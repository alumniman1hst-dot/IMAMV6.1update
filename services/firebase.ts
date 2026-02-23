/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyACaFuJPIvj8urf5ZSDaw_pvgZNkx1mQLM",
  authDomain: "edusync-manager.firebaseapp.com",
  databaseURL: "https://edusync-manager-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edusync-manager",
  storageBucket: "edusync-manager.firebasestorage.app",
  messagingSenderId: "776387068593",
  appId: "1:776387068593:web:aa562f6f9d62c14ff09890",
  measurementId: "G-WDB4WFXBLZ"
};

// Check for mock mode in localStorage or process env
// Menggunakan fungsi agar pengecekan selalu segar (fresh)
export const checkMockMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const forced = localStorage.getItem('imam_force_mock');
    if (forced === 'true') return true;
    if (forced === 'false') return false;
    
    // Auto-mock jika di lingkungan local yang tidak dikonfigurasi
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
       // Tetap default false agar user bisa mencoba koneksi asli dulu
       return false;
    }
  }
  return false;
};

export const isMockMode = checkMockMode();

let app: firebase.app.App | undefined;
let auth: firebase.auth.Auth | undefined;
let db: firebase.firestore.Firestore | undefined;
let analytics: firebase.analytics.Analytics | undefined;

try {
  // Inisialisasi Firebase hanya jika tidak dalam mode simulasi paksa
  // Ini mencegah error "network-request-failed" saat inisialisasi di jaringan terbatas
  if (!isMockMode) {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }

    auth = firebase.auth();
    db = firebase.firestore();
    
    if (typeof window !== 'undefined' && db) {
        // Set persistence ke LOCAL agar sesi bertahan meski tab ditutup
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(err => {
          console.warn("Auth persistence error:", err.message);
        });

        // Aktifkan Offline Persistence untuk Firestore
        db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
            console.warn("Firestore Persistence Disabled:", err.code);
        });
    }

    if (typeof window !== 'undefined' && firebase.analytics.isSupported()) {
       analytics = firebase.analytics();
    }
    
    console.log("IMAM DB: CLOUD ENGINE INITIALIZED");
  } else {
    console.log("IMAM DB: SIMULATION ENGINE ACTIVE (FIREBASE BYPASSED)");
  }

} catch (error: any) {
  console.error("Critical Firebase Init Failure:", error.message);
  // Jika gagal total, paksa mode simulasi untuk menjaga aplikasi tetap bisa dibuka
  if (typeof window !== 'undefined') {
    // localStorage.setItem('imam_force_mock', 'true'); 
  }
}

export { app, auth, db, analytics };