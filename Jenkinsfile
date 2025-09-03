pipeline {
  agent any
  tools { nodejs 'Node24' }
  options { timestamps() }

  environment {
    DOCKERHUB_REPO  = 'jeffreyrivera/my-pipeline-306-nextjs'
    DOCKERHUB_CREDS = 'dockerhub-creds' // Jenkins username+password cred for Docker Hub
  }

  stages {
    stage('Checkout') {
      steps {
        echo '🔄 Checking out source code from GitHub...'
        checkout scm
        echo '✅ Checkout complete'
      }
    }

    stage('Install') {
      steps {
        echo '📦 Installing deps...'
        sh 'npm ci'
        echo '✅ Deps installed'
      }
    }

    stage('Maintenance (optional)') {
      when { expression { return env.BRANCH_NAME == 'main' } }
      steps {
        echo '🛠 Updating browserslist DB...'
        sh 'npx update-browserslist-db@latest || true'
        echo '✅ Browserslist updated'
      }
    }

    stage('Build') {
      steps {
        echo '🏗 Building Next.js...'
        sh 'npm run build'
        echo '✅ Build ok'
      }
    }

    stage('Test') {
      steps {
        echo '🧪 Running tests (if any)...'
        sh 'npm test --if-present'
        echo '✅ Tests done'
      }
    }

    stage('Docker: Build & Push') {
      steps {
        script {
          // compute tag in Groovy
          def shortSha = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          def tag = "${env.BRANCH_NAME}-${shortSha}"

          docker.withRegistry('https://registry.hub.docker.com', DOCKERHUB_CREDS) {
            def img = docker.build("${DOCKERHUB_REPO}:${tag}")
            img.push()
            if (env.BRANCH_NAME == 'main') {
              img.push('latest')
            }
          }
        }
      }
    }
  }

  post {
    always {
      echo '📝 Publishing test reports (if any)...'
      junit testResults: 'junit*.xml', allowEmptyResults: true
    }
    success {
      script {
        if (fileExists('.next')) {
          echo '📂 Archiving .next artifacts...'
          archiveArtifacts artifacts: '.next/**', fingerprint: true
          echo '✅ Artifacts archived'
        } else {
          echo 'ℹ️ No .next directory found; skipping archive'
        }
      }
    }
    cleanup {
      echo '🧹 Cleaning workspace...'
      cleanWs()
      echo '✅ Cleanup done'
    }
  }
}
