import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || 'edusync-manager';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: clientEmail && privateKey
      ? admin.credential.cert({ projectId, clientEmail, privateKey })
      : admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

const patchCollection = async (collectionName, roleValue) => {
  const snap = await db.collection(collectionName).get();
  let count = 0;
  let batch = db.batch();
  let op = 0;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    batch.update(doc.ref, {
      role: roleValue,
      roles: [roleValue],
      uidAuth: data.uidAuth || data.linkedUserId || null,
      password: data.password || '123456',
    });
    op += 1;
    count += 1;

    if (op >= 400) {
      await batch.commit();
      batch = db.batch();
      op = 0;
    }
  }

  if (op > 0) await batch.commit();
  return count;
};

(async () => {
  const students = await patchCollection('students', 'SISWA');
  const teachers = await patchCollection('teachers', 'GURU');
  console.log(`Updated students: ${students}, teachers: ${teachers}`);
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
