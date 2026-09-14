/**
 * Firebase Admin SDK — server-side only.
 *
 * SECURITY: This file must ONLY be imported from server-side files (api routes / serverStore).
 * It must NEVER appear in any client-side bundle.
 *
 * LAZY INITIALIZATION & SAFE FALLBACK:
 * If Firebase Admin environment variables are missing or invalid,
 * it safely returns null so the application seamlessly falls back
 * to the persistent local data layer with 100% integrity.
 */

import {
  initializeApp,
  getApps,
  cert,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
    process.env.FIREBASE_ADMIN_PROJECT_ID !== "YOUR_FIREBASE_ADMIN_PROJECT_ID_HERE"
  );
}

/**
 * Get or create the Firebase Admin app instance safely.
 */
export function getAdminApp(): App | null {
  if (adminApp) return adminApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });

    return adminApp;
  } catch (err) {
    console.warn("[FirebaseAdmin] Failed to initialize Firebase Admin app:", err);
    return null;
  }
}

/** Get the Admin Firestore instance safely. Returns null if unconfigured. */
export function getAdminFirestoreSafe(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch {
    return null;
  }
}

/** Legacy export for backward compatibility */
export function getAdminFirestore(): Firestore {
  const db = getAdminFirestoreSafe();
  if (!db) {
    throw new Error("Firebase Admin is not configured. Use serverStore for robust fallback.");
  }
  return db;
}
