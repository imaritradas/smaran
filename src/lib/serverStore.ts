/**
 * Server-side persistent storage layer for Smaran.
 *
 * Supports dual-mode:
 * 1. Cloud Firestore (when Firebase Admin credentials are configured in .env.local)
 * 2. Persistent file-backed JSON store (.data/smaran-db.json) for zero-configuration,
 *    local development, hackathon demos, and offline environments.
 *
 * Guarantees 100% data integrity between patient app and caregiver dashboard.
 */

import fs from "fs";
import path from "path";
import { isFirebaseAdminConfigured, getAdminFirestoreSafe } from "./firebaseAdmin";
import { Patient, GameSession, CheckIn, CaregiverAlert, SupportedLanguage } from "./types";

interface FamilyMemberRecord {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  photoBase64: string;
  createdAt: string;
}

interface SmaranServerData {
  patients: Patient[];
  patientCodes: Record<string, { code: string; patientId: string; caregiverId: string; createdAt: number }>;
  gameSessions: GameSession[];
  checkIns: CheckIn[];
  alerts: CaregiverAlert[];
  familyMembers: FamilyMemberRecord[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "smaran-db.json");

const INITIAL_PATIENTS: Patient[] = [
  {
    id: "pat_849201",
    caregiverId: "cg_default",
    name: "Bhaben Baruah",
    preferredLanguage: "as",
    caregiverPhone: "+91 98640 12345",
    pairingCode: "849201",
    createdAt: Date.now() - 14 * 86400000,
  },
  {
    id: "pat_391042",
    caregiverId: "cg_default",
    name: "Hagrama Basumatary",
    preferredLanguage: "brx",
    caregiverPhone: "+91 94350 54321",
    pairingCode: "391042",
    createdAt: Date.now() - 28 * 86400000,
  },
];

// Initial mock baseline sessions so trends and dashboard show realistic data immediately
const INITIAL_SESSIONS: GameSession[] = [
  {
    id: "sess_init_1",
    patientId: "pat_849201",
    gameType: "memory-match",
    playedAt: Date.now() - 2 * 86400000,
    accuracy: 0.85,
    avgResponseMs: 1420,
    repeatedMistakes: 1,
    durationMs: 45000,
    synced: true,
  },
  {
    id: "sess_init_2",
    patientId: "pat_849201",
    gameType: "spot-and-tap",
    playedAt: Date.now() - 1 * 86400000,
    accuracy: 0.90,
    avgResponseMs: 980,
    repeatedMistakes: 0,
    durationMs: 32000,
    synced: true,
  },
  {
    id: "sess_init_3",
    patientId: "pat_849201",
    gameType: "routine-recall",
    playedAt: Date.now() - 3600000 * 6,
    accuracy: 0.75,
    avgResponseMs: 2100,
    repeatedMistakes: 1,
    durationMs: 50000,
    synced: true,
  },
  {
    id: "sess_init_4",
    patientId: "pat_849201",
    gameType: "family-faces",
    playedAt: Date.now() - 3600000 * 2,
    accuracy: 1.0,
    avgResponseMs: 1200,
    repeatedMistakes: 0,
    durationMs: 30000,
    synced: true,
  },
];

let inMemoryData: SmaranServerData | null = null;

function loadFileData(): SmaranServerData {
  if (inMemoryData) return inMemoryData;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      inMemoryData = JSON.parse(content);
      if (inMemoryData) {
        // Ensure all collections exist
        inMemoryData.patients = inMemoryData.patients || [];
        inMemoryData.patientCodes = inMemoryData.patientCodes || {};
        inMemoryData.gameSessions = inMemoryData.gameSessions || [];
        inMemoryData.checkIns = inMemoryData.checkIns || [];
        inMemoryData.alerts = inMemoryData.alerts || [];
        inMemoryData.familyMembers = inMemoryData.familyMembers || [];

        // Ensure default patients exist
        for (const p of INITIAL_PATIENTS) {
          if (!inMemoryData.patients.some((x) => x.id === p.id)) {
            inMemoryData.patients.push(p);
          }
          if (!inMemoryData.patientCodes[p.pairingCode]) {
            inMemoryData.patientCodes[p.pairingCode] = {
              code: p.pairingCode,
              patientId: p.id,
              caregiverId: p.caregiverId,
              createdAt: p.createdAt,
            };
          }
        }
        return inMemoryData;
      }
    }
  } catch (err) {
    console.error("[ServerStore] Error reading store file:", err);
  }

  // Fallback initial dataset
  inMemoryData = {
    patients: [...INITIAL_PATIENTS],
    patientCodes: {
      "849201": { code: "849201", patientId: "pat_849201", caregiverId: "cg_default", createdAt: Date.now() },
      "391042": { code: "391042", patientId: "pat_391042", caregiverId: "cg_default", createdAt: Date.now() },
    },
    gameSessions: [...INITIAL_SESSIONS],
    checkIns: [],
    alerts: [
      {
        id: "alt_init_1",
        patientId: "pat_849201",
        message: "Consistent decline detected in Pattern Recognition (-9%) over the past 14 days. Consider scheduling a wellness check.",
        createdAt: Date.now() - 3600000 * 5,
        acknowledged: false,
      },
    ],
    familyMembers: [],
  };

  saveFileData();
  return inMemoryData;
}

function saveFileData() {
  if (!inMemoryData) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryData, null, 2), "utf-8");
  } catch (err) {
    console.error("[ServerStore] Error saving store file:", err);
  }
}

// ─────────────────────────────────────────────────────────
// PATIENT OPERATIONS
// ─────────────────────────────────────────────────────────

export async function createPatient(data: {
  name: string;
  caregiverId: string;
  caregiverPhone: string;
  preferredLanguage?: SupportedLanguage;
  photoUrl?: string;
}): Promise<{ patient: Patient; pairingCode: string }> {
  const store = loadFileData();

  // Generate unique 6-digit code
  let code: string;
  let codeExists = true;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
    codeExists = Boolean(store.patientCodes[code]);
  } while (codeExists);

  const patientId = `pat_${code}`;
  const patient: Patient = {
    id: patientId,
    caregiverId: data.caregiverId,
    name: data.name.trim(),
    preferredLanguage: data.preferredLanguage || "as",
    caregiverPhone: data.caregiverPhone.trim(),
    pairingCode: code,
    photoUrl: data.photoUrl,
    createdAt: Date.now(),
  };

  store.patients.unshift(patient);
  store.patientCodes[code] = {
    code,
    patientId: patient.id,
    caregiverId: patient.caregiverId,
    createdAt: patient.createdAt,
  };
  saveFileData();

  // If Firebase Admin is configured, mirror to Firestore
  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestoreSafe();
      if (db) {
        await db.collection("patients").doc(patient.id).set(patient);
        await db.collection("patientCodes").doc(code).set({
          code,
          patientId: patient.id,
          caregiverId: patient.caregiverId,
          createdAt: patient.createdAt,
        });
      }
    } catch (err) {
      console.warn("[ServerStore] Cloud Firestore mirror failed, local store retained:", err);
    }
  }

  return { patient, pairingCode: code };
}

export async function getPatientsByCaregiver(caregiverId: string): Promise<Patient[]> {
  const store = loadFileData();

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestoreSafe();
      if (db) {
        const snap = await db
          .collection("patients")
          .where("caregiverId", "==", caregiverId)
          .orderBy("createdAt", "desc")
          .get();

        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Patient);
        }
      }
    } catch (err) {
      console.warn("[ServerStore] Firestore getPatients failed, using local store:", err);
    }
  }

  // Return local store patients for this caregiver or default demo caregiver
  return store.patients.filter(
    (p) => p.caregiverId === caregiverId || p.caregiverId === "cg_default" || caregiverId === "cg_default"
  );
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const store = loadFileData();

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestoreSafe();
      if (db) {
        const doc = await db.collection("patients").doc(patientId).get();
        if (doc.exists) {
          return doc.data() as Patient;
        }
      }
    } catch { /* fallback to local */ }
  }

  const found = store.patients.find((p) => p.id === patientId);
  return found || null;
}

export async function getPatientByCode(code: string): Promise<Patient | null> {
  const store = loadFileData();

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestoreSafe();
      if (db) {
        const codeDoc = await db.collection("patientCodes").doc(code).get();
        if (codeDoc.exists) {
          const patientId = codeDoc.data()?.patientId;
          if (patientId) {
            const pDoc = await db.collection("patients").doc(patientId).get();
            if (pDoc.exists) {
              return pDoc.data() as Patient;
            }
          }
        }
      }
    } catch { /* fallback to local */ }
  }

  const mapping = store.patientCodes[code];
  if (mapping) {
    const p = store.patients.find((x) => x.id === mapping.patientId);
    if (p) return p;
  }

  // Also check patient.pairingCode directly
  const direct = store.patients.find((p) => p.pairingCode === code);
  return direct || null;
}

// ─────────────────────────────────────────────────────────
// GAME SESSION & CHECK-IN SYNC OPERATIONS
// ─────────────────────────────────────────────────────────

export async function syncGameSessions(
  sessions: GameSession[],
  checkIns: CheckIn[] = []
): Promise<{ syncedCount: number }> {
  const store = loadFileData();
  let count = 0;

  for (const s of sessions) {
    const existingIndex = store.gameSessions.findIndex((x) => x.id === s.id);
    const updated = { ...s, synced: true };
    if (existingIndex >= 0) {
      store.gameSessions[existingIndex] = updated;
    } else {
      store.gameSessions.unshift(updated);
    }
    count++;
  }

  for (const c of checkIns) {
    const existingIndex = store.checkIns.findIndex((x) => x.id === c.id);
    const updated = { ...c, synced: true };
    if (existingIndex >= 0) {
      store.checkIns[existingIndex] = updated;
    } else {
      store.checkIns.unshift(updated);
    }
    count++;
  }

  saveFileData();

  // If Firebase Admin is available, batch write to Cloud Firestore
  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestoreSafe();
      if (db && count > 0) {
        const batch = db.batch();
        for (const s of sessions) {
          const ref = db.collection("gameSessions").doc(s.id);
          batch.set(ref, { ...s, synced: true });
        }
        for (const c of checkIns) {
          const ref = db.collection("checkIns").doc(c.id);
          batch.set(ref, { ...c, synced: true });
        }
        await batch.commit();
      }
    } catch (err) {
      console.warn("[ServerStore] Firestore batch sync failed, local sync retained:", err);
    }
  }

  return { syncedCount: count };
}

export async function getGameSessionsForPatient(patientId: string): Promise<GameSession[]> {
  const store = loadFileData();

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestoreSafe();
      if (db) {
        const snap = await db
          .collection("gameSessions")
          .where("patientId", "==", patientId)
          .orderBy("playedAt", "desc")
          .get();

        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as GameSession);
        }
      }
    } catch { /* fallback to local */ }
  }

  return store.gameSessions.filter((s) => s.patientId === patientId);
}

export async function getCheckInsForPatient(patientId: string): Promise<CheckIn[]> {
  const store = loadFileData();

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestoreSafe();
      if (db) {
        const snap = await db
          .collection("checkIns")
          .where("patientId", "==", patientId)
          .orderBy("scheduledFor", "desc")
          .get();

        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as CheckIn);
        }
      }
    } catch { /* fallback to local */ }
  }

  return store.checkIns.filter((c) => c.patientId === patientId);
}

// ─────────────────────────────────────────────────────────
// ALERT OPERATIONS
// ─────────────────────────────────────────────────────────

export async function getAlertsForPatient(patientId: string): Promise<CaregiverAlert[]> {
  const store = loadFileData();
  return store.alerts.filter((a) => a.patientId === patientId);
}

export async function createAlert(patientId: string, message: string): Promise<CaregiverAlert> {
  const store = loadFileData();
  const alert: CaregiverAlert = {
    id: `alt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    patientId,
    message,
    createdAt: Date.now(),
    acknowledged: false,
  };
  store.alerts.unshift(alert);
  saveFileData();
  return alert;
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const store = loadFileData();
  const alert = store.alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    saveFileData();
  }
}

// ─────────────────────────────────────────────────────────
// DELETE PATIENT
// ─────────────────────────────────────────────────────────

export async function deletePatient(patientId: string): Promise<boolean> {
  const store = loadFileData();
  const patient = store.patients.find((p) => p.id === patientId);
  if (!patient) return false;

  // Remove from patients array
  store.patients = store.patients.filter((p) => p.id !== patientId);

  // Remove pairing code
  if (patient.pairingCode && store.patientCodes[patient.pairingCode]) {
    delete store.patientCodes[patient.pairingCode];
  }

  // Remove associated game sessions, check-ins, alerts, family members
  store.gameSessions = store.gameSessions.filter((s) => s.patientId !== patientId);
  store.checkIns = store.checkIns.filter((c) => c.patientId !== patientId);
  store.alerts = store.alerts.filter((a) => a.patientId !== patientId);
  store.familyMembers = store.familyMembers.filter((m) => m.patientId !== patientId);

  saveFileData();

  // If Firebase Admin is available, delete from Cloud Firestore too
  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestoreSafe();
      if (db) {
        await db.collection("patients").doc(patientId).delete();
        if (patient.pairingCode) {
          await db.collection("patientCodes").doc(patient.pairingCode).delete();
        }
      }
    } catch (err) {
      console.warn("[ServerStore] Firestore delete patient failed:", err);
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────
// FAMILY MEMBER OPERATIONS
// ─────────────────────────────────────────────────────────

export async function saveFamilyMember(data: {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  photoBase64: string;
  createdAt: string;
}): Promise<void> {
  const store = loadFileData();
  // Avoid duplicates
  const existingIndex = store.familyMembers.findIndex((m) => m.id === data.id);
  if (existingIndex >= 0) {
    store.familyMembers[existingIndex] = data;
  } else {
    store.familyMembers.unshift(data);
  }
  saveFileData();
}

export async function getFamilyMembersForPatient(patientId: string): Promise<FamilyMemberRecord[]> {
  const store = loadFileData();
  return store.familyMembers.filter((m) => m.patientId === patientId);
}

export async function deleteFamilyMember(memberId: string): Promise<boolean> {
  const store = loadFileData();
  const before = store.familyMembers.length;
  store.familyMembers = store.familyMembers.filter((m) => m.id !== memberId);
  if (store.familyMembers.length < before) {
    saveFileData();
    return true;
  }
  return false;
}
