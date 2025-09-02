pipeline {
  agent any

  tools { nodejs 'Node24' }

  options {
    timestamps()
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
  }

  post {
    // Keep JUnit, but don't fail if there are no reports
    always {
      echo '📝 Publishing test reports (if any)...'
      junit testResults: 'junit*.xml', allowEmptyResults: true
    }

    // Archive BEFORE cleanup, and only if .next exists
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

    // Runs LAST in Declarative pipelines
    cleanup {
      echo '🧹 Cleaning workspace...'
      cleanWs()
      echo '✅ Cleanup done'
    }
  }
}
