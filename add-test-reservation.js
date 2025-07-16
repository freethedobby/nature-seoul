const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

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

async function addTestReservation() {
  try {
    const testReservation = {
      slotId: 'test-slot-1',
      userId: 'test-user-1',
      userEmail: 'test@example.com',
      userName: 'Blacksheepwall',
      date: '2024년 1월 15일',
      time: '14:30',
      status: '대기',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'reservations'), testReservation);
    console.log('Test reservation added with ID:', docRef.id);
    console.log('Reservation data:', testReservation);
  } catch (error) {
    console.error('Error adding test reservation:', error);
  }
}

// Run the function
addTestReservation(); 