const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function addAdminUser(email) {
  try {
    if (!email) {
      console.error('❌ Email is required');
      console.log('Usage: node add-admin.js <email>');
      process.exit(1);
    }

    const adminDoc = {
      email: email,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    console.log('Adding admin user:', adminDoc.email);
    
    // Use the email as the document ID for easier querying
    await db.collection('admins').doc(email).set(adminDoc);
    console.log('✅ Admin added successfully:', email);
  } catch (error) {
    console.error('❌ Error adding admin:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];
addAdminUser(email); 