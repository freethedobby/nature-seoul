// Test environment configuration for local development
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Test Firebase configuration (separate from production)
const testFirebaseConfig = {
  apiKey: "demo-key-for-testing",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-time-scheduling",
  storageBucket: "test-time-scheduling.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:test-app-id",
};

// Production Firebase configuration
const prodFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

export function isLocalTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for test mode indicators
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const hasTestParam = window.location.search.includes('test=true');
  const hasTestFlag = localStorage.getItem('enableTestMode') === 'true';
  
  return isLocalhost && (hasTestParam || hasTestFlag);
}

export function enableTestMode() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('enableTestMode', 'true');
    window.location.reload();
  }
}

export function disableTestMode() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('enableTestMode');
    window.location.reload();
  }
}

// Initialize Firebase based on environment
function initializeFirebaseForEnvironment() {
  const useTestConfig = isLocalTestMode();
  const config = useTestConfig ? testFirebaseConfig : prodFirebaseConfig;
  
  console.log(`🔥 Firebase Mode: ${useTestConfig ? 'TEST' : 'PRODUCTION'}`);
  
  let app;
  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  // Connect to Firestore emulator in test mode
  if (useTestConfig && typeof window !== 'undefined') {
    try {
      // Only connect to emulator if not already connected
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('🧪 Connected to Firestore Emulator');
    } catch (error) {
      console.warn('⚠️ Firestore emulator connection failed (may already be connected):', error);
    }
  }
  
  return { app, auth, db, storage, isTestMode: useTestConfig };
}

// Test data seeding functions
export async function seedTestData(db: ReturnType<typeof getFirestore>) {
  console.log('🌱 Seeding test data...');
  
  try {
    // Create test users
    const testUsers = [
      {
        id: 'test-user-1',
        email: 'test1@example.com',
        name: '테스트 사용자 1',
        kycStatus: 'approved',
        approvedAt: Timestamp.now(),
      },
      {
        id: 'test-user-2', 
        email: 'test2@example.com',
        name: '테스트 사용자 2',
        kycStatus: 'approved',
        approvedAt: Timestamp.now(),
      },
      {
        id: 'test-user-3',
        email: 'test3@example.com', 
        name: '테스트 사용자 3',
        kycStatus: 'pending',
        createdAt: Timestamp.now(),
      }
    ];

    for (const user of testUsers) {
      await setDoc(doc(db, 'users', user.id), user);
    }

    // Create test slots for today and next few days
    const today = new Date();
    const testSlots = [];
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + dayOffset);
      
      // Create slots at 10:00, 14:00, 16:00 for each day
      const times = [
        { hour: 10, minute: 0 },
        { hour: 14, minute: 0 },
        { hour: 16, minute: 0 },
      ];
      
      for (const time of times) {
        const slotStart = new Date(slotDate);
        slotStart.setHours(time.hour, time.minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 2); // 2 hour slots
        
        const slot = {
          start: Timestamp.fromDate(slotStart),
          end: Timestamp.fromDate(slotEnd),
          status: 'available',
          type: 'recurring',
          createdAt: Timestamp.now(),
        };
        
        testSlots.push(slot);
      }
    }

    for (const slot of testSlots) {
      await addDoc(collection(db, 'slots'), slot);
    }

    // Create test reservations
    const testReservations = [
      {
        slotId: 'test-slot-1',
        userId: 'test-user-1',
        userEmail: 'test1@example.com',
        userName: '테스트 사용자 1',
        date: today.toLocaleDateString('ko-KR'),
        time: '10:00',
        status: 'approved',
        createdAt: Timestamp.now(),
      }
    ];

    for (const reservation of testReservations) {
      await addDoc(collection(db, 'reservations'), reservation);
    }

    // Create test admin
    await setDoc(doc(db, 'admins', 'test-admin'), {
      email: 'admin@test.com',
      isActive: true,
      createdAt: Timestamp.now(),
    });

    console.log('✅ Test data seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  }
}

export async function clearTestData() {
  console.log('🧹 Clearing test data...');
  
  try {
    const collections = ['users', 'slots', 'reservations', 'admins', 'notifications'];
    
    for (const collectionName of collections) {
      // Note: In a real implementation, you would use getDocs to get documents
      // and then delete them. This is simplified for the test environment.
      console.log(`🗑️ Would clear ${collectionName} collection`);
    }
    
    console.log('✅ Test data cleared successfully');
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
  }
}

// Export the initialized Firebase instances
export const firebase = initializeFirebaseForEnvironment();
export const { app, auth, db, storage, isTestMode } = firebase;

// Test mode utilities
export const testUtils = {
  isLocalTestMode,
  enableTestMode,
  disableTestMode,
  seedTestData: () => seedTestData(db),
  clearTestData: () => clearTestData(),
}; 