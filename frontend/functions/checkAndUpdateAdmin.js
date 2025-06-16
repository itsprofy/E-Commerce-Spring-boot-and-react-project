const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = 'XRkOLb2aFeR6QFabYma5piHs7Qf1';

async function checkAndUpdateAdminRole() {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log('User document does not exist. Creating it...');
      await userRef.set({
        email: 'kinandeiri@gmail.com',
        displayName: 'kinan',
        roles: ['USER', 'ADMIN'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Created user document with ADMIN role');
    } else {
      const userData = userDoc.data();
      console.log('Current user data:', userData);

      // Check if roles array exists and includes ADMIN
      if (!userData.roles || !userData.roles.includes('ADMIN')) {
        console.log('Updating user with ADMIN role...');
        await userRef.update({
          roles: ['USER', 'ADMIN'],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('Updated user with ADMIN role');
      } else {
        console.log('User already has ADMIN role');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndUpdateAdminRole(); 