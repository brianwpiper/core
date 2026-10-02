// The app talks to one Backend. With Supabase env vars set it uses Supabase;
// without them it runs in demo mode, where everything stays in this browser.

import type {
  ContentRow,
  ContentTable,
  DashboardSummary,
  HelpRequest,
  LiveState,
  Plan,
  Profile,
  Role,
  Capture,
  UseCase,
} from './types';

export type SyncTable = 'profiles' | 'captures' | 'use_cases' | 'plans' | 'section_progress' | 'link_events';

export interface Op {
  id: string; // `${table}:${primary key}`, later ops with the same id replace earlier ones
  table: SyncTable;
  kind: 'upsert' | 'delete';
  row: Record<string, any>;
  seq: number;
}

export interface RemoteUserData {
  profile: Profile;
  captures: Capture[];
  useCases: UseCase[];
  plan: Plan | null;
  progress: { section_key: string; completed_at: string | null }[];
}

export interface Session {
  userId: string;
  email: string;
}

export interface AdminAttendee {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  organization: string | null;
  industry: string | null;
  attendance_type: string | null;
  onboarded_at: string | null;
  last_seen_at: string | null;
  roles: Role[];
}

export interface ImportRow {
  email: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  industry?: string;
  role?: string;
  size_band?: string;
  attendance_type?: string;
  ai_tool?: string;
  eventbrite_order_id?: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export type ExportTable =
  | 'profiles'
  | 'captures'
  | 'use_cases'
  | 'plans'
  | 'section_progress'
  | 'link_events'
  | 'help_requests';

export interface Backend {
  mode: 'supabase' | 'demo';

  getSession(): Promise<Session | null>;
  onAuthChange(cb: (s: Session | null) => void): () => void;
  requestLogin(email: string): Promise<{ ok: boolean; error?: string }>;
  verifyCode(email: string, code: string): Promise<{ ok: boolean; error?: string }>;
  signOut(): Promise<void>;
  getRoles(userId: string): Promise<Role[]>;
  fileHelpRequest(r: { email_tried: string; name?: string; registered_email?: string; note?: string }): Promise<void>;

  pullUserData(userId: string): Promise<RemoteUserData>;
  push(userId: string, ops: Op[]): Promise<void>;
  touch(userId: string): Promise<void>;
  deleteMyData(userId: string): Promise<void>;

  fetchContentRows(): Promise<Record<ContentTable, ContentRow[]>>;
  saveContentRow(table: ContentTable, row: ContentRow): Promise<void>;
  fetchLiveState(): Promise<LiveState>;
  saveLiveState(patch: Partial<LiveState>): Promise<void>;

  dashboardSummary(): Promise<DashboardSummary>;
  listAttendees(): Promise<AdminAttendee[]>;
  importAttendees(rows: ImportRow[]): Promise<ImportResult>;
  changeEmail(userId: string, email: string): Promise<void>;
  setRole(userId: string, role: Exclude<Role, 'attendee'>, on: boolean): Promise<void>;
  listHelpRequests(): Promise<HelpRequest[]>;
  resolveHelpRequest(id: string): Promise<void>;
  exportTable(table: ExportTable): Promise<Record<string, unknown>[]>;
}

import { createSupabaseBackend } from './supabaseBackend';
import { createDemoBackend } from './demoBackend';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const backend: Backend = url && key ? createSupabaseBackend(url, key) : createDemoBackend();
