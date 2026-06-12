// src/firebase.js
// Firebase connection — reads config from environment variables.
// Set these in a .env file locally or as GitHub Secrets in CI.
// If no config is provided the app works fully offline via localStorage.

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

const cfg = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.projectId);

let db = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(cfg);
    db = getFirestore(app);
    // Offline persistence — data available even without internet
    enableIndexedDbPersistence(db).catch(() => {});
  } catch (e) {
    console.warn('[Firebase] init failed — using localStorage only:', e.message);
  }
}

export { db };
