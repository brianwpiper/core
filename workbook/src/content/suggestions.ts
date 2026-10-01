// Pre-populated "businesses like yours often start here" suggestions (design doc 6.4).
// DRAFT: written as placeholders for review. A person must review this list
// before it goes live. Empty `industries` or `roles` means "show to everyone".

import type { Suggestion } from '../lib/types';

const AS_OF = '2026-10-01';
type S = Omit<Suggestion, 'as_of' | 'version'>;

const list: S[] = [
  // Any business
  { key: 'any_email_drafts', name: 'Draft replies to common emails', area: 'communication', description: 'First drafts of replies to the questions you answer every week, which you edit and send.', industries: [], roles: [] },
  { key: 'any_meeting_notes', name: 'Meeting notes and action items', area: 'process', description: 'Turn rough notes or a transcript into a clean summary with owners and dates.', industries: [], roles: [] },
  { key: 'any_social_posts', name: 'Social media post drafts', area: 'communication', description: 'A month of post ideas and drafts in your voice, reviewed before posting.', industries: [], roles: ['Owner or founder', 'Marketing and sales'] },
  { key: 'any_sop', name: 'Write down how we do things', area: 'process', description: 'Turn what is in people\'s heads into short step-by-step guides for training.', industries: [], roles: ['Owner or founder', 'Operations', 'HR and people'] },
  { key: 'any_reviews', name: 'Respond to online reviews', area: 'communication', description: 'Draft thoughtful replies to Google and Yelp reviews, especially the hard ones.', industries: ['Retail', 'Restaurant and food service', 'Health and wellness', 'Hospitality and tourism', 'Construction and trades'], roles: [] },
  { key: 'any_job_posts', name: 'Job descriptions and interview questions', area: 'communication', description: 'Clear, fair job posts and a consistent set of interview questions.', industries: [], roles: ['Owner or founder', 'HR and people'] },
  { key: 'any_numbers', name: 'Explain the monthly numbers', area: 'decision_support', description: 'Summarize sales or expense reports in plain language and spot what changed.', industries: [], roles: ['Owner or founder', 'Executive or general manager', 'Finance and admin'] },

  // Retail
  { key: 'retail_product_copy', name: 'Product descriptions', area: 'communication', description: 'Consistent descriptions for your online store or shelf tags.', industries: ['Retail'], roles: [] },
  { key: 'retail_inventory', name: 'Spot slow and fast movers', area: 'decision_support', description: 'Read a sales export and flag items to reorder, discount, or drop.', industries: ['Retail'], roles: [] },

  // Restaurant
  { key: 'food_menu', name: 'Menu descriptions and specials', area: 'communication', description: 'Write appealing menu copy and weekly specials posts.', industries: ['Restaurant and food service'], roles: [] },
  { key: 'food_scheduling', name: 'Staff schedule first draft', area: 'process', description: 'Draft a weekly schedule from availability and expected covers, then adjust by hand.', industries: ['Restaurant and food service', 'Hospitality and tourism'], roles: [] },

  // Professional services
  { key: 'pro_proposals', name: 'Proposal first drafts', area: 'communication', description: 'Turn call notes into a first draft proposal using your past proposals as a model.', industries: ['Professional services', 'Technology'], roles: [] },
  { key: 'pro_intake', name: 'Client intake summaries', area: 'process', description: 'Summarize intake forms so the first meeting starts with the right questions.', industries: ['Professional services', 'Financial services', 'Health and wellness'], roles: [] },

  // Health and wellness
  { key: 'health_reminders', name: 'Appointment reminder messages', area: 'automation', description: 'Friendly reminder and follow-up messages, with no patient details in the AI tool.', industries: ['Health and wellness'], roles: [] },
  { key: 'health_faq', name: 'Answer common patient questions', area: 'communication', description: 'A reviewed FAQ for your website and front desk about hours, insurance, and prep.', industries: ['Health and wellness'], roles: [] },

  // Construction and trades
  { key: 'trades_estimates', name: 'Estimate and quote write-ups', area: 'process', description: 'Turn site notes and photos into a clear, consistent written quote.', industries: ['Construction and trades'], roles: [] },
  { key: 'trades_safety', name: 'Toolbox talk outlines', area: 'communication', description: 'Short weekly safety talk outlines for the crew.', industries: ['Construction and trades', 'Manufacturing'], roles: [] },

  // Manufacturing
  { key: 'mfg_work_instructions', name: 'Work instructions', area: 'process', description: 'Clear step-by-step instructions for each station, easy to update.', industries: ['Manufacturing'], roles: [] },
  { key: 'mfg_quality', name: 'Quality issue summaries', area: 'decision_support', description: 'Group defect notes by cause so patterns are easier to see.', industries: ['Manufacturing'], roles: [] },

  // Real estate
  { key: 're_listings', name: 'Listing descriptions', area: 'communication', description: 'First drafts of listing copy from your notes and the property facts.', industries: ['Real estate'], roles: [] },
  { key: 're_followup', name: 'Lead follow-up sequences', area: 'automation', description: 'A series of follow-up messages for new leads that you personalize.', industries: ['Real estate', 'Financial services'], roles: [] },

  // Financial services
  { key: 'fin_explainers', name: 'Plain-language client explainers', area: 'communication', description: 'Explain complex topics simply, reviewed for accuracy before sending.', industries: ['Financial services'], roles: [] },

  // Nonprofit
  { key: 'np_grants', name: 'Grant application drafts', area: 'communication', description: 'First drafts of grant sections using your past applications and program data.', industries: ['Nonprofit'], roles: [] },
  { key: 'np_volunteers', name: 'Volunteer communications', area: 'communication', description: 'Thank-you notes, shift reminders, and newsletters for volunteers.', industries: ['Nonprofit'], roles: [] },

  // Hospitality
  { key: 'hosp_guest_msgs', name: 'Guest messages before and after a stay', area: 'automation', description: 'Welcome, check-in, and thank-you messages that feel personal.', industries: ['Hospitality and tourism'], roles: [] },

  // Creative
  { key: 'creative_briefs', name: 'Project briefs and client recaps', area: 'process', description: 'Turn kickoff calls into a clear brief and send recaps after each review.', industries: ['Arts, media, and creative'], roles: [] },

  // Technology
  { key: 'tech_support', name: 'Support ticket triage', area: 'automation', description: 'Sort incoming tickets by topic and urgency and suggest a first reply.', industries: ['Technology'], roles: ['Customer service', 'Technology'] },

  // Education
  { key: 'edu_materials', name: 'Course and training materials', area: 'communication', description: 'Outlines, quizzes, and handouts from your existing material.', industries: ['Education'], roles: [] },

  // By role
  { key: 'role_cs_macros', name: 'Customer service reply library', area: 'communication', description: 'A reviewed set of reply templates for your most common requests.', industries: [], roles: ['Customer service'] },
  { key: 'role_fin_invoices', name: 'Invoice and payment follow-up', area: 'automation', description: 'Polite, firm reminder messages for overdue invoices.', industries: [], roles: ['Finance and admin'] },
  { key: 'role_ops_checklists', name: 'Opening and closing checklists', area: 'process', description: 'Consistent checklists that new staff can follow on day one.', industries: [], roles: ['Operations', 'Executive or general manager'] },
];

export const DEFAULT_SUGGESTIONS: Suggestion[] = list.map((s) => ({ ...s, version: 1, as_of: AS_OF }));
