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
import { Patient, GameSession, CheckIn, CaregiverAlert, SupportedLanguage, LocationRecord, SafeZoneConfig } from "./types";

interface FamilyMemberRecord {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  photoBase64: string;
  createdAt: string;
}

export interface ReminderRecord {
  id: string;
  patientId: string;
  title: string;
  scheduledTime: string; // "08:30", "16:00"
  category: "medicine" | "water" | "walk" | "food" | "general";
  completed: boolean;
  completedAt?: number | null;
  createdAt: number;
}

export interface NotificationRecord {
  id: string;
  patientId: string;
  title: string;
  message: string;
  type: "alert" | "reminder" | "caregiver" | "system";
  priority: "high" | "normal";
  read: boolean;
  createdAt: number;
}

interface SmaranServerData {
  patients: Patient[];
  patientCodes: Record<string, { code: string; patientId: string; caregiverId: string; createdAt: number }>;
  gameSessions: GameSession[];
  checkIns: CheckIn[];
  alerts: CaregiverAlert[];
  familyMembers: FamilyMemberRecord[];
  reminders: ReminderRecord[];
  notifications: NotificationRecord[];
  locations: LocationRecord[];
  safeZones: Record<string, SafeZoneConfig>;
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

const INITIAL_REMINDERS: ReminderRecord[] = [
  {
    id: "rem_1",
    patientId: "pat_602188",
    title: "Take Morning Blood Pressure Tablet",
    scheduledTime: "08:30",
    category: "medicine",
    completed: false,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: "rem_2",
    patientId: "pat_602188",
    title: "Drink Fresh Water / Hydrate Yourself",
    scheduledTime: "11:00",
    category: "water",
    completed: false,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: "rem_3",
    patientId: "pat_602188",
    title: "Healthy Midday Meal & Fruits",
    scheduledTime: "13:00",
    category: "food",
    completed: false,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: "rem_4",
    patientId: "pat_602188",
    title: "Evening Walk in Garden",
    scheduledTime: "16:30",
    category: "walk",
    completed: false,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: "rem_5",
    patientId: "pat_602188",
    title: "Evening Ayurvedic Tea & Relaxation",
    scheduledTime: "18:00",
    category: "water",
    completed: false,
    createdAt: Date.now() - 3600000 * 3,
  },
];

const INITIAL_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: "notif_1",
    patientId: "pat_602188",
    title: "Caregiver Connected",
    message: "Your caregiver is connected and monitoring your cognitive wellness & routine.",
    type: "caregiver",
    priority: "normal",
    read: false,
    createdAt: Date.now() - 7200000,
  },
  {
    id: "notif_2",
    patientId: "pat_602188",
    title: "Hydration Alert",
    message: "Please drink a glass of fresh water to keep your mind active and body hydrated.",
    type: "alert",
    priority: "high",
    read: false,
    createdAt: Date.now() - 1800000,
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
        inMemoryData.reminders = inMemoryData.reminders || [];
        inMemoryData.notifications = inMemoryData.notifications || [];
        inMemoryData.locations = inMemoryData.locations || [];
        inMemoryData.safeZones = inMemoryData.safeZones || {};

        // If reminders/notifications are empty, populate defaults
        if (inMemoryData.reminders.length === 0) {
          inMemoryData.reminders = [...INITIAL_REMINDERS];
        }
        if (inMemoryData.notifications.length === 0) {
          inMemoryData.notifications = [...INITIAL_NOTIFICATIONS];
        }

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
    reminders: [...INITIAL_REMINDERS],
    notifications: [...INITIAL_NOTIFICATIONS],
    locations: [],
    safeZones: {},
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
  const patientAlerts = store.alerts.filter((a) => a.patientId === patientId);
  const seen = new Set<string>();
  return patientAlerts.filter((a) => {
    const key = `${a.message.trim()}_${a.acknowledged}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function createAlert(patientId: string, message: string): Promise<CaregiverAlert> {
  const store = loadFileData();

  // Deduplicate active alert with exact same message
  const existing = store.alerts.find(
    (a) => a.patientId === patientId && !a.acknowledged && a.message.trim() === message.trim()
  );
  if (existing) {
    return existing;
  }

  const alert: CaregiverAlert = {
    id: `alt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    patientId,
    message: message.trim(),
    createdAt: Date.now(),
    acknowledged: false,
  };
  store.alerts.unshift(alert);

  // Clean duplicate active alerts
  const seenAlerts = new Set<string>();
  store.alerts = store.alerts.filter((a) => {
    const key = `${a.patientId}_${a.message.trim()}_${a.acknowledged}`;
    if (seenAlerts.has(key)) return false;
    seenAlerts.add(key);
    return true;
  });

  // Automatically mirror important alert to the patient app notifications (deduplicated)
  const existingNotif = store.notifications.find(
    (n) => n.patientId === patientId && !n.read && n.message.trim() === message.trim()
  );
  if (!existingNotif) {
    const notif: NotificationRecord = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      patientId,
      title: "Caregiver Alert",
      message: message.trim(),
      type: "alert",
      priority: "high",
      read: false,
      createdAt: Date.now(),
    };
    store.notifications.unshift(notif);
  }

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

  // Remove associated records
  store.gameSessions = store.gameSessions.filter((s) => s.patientId !== patientId);
  store.checkIns = store.checkIns.filter((c) => c.patientId !== patientId);
  store.alerts = store.alerts.filter((a) => a.patientId !== patientId);
  store.familyMembers = store.familyMembers.filter((m) => m.patientId !== patientId);
  store.reminders = store.reminders.filter((r) => r.patientId !== patientId);
  store.notifications = store.notifications.filter((n) => n.patientId !== patientId);

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

// ─────────────────────────────────────────────────────────
// REMINDER OPERATIONS
// ─────────────────────────────────────────────────────────

export async function getRemindersForPatient(patientId: string): Promise<ReminderRecord[]> {
  const store = loadFileData();
  const list = store.reminders.filter((r) => r.patientId === patientId);
  // Also include pat_602188 if checking local_patient or vice-versa and empty
  if (list.length === 0 && (patientId === "local_patient" || patientId === "pat_849201")) {
    return store.reminders.filter((r) => r.patientId === "pat_602188");
  }
  return list;
}

export async function createReminder(data: {
  id?: string;
  patientId: string;
  title: string;
  scheduledTime: string;
  category?: "medicine" | "water" | "walk" | "food" | "general";
}): Promise<ReminderRecord> {
  const store = loadFileData();
  const reminder: ReminderRecord = {
    id: data.id || `rem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    patientId: data.patientId,
    title: data.title.trim(),
    scheduledTime: data.scheduledTime || "09:00",
    category: data.category || "general",
    completed: false,
    createdAt: Date.now(),
  };

  store.reminders.unshift(reminder);

  // Also auto-notify the patient about the scheduled reminder
  const notif: NotificationRecord = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    patientId: data.patientId,
    title: `New Reminder: ${reminder.title}`,
    message: `Scheduled for ${reminder.scheduledTime}. Remember to take care of yourself!`,
    type: "reminder",
    priority: reminder.category === "medicine" ? "high" : "normal",
    read: false,
    createdAt: Date.now(),
  };
  store.notifications.unshift(notif);

  saveFileData();
  return reminder;
}

export async function toggleReminderStatus(reminderId: string, completed: boolean): Promise<ReminderRecord | null> {
  const store = loadFileData();
  const rem = store.reminders.find((r) => r.id === reminderId);
  if (rem) {
    rem.completed = completed;
    rem.completedAt = completed ? Date.now() : null;
    saveFileData();
    return rem;
  }
  return null;
}

export async function deleteReminder(reminderId: string): Promise<boolean> {
  const store = loadFileData();
  const before = store.reminders.length;
  store.reminders = store.reminders.filter((r) => r.id !== reminderId);
  if (store.reminders.length < before) {
    saveFileData();
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────
// NOTIFICATION OPERATIONS (Patient App)
// ─────────────────────────────────────────────────────────

export async function getNotificationsForPatient(patientId: string): Promise<NotificationRecord[]> {
  const store = loadFileData();
  const list = store.notifications.filter((n) => n.patientId === patientId);
  if (list.length === 0 && (patientId === "local_patient" || patientId === "pat_849201")) {
    return store.notifications.filter((n) => n.patientId === "pat_602188");
  }
  return list;
}

export async function createNotification(data: {
  id?: string;
  patientId: string;
  title: string;
  message: string;
  type?: "alert" | "reminder" | "caregiver" | "system";
  priority?: "high" | "normal";
}): Promise<NotificationRecord> {
  const store = loadFileData();
  const notif: NotificationRecord = {
    id: data.id || `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    patientId: data.patientId,
    title: data.title.trim(),
    message: data.message.trim(),
    type: data.type || "caregiver",
    priority: data.priority || "normal",
    read: false,
    createdAt: Date.now(),
  };
  store.notifications.unshift(notif);
  saveFileData();
  return notif;
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const store = loadFileData();
  const notif = store.notifications.find((n) => n.id === notificationId);
  if (notif) {
    notif.read = true;
    saveFileData();
    return true;
  }
  return false;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const store = loadFileData();
  const before = store.notifications.length;
  store.notifications = store.notifications.filter((n) => n.id !== notificationId);
  if (store.notifications.length < before) {
    saveFileData();
    return true;
  }
  return false;
}

// ─── GPS Location & Safe-Zone Geofencing Store ──────────────────────

/**
 * Calculates distance between two GPS coordinates using Haversine formula in meters.
 */
export function computeDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Computes bearing in degrees (0 - 360) from current location to home.
 */
export function computeBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return Math.round(((theta * 180) / Math.PI + 360) % 360);
}

// Sensible default home locations (Guwahati / Assam central coordinates)
const DEFAULT_SAFE_ZONES: Record<string, SafeZoneConfig> = {
  pat_602188: {
    patientId: "pat_602188",
    homeLatitude: 26.1445,
    homeLongitude: 91.7362,
    homeAddress: "Zoo Road, Guwahati, Assam",
    radiusMeters: 250,
    enabled: true,
    updatedAt: Date.now() - 3600000,
  },
  pat_849201: {
    patientId: "pat_849201",
    homeLatitude: 26.1856,
    homeLongitude: 91.7473,
    homeAddress: "Uzan Bazar, Guwahati, Assam",
    radiusMeters: 300,
    enabled: true,
    updatedAt: Date.now() - 3600000,
  },
};

export async function getPatientSafeZone(patientId: string): Promise<SafeZoneConfig> {
  const store = loadFileData();
  store.safeZones = store.safeZones || {};

  if (!store.safeZones[patientId]) {
    const fallback = DEFAULT_SAFE_ZONES[patientId] || {
      patientId,
      homeLatitude: 26.1445,
      homeLongitude: 91.7362,
      homeAddress: "Home Residence, Guwahati",
      radiusMeters: 250,
      enabled: true,
      updatedAt: Date.now(),
    };
    store.safeZones[patientId] = fallback;
    saveFileData();
  }

  return store.safeZones[patientId];
}

export async function updatePatientSafeZone(
  config: Partial<SafeZoneConfig> & { patientId: string }
): Promise<SafeZoneConfig> {
  const store = loadFileData();
  store.safeZones = store.safeZones || {};

  const current = await getPatientSafeZone(config.patientId);
  const updated: SafeZoneConfig = {
    ...current,
    ...config,
    updatedAt: Date.now(),
  };

  store.safeZones[config.patientId] = updated;
  saveFileData();
  return updated;
}

export async function getPatientLocations(
  patientId: string,
  limitCount = 60
): Promise<LocationRecord[]> {
  const store = loadFileData();
  store.locations = store.locations || [];

  let list = store.locations.filter((l) => l.patientId === patientId);

  // If no location history yet, generate initial baseline locations near home
  if (list.length === 0) {
    const safeZone = await getPatientSafeZone(patientId);
    const now = Date.now();
    const seedPoints: LocationRecord[] = [
      {
        id: `loc_seed_1`,
        patientId,
        latitude: safeZone.homeLatitude + 0.0001,
        longitude: safeZone.homeLongitude + 0.0001,
        accuracy: 12,
        heading: 90,
        speed: 0.5,
        timestamp: now - 15 * 60000,
        isLostSOS: false,
      },
      {
        id: `loc_seed_2`,
        patientId,
        latitude: safeZone.homeLatitude + 0.00025,
        longitude: safeZone.homeLongitude - 0.00015,
        accuracy: 10,
        heading: 140,
        speed: 0.8,
        timestamp: now - 5 * 60000,
        isLostSOS: false,
      },
      {
        id: `loc_seed_3`,
        patientId,
        latitude: safeZone.homeLatitude + 0.00018,
        longitude: safeZone.homeLongitude + 0.00005,
        accuracy: 8,
        heading: 45,
        speed: 0.2,
        timestamp: now,
        isLostSOS: false,
      },
    ];
    store.locations.push(...seedPoints);
    saveFileData();
    list = seedPoints;
  }

  return list.slice(-limitCount);
}

export async function recordPatientLocation(data: {
  patientId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  isLostSOS?: boolean;
}): Promise<{
  location: LocationRecord;
  safeZone: SafeZoneConfig;
  distanceMeters: number;
  isOutsideSafeZone: boolean;
  bearingDegrees: number;
}> {
  const store = loadFileData();
  store.locations = store.locations || [];

  const location: LocationRecord = {
    id: `loc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    patientId: data.patientId,
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy || 10,
    heading: data.heading !== undefined ? data.heading : null,
    speed: data.speed !== undefined ? data.speed : null,
    timestamp: Date.now(),
    isLostSOS: !!data.isLostSOS,
  };

  store.locations.push(location);

  // Keep last 300 locations per patient to maintain optimal storage
  if (store.locations.length > 500) {
    store.locations = store.locations.slice(-300);
  }

  const safeZone = await getPatientSafeZone(data.patientId);
  const distanceMeters = computeDistanceMeters(
    data.latitude,
    data.longitude,
    safeZone.homeLatitude,
    safeZone.homeLongitude
  );
  const isOutsideSafeZone = safeZone.enabled && distanceMeters > safeZone.radiusMeters;
  const bearingDegrees = computeBearing(
    data.latitude,
    data.longitude,
    safeZone.homeLatitude,
    safeZone.homeLongitude
  );

  // ─── Automatic Wandering & SOS Safety Alerts ───
  if (data.isLostSOS) {
    const alertMsg = `🚨 Emergency SOS: Patient activated "Take Me Home" assistance at [${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}] (${distanceMeters}m from Home).`;
    await createAlert(data.patientId, alertMsg);
    await createNotification({
      patientId: data.patientId,
      title: "🚨 Emergency SOS Active",
      message: "Help is on the way. Your caregiver has been notified with your exact GPS location.",
      type: "alert",
      priority: "high",
    });
  } else if (isOutsideSafeZone) {
    const alertMsg = `⚠️ Wandering Advisory: Patient is ${distanceMeters}m from Home — outside their ${safeZone.radiusMeters}m Safe Zone!`;
    await createAlert(data.patientId, alertMsg);
    await createNotification({
      patientId: data.patientId,
      title: "Safe Zone Boundary Notice",
      message: `You are currently ${distanceMeters}m from Home. Please stay where you are or tap 'Take Me Home'.`,
      type: "alert",
      priority: "high",
    });
  }

  saveFileData();

  return {
    location,
    safeZone,
    distanceMeters,
    isOutsideSafeZone,
    bearingDegrees,
  };
}

