#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Time Scheduling Application Setup\n');

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Do you want to overwrite it? (y/N)');
  rl.question('', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      runSetup();
    } else {
      console.log('Setup cancelled.');
      rl.close();
    }
  });
} else {
  runSetup();
}

function runSetup() {
  console.log('\n📋 Firebase Configuration Setup\n');
  console.log('Please provide your Firebase configuration details.\n');
  console.log('You can find these in your Firebase Console:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Select your project');
  console.log('3. Go to Project Settings (gear icon)');
  console.log('4. Scroll down to "Your apps" section\n');

  const questions = [
    {
      name: 'apiKey',
      question: 'Enter your Firebase API Key: ',
      required: true
    },
    {
      name: 'authDomain',
      question: 'Enter your Firebase Auth Domain (e.g., your-project.firebaseapp.com): ',
      required: true
    },
    {
      name: 'projectId',
      question: 'Enter your Firebase Project ID: ',
      required: true
    },
    {
      name: 'storageBucket',
      question: 'Enter your Firebase Storage Bucket (e.g., your-project.appspot.com): ',
      required: true
    },
    {
      name: 'messagingSenderId',
      question: 'Enter your Firebase Messaging Sender ID: ',
      required: true
    },
    {
      name: 'appId',
      question: 'Enter your Firebase App ID: ',
      required: true
    },
    {
      name: 'kakaoClientId',
      question: 'Enter your Kakao Client ID (optional, press Enter to skip): ',
      required: false
    }
  ];

  const answers = {};
  let currentQuestion = 0;

  function askQuestion() {
    if (currentQuestion >= questions.length) {
      createEnvFile();
      return;
    }

    const question = questions[currentQuestion];
    rl.question(question.question, (answer) => {
      if (question.required && !answer.trim()) {
        console.log('❌ This field is required. Please try again.');
        askQuestion();
        return;
      }
      
      answers[question.name] = answer.trim();
      currentQuestion++;
      askQuestion();
    });
  }

  function createEnvFile() {
    const envContent = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${answers.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${answers.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${answers.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${answers.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${answers.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${answers.appId}
${answers.kakaoClientId ? `\n# Kakao OAuth Configuration\nNEXT_PUBLIC_KAKAO_CLIENT_ID=${answers.kakaoClientId}` : ''}
`;

    try {
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ .env.local file created successfully!');
      console.log('\n🎉 Setup complete! Your application is ready to run.');
      console.log('\n📝 Next steps:');
      console.log('1. Make sure your Firebase project has Authentication enabled');
      console.log('2. Enable Google sign-in provider in Firebase Console');
      console.log('3. Create a Firestore database in test mode');
      console.log('4. Run "npm run dev" to start the development server');
      console.log('\n🌐 Your app will be available at: http://localhost:3000');
    } catch (error) {
      console.error('❌ Error creating .env.local file:', error.message);
    }

    rl.close();
  }

  askQuestion();
} 