// Prompt cards. Every prompt follows CRIT (Context, Role, Interview, Task).
// Variables in {{double braces}} are filled in the browser from the attendee's
// profile and entries. Copy rules: say "guidelines", no em dashes, plain language.
// Bump `version` whenever wording changes so exports show which wording people used.

import type { PromptCard } from '../lib/types';

const AS_OF = '2026-10-01';

const list: Omit<PromptCard, 'as_of'>[] = [
  {
    key: 'starter_context',
    version: 1,
    title: 'Starter prompt: teach your AI tool about your business',
    when: 'Run this first, before the Summit or at 8:15. Every later prompt builds on it.',
    context:
      'I work at {{organization}}, a {{industry}} business with {{size_band}}. My role is {{role}}. I am attending the Main Street Event AI Summit on November 13, 2026 to find practical ways AI can help my business. Through the day I will come back to this chat to build a list of AI use cases and a 90-day plan.',
    role: 'Act as a practical AI advisor for small and mid-sized businesses. You give plain-language advice, you are honest about limits and risks, and you favor small experiments over big projects.',
    interview:
      'Before you do anything else, interview me to understand my business. Ask one question at a time and wait for my answer. Ask up to 8 questions. Cover what we sell and to whom, how the team spends a typical week, the tools we already use, where work piles up, and what I most want to get out of today.',
    task: 'When the interview is done, write a short profile of my business (under 200 words) that you will refer back to for the rest of today. Then tell me in two or three sentences where you see the first opportunities, and ask me to confirm the profile is right.',
  },
  {
    key: 'crit_example',
    version: 1,
    title: 'Worked example: a social post, written with CRIT',
    when: 'Try this to see how much better a CRIT prompt works than a one-line request.',
    context:
      'I run {{organization}}, a {{industry}} business. We are running a spring promotion and I need a social media post about it. Most of our customers are local and know us by name.',
    role: 'Act as an experienced small business marketer who writes warm, plain social posts that sound like a real person.',
    interview: 'Before writing, ask me up to 4 questions, one at a time, about the promotion, who it is for, and the tone I want.',
    task: 'Write three short versions of the post for Facebook, each under 60 words, with one clear call to action. Then tell me which one you would pick and why.',
  },
  {
    key: 'risk_check',
    version: 1,
    title: 'Risk check for any AI tool or use case',
    when: 'Use this any time you are about to try a new AI tool or hand it a new kind of work.',
    context:
      'I am thinking about using AI at {{organization}} ({{industry}}). My biggest concerns right now are: {{concerns}}. Here is the tool or use case I have in mind: [describe it in a sentence or two].',
    role: 'Act as a careful, practical risk advisor for small businesses. You help owners make informed decisions and you explain trade-offs in plain language.',
    interview:
      'Ask me up to 5 questions, one at a time, about what information would go into the tool, who would check the output, and what happens if it gets something wrong.',
    task: 'Then walk me through four questions. How is my data handled? How accurate does this need to be? Who checks the output before it is used? What happens if it is wrong? For each one, give a short answer for my situation, a risk level (low, medium, or high), and one simple safeguard. Finish with three starting guidelines you would suggest for my team.',
  },
  {
    key: 'keynote_reflect',
    version: 1,
    title: 'Turn a keynote idea into a small test',
    when: 'Right after the keynote, while the idea is fresh.',
    context: 'I just heard a keynote at the AI Summit. The idea I am taking away is: {{keynote_idea}}.',
    role: 'Act as a thoughtful business coach who helps owners turn big ideas into small, practical steps.',
    interview: 'Ask me 2 questions, one at a time, about how this idea connects to my business.',
    task: 'Suggest one small way I could test this idea in the next 30 days, with a simple way to tell whether it worked.',
  },
  {
    key: 'opportunity_scan',
    version: 1,
    title: 'Where could AI help a business like mine?',
    when: 'After the panel and your self-assessment. Use it to fill your use case list.',
    context:
      'Use what you know about my business from earlier in this chat. My self-assessment says my best opportunity areas are: {{opportunity_areas}}. The four areas we are looking at are communication, process, automation, and decision support.',
    role: 'Act as a small business operations coach who has helped many {{industry}} businesses get started with AI.',
    interview:
      'Ask me up to 5 questions, one at a time, about the tasks in those areas that take the most time or cause the most frustration.',
    task: 'Suggest 6 to 8 specific ways AI could help, grouped by area. For each one, write one sentence on what it would do and one sentence on why it fits my business. Keep it practical. Flag any idea that would involve customer data.',
  },
  {
    key: 'work_inventory',
    version: 1,
    title: 'Inventory your repetitive work',
    when: 'Workshop 1. Finds tasks you do so often you no longer notice them.',
    context: 'I am looking for my best first AI project at {{organization}}. Here is my use case list so far:\n{{use_case_list}}',
    role: 'Act as a process improvement consultant who knows how small teams really work.',
    interview:
      'Interview me about my week, one question at a time, up to 8 questions. Ask what I do every day, every week, and every month, what I dread, where work waits on someone, and where mistakes happen. Ask for rough hours wherever you can.',
    task: 'Turn my answers into a table with these columns: task, how often, hours per week today, what AI could do, and what a person still needs to do. Then point out the 3 tasks with the clearest payoff.',
  },
  {
    key: 'bottlenecks',
    version: 1,
    title: 'Find the bottlenecks and friction',
    when: 'Workshop 1. Finds the places where work slows down or customers wait.',
    context:
      'I work at {{organization}}, a {{industry}} business with {{size_band}}. I want to find where work gets stuck, where customers wait on us, and where my team repeats the same fixes.',
    role: 'Act as an operations advisor who is good at spotting bottlenecks from a short conversation.',
    interview:
      'Ask me up to 6 questions, one at a time. Ask me to walk you through one common job from start to finish, then ask where it stalls, who it waits on, and what gets redone.',
    task: 'List the 3 biggest points of friction you heard. For each one, describe how AI might help in one or two sentences, what number I could track to see if it improved (for example hours per week or days to respond), and a rough guess at today\'s number based on what I told you.',
  },
  {
    key: 'use_case_ranker',
    version: 1,
    title: 'Rank my use cases and recommend a pilot',
    when: 'Built from your whole use case list. Use it before you pick your pilot.',
    context:
      'My business: {{organization}}, a {{industry}} business with {{size_band}}. My role: {{role}}. My concerns about AI: {{concerns}}.\n\nHere is my running list of possible AI use cases, with my own ratings from 1 to 5 for impact, effort, and risk, and my current numbers where I have them:\n{{use_case_list}}',
    role: 'Act as a supportive but skeptical advisor who helps small businesses pick a first AI pilot they can finish in 90 days.',
    interview:
      'Before ranking, ask me up to 5 questions, one at a time, about anything in the list that is unclear. Push back on any rating that looks too hopeful.',
    task: 'Rank the candidates from best to worst first pilot. For each one, say whether you agree with my ratings and why. Recommend one pilot, explain the trade-off you made, and suggest how I would measure success with a number I can track.',
  },
  {
    key: 'demo_fit',
    version: 1,
    title: 'Would the tool I just saw fit my business?',
    when: 'During or after the lightning round demos.',
    context: 'I just watched a demo of [tool name], which [what it does in one sentence]. Here is my use case list:\n{{use_case_list}}',
    role: 'Act as an independent technology advisor for small businesses. You do not sell any product.',
    interview: 'Ask me 3 questions, one at a time, about how my team works today and what we already pay for.',
    task: 'Tell me which of my use cases this tool could help with, what it would likely cost to try, how long it would take to set up, and what to check about how it handles data.',
  },
  {
    key: 'tool_eval',
    version: 1,
    title: 'Compare AI tools for your chosen use case',
    when: 'Workshop 2, after you have worked through the AI Guidelines Tool.',
    context:
      'My chosen use case is: {{chosen_use_case}}. {{chosen_use_case_description}}\nI have uploaded or pasted my AI guidelines from the AI Guidelines Tool into this chat.\nTools I saw today:\n{{tools_seen}}\nThe AI tool I use most is {{ai_tool}}.',
    role: 'Act as an independent technology advisor for small businesses. You do not sell any product, and you say clearly where your information may be out of date.',
    interview:
      'Ask me up to 5 questions, one at a time, about budget, who would use the tool, what systems it needs to connect to, and what information it would touch.',
    task: 'Compare 2 or 3 tools that could handle this use case. Score each from 1 to 5 on fit, cost, ease of adoption, and data handling, with a one-line reason for each score. Check each tool against my guidelines. Then tell me what to confirm on the vendor\'s website before I decide, since pricing and features change often.',
  },
  {
    key: 'plan_pressure_test',
    version: 1,
    title: 'Pressure-test my 90-day plan',
    when: 'Workshop 3. Built from your plan. Paste it into the same chat you have used all day.',
    context:
      'Here is my 90-day AI plan for {{organization}} ({{industry}}, {{size_band}}).\nOpportunity: {{plan_opportunity}}\nPeople involved: {{plan_people}}\nFirst actions:\n{{plan_actions}}\nGuardrails: {{plan_guardrails}}\nTool: {{chosen_tool}}\nSuccess measure: {{plan_measure}}\nStop or change condition: {{plan_stop}}\nCheck-in date: {{plan_checkin}}',
    role: 'Act as a practical project coach who has watched many small business AI pilots succeed and fail.',
    interview:
      'Ask me up to 6 questions, one at a time, to find gaps: who owns each action, what could get in the way, whether my measure is realistic, and how I will know early if it is not working.',
    task: 'Then pressure-test the plan. List the three biggest risks and a fix for each. Suggest a week-by-week outline for the first 4 weeks. Rewrite my success measure if it is vague. Keep everything short enough to fit on one page.',
  },
  {
    key: 'next_step',
    version: 1,
    title: 'Make your next step stick',
    when: 'At the close. Turns your commitment into a calendar entry and a note to your team.',
    context: 'Today at the AI Summit I built a 90-day plan: {{plan_opportunity}}. My one next step is: {{next_step}}. My check-in date is {{plan_checkin}}.',
    role: 'Act as an accountability partner who is encouraging and direct.',
    interview: 'Ask me 3 questions, one at a time: exactly when I will do the next step, what might stop me, and who else should know about it.',
    task: 'Write a short reminder I can put on my calendar and a two-sentence note I can send my team about the plan. Remember this plan so that when I come back to this chat you can ask me how it is going.',
  },
  {
    key: 'day90_review',
    version: 1,
    title: 'Day 90 review: what changed?',
    when: 'February 2027, when you come back to your plan.',
    context:
      'Ninety days ago at the AI Summit I made this plan for {{organization}}.\nOpportunity: {{plan_opportunity}}\nSuccess measure: {{plan_measure}}\nStop or change condition: {{plan_stop}}',
    role: 'Act as a coach running a friendly, honest 90-day review.',
    interview: 'Ask me up to 5 questions, one at a time, about what actually happened, including what the number is today.',
    task: 'Help me write a short "what changed" note (under 100 words). Then help me decide whether to keep going, change course, or stop, and set one goal for the next 90 days.',
  },
];

export const DEFAULT_PROMPTS: Record<string, PromptCard> = Object.fromEntries(
  list.map((p) => [p.key, { ...p, as_of: AS_OF }]),
);
