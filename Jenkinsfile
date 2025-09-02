pipeline {
  agent any

  tools {
    nodejs 'Node24'   // 👈 must match the name you set in Jenkins under NodeJS installations
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test --if-present'
      }
    }
  }
}
