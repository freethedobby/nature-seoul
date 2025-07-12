const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

console.log('Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addAdminUser() {
  try {
    const adminDoc = {
      email: 'blacksheepwall.xyz@gmail.com',
      isActive: true,
      createdAt: serverTimestamp(),
    };
    
    console.log('Adding admin user:', adminDoc.email);
    const docRef = await addDoc(collection(db, 'admins'), adminDoc);
    console.log('✅ Admin added successfully with ID:', docRef.id);
  } catch (error) {
    console.error('❌ Error adding admin:', error);
  }
}

addAdminUser(); 