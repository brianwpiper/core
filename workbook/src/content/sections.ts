// Workbook sections, mapped to the Summit agenda (Friday, November 13, 2026).
// Admins can override any section from the Admin > Content screen without a deploy.
// Copy rules: say "guidelines", no em dashes, plain language.

import type { Section } from '../lib/types';
import { AI_TOOL_LABELS, AREA_LABELS, CONCERN_OPTIONS } from '../lib/options';

const AS_OF = '2026-10-01';

const aiToolOptions = Object.entries(AI_TOOL_LABELS).map(([value, label]) => ({ value, label }));
const areaOptions = (['communication', 'process', 'automation', 'decision_support'] as const).map((value) => ({
  value,
  label: AREA_LABELS[value],
}));

export const DEFAULT_SECTIONS: Section[] = [
  {
    key: 's0',
    number: 0,
    title: 'Get set up',
    short: 'Get set up',
    slot: 'Before the event or 8:15 AM',
    as_of: AS_OF,
    version: 1,
    intro:
      'Ten minutes now saves you an hour on the day. Pick the AI tool you will use, learn the one prompting pattern we use all day, and introduce your business to your AI tool.',
    required: ['ai_tool'],
    blocks: [
      {
        type: 'field',
        field: {
          key: 'ai_tool',
          label: 'Which AI tool will you use today?',
          kind: 'choice',
          options: aiToolOptions,
          help: 'Pick the one you are most likely to use on Monday. A free account is fine. If you pick "None yet", ChatGPT, Claude, Gemini, and Copilot all have free versions you can set up in a few minutes.',
          required: true,
          syncProfile: 'ai_tool',
        },
      },
      {
        type: 'text',
        title: 'One pattern for every prompt: CRIT',
        body: 'Every prompt in this workbook follows the same four parts, from Geoff Woods\' book The AI-Driven Leader. Once you see the pattern a few times, you can write your own.',
      },
      { type: 'crit-example' },
      {
        type: 'callout',
        tone: 'tip',
        title: 'A prompt without CRIT',
        body: '"Write a social post about our sale." You will get something generic, because the AI knows nothing about you. Compare that with the CRIT version below.',
      },
      { type: 'prompt', prompt: 'crit_example' },
      {
        type: 'text',
        title: 'Your starter prompt',
        body: 'This prompt is already filled in with your profile. Copy it, paste it into your AI tool, and answer its questions. Keep that chat open. You will add to it all day, so your AI tool builds up a picture of your business.',
      },
      { type: 'prompt', prompt: 'starter_context' },
      {
        type: 'field',
        field: { key: 'ran_starter', label: 'I ran the starter prompt in my AI tool', kind: 'checkbox' },
      },
    ],
  },
  {
    key: 's1',
    number: 1,
    title: 'Welcome, framing, and risks',
    short: 'Framing and risks',
    slot: '9:00 AM',
    people: 'Brian Piper and Quinn Karley',
    as_of: AS_OF,
    version: 1,
    intro:
      'We start with risk so you can explore the rest of the day with your eyes open. Four questions to ask about any AI tool or use case, and a chance to name what worries you most.',
    required: ['concerns'],
    blocks: [
      {
        type: 'callout',
        tone: 'risk',
        title: 'Four questions for any AI tool or use case',
        body: '1. Data: what information goes in, where does it go, and is it used to train the tool?\n2. Accuracy: how right does the answer need to be, and how would you know if it was wrong?\n3. Oversight: who checks the output before a customer or decision depends on it?\n4. Impact: what happens if it is wrong, and how quickly could you fix it?',
      },
      {
        type: 'field',
        field: {
          key: 'concerns',
          label: 'What are your top concerns about using AI in your business?',
          kind: 'multi',
          max: 3,
          options: CONCERN_OPTIONS,
          allowOther: true,
          help: 'Choose up to 3. The room sees only the totals.',
          required: true,
        },
      },
      { type: 'prompt', prompt: 'risk_check' },
    ],
  },
  {
    key: 's2',
    number: 2,
    title: 'Keynote',
    short: 'Keynote',
    slot: '9:20 AM',
    people: 'Josh Reynolds, Microsoft',
    as_of: AS_OF,
    version: 1,
    intro: 'Put the phone down and listen. When something clicks, write it in one line below.',
    required: ['keynote_idea'],
    blocks: [
      {
        type: 'field',
        field: {
          key: 'keynote_idea',
          label: 'One idea you are taking away',
          kind: 'text',
          max: 200,
          placeholder: 'One line is plenty',
          required: true,
        },
      },
      { type: 'prompt', prompt: 'keynote_reflect' },
    ],
  },
  {
    key: 's3',
    number: 3,
    title: 'What AI can do for a business like yours',
    short: 'What AI can do',
    slot: '9:55 AM panel',
    as_of: AS_OF,
    version: 1,
    intro:
      'AI helps small businesses in four broad ways: communication, process, automation, and decision support. A quick self-assessment shows where your best openings are. Then start your running use case list.',
    required: ['opportunity_areas'],
    blocks: [
      { type: 'self-assessment' },
      {
        type: 'field',
        field: {
          key: 'opportunity_areas',
          label: 'Pick your 2 or 3 biggest opportunity areas',
          kind: 'multi',
          max: 3,
          options: areaOptions,
          help: 'Your self-assessment highlights where your scores were highest. You make the call.',
          required: true,
        },
      },
      { type: 'suggestions' },
      { type: 'prompt', prompt: 'opportunity_scan' },
      { type: 'use-cases', mode: 'brief' },
    ],
  },
  {
    key: 's4',
    number: 4,
    title: 'Expand your thinking and find your AI opportunity',
    short: 'Find your opportunity',
    slot: '10:55 AM Workshop 1',
    people: 'Quinn Karley',
    as_of: AS_OF,
    version: 1,
    intro:
      'Dig into the work you repeat, the places work gets stuck, and the friction your customers feel. Rate each idea and write down how it works today with a number. That number is your baseline for day 90.',
    required: ['pilot_id'],
    blocks: [
      { type: 'prompt', prompt: 'work_inventory' },
      { type: 'prompt', prompt: 'bottlenecks' },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Capture a number for today',
        body: 'For each idea, write down how it works now: hours per week, days to respond, errors per month. A rough guess is fine. Without a starting number you cannot tell later whether AI helped.',
      },
      { type: 'use-cases', mode: 'rate' },
      { type: 'list-composer' },
      { type: 'companion', target: 'pilot_tool' },
      { type: 'pilot-picker' },
    ],
  },
  {
    key: 's5',
    number: 5,
    title: 'Lightning round demos',
    short: 'Lightning demos',
    slot: '1:00 PM',
    people: 'Demika Jackson, Will Hart, and Tondreka Robles',
    as_of: AS_OF,
    version: 1,
    intro: 'Three fast demos of real tools. Jot down each tool, what it is good at, and whether it fits one of your use cases.',
    blocks: [{ type: 'tools-seen' }, { type: 'prompt', prompt: 'demo_fit' }],
  },
  {
    key: 's6',
    number: 6,
    title: 'Your guardrails and evaluating your options',
    short: 'Guardrails and tools',
    slot: '1:45 PM Workshop 2',
    people: 'Megan Crawford',
    as_of: AS_OF,
    version: 1,
    intro:
      'Set your AI guidelines with the AI Guidelines Tool, then compare 2 or 3 tools for your chosen use case. Guidelines are a starting point you will adjust as you learn.',
    required: ['chosen_tool'],
    blocks: [
      { type: 'companion', target: 'guidelines_tool' },
      {
        type: 'field',
        field: {
          key: 'guidelines_done',
          label: 'I finished the AI Guidelines Tool and uploaded its PDF to my AI tool',
          kind: 'checkbox',
        },
      },
      { type: 'prompt', prompt: 'tool_eval' },
      { type: 'tool-compare' },
      {
        type: 'field',
        field: {
          key: 'chosen_tool',
          label: 'The tool you will use for your pilot',
          kind: 'text',
          max: 80,
          placeholder: 'For example: Microsoft Copilot',
          required: true,
        },
      },
    ],
  },
  {
    key: 's7',
    number: 7,
    title: 'Build your 90-day action plan',
    short: '90-day plan',
    slot: '2:55 PM Workshop 3',
    people: 'Brian Piper',
    as_of: AS_OF,
    version: 1,
    intro:
      'Everything from today comes together here. Your plan is pre-filled from your chosen use case and tool. Add a number to measure and a point where you would stop or change course, then pressure-test it in your AI tool.',
    requiresPlan: true,
    blocks: [{ type: 'plan' }, { type: 'plan-composer' }],
  },
  {
    key: 's8',
    number: 8,
    title: "Don't do this alone",
    short: 'Next steps',
    slot: '3:40 PM close',
    people: 'Brian Piper and Quinn Karley',
    as_of: AS_OF,
    version: 1,
    intro: 'Commit to one next step you will take this week, and stay connected with the people who were in the room.',
    required: ['next_step'],
    blocks: [
      {
        type: 'field',
        field: {
          key: 'next_step',
          label: 'My one next step this week',
          kind: 'text',
          max: 200,
          placeholder: 'For example: Show my plan to our office manager on Tuesday',
          required: true,
        },
      },
      { type: 'prompt', prompt: 'next_step' },
      {
        type: 'field',
        field: {
          key: 'meetup_opt_in',
          label: 'Send me reminders about local AI meetups and the day-90 check-in',
          kind: 'checkbox',
        },
      },
      { type: 'closing-links' },
    ],
  },
];
