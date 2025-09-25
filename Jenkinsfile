pipeline {
  agent any
  tools { nodejs 'Node24' }
  options { timestamps() }

  parameters {
    choice(name: 'BUMP', choices: ['patch', 'minor', 'major'], description: 'Which version to bump?')
  }

  environment {
    DOCKERHUB_REPO  = 'jeffreyrivera/my-pipeline-306-nextjs'
    DOCKERHUB_CREDS = 'docker-hub-repo'          // Docker Hub access token credential ID
    GITHUB_CREDS    = 'github-credentials-PAT'   // <-- updated to your PAT credential ID
  }

  stages {
    stage('Checkout') {
      steps {
        echo '🔄 Checking out source code from GitHub...'
        checkout scm
        sh 'git fetch --tags --quiet || true'   // ensure we see existing tags
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
          // Determine current version from latest git tag vX.Y.Z; fallback to VERSION file; else 1.0.0
          def lastTag = sh(script: "git tag --list 'v*.*.*' --sort=-v:refname | head -n 1", returnStdout: true).trim()
          def current = lastTag ? lastTag.replaceFirst(/^v/, '') :
                        (fileExists('VERSION') ? readFile('VERSION').trim() : '1.0.0')

          def parts = current.tokenize('.').collect { it as int }
          if (parts.size() != 3) { error "Bad version '${current}' (expected X.Y.Z)" }
          def (major, minor, patch) = parts

          switch (params.BUMP) {
            case 'major': major++; minor = 0; patch = 0; break
            case 'minor': minor++; patch = 0;            break
            default     : patch++;                       break
          }

          env.IMAGE_TAG = "${major}.${minor}.${patch}"
          echo "🔢 New version: ${env.IMAGE_TAG}"

          // Persist: write VERSION, commit
          writeFile file: 'VERSION', text: env.IMAGE_TAG + "\n"

          sh '''
            set -eux
            git config user.name  "jenkins-bot"
            git config user.email "jenkins-bot@local"
            git add VERSION
            git commit -m "chore: bump version to ${IMAGE_TAG} [skip ci]" || true
          '''

          // Tag & push using Authorization header (no token in URL)
          withCredentials([usernamePassword(
            credentialsId: GITHUB_CREDS,           // uses 'github-credentials-PAT'
            usernameVariable: 'GIT_USER',
            passwordVariable: 'GIT_TOKEN'
          )]) {
            sh '''
              set -eux
              # Ensure origin is a clean HTTPS URL (no creds embedded)
              git remote set-url origin https://github.com/Jeffrey-Rivera/cprg306-projectphase2.git

              # Create tag if not present (idempotent)
              git tag -a v"$IMAGE_TAG" -m "Release v$IMAGE_TAG" || true

              # Build Basic auth header for x-access-token:<PAT>
              B64=$(printf "%s" "x-access-token:${GIT_TOKEN}" | base64 -w0 2>/dev/null || base64)

              # Push commit & tags; token only in HTTP header (not stored)
              git -c http.extraheader="AUTHORIZATION: Basic ${B64}" push origin HEAD:main
              git -c http.extraheader="AUTHORIZATION: Basic ${B64}" push origin --tags
            '''
          }
        }
      }
    }

    stage('Docker: Build & Push') {
      steps {
        script {
          def branch = env.BRANCH_NAME ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
          docker.withRegistry('https://index.docker.io/v1/', DOCKERHUB_CREDS) {
            // Force a clean rebuild once to ensure next build is baked in
            def img = docker.build("${DOCKERHUB_REPO}:${env.IMAGE_TAG}", "--pull --no-cache .")
            img.push()                                // :X.Y.Z
            if (branch == 'main') {
              img.push('latest')                      // :latest only for main
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
      echo "✅ Pushed ${DOCKERHUB_REPO}:${env.IMAGE_TAG}${env.BRANCH_NAME=='main'?' and :latest':''}"
    }
    cleanup {
      echo '🧹 Cleaning workspace...'
      cleanWs()
      echo '✅ Cleanup done'
    }
  }
}
