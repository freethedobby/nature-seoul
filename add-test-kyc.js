const { initializeApp } = require('firebase/app');
const { getFirestore, collection, setDoc, doc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration - you'll need to add your own config here
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTestKYC() {
  try {
    const testUserId = 'test-user-' + Date.now();
    const testKYCData = {
      userId: testUserId,
      email: 'test@example.com',
      name: '테스트 사용자',
      contact: '01012345678',
      photoURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      photoType: 'base64',
      kycStatus: 'pending',
      hasPreviousTreatment: false,
      createdAt: serverTimestamp(),
      submittedAt: serverTimestamp(),
    };

    console.log('Adding test KYC data...');
    await setDoc(doc(db, 'users', testUserId), testKYCData);
    console.log('✅ Test KYC data added successfully!');
    console.log('User ID:', testUserId);
    console.log('Check the admin KYC page to see this data');
    
  } catch (error) {
    console.error('❌ Error adding test KYC data:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

addTestKYC(); 