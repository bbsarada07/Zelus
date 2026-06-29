export interface VerificationLog {
  name: string;
  timestamp: string;
  photo: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  method: string;
  service: string;
  status: number;
  payload: string;
}

export interface Incident {
  id: string;
  category: string;
  location: string;
  coordinates: [number, number]; // [x, y] representing map grid position (0-100 values)
  severity: 'Critical' | 'Moderate' | 'Low';
  status: 'Triage' | 'Bounty_Posted' | 'Claimed_In_Progress' | 'Peer_Review' | 'Resolved';
  upvotes: number;
  description: string;
  languageBadge: string | null;
  image?: string;
  timestamp?: string;
  mergedCount?: number;
  notes?: string;
  geolocation?: {
    lat: number;
    lng: number;
  };
  exifVerified?: boolean;
  hash?: string;
  swarmData?: {
    aegisConfidence: string;
    atlasRouting: string;
    vulcanMaterial: string;
    mercuryPing: string;
    chronosEta: string;
  };
  claimedBy?: string;
  contractorStage?: 'Accepted' | 'Dispatched' | 'In-Review';
  etaTargetTime?: number;
  progressPhoto?: string;
  verifications?: VerificationLog[];
  webhookLogs?: WebhookLog[];
}

export type UserRole = 'Admin' | 'Citizen' | 'Contractor';

export interface UserSession {
  username: string;
  role: UserRole;
  karmaXP: number;
  badges: string[];
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  sponsor: string;
  targetBounty: number;
  currentFunding: number;
  progress: number;
  votes: number;
  isVerified: boolean;
}

export type Theme = 'dark' | 'light';

export interface DevLog {
  id: string;
  timestamp: string;
  agent: 'ORCHESTRATOR' | 'AEGIS' | 'ATLAS' | 'VULCAN' | 'MERCURY' | 'CHRONOS' | 'SYSTEM';
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  raw?: Record<string, unknown>;
}

