/**
 * Firebase client SDK initialization (Firestore + Auth).
 *
 * This module runs in the browser. It uses NEXT_PUBLIC_ env vars which
 * are safe to expose client-side (they're project identifiers, not secrets).
 * The Admin SDK (with privileged access) is in firebaseAdmin.ts and
 * MUST ONLY be imported from server-side API routes.
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const isConfigured =
  apiKey &&
  apiKey !== "YOUR_FIREBASE_API_KEY_HERE" &&
  !apiKey.startsWith("YOUR_");

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (typeof window !== "undefined" && isConfigured) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  dbInstance = getFirestore(app);
  authInstance = getAuth(app);
}

export const db = dbInstance as Firestore;
export const auth = authInstance as Auth;

export function initClientAuth() {
  return authInstance;
}


