pipeline {
  agent any
  tools { nodejs 'Node24' }
  options { timestamps() }

  parameters {
    choice(name: 'BUMP', choices: ['patch', 'minor', 'major'], description: 'Which version to bump?')
  }

  environment {
    // ----- Docker Hub -----
    DOCKERHUB_REPO    = 'jeffreyrivera/my-pipeline-306-nextjs'
    DOCKERHUB_CREDS   = 'docker-hub-repo'     // Jenkins "Username with password"
    DOCKERHUB_PRIVATE = 'false'               // set 'true' if the repo is private

    // ----- EC2 / SSH -----
    EC2_HOST      = '15.223.186.70'
    EC2_USER      = 'ec2-user'
    SSH_KEY_CRED  = 'ec2-server-key'          // Jenkins "SSH Username with private key"

    // App / ports (for health check etc.)
    EXPOSE_PORT   = '80'

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
          docker.withRegistry('https://index.docker.io/v1/', DOCKERHUB_CREDS) {
            def img = docker.build("${DOCKERHUB_REPO}:${env.IMAGE_TAG}", "--pull --no-cache .")
            img.push() // :X.Y.Z
            def branch = env.BRANCH_NAME ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
            if (branch == 'main') { img.push('latest') }
          }
        }
      }
    }

    // ---- Compose-based deployment to EC2 (auto-detect compose command) ----
    stage('Deploy to EC2') {
      when { branch 'main' }
      steps {
        sshagent([env.SSH_KEY_CRED]) {

          // trust host
          sh """
            mkdir -p ~/.ssh && chmod 700 ~/.ssh
            ssh-keyscan -H ${EC2_HOST} >> ~/.ssh/known_hosts
          """

          // create remote app dir
          sh "ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'mkdir -p ~/app'"

          // copy compose + nginx config
          sh """
            scp -o StrictHostKeyChecking=no docker-compose.yaml ${EC2_USER}@${EC2_HOST}:~/app/
            scp -o StrictHostKeyChecking=no nginx.conf ${EC2_USER}@${EC2_HOST}:~/app/
          """

          // optional: login if Docker Hub repo is private
          script {
            if (env.DOCKERHUB_PRIVATE?.toLowerCase() == 'true') {
              withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDS, usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                sh """
                  ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
                """
              }
            }
          }

          // write .env, ensure docker is running, pick compose cmd, then pull & up
          sh """
            ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'bash -s' <<'EOF'
set -e
cd ~/app

# Ensure Docker is running (harmless if already started)
if ! sudo systemctl is-active --quiet docker; then
  sudo systemctl enable --now docker || true
  sudo usermod -aG docker ec2-user || true
fi

# Pick compose command: prefer "docker compose", fallback to "docker-compose"
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="$(command -v docker-compose)"
else
  echo "Docker Compose not found"; exit 1
fi

# Write .env that docker-compose reads (values below are inserted by Jenkins before SSH)
cat > .env <<EOVARS
DOCKERHUB_REPO=${DOCKERHUB_REPO}
IMAGE_TAG=${IMAGE_TAG}
EOVARS

# Pull and start the stack
\$COMPOSE pull
\$COMPOSE up -d

# optional: clean up old images (keeps running ones)
docker image prune -f || true
EOF
          """
        }
      }
    }

    stage('Health Check') {
      when { branch 'main' }
      steps {
        sh """
          set -e
          echo "Waiting for app on http://${EC2_HOST}:${EXPOSE_PORT} ..."
          i=1
          while [ "\\$i" -le 20 ]; do
            if curl -fsS http://${EC2_HOST}:${EXPOSE_PORT} >/dev/null; then
              echo "✅ App is responding"
              exit 0
            fi
            sleep 3
            i=\\$((i+1))
          done
          echo "❌ Health check failed"
          exit 1
        """
      }
    }
  }

  post {
    success {
      echo "✅ Built & pushed ${DOCKERHUB_REPO}:${env.IMAGE_TAG}; deployed to ${EC2_HOST}:${EXPOSE_PORT}"
    }
    failure {
      echo "❌ Pipeline failed. Check console for details."
    }
    cleanup {
      cleanWs()
    }
  }
}
