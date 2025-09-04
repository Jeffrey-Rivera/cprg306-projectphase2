pipeline {
  agent any
  tools { nodejs 'Node24' }
  options { timestamps() }

  environment {
    DOCKERHUB_REPO  = 'jeffreyrivera/my-pipeline-306-nextjs'
    DOCKERHUB_CREDS = 'docker-hub-repo'   // <-- matches your actual credential ID
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
          // Fallback for non-multibranch jobs where BRANCH_NAME may be empty
          def branch   = env.BRANCH_NAME ?: sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
          def shortSha = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          def tag      = "${branch}-${shortSha}"

          // Login & push using Docker Pipeline plugin
          docker.withRegistry('https://index.docker.io/v1/', DOCKERHUB_CREDS) {
            def img = docker.build("${DOCKERHUB_REPO}:${tag}")
            img.push()                 // push branch-SHA tag
            if (branch == 'main') {
              img.push('latest')       // also push :latest for main
            }
          }
        }
      }
    }
  } // <-- close stages BEFORE post

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
