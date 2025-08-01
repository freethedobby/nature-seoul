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