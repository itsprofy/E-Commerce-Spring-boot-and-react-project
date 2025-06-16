const admin = require('firebase-admin');
const serviceAccount = require('../functions/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function makeUserAdmin(email) {
  try {
    console.log('Looking for user with email:', email);
    
    // Get user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      console.log('No user found with email:', email);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    console.log('Found user:', userDoc.id);

    // Update user document with admin role
    await db.collection('users').doc(userDoc.id).update({
      roles: ['USER', 'ADMIN'],
      updatedAt: new Date()
    });

    console.log('Successfully made user an admin!');
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    // Exit the process
    process.exit();
  }
}

// Replace with the email you want to make admin
makeUserAdmin('profy401@gmail.com'); 