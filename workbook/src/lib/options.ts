// Fixed option lists used by the profile, fields, and dashboard labels.

import type { Area } from './types';

export const AREA_LABELS: Record<Area, string> = {
  communication: 'Communication',
  process: 'Process',
  automation: 'Automation',
  decision_support: 'Decision support',
  other: 'Other',
};
export const AREAS = Object.keys(AREA_LABELS) as Area[];

export const AI_TOOL_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  copilot: 'Microsoft Copilot',
  other: 'Another tool',
  none: 'None yet',
};
export const AI_TOOLS = Object.keys(AI_TOOL_LABELS);

export const INDUSTRIES = [
  'Retail',
  'Restaurant and food service',
  'Professional services',
  'Health and wellness',
  'Construction and trades',
  'Manufacturing',
  'Real estate',
  'Financial services',
  'Nonprofit',
  'Hospitality and tourism',
  'Arts, media, and creative',
  'Technology',
  'Education',
  'Other',
];

export const ROLES = [
  'Owner or founder',
  'Executive or general manager',
  'Operations',
  'Marketing and sales',
  'Finance and admin',
  'HR and people',
  'Customer service',
  'Technology',
  'Other',
];

export const SIZE_BANDS = ['Just me', '2 to 10', '11 to 50', '51 to 200', '201 to 500', 'More than 500'];

export const CONCERN_OPTIONS = [
  { value: 'data_privacy', label: 'Keeping customer and business data private' },
  { value: 'accuracy', label: 'Wrong or made-up answers' },
  { value: 'oversight', label: 'Knowing who checks the output' },
  { value: 'cost', label: 'Cost and unclear return' },
  { value: 'skills', label: 'My team does not have the skills yet' },
  { value: 'trust', label: 'Customers or staff trusting it' },
  { value: 'legal', label: 'Legal and copyright questions' },
  { value: 'jobs', label: 'What it means for jobs on my team' },
  { value: 'security', label: 'Security of the tools themselves' },
];

export const FIT_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'No' },
];

export const SECTION_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
