// End-to-end smoke test in demo mode (no Supabase needed).
// Usage: npm run dev, then: npm i -D playwright-core && node e2e/smoke.mjs ./screenshots
// Set CHROMIUM_PATH if Playwright cannot find a browser.
import { chromium } from 'playwright-core';
const S = process.argv[2] || '.';
const B = process.env.BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); if (m.text().startsWith('SETDATA')) console.log(m.text().slice(0,400)); });
const step = (s) => console.log('STEP', s);

step('login');
await page.goto(B);
await page.getByLabel('Email').fill('pat@cornerhardware.example');
await page.getByRole('button', { name: 'Email me a login' }).click();
await page.getByLabel('6-digit code').fill('123456');
await page.getByRole('button', { name: 'Log in' }).click();

step('welcome');
await page.getByRole('heading', { name: /Welcome/ }).waitFor();
await page.screenshot({ path: `${S}/01-welcome.png`, fullPage: true });
await page.getByLabel('Your role').selectOption('Owner or founder');
await page.getByLabel('Number of employees').selectOption('2 to 10');
await page.getByLabel('In person').check();
await page.getByLabel('Which AI tool do you plan to use?').selectOption('claude');
await page.getByLabel('I understand how my information is used').check();
await page.getByRole('button', { name: 'Open my workbook' }).click();
await page.getByRole('heading', { name: 'Hi Pat' }).waitFor();
await page.screenshot({ path: `${S}/02-home.png`, fullPage: true });

step('section 0');
await page.goto(`${B}/s/s0`);
await page.getByRole('heading', { name: 'Get set up', level: 1 }).waitFor();
const first = page.getByRole('button', { name: 'Copy prompt' }).nth(1);
await first.click();
await page.getByText('Copied. Paste this into your AI tool').waitFor();
const clip = await page.evaluate(() => navigator.clipboard.readText());
console.log('CLIPBOARD starts:', JSON.stringify(clip.slice(0, 160)));
if (!clip.includes('Corner Hardware') || !clip.includes('INTERVIEW')) throw new Error('prompt not personalized');
await page.getByLabel('I ran the starter prompt in my AI tool').check();
await page.screenshot({ path: `${S}/03-s0.png`, fullPage: false });
await page.getByRole('button', { name: 'Mark this section done' }).click();
await page.getByText('Section done').waitFor();

step('section 1 + 3');
await page.goto(`${B}/s/s1`);
await page.getByLabel('Wrong or made-up answers').check();
await page.getByLabel('Keeping customer and business data private').check();
await page.goto(`${B}/s/s3`);
await page.getByRole('heading', { name: 'Quick self-assessment' }).waitFor();
const radios = page.locator('.scale').first().locator('label').nth(4);
await radios.click();
await page.getByLabel('Communication', { exact: true }).check();
await page.getByLabel('Automation', { exact: true }).check();
await page.getByRole('button', { name: '+ Add to my list' }).first().click();
await page.getByText('On your list').first().waitFor();
await page.screenshot({ path: `${S}/04-s3.png`, fullPage: true });

step('section 4 add use case via drawer');
await page.goto(`${B}/s/s4`);
await page.getByRole('button', { name: '+ Use case' }).click();
await page.getByRole('dialog').getByRole('button', { name: '+ Add a use case' }).click();
const dlg = page.getByRole('dialog');
await dlg.getByLabel('Short name').fill('Reply to quote requests');
await dlg.getByLabel('Area').selectOption('communication');
await dlg.locator('fieldset').nth(0).locator('label').nth(3).click();
await dlg.getByLabel('Today (number)').fill('6');
await dlg.getByLabel('Target (number)').fill('2');
await dlg.getByLabel('Unit').fill('hours per week');
await dlg.getByRole('button', { name: 'Add to my list' }).click();
await page.screenshot({ path: `${S}/05-drawer.png` });
await dlg.getByRole('button', { name: 'Close' }).click();
await page.getByRole('heading', { name: 'Choose your pilot candidate' }).waitFor();
await page.locator('input[name="pilot"]').last().check();

step('offline save');
await page.goto(`${B}/s/s2`);
await ctx.setOffline(true);
await page.getByLabel('One idea you are taking away').fill('Start small and measure');
await page.getByText('Offline, will sync').waitFor({ timeout: 5000 });
await page.screenshot({ path: `${S}/06-offline.png` });
await ctx.setOffline(false);
await page.getByText('Saved', { exact: true }).waitFor({ timeout: 10000 });
console.log('offline -> saved OK');

step('section 6 + 7 plan');
await page.goto(`${B}/s/s6`);
await page.getByLabel('The tool you will use for your pilot').fill('Claude');
await page.goto(`${B}/s/s7`);
await page.getByRole('heading', { name: 'My 90-day plan', exact: true }).waitFor();
const opp = await page.getByLabel('The opportunity').inputValue();
console.log('plan prefilled opportunity:', opp, '| tool:', await page.getByLabel('Tool', { exact: true }).inputValue());
const markBtn = page.getByRole('button', { name: 'Mark plan complete' });
console.log('mark complete disabled before stop condition:', await markBtn.isDisabled());
await page.getByLabel('Stop or change condition').fill('If it still takes over 4 hours a week after 6 weeks');
await markBtn.click();
await page.getByText('Plan marked complete').waitFor();
const dl = page.waitForEvent('download');
await page.getByRole('button', { name: 'Download one-page PDF' }).click();
const file = await dl;
await file.saveAs(`${S}/plan.pdf`);
console.log('pdf downloaded:', file.suggestedFilename());
await page.screenshot({ path: `${S}/07-plan.png`, fullPage: true });

step('reload persists');
await page.reload();
await page.getByText('Plan marked complete').waitFor();
await page.goto(`${B}/`);
await page.screenshot({ path: `${S}/08-home-progress.png`, fullPage: true });

step('library');
await page.goto(`${B}/library/crit_card`);
await page.getByRole('heading', { name: 'CRIT reference card' }).waitFor();

step('admin');
await page.getByRole('link', { name: 'Sign out' }).click();
await page.getByLabel('Email').fill('brian@mainstreetevent.example');
await page.getByLabel('Demo: preview as').selectOption('admin');
await page.getByRole('button', { name: 'Email me a login' }).click();
await page.getByLabel('6-digit code').fill('123456');
await page.getByRole('button', { name: 'Log in' }).click();
await page.getByRole('heading', { name: /Welcome/ }).waitFor();
await page.goto(`${B}/admin`);
await page.setViewportSize({ width: 1280, height: 900 });
await page.getByRole('heading', { name: 'Admin' }).waitFor();
await page.getByRole('button', { name: /^4\. Expand your thinking/ }).click();
await page.screenshot({ path: `${S}/09-admin.png`, fullPage: true });
await page.getByRole('tab', { name: 'Content' }).click();
await page.getByRole('button', { name: 'Edit' }).first().click();
await page.getByLabel('Title').fill('Starter prompt — test');
await page.getByText('Contains an em dash').waitFor();
console.log('copy rule enforced in editor');
await page.getByRole('button', { name: 'Cancel' }).click();

step('dashboard');
await page.goto(`${B}/dashboard`);
await page.getByText('Top concerns').waitFor();
await page.screenshot({ path: `${S}/10-dashboard.png`, fullPage: true });

console.log('ERRORS:', errors.length ? errors : 'none');
await browser.close();
