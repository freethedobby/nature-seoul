#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Setting up Firebase Test Environment...\n');

// Create firebase.json for emulator configuration
const firebaseConfig = {
  "emulators": {
    "firestore": {
      "port": 8080,
      "host": "localhost"
    },
    "auth": {
      "port": 9099,
      "host": "localhost"
    },
    "ui": {
      "enabled": true,
      "port": 4000,
      "host": "localhost"
    },
    "singleProjectMode": true
  },
  "firestore": {
    "rules": "firestore.rules"
  }
};

// Write firebase.json if it doesn't exist or update emulator config
const firebaseJsonPath = path.join(__dirname, 'firebase.json');
let existingConfig = {};

if (fs.existsSync(firebaseJsonPath)) {
  try {
    existingConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
  } catch (error) {
    console.warn('⚠️ Could not parse existing firebase.json, creating new one...');
  }
}

// Merge emulator config
const mergedConfig = {
  ...existingConfig,
  emulators: firebaseConfig.emulators
};

fs.writeFileSync(firebaseJsonPath, JSON.stringify(mergedConfig, null, 2));
console.log('✅ Firebase emulator configuration created/updated');

// Create package.json scripts for emulator
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add emulator scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'test:emulator': 'firebase emulators:start --project=test-time-scheduling',
      'test:emulator:ui': 'firebase emulators:start --project=test-time-scheduling',
      'test:seed': 'node scripts/seed-test-data.js',
      'test:clear': 'node scripts/clear-test-data.js'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added emulator scripts to package.json');
  } catch (error) {
    console.warn('⚠️ Could not update package.json:', error.message);
  }
}

// Create test data seeding script
const scriptsDir = path.join(__dirname, 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

const seedScript = `
const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, collection, addDoc, doc, setDoc } = require('firebase/firestore');

// Initialize Firebase for emulator
const app = initializeApp({
  projectId: 'test-time-scheduling'
});

const db = getFirestore(app);
connectFirestoreEmulator(db, 'localhost', 8080);

async function seedTestData() {
  console.log('🌱 Seeding test data to emulator...');
  
  // Add your test data seeding logic here
  // This script can be customized based on your testing needs
  
  console.log('✅ Test data seeded successfully');
}

seedTestData().catch(console.error);
`;

fs.writeFileSync(path.join(scriptsDir, 'seed-test-data.js'), seedScript.trim());
console.log('✅ Created test data seeding script');

// Instructions
console.log('\n🎉 Test environment setup complete!\n');
console.log('📋 Next steps:');
console.log('1. Install Firebase CLI: npm install -g firebase-tools');
console.log('2. Start emulator: npm run test:emulator');
console.log('3. Open your app: http://localhost:3000?test=true');
console.log('4. Use the test mode toggle in the bottom-right corner\n');

console.log('🧪 Test Mode Features:');
console.log('• Complete isolation from production data');
console.log('• Bypass all time restrictions');
console.log('• Test double booking scenarios');
console.log('• Easy data seeding and cleanup');
console.log('• Emulator UI at http://localhost:4000\n');

console.log('⚡ Quick Commands:');
console.log('• npm run test:emulator  - Start Firebase emulator');
console.log('• npm run dev           - Start Next.js in development');
console.log('• Visit localhost:3000?test=true to enable test mode'); 