/**
 * Version: 2.2.0 (Modern Offline Cache)
 * Changelog: 
 * - FIX: Mengganti enableIndexedDbPersistence yang deprecated.
 * - UPGRADE: Menggunakan initializeFirestore dengan persistentLocalCache.
 * - Mendukung persistentMultipleTabManager (Aman dibuka di banyak tab/window).
 */
import { initializeApp } from 'firebase/app';
// Ganti getFirestore jadi initializeFirestore untuk akses metode cache modern
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // PASTIKAN INI API KEY ASLI MILIK LU
  apiKey: "AIzaSyDIExJP9zUwnra26OFl1f1zgyO_yKzmMrk",
  authDomain: "mekanikpro-4ef01.firebaseapp.com",
  projectId: "mekanikpro-4ef01",
  storageBucket: "mekanikpro-4ef01.firebasestorage.app",
  messagingSenderId: "570974417754",
  appId: "1:570974417754:web:eaa2a1af5cef649e9e7963"
};

const app = initializeApp(firebaseConfig);

// METODE OFFLINE MODE TERBARU (ANTI DEPRECATED WARNING)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
