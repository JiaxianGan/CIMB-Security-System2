const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json'); // Update with your service account key path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://cimb-monitoring-system.firebaseio.com' // Update with your Firebase project ID
});

const db = admin.firestore();

async function setupUsers() {
  const users = [
    { email: 'admin@example.com', password: 'admin123', role: 'Administrator', username: 'admin' },
    { email: 'manager@example.com', password: 'manager123', role: 'Manager', username: 'manager' },
    { email: 'security@example.com', password: 'security123', role: 'Security Analyst', username: 'security' }
  ];

  for (const user of users) {
    try {
      // Create or update user in Firebase Authentication
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(user.email);
        console.log(`User ${user.email} already exists, updating...`);
        await admin.auth().updateUser(userRecord.uid, {
          email: user.email,
          password: user.password
        });
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          userRecord = await admin.auth().createUser({
            email: user.email,
            password: user.password,
            displayName: user.username
          });
          console.log(`Created user ${user.email}`);
        } else {
          throw error;
        }
      }

      // Set custom claims for role
      await admin.auth().setCustomUserClaims(userRecord.uid, { role: user.role });
      console.log(`Set role ${user.role} for ${user.email}`);

      // Store user metadata in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Stored metadata for ${user.email} in Firestore`);
    } catch (error) {
      console.error(`Error processing ${user.email}:`, error);
    }
  }

  console.log('User setup completed.');
  process.exit(0);
}

setupUsers().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});