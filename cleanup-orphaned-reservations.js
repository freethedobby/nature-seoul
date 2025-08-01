const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findOrphanedReservations() {
  console.log('🔍 Searching for orphaned reservations...');
  
  try {
    // Get all reservations
    const reservationsSnapshot = await db.collection('reservations').get();
    const reservations = [];
    
    reservationsSnapshot.forEach(doc => {
      reservations.push({
        id: doc.id,
        ...doc.data(),
        docRef: doc.ref
      });
    });
    
    console.log(`📋 Found ${reservations.length} total reservations`);
    
    // Get all slots
    const slotsSnapshot = await db.collection('slots').get();
    const slotIds = new Set();
    
    slotsSnapshot.forEach(doc => {
      slotIds.add(doc.id);
    });
    
    console.log(`🗓️ Found ${slotIds.size} total slots`);
    
    // Find orphaned reservations
    const orphanedReservations = reservations.filter(reservation => 
      !slotIds.has(reservation.slotId)
    );
    
    console.log(`🚨 Found ${orphanedReservations.length} orphaned reservations`);
    
    if (orphanedReservations.length > 0) {
      console.log('\n📄 Orphaned reservations:');
      orphanedReservations.forEach(reservation => {
        console.log(`- ID: ${reservation.id}`);
        console.log(`  User: ${reservation.userName || reservation.userEmail || 'Unknown'}`);
        console.log(`  Slot ID: ${reservation.slotId}`);
        console.log(`  Date: ${reservation.date || 'Unknown'}`);
        console.log(`  Time: ${reservation.time || 'Unknown'}`);
        console.log(`  Status: ${reservation.status || 'Unknown'}`);
        console.log('---');
      });
    }
    
    return orphanedReservations;
    
  } catch (error) {
    console.error('❌ Error finding orphaned reservations:', error);
    throw error;
  }
}

async function deleteOrphanedReservations(orphanedReservations) {
  if (orphanedReservations.length === 0) {
    console.log('✅ No orphaned reservations to delete');
    return;
  }
  
  console.log(`\n🗑️ Deleting ${orphanedReservations.length} orphaned reservations...`);
  
  try {
    const deletePromises = orphanedReservations.map(reservation => 
      reservation.docRef.delete()
    );
    
    await Promise.all(deletePromises);
    
    console.log('✅ Successfully deleted all orphaned reservations');
    
  } catch (error) {
    console.error('❌ Error deleting orphaned reservations:', error);
    throw error;
  }
}

async function findSpecificUserReservation(userEmail, date) {
  console.log(`🔍 Searching for reservations by ${userEmail} on ${date}...`);
  
  try {
    const reservationsSnapshot = await db.collection('reservations')
      .where('userEmail', '==', userEmail)
      .get();
    
    const userReservations = [];
    reservationsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date.includes(date)) {
        userReservations.push({
          id: doc.id,
          ...data,
          docRef: doc.ref
        });
      }
    });
    
    console.log(`📋 Found ${userReservations.length} reservations for ${userEmail} on ${date}`);
    
    userReservations.forEach(reservation => {
      console.log(`- ID: ${reservation.id}`);
      console.log(`  Slot ID: ${reservation.slotId}`);
      console.log(`  Date: ${reservation.date}`);
      console.log(`  Time: ${reservation.time}`);
      console.log(`  Status: ${reservation.status}`);
    });
    
    return userReservations;
    
  } catch (error) {
    console.error('❌ Error finding user reservations:', error);
    throw error;
  }
}

async function deleteSpecificReservations(reservationIds) {
  console.log(`🗑️ Deleting specific reservations: ${reservationIds.join(', ')}`);
  
  try {
    const deletePromises = reservationIds.map(id => 
      db.collection('reservations').doc(id).delete()
    );
    
    await Promise.all(deletePromises);
    
    console.log('✅ Successfully deleted specified reservations');
    
  } catch (error) {
    console.error('❌ Error deleting specific reservations:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting orphaned reservation cleanup...\n');
    
    // Find orphaned reservations
    const orphanedReservations = await findOrphanedReservations();
    
    // Also check for the specific user mentioned
    const gd2025_8_2 = await findSpecificUserReservation('blacksheepwall.xyz@gmail.com', '2025. 8. 2.');
    
    console.log('\n⚠️  WHAT TO DO NEXT:');
    console.log('1. Review the orphaned reservations listed above');
    console.log('2. If you want to delete them, uncomment the deletion line below');
    console.log('3. Run the script again to execute the deletion');
    
    // Uncomment the line below to actually delete orphaned reservations
    // await deleteOrphanedReservations(orphanedReservations);
    
    // If you want to delete specific reservations, use this:
    // await deleteSpecificReservations(['reservation-id-1', 'reservation-id-2']);
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  findOrphanedReservations,
  deleteOrphanedReservations,
  findSpecificUserReservation,
  deleteSpecificReservations
}; 