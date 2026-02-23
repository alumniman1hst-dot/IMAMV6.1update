
import * as admin from 'firebase-admin';

// Check if app is already initialized to prevent multiple instances
if (!admin.apps.length) {
  try {
    // Only initialize if we have environment variables or in a context where it's safe
    // In a real Next.js server environment, these would be populated.
    // For this demo/client-side preview, this might catch errors if env vars are missing.
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "edusync-manager",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "mock-email@firebase.com",
        // Handle newline characters in private key for Vercel/Env vars
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://edusync-manager-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
