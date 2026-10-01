// Shared data shapes. Field names match the Supabase columns.

export type Role = 'attendee' | 'facilitator' | 'admin';
export type Area = 'communication' | 'process' | 'automation' | 'decision_support' | 'other';

export interface Profile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  organization: string | null;
  industry: string | null;
  role: string | null;
  size_band: string | null;
  attendance_type: 'in_person' | 'virtual' | null;
  ai_tool: string | null;
  eventbrite_order_id: string | null;
  consent_at: string | null;
  onboarded_at: string | null;
  last_section: string | null;
  last_seen_at?: string | null;
  updated_at?: string;
}

export type CaptureValue = string | number | boolean | string[] | Record<string, unknown> | unknown[] | null;

export interface Capture {
  section_key: string;
  field_key: string;
  value: CaptureValue;
  updated_at: string;
}

export interface UseCase {
  id: string;
  name: string;
  area: Area | null;
  description: string | null;
  source_section: string | null;
  is_suggested: boolean;
  suggestion_key: string | null;
  impact: number | null;
  effort: number | null;
  risk: number | null;
  current_value: number | null;
  target_value: number | null;
  unit: string | null;
  is_pilot_candidate: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  use_case_id: string | null;
  opportunity: string | null;
  people: string | null;
  actions: string[];
  guardrails: string | null;
  tool: string | null;
  current_value: number | null;
  target_value: number | null;
  unit: string | null;
  stop_condition: string | null;
  checkin_date: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface UserData {
  profile: Profile;
  captures: Record<string, Capture>; // key: `${section_key}.${field_key}`
  useCases: Record<string, UseCase>;
  plan: Plan | null;
  progress: Record<string, string>; // section_key -> completed_at
}

export interface LiveState {
  current_section_key: string | null;
  settings: Partial<Settings>;
  updated_at?: string;
}

export interface Settings {
  pilotToolUrl: string;
  guidelinesToolUrl: string;
  surveyUrl: string;
  communityUrl: string;
  meetupsUrl: string;
  day90Date: string; // YYYY-MM-DD
  eventDate: string; // YYYY-MM-DD
}

export interface HelpRequest {
  id: string;
  email_tried: string;
  name: string | null;
  registered_email: string | null;
  note: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface DashboardSummary {
  generated_at: string;
  min_group: number;
  attendees: {
    registered: number | null;
    logged_in: number | null;
    in_person: number | null;
    virtual: number | null;
    active_15m: number | null;
  };
  sections: Record<string, number | null>;
  opportunity_areas: Record<string, number | null>;
  concerns: Record<string, number | null>;
  use_case_areas: Record<string, number | null>;
  ratings: Record<'impact' | 'effort' | 'risk', Record<string, number | null>>;
  chosen_tools: Record<string, number | null>;
  ai_tools: Record<string, number | null>;
  plans: { started: number | null; measures_complete: number | null; marked_complete: number | null };
}

// --- Admin-editable content -------------------------------------------------

export interface ContentMeta {
  key: string;
  version: number;
  as_of: string;
  retired?: boolean;
}

export interface PromptCard extends ContentMeta {
  title: string;
  when: string;
  context: string;
  role: string;
  interview: string;
  task: string;
}

export type FieldKind = 'text' | 'textarea' | 'checkbox' | 'choice' | 'multi' | 'number' | 'select-tool';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  help?: string;
  options?: { value: string; label: string }[];
  max?: number; // max chars, or max selections for multi
  required?: boolean;
  allowOther?: boolean;
  placeholder?: string;
  syncProfile?: keyof Profile; // also write the answer onto the profile
}

export type Block =
  | { type: 'text'; title?: string; body: string }
  | { type: 'callout'; tone: 'info' | 'risk' | 'tip'; title?: string; body: string }
  | { type: 'prompt'; prompt: string }
  | { type: 'field'; field: FieldDef }
  | { type: 'companion'; target: 'pilot_tool' | 'guidelines_tool' }
  | { type: 'crit-example' }
  | { type: 'self-assessment' }
  | { type: 'suggestions' }
  | { type: 'use-cases'; mode?: 'brief' | 'rate' }
  | { type: 'pilot-picker' }
  | { type: 'list-composer' }
  | { type: 'tools-seen' }
  | { type: 'tool-compare' }
  | { type: 'plan' }
  | { type: 'plan-composer' }
  | { type: 'closing-links' };

export interface Section extends ContentMeta {
  number: number;
  title: string;
  short: string;
  slot: string;
  people?: string;
  intro: string;
  blocks: Block[];
  required?: string[]; // field keys that must be filled before "done"
  requiresPlan?: boolean;
  hasCaptures?: boolean;
}

export interface Suggestion extends ContentMeta {
  name: string;
  area: Area;
  description: string;
  industries: string[]; // empty = any
  roles: string[]; // empty = any
}

export interface LibraryItem extends ContentMeta {
  title: string;
  category: string;
  summary: string;
  body: string;
  changelog: string;
  link?: string;
}

export interface ContentBundle {
  sections: Section[];
  prompts: Record<string, PromptCard>;
  suggestions: Suggestion[];
  library: LibraryItem[];
}

export type ContentTable = 'sections' | 'prompts' | 'library_items' | 'suggestions';

export interface ContentRow {
  key: string;
  data: any;
  version: number;
  as_of: string;
  retired: boolean;
  updated_at?: string;
}
