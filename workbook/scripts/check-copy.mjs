// Scans user-facing source for copy standard violations (design doc C4 and C6):
// em dashes, the word "policy", and "not X but Y" phrasing.
// Rules mirror src/lib/copyRules.ts.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const RULES = [
  { id: 'em dash', test: /—/ },
  { id: '"policy" (say "guidelines")', test: /\bpolic(y|ies)\b/i },
  { id: '"not X but Y" phrasing', test: /\bnot\s+(?:just\s+|only\s+)?[^.;:!?\n]{1,40}?,?\s+but\s/i },
];
// Lines that define the rules themselves are allowed to mention them.
const SKIP_FILES = ['src/lib/copyRules.ts'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|html|json)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const files = [...walk(join(root, 'src')), join(root, 'index.html'), join(root, 'supabase/templates/magic_link.html')];
let problems = 0;
for (const f of files) {
  const rel = relative(root, f);
  if (SKIP_FILES.includes(rel)) continue;
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const r of RULES) {
        if (r.test.test(line)) {
          problems++;
          console.log(`${rel}:${i + 1}  ${r.id}\n    ${line.trim().slice(0, 140)}`);
        }
      }
    });
}
if (problems) {
  console.error(`\n${problems} copy issue(s) found.`);
  process.exit(1);
}
console.log('Copy check passed: no em dashes, no "policy", no "not X but Y".');
