// Event settings. Admins can override any of these from Admin > Live now & settings.
// Companion app URLs are blank until those apps exist; the buttons say "Link coming soon".

import type { Settings } from '../lib/types';

export const DEFAULT_SETTINGS: Settings = {
  pilotToolUrl: '',
  guidelinesToolUrl: '',
  surveyUrl: '',
  communityUrl: '',
  meetupsUrl: '',
  eventDate: '2026-11-13',
  day90Date: '2027-02-11',
};

export const EVENT_NAME = 'Main Street Event AI Summit';

// Self-assessment for Section 3. Each statement is rated 1 (not at all) to 5 (very much).
export const SELF_ASSESSMENT: { area: 'communication' | 'process' | 'automation' | 'decision_support'; key: string; text: string }[] = [
  { area: 'communication', key: 'comm_1', text: 'We spend a lot of time writing emails, posts, or customer replies.' },
  { area: 'communication', key: 'comm_2', text: 'We answer the same customer questions over and over.' },
  { area: 'process', key: 'proc_1', text: 'Important know-how lives in one or two people\'s heads.' },
  { area: 'process', key: 'proc_2', text: 'Work often waits on someone before it can move forward.' },
  { area: 'automation', key: 'auto_1', text: 'We copy information from one place to another by hand.' },
  { area: 'automation', key: 'auto_2', text: 'We send reminders or follow-ups by hand.' },
  { area: 'decision_support', key: 'dec_1', text: 'We have data (sales, reviews, costs) we rarely have time to look at.' },
  { area: 'decision_support', key: 'dec_2', text: 'Big decisions are made on gut feel because the numbers take too long to pull together.' },
];
