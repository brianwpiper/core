// Resource library (design doc 6.5). Every item shows "As of [date]" and a
// changelog line. Admins can add, edit, or retire items from Admin > Content.
// Body format: blank line between paragraphs, "## " for headings, "- " for
// bullets, "1. " for numbered steps, **bold** for emphasis.

import type { LibraryItem } from '../lib/types';

export const DEFAULT_LIBRARY: LibraryItem[] = [
  {
    key: 'crit_card',
    title: 'CRIT reference card',
    category: 'Prompting',
    summary: 'The four parts of every good prompt, on one card.',
    as_of: '2026-10-01',
    version: 1,
    changelog: 'First version for the Summit.',
    body: `CRIT comes from Geoff Woods' book The AI-Driven Leader. It turns a one-line request into a conversation that gets you a useful answer.

## C is for Context
Tell the AI about your situation: your business, your customers, what you are trying to do, and any limits. The more it knows, the less generic the answer.

## R is for Role
Tell the AI who to be. "Act as an experienced bookkeeper for small restaurants" gets a different answer than no role at all.

## I is for Interview
Ask the AI to ask you questions first, one at a time. This is the step most people skip, and it is the one that makes the biggest difference. The AI finds out what it does not know before it starts.

## T is for Task
Say exactly what you want back: the format, the length, how many options, and what to do next.

## Tips
- Keep one chat open for one project, so the AI remembers what you told it.
- If the answer misses, say what is wrong and ask it to try again.
- Always check facts, numbers, and names before you use the output.`,
  },
  {
    key: 'tool_strengths',
    title: 'AI tools at a glance',
    category: 'Tools',
    summary: 'What the main general-purpose AI tools tend to be good at. This changes often.',
    as_of: '2026-10-01',
    version: 1,
    changelog: 'DRAFT for review. Confirm details against each vendor before the Summit.',
    body: `AI tools change every few weeks. Treat this as a starting point and check the vendor's website for current features and pricing. All four have a free version.

## ChatGPT (OpenAI)
- The most widely used, with a large library of how-to content online.
- Good all-rounder for writing, brainstorming, and analyzing files.
- Check the data controls in settings before you share business information.

## Claude (Anthropic)
- Strong at long documents, careful writing, and following detailed instructions.
- Projects let you keep reference files and instructions together.
- Check the data controls in settings before you share business information.

## Gemini (Google)
- Works closely with Gmail, Docs, Sheets, and Drive if you use Google Workspace.
- Good at research questions that need current information from the web.
- Business plans have different data terms from personal accounts.

## Microsoft Copilot
- Built into Word, Excel, Outlook, and Teams for Microsoft 365 business plans.
- Can work with your own files and email if your plan includes it.
- Your admin settings decide what data it can reach.

## Choosing
Pick the tool that fits where your work already lives. If your team lives in Outlook and Excel, start with Copilot. If you live in Gmail, start with Gemini. If you mostly want a thinking partner, any of the four will do.`,
  },
  {
    key: 'what_not_to_paste',
    title: 'What not to paste into an AI tool',
    category: 'Guidelines',
    summary: 'A short list to share with your team before anyone starts.',
    as_of: '2026-10-01',
    version: 1,
    changelog: 'First version for the Summit.',
    body: `A good default for any team until your own AI guidelines are in place.

## Keep out unless your tool and plan are approved for it
- Customer or patient names together with personal details
- Payment card numbers, bank details, or Social Security numbers
- Passwords, keys, or login links
- Employee records, pay, or health information
- Contracts or documents marked confidential

## Usually fine
- Your own writing, with names removed
- Public information about your business
- General questions about how to do something
- Made-up examples that look like your real situation

## When in doubt
Replace real names with placeholders like "Customer A" and round off real numbers. You still get a useful answer.`,
  },
  {
    key: 'guidelines_starter',
    title: 'Writing AI guidelines for a small team',
    category: 'Guidelines',
    summary: 'How to write a first set of AI guidelines you can adjust as you learn.',
    as_of: '2026-10-01',
    version: 1,
    changelog: 'First version for the Summit.',
    body: `Guidelines tell your team how to use AI well. Keep them short enough to fit on one page and plan to revisit them every 90 days.

## What to cover
1. Which tools are approved, and which accounts to use.
2. What information can and cannot go into those tools.
3. Who checks AI output before it reaches a customer.
4. When to tell customers that AI helped.
5. Who to ask when someone is unsure.

## How to roll them out
- Draft them with the AI Guidelines Tool from Workshop 2.
- Share them in a team meeting and ask for questions.
- Write down what you change and why, so the next version is easier.`,
    link: 'guidelines_tool',
  },
  {
    key: 'measuring_a_pilot',
    title: 'Measuring an AI pilot',
    category: 'Planning',
    summary: 'Pick one number, write down today, and check it at day 90.',
    as_of: '2026-10-01',
    version: 1,
    changelog: 'First version for the Summit.',
    body: `A pilot without a number is a hunch. A pilot with a number is a decision you can make in 90 days.

## Good measures are
- Easy to count without new software
- Something you can check every couple of weeks
- Tied to time, money, quality, or customer experience

## Examples
- Hours per week spent on a task
- Days to respond to a quote request
- Number of reviews answered each month
- Errors found per 100 orders

## Set a stop or change point
Decide now what would make you stop or change course. For example: "If it still takes more than 4 hours a week after 6 weeks, we switch tools or drop it." Deciding ahead of time makes the call easier later.`,
  },
  {
    key: 'glossary',
    title: 'Plain-language AI glossary',
    category: 'Reference',
    summary: 'The words you will hear today, explained simply.',
    as_of: '2026-10-01',
    version: 1,
    changelog: 'First version for the Summit.',
    body: `## AI tool or chatbot
An app like ChatGPT, Claude, Gemini, or Copilot that you talk to in plain language.

## Model
The engine inside an AI tool. Tools often let you choose between faster and more capable models.

## Prompt
What you type to the AI. CRIT is a pattern for writing good prompts.

## Hallucination
When an AI states something false with confidence. The reason to always check facts.

## Context window
How much the AI can keep in mind at once in a single chat.

## Agent
An AI setup that can take several steps on its own, such as looking things up and filling in a form.

## Automation
Work that runs on its own once set up, such as sending a reminder when a form is submitted.

## Pilot
A small, time-boxed test of an idea with a number to measure.

## Guidelines
Your team's agreed approach to using AI: which tools, what data, and who checks the output. Meant to be adjusted as you learn.`,
  },
  {
    key: 'companion_apps',
    title: 'Companion tools from the Summit',
    category: 'Tools',
    summary: 'The Pilot Selection Tool and the AI Guidelines Tool.',
    as_of: '2026-10-01',
    version: 1,
    changelog: 'First version for the Summit.',
    body: `Two companion tools help you with the biggest decisions of the day. Each one produces a PDF you can upload into your AI tool so it knows your choices.

## Pilot and Use Case Selection Tool
Used in Workshop 1. Helps you compare your use cases and pick a pilot.

## AI Guidelines Tool
Used in Workshop 2. Walks you through writing AI guidelines for your team.`,
  },
];
