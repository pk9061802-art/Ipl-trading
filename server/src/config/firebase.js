const admin = require('firebase-admin');

const isConfigured = 
  process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_PROJECT_ID !== 'your_project_id' &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');

if (!admin.apps.length && isConfigured) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.error('❌ Firebase Admin initialization failed:', err.message);
  }
} else if (!isConfigured) {
  console.log('⚠️ Firebase Admin not configured. Skipping initialization.');
}

let db = null;
let auth = null;

if (admin.apps.length) {
  db = admin.firestore();
  auth = admin.auth();
}

module.exports = { admin, db, auth };
