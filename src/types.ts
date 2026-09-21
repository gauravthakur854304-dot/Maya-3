export type VoiceAuthState = 'VERIFIED_ADMIN' | 'NOT_VERIFIED' | 'INSUFFICIENT_EVIDENCE' | 'IDLE';

export interface VoiceSample {
  id: string;
  slotNumber: number;
  phrase: string;
  audioBlobUrl?: string;
  durationSeconds: number;
  rmsLevel: number;
  embeddingVector: number[];
  recordedAt?: string;
  isEnrolled: boolean;
}

export interface VoiceVerificationResult {
  state: VoiceAuthState;
  similarityScore: number; // 0 to 1
  rmsLevel: number;
  speechQuality: 'GOOD' | 'LOW' | 'NOISY_OR_SILENT';
  turnToken: string;
  details: string;
  timestamp: string;
  sampleScores?: { slot: number; score: number }[];
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  turnToken?: string;
  authState?: VoiceAuthState;
  timestamp: string;
  personality: string;
}

export interface MemoryItem {
  id: string;
  content: string;
  category: 'Preference' | 'Personal' | 'Work' | 'Security' | 'Instruction';
  createdAt: string;
  isPinned?: boolean;
}

export interface ProtectedTool {
  id: string;
  name: string;
  description: string;
  category: 'System' | 'Cloud' | 'Memory' | 'Device';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresVoiceAdmin: boolean;
  actionKey: string;
  lastExecuted?: string;
}

export interface SecurityAuditLog {
  id: string;
  toolName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'AUTHORIZED' | 'DENIED' | 'PIN_UNLOCKED' | 'FAIL_CLOSED';
  authState: VoiceAuthState;
  similarityScore: number;
  rmsLevel: number;
  turnToken: string;
  details: string;
  timestamp: string;
}

export interface DriveSyncState {
  isConnected: boolean;
  userEmail: string | null;
  displayName: string | null;
  photoUrl: string | null;
  lastSyncTime: string | null;
  backupFileId: string | null;
  isSyncing: boolean;
  error: string | null;
}

export interface AccessibilityState {
  isServiceEnabled: boolean;
  managerConnected: boolean;
  secureSettingsVerified: boolean;
  raceConditionGuarded: boolean;
  lastCheckTimestamp: string;
}
