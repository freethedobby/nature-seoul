const fs = require('fs');
const path = require('path');

// Function to extract environment variables from Firebase service account JSON
function extractEnvVars(jsonFilePath) {
  try {
    // Read the JSON file
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    const serviceAccount = JSON.parse(jsonContent);
    
    console.log('🔧 Firebase Service Account Environment Variables:');
    console.log('================================================');
    console.log('');
    
    // Extract and format the values
    const projectId = serviceAccount.project_id;
    const clientEmail = serviceAccount.client_email;
    const privateKey = serviceAccount.private_key;
    
    console.log('📋 Copy these to your Vercel Environment Variables:');
    console.log('');
    console.log(`FIREBASE_PROJECT_ID=${projectId}`);
    console.log(`FIREBASE_CLIENT_EMAIL=${clientEmail}`);
    console.log(`FIREBASE_PRIVATE_KEY="${privateKey}"`);
    console.log('');
    console.log('✅ All values extracted successfully!');
    console.log('');
    console.log('📝 Instructions:');
    console.log('1. Go to your Vercel project dashboard');
    console.log('2. Settings → Environment Variables');
    console.log('3. Add each variable above');
    console.log('4. Redeploy your project');
    
  } catch (error) {
    console.error('❌ Error reading JSON file:', error.message);
    console.log('');
    console.log('💡 Make sure:');
    console.log('- The JSON file path is correct');
    console.log('- The file contains valid JSON');
    console.log('- You have read permissions for the file');
  }
}

// Check if file path is provided
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.log('📁 Usage: node extract-env.js <path-to-your-json-file>');
  console.log('');
  console.log('Example:');
  console.log('node extract-env.js ./firebase-service-account.json');
  console.log('');
  console.log('💡 Drag and drop your JSON file into the terminal after the command');
} else {
  extractEnvVars(jsonFilePath);
} 