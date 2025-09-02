pipeline {
  agent any
  tools { nodejs 'Node24' }

  options {
    timestamps()        // ✅ safe without extra plugin
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
      when { expression { return env.BRANCH_NAME == "main" } }
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
  }

  post {
    success {
      echo '📂 Archiving .next...'
      archiveArtifacts artifacts: '.next/**', fingerprint: true
      echo '✅ Artifacts archived'
    }
    always {
      echo '🧹 Cleaning workspace & collecting test reports...'
      junit testResults: 'junit*.xml', allowEmptyResults: true
      cleanWs()
      echo '✅ Cleanup done'
    }
  }
}
