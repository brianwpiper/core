import { describe, expect, it } from 'vitest';
import { guessMapping, normalizeAiTool, normalizeAttendance } from '../pages/admin/AdminAttendees';
import { toCsv } from '../pages/admin/AdminPage';

describe('Eventbrite import', () => {
  it('guesses common Eventbrite headers', () => {
    const m = guessMapping(['Order #', 'First Name', 'Last Name', 'Email', 'Company', 'Ticket Type', 'Which AI tool do you plan to use?', 'Job Title']);
    expect(m).toMatchObject({
      eventbrite_order_id: 'Order #', first_name: 'First Name', last_name: 'Last Name', email: 'Email',
      organization: 'Company', attendance_type: 'Ticket Type', ai_tool: 'Which AI tool do you plan to use?', role: 'Job Title',
    });
  });
  it('normalizes ticket types and AI tools', () => {
    expect(normalizeAttendance('Virtual Livestream')).toBe('virtual');
    expect(normalizeAttendance('In-Person General Admission')).toBe('in_person');
    expect(normalizeAiTool('ChatGPT')).toBe('chatgpt');
    expect(normalizeAiTool('Microsoft Copilot')).toBe('copilot');
    expect(normalizeAiTool('None yet')).toBe('none');
    expect(normalizeAiTool('Perplexity')).toBe('other');
  });
  it('writes CSV with quoting', () => {
    expect(toCsv([{ a: 'x,y', b: { k: 1 } }])).toBe('a,b\r\n"x,y","{""k"":1}"');
  });
});
