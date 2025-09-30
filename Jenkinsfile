pipeline {
  agent any
  tools { nodejs 'Node24' }
  options { timestamps() }

  parameters {
    choice(name: 'BUMP', choices: ['patch', 'minor', 'major'], description: 'Which version to bump?')
  }

  environment {
    // ----- Docker Hub -----
    DOCKERHUB_REPO     = 'jeffreyrivera/my-pipeline-306-nextjs'
    DOCKERHUB_CREDS    = 'docker-hub-repo'           // Jenkins "Username with password"
    DOCKERHUB_PRIVATE  = 'false'                     // set to 'true' if your repo is private

    // ----- EC2 / SSH -----
    EC2_HOST           = '15.223.186.70'             // your EC2 public IP/DNS
    EC2_USER           = 'ec2-user'
    SSH_KEY_CRED       = 'ec2-server-key'            // Jenkins "SSH Username with private key"

    // ----- App/Container -----
    CONTAINER_NAME     = 'nextjs-app'
    APP_PORT           = '3000'                      // inside container
    EXPOSE_PORT        = '80'                        // host port

    // computed later:
    // IMAGE_TAG
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        sh 'git fetch --tags --quiet || true'
      }
    }

    stage('Set Version') {
      steps {
        script {
          def lastTag = sh(script: "git tag --list 'v*.*.*' --sort=-v:refname | head -n 1", returnStdout: true).trim()
          def current = lastTag ? lastTag.replaceFirst(/^v/, '') : '1.0.0'
          def parts = current.tokenize('.').collect { it as int }
          if (parts.size() != 3) { error "Bad version '${current}' (expected X.Y.Z)" }
          def (major, minor, patch) = parts
          switch (params.BUMP) {
            case 'major': major++; minor = 0; patch = 0; break
            case 'minor': minor++; patch = 0; break
            default     : patch++; break
          }
          env.IMAGE_TAG = "${major}.${minor}.${patch}"
          echo "New image tag: ${env.IMAGE_TAG}"
          writeFile file: 'VERSION', text: env.IMAGE_TAG + "\n"
        }
      }
    }

    stage('Docker: Build & Push') {
      steps {
        script {
          def buildArgs = "--pull --no-cache ."
          docker.withRegistry('https://index.docker.io/v1/', DOCKERHUB_CREDS) {
            def img = docker.build("${DOCKERHUB_REPO}:${env.IMAGE_TAG}", buildArgs)
            img.push() // push :X.Y.Z
            def branch = env.BRANCH_NAME ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
            if (branch == 'main') { img.push('latest') }
          }
        }
      }
    }

    stage('Deploy to EC2') {
      when { branch 'main' } // deploy only from main; remove/adjust if needed
      steps {
        sshagent([env.SSH_KEY_CRED]) {
          sh """
            set -eo pipefail
            mkdir -p ~/.ssh && chmod 700 ~/.ssh
            ssh-keyscan -H ${EC2_HOST} >> ~/.ssh/known_hosts
          """

          // Login on EC2 to Docker Hub only if repo is private
          script {
            if (env.DOCKERHUB_PRIVATE?.toLowerCase() == 'true') {
              withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDS, usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                sh """
                  ssh -o BatchMode=yes ${EC2_USER}@${EC2_HOST} 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
                """
              }
            }
          }

          // Pull new image and (re)start container
          sh """
            ssh -o BatchMode=yes ${EC2_USER}@${EC2_HOST} '
              set -eo pipefail

              echo "Pulling ${DOCKERHUB_REPO}:${IMAGE_TAG} ..."
              docker pull ${DOCKERHUB_REPO}:${IMAGE_TAG}

              echo "Stopping old container (if any)..."
              docker stop ${CONTAINER_NAME} || true
              docker rm   ${CONTAINER_NAME} || true

              echo "Starting new container..."
              docker run -d --name ${CONTAINER_NAME} \\
                -p ${EXPOSE_PORT}:${APP_PORT} \\
                --restart unless-stopped \\
                ${DOCKERHUB_REPO}:${IMAGE_TAG}

              docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\\t{{.Status}}\\t{{.Image}}"
            '
          """
        }
      }
    }

    stage('Health Check') {
      when { branch 'main' }
      steps {
        // simple HTTP check against EC2 public endpoint
        sh """
          echo "Waiting for app to be ready on http://${EC2_HOST}:${EXPOSE_PORT} ..."
          for i in {1..20}; do
            if curl -fsS http://${EC2_HOST}:${EXPOSE_PORT} >/dev/null; then
              echo "✅ App is responding"
              exit 0
            fi
            sleep 3
          done
          echo "❌ Health check failed"
          exit 1
        """
      }
    }
  }

  post {
    success {
      echo "✅ Built and pushed ${DOCKERHUB_REPO}:${env.IMAGE_TAG}; deployed to ${EC2_HOST}:${EXPOSE_PORT}"
    }
    failure {
      echo "❌ Pipeline failed. Check console for details."
    }
    cleanup {
      cleanWs()
    }
  }
}
