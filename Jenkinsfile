pipeline {
  agent any

  tools {
    nodejs 'Node24'  // matches your Tools config
  }

  options {
    timestamps()
    ansiColor('xterm')
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
        echo '📦 Installing project dependencies with npm ci...'
        sh 'npm ci'
        echo '✅ Dependencies installed successfully'
      }
    }

    stage('Maintenance (optional)') {
      when { expression { return env.BRANCH_NAME == 'main' } }
      steps {
        echo '🛠 Updating browserslist database (only on main branch)...'
        sh 'npx update-browserslist-db@latest || true'
        echo '✅ Browserslist update finished'
      }
    }

    stage('Build') {
      steps {
        echo '🏗 Running Next.js production build...'
        sh 'npm run build'
        echo '✅ Build completed successfully'
      }
    }

    stage('Test') {
      steps {
        echo '🧪 Running tests (if present)...'
        sh 'npm test --if-present'
        echo '✅ Tests finished (or skipped if none found)'
      }
    }
  }

  post {
    success {
      echo '📂 Archiving build artifacts from .next directory...'
      archiveArtifacts artifacts: '.next/**', fingerprint: true
      echo '✅ Artifacts archived successfully'
    }
    always {
      echo '🧹 Cleaning up workspace and collecting test reports...'
      junit testResults: 'junit*.xml', allowEmptyResults: true
      cleanWs()
      echo '✅ Cleanup done'
    }
  }
}
