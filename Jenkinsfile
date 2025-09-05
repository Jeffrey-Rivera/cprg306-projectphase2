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

    stage('Version bump') {
      steps {
        script {
          // ensure VERSION file exists (default to 1.0.0)
          if (!fileExists('VERSION')) {
            writeFile file: 'VERSION', text: '1.0.0'
          }

          // read current version
          def version = readFile('VERSION').trim()

          // split into parts
          def (major, minor, patch) = version.tokenize('.').collect { it as int }

          // bump patch automatically
          patch = patch + 1
          def newVersion = "${major}.${minor}.${patch}"

          // save new version
          writeFile file: 'VERSION', text: newVersion
          echo "🔢 New version: ${newVersion}"

          // expose it to next stages
          env.IMAGE_TAG = newVersion
        }
      }
    }

    stage('Docker: Build & Push') {
      steps {
        script {
          def branch = env.BRANCH_NAME ?: sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
          def tag    = env.IMAGE_TAG  // 👈 use the auto-incremented version

          docker.withRegistry('https://index.docker.io/v1/', DOCKERHUB_CREDS) {
            def img = docker.build("${DOCKERHUB_REPO}:${tag}")
            img.push()                 // push version tag
            if (branch == 'main') {
              img.push('latest')       // also push :latest for main
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
