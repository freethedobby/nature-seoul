const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

async function analyzeDateBookings(targetDate) {
  console.log(`🔍 Analyzing bookings for ${targetDate}...`);
  
  try {
    // 1. Get all reservations for the target date
    const reservationsSnapshot = await db.collection('reservations')
      .where('date', '==', targetDate)
      .get();
    
    if (reservationsSnapshot.empty) {
      console.log(`❌ No reservations found for ${targetDate}`);
      return;
    }

    console.log(`📋 Found ${reservationsSnapshot.size} reservations for ${targetDate}:`);
    
    const reservations = [];
    const slotIds = new Set();
    
    reservationsSnapshot.forEach(doc => {
      const data = doc.data();
      const reservation = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      };
      reservations.push(reservation);
      slotIds.add(data.slotId);
      
      console.log(`  - ${data.userName || data.userEmail} (${data.time}) - Status: ${data.status} - SlotID: ${data.slotId.substring(0, 8)}...`);
    });

    // 2. Check for duplicate slot IDs
    const duplicateSlots = {};
    reservations.forEach(res => {
      if (!duplicateSlots[res.slotId]) {
        duplicateSlots[res.slotId] = [];
      }
      duplicateSlots[res.slotId].push(res);
    });

    // 3. Identify double bookings
    console.log(`\n🔍 Checking for double bookings...`);
    let hasDoubleBookings = false;
    
    for (const [slotId, bookings] of Object.entries(duplicateSlots)) {
      const activeBookings = bookings.filter(b => b.status !== 'cancelled');
      
      if (activeBookings.length > 1) {
        hasDoubleBookings = true;
        console.log(`\n🚨 DOUBLE BOOKING DETECTED for slot ${slotId.substring(0, 8)}...:`);
        
        activeBookings.forEach((booking, index) => {
          console.log(`  ${index + 1}. ${booking.userName || booking.userEmail}`);
          console.log(`     - Email: ${booking.userEmail}`);
          console.log(`     - Time: ${booking.time}`);
          console.log(`     - Status: ${booking.status}`);
          console.log(`     - Created: ${booking.createdAt}`);
          console.log(`     - Reservation ID: ${booking.id}`);
          console.log('');
        });
      }
    }

    if (!hasDoubleBookings) {
      console.log(`✅ No double bookings found for ${targetDate}`);
      return;
    }

    // 4. Get slot information
    console.log(`\n📅 Getting slot information...`);
    for (const slotId of slotIds) {
      try {
        const slotDoc = await db.collection('slots').doc(slotId).get();
        if (slotDoc.exists) {
          const slotData = slotDoc.data();
          console.log(`  Slot ${slotId.substring(0, 8)}... - Status: ${slotData.status} - Start: ${slotData.start?.toDate?.()}`);
        } else {
          console.log(`  Slot ${slotId.substring(0, 8)}... - NOT FOUND`);
        }
      } catch (error) {
        console.log(`  Slot ${slotId.substring(0, 8)}... - ERROR: ${error.message}`);
      }
    }

    return { reservations, duplicateSlots, hasDoubleBookings };
    
  } catch (error) {
    console.error('❌ Error analyzing bookings:', error);
    throw error;
  }
}

async function fixDoubleBooking(targetDate, keepReservationId, cancelReservationIds) {
  console.log(`\n🔧 Fixing double booking for ${targetDate}...`);
  console.log(`   Keeping: ${keepReservationId}`);
  console.log(`   Cancelling: ${cancelReservationIds.join(', ')}`);

  try {
    const batch = db.batch();

    // Cancel the duplicate reservations
    for (const reservationId of cancelReservationIds) {
      const reservationRef = db.collection('reservations').doc(reservationId);
      batch.update(reservationRef, {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelReason: 'Duplicate booking detected - system fix'
      });
      console.log(`   ❌ Cancelling reservation: ${reservationId}`);
    }

    await batch.commit();
    console.log(`✅ Successfully fixed double booking for ${targetDate}`);
    
  } catch (error) {
    console.error('❌ Error fixing double booking:', error);
    throw error;
  }
}

async function main() {
  const targetDate = '2025. 10. 28.'; // Korean date format as used in the app
  
  console.log('🚀 Starting double booking analysis and fix...\n');
  
  try {
    const analysis = await analyzeDateBookings(targetDate);
    
    if (!analysis || !analysis.hasDoubleBookings) {
      console.log('\n✅ No fixes needed.');
      return;
    }

    console.log('\n⚠️  MANUAL INTERVENTION REQUIRED:');
    console.log('Please review the double bookings above and determine which reservation to keep.');
    console.log('You can run the fix function manually by calling:');
    console.log('await fixDoubleBooking(targetDate, keepReservationId, [cancelReservationId1, cancelReservationId2])');
    
    // Example of how to fix (commented out for safety):
    // await fixDoubleBooking(targetDate, 'keep-this-reservation-id', ['cancel-this-id']);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Allow running functions individually
module.exports = {
  analyzeDateBookings,
  fixDoubleBooking
};

// Run if called directly
if (require.main === module) {
  main().then(() => {
    console.log('\n🏁 Script completed.');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
} 