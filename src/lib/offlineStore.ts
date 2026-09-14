"use client";

/**
 * Offline storage via IndexedDB using the `idb` package.
 *
 * All game sessions and check-ins write here first, then sync to
 * the server when online. This is the core of the offline-first
 * architecture — the patient app works fully without network.
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { GameSession, CheckIn } from "./types";

interface SmaranDB extends DBSchema {
  gameSessions: {
    key: string;
    value: GameSession;
    indexes: {
      "by-synced": number;
      "by-patient": string;
    };
  };
  checkIns: {
    key: string;
    value: CheckIn;
    indexes: {
      "by-synced": number;
      "by-patient": string;
    };
  };
}

const DB_NAME = "smaran-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SmaranDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SmaranDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmaranDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("gameSessions")) {
          const sessionStore = db.createObjectStore("gameSessions", {
            keyPath: "id",
          });
          sessionStore.createIndex("by-synced", "synced" as never);
          sessionStore.createIndex("by-patient", "patientId");
        }

        if (!db.objectStoreNames.contains("checkIns")) {
          const checkInStore = db.createObjectStore("checkIns", {
            keyPath: "id",
          });
          checkInStore.createIndex("by-synced", "synced" as never);
          checkInStore.createIndex("by-patient", "patientId");
        }
      },
    });
  }
  return dbPromise;
}

/** Save a game session to IndexedDB (synced: false by default). */
export async function saveSessionOffline(session: GameSession): Promise<void> {
  const db = await getDB();
  await db.put("gameSessions", { ...session, synced: false });
}

/** Save a check-in to IndexedDB (synced: false by default). */
export async function saveCheckInOffline(checkIn: CheckIn): Promise<void> {
  const db = await getDB();
  await db.put("checkIns", { ...checkIn, synced: false });
}

/** Get all game sessions that haven't been synced yet. */
export async function getUnsyncedSessions(): Promise<GameSession[]> {
  const db = await getDB();
  const all = await db.getAll("gameSessions");
  return all.filter((s) => !s.synced);
}

/** Get all check-ins that haven't been synced yet. */
export async function getUnsyncedCheckIns(): Promise<CheckIn[]> {
  const db = await getDB();
  const all = await db.getAll("checkIns");
  return all.filter((c) => !c.synced);
}

/** Mark a record as synced. */
export async function markSynced(
  store: "gameSessions" | "checkIns",
  id: string
): Promise<void> {
  const db = await getDB();
  const record = await db.get(store, id);
  if (record) {
    await db.put(store, { ...record, synced: true });
  }
}

/** Get all sessions for a patient from local IDB. */
export async function getSessionsForPatient(
  patientId: string
): Promise<GameSession[]> {
  const db = await getDB();
  return db.getAllFromIndex("gameSessions", "by-patient", patientId);
}

/**
 * Sync all unsynced records to the server via /api/sync.
 * Broadcasts sync events across tabs so caregiver dashboard immediately updates.
 */
export async function syncToFirestore(): Promise<{
  sessionsSynced: number;
  checkInsSynced: number;
}> {
  const sessions = await getUnsyncedSessions();
  const checkIns = await getUnsyncedCheckIns();

  if (sessions.length === 0 && checkIns.length === 0) {
    return { sessionsSynced: 0, checkInsSynced: 0 };
  }

  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions, checkIns }),
    });

    if (!response.ok) {
      console.warn("[Sync] Server returned", response.status);
      return { sessionsSynced: 0, checkInsSynced: 0 };
    }

    // Mark all as synced
    for (const s of sessions) {
      await markSynced("gameSessions", s.id);
    }
    for (const c of checkIns) {
      await markSynced("checkIns", c.id);
    }

    // Broadcast sync event to caregiver dashboard
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("smaran_sync");
        channel.postMessage({
          type: "SESSION_SYNCED",
          patientId: sessions[0]?.patientId,
          count: sessions.length,
          timestamp: Date.now(),
        });
        setTimeout(() => {
          try { channel.close(); } catch {}
        }, 1500);
      } catch { /* silent */ }
    }

    return {
      sessionsSynced: sessions.length,
      checkInsSynced: checkIns.length,
    };
  } catch (err) {
    console.error("[Sync] Failed to sync:", err);
    return { sessionsSynced: 0, checkInsSynced: 0 };
  }
}

/** Convenience alias for saving game session with instant online sync */
export async function saveGameSessionLocally(session: GameSession): Promise<void> {
  await saveSessionOffline(session);

  // Trigger immediate direct sync if connected to network
  if (typeof window !== "undefined" && navigator.onLine) {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions: [session] }),
      });

      // Broadcast immediately
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("smaran_sync");
        channel.postMessage({
          type: "SESSION_SYNCED",
          patientId: session.patientId,
          session,
          timestamp: Date.now(),
        });
        setTimeout(() => {
          try { channel.close(); } catch {}
        }, 1500);
      }
    } catch (err) {
      console.warn("[OfflineStore] Immediate live sync trigger:", err);
    }
  }
}

/** Convenience alias for syncing pending sessions */
export async function syncPendingSessions(patientId?: string): Promise<number> {
  void patientId;
  const res = await syncToFirestore();
  return res.sessionsSynced + res.checkInsSynced;
}

/** Family photo storage in localStorage */
export async function saveFamilyMemberLocally(photo: {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  photoBase64: string;
  createdAt: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  const key = `smaran_family_${photo.patientId}`;
  const existingRaw = localStorage.getItem(key);
  const list = existingRaw ? JSON.parse(existingRaw) : [];
  list.unshift(photo);
  localStorage.setItem(key, JSON.stringify(list));
}

export async function getLocalFamilyMembers(
  patientId?: string
): Promise<
  Array<{
    id: string;
    patientId: string;
    name: string;
    relation: string;
    photoBase64: string;
    createdAt: string;
  }>
> {
  if (typeof window === "undefined") return [];
  if (patientId) {
    const raw = localStorage.getItem(`smaran_family_${patientId}`);
    return raw ? JSON.parse(raw) : [];
  }
  const currentPid = localStorage.getItem("smaran_patient_id") || "local";
  const raw = localStorage.getItem(`smaran_family_${currentPid}`);
  return raw ? JSON.parse(raw) : [];
}
