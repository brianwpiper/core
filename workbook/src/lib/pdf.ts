// PDFs are generated in the browser. jsPDF is loaded only when someone asks for one.
import type { Plan, Profile } from './types';
import { planRows } from './planText';
import { EVENT_NAME } from '../content/settings';

const BRAND: [number, number, number] = [20, 54, 93];

function safeName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'download';
}

export async function downloadPlanPdf(plan: Plan, profile: Profile, defaultCheckin: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 78, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('My 90-day AI plan', M, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const who = [profile.first_name, profile.organization].filter(Boolean).join(', ');
  doc.text(`${EVENT_NAME}${who ? `  |  ${who}` : ''}`, M, 60);

  let y = 108;
  doc.setTextColor(27, 36, 48);
  // Shrink type a little if the plan is long, so it always fits on one page.
  const rows = planRows(plan, defaultCheckin);
  const totalChars = rows.reduce((n, [, v]) => n + v.length, 0);
  const size = totalChars > 1600 ? 9.5 : totalChars > 1100 ? 10.5 : 11.5;

  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND);
    doc.text(label.toUpperCase(), M, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(27, 36, 48);
    const lines = doc.splitTextToSize(value || '(not filled in yet)', W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * size * 1.35 + 12;
    if (y > H - 70) break;
  }

  doc.setFontSize(8.5);
  doc.setTextColor(90, 100, 115);
  doc.text('Upload this PDF to your AI tool so it remembers your plan. Log back in to your workbook at day 90.', M, H - 36);
  doc.save(`90-day-plan-${safeName(profile.organization ?? 'my-business')}.pdf`);
}

export async function downloadTextPdf(title: string, asOf: string, body: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 54;
  let y = M;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND);
  doc.text(doc.splitTextToSize(title, W - 2 * M), M, y);
  y += 26;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 115);
  doc.text(`As of ${asOf}  |  ${EVENT_NAME}`, M, y);
  y += 22;
  doc.setTextColor(27, 36, 48);
  for (const raw of body.replace(/\*\*/g, '').split('\n')) {
    const heading = raw.startsWith('## ');
    const text = heading ? raw.slice(3) : raw.replace(/^\s*[-*]\s+/, '• ');
    doc.setFont('helvetica', heading ? 'bold' : 'normal');
    doc.setFontSize(heading ? 13 : 11);
    const lines = text ? doc.splitTextToSize(text, W - 2 * M) : [''];
    for (const line of lines) {
      if (y > H - M) {
        doc.addPage();
        y = M;
      }
      doc.text(line, M, y);
      y += heading ? 18 : 15;
    }
    if (heading) y += 2;
  }
  doc.save(`${safeName(title)}.pdf`);
}

export function downloadFile(filename: string, text: string, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
