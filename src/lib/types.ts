/**
 * Smaran Data Model
 *
 * Supported NER languages: English, Assamese, Bodo, Khasi.
 * These are the four languages the patient app offers.
 */

export type SupportedLanguage = "en" | "as" | "brx" | "kha";

export type GameType =
  | "memory-match"
  | "spot-and-tap"
  | "sequence-recall"
  | "routine-recall"
  | "family-faces";

export interface Patient {
  id: string;
  caregiverId: string;
  name: string;
  preferredLanguage: SupportedLanguage;
  caregiverPhone: string;
  pairingCode: string;
  photoUrl?: string;
  createdAt: number;
}

export interface FamilyPhoto {
  id: string;
  patientId: string;
  photoBase64: string;
  name: string;
  relation: string;
  createdAt: number;
}

export interface GameSession {
  id: string;
  patientId: string;
  gameType: GameType;
  playedAt: number;
  /** 0–1 scale, meaning is game-specific but always represents "how well they did" */
  accuracy: number;
  /** Average reaction/response time in milliseconds, where meaningful */
  avgResponseMs: number;
  /** Count of repeated incorrect attempts; 0 where not applicable */
  repeatedMistakes: number;
  /** Total game duration in milliseconds */
  durationMs: number;
  /** Whether this session has been synced to Firestore */
  synced: boolean;
}

export interface CheckIn {
  id: string;
  patientId: string;
  type: "medicine" | "hydration" | "routine" | "appointment";
  scheduledFor: number;
  completedAt: number | null;
  synced: boolean;
}

export interface TrendMetric {
  label: "Memory" | "Attention" | "Pattern Recognition" | "Routine Recall";
  score: number;
  baselineScore?: number;
  changePct: number | null;
  direction: "up" | "down" | "flat" | "unknown";
  status?: "optimal" | "stable" | "mild_decline" | "significant_decline";
  sessionCount?: number;
  history?: number[];
  insight?: string;
}

export interface CognitiveVerdict {
  overallScore: number;
  overallBaseline: number;
  overallChangePct: number;
  status: "optimal" | "stable" | "mild_decline" | "significant_decline";
  verdictTitle: string;
  summary: string;
  keyFindings: Array<{ domain: string; text: string; positive: boolean }>;
  recommendations: Array<{ title: string; action: string; category: "game" | "routine" | "clinical" }>;
  riskLevel: "Low" | "Moderate" | "Elevated";
  lastAssessedAt: number;
}

export interface CaregiverAlert {
  id: string;
  patientId: string;
  message: string;
  createdAt: number;
  acknowledged: boolean;
}

/**
 * Mapping from pairing code to patient ID.
 * Stored as its own Firestore collection so patient devices
 * can look up their patient record without auth beyond anonymous.
 */
export interface PatientCode {
  code: string;
  patientId: string;
  caregiverId: string;
  createdAt: number;
}
