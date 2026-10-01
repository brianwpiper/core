import { useState } from 'react';
import { useApp } from '../app/AppContext';
import { BrandMark } from '../components/Layout';
import { TextInput } from '../components/Field';
import { DEMO_CODE, setDemoPreviewRole } from '../lib/demoBackend';
import type { Role } from '../lib/types';

type Step = 'email' | 'code' | 'help' | 'help-sent';

export function LoginPage() {
  const { backend } = useApp();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewRole, setPreviewRole] = useState<Role>('attendee');
  const [help, setHelp] = useState({ name: '', registered_email: '', note: '' });
  const demo = backend.mode === 'demo';

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter the email you registered with.');
      return;
    }
    setBusy(true);
    if (demo) setDemoPreviewRole(previewRole);
    const res = await backend.requestLogin(email);
    setBusy(false);
    if (res.ok) setStep('code');
    else if (res.error === 'not_registered')
      setError("We couldn't find that email. Use the email from your Eventbrite registration, or tap \"Wrong email?\" below.");
    else setError(res.error ?? 'Something went wrong. Please try again.');
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await backend.verifyCode(email, code);
    setBusy(false);
    if (!res.ok) setError(res.error?.includes('demo') ? res.error : 'That code did not work. Check the latest email and try again.');
  };

  const sendHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await backend.fileHelpRequest({ email_tried: email.trim(), ...help });
      setStep('help-sent');
    } catch {
      setError('Could not send. Please find a facilitator at the registration table.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-page">
      <main className="card login-card" id="main" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'var(--brand)', color: 'var(--brand-ink)', padding: '18px 20px' }} className="row">
          <BrandMark />
          <div>
            <strong>Summit Workbook</strong>
            <div className="small">Main Street Event AI Summit</div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {error && (
            <p className="notice err" role="alert">
              {error}
            </p>
          )}

          {step === 'email' && (
            <form onSubmit={send} noValidate>
              <h1>Log in</h1>
              <p>Enter the email you used to register. We will send you a login link and a 6-digit code.</p>
              <TextInput label="Email" type="email" value={email} onChange={setEmail} max={200} />
              {demo && (
                <div className="field">
                  <label htmlFor="preview">Demo: preview as</label>
                  <select id="preview" value={previewRole} onChange={(e) => setPreviewRole(e.target.value as Role)}>
                    <option value="attendee">Attendee</option>
                    <option value="facilitator">Facilitator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
              <button className="btn big" type="submit" disabled={busy}>
                {busy ? 'Sending' : 'Email me a login'}
              </button>
              <p style={{ marginTop: 14 }}>
                <button type="button" className="btn ghost" onClick={() => setStep('help')}>
                  Wrong email?
                </button>
              </p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={verify} noValidate>
              <h1>Check your email</h1>
              <p>
                We sent an email to <strong>{email}</strong>. Tap the button in the email on this device, or type the 6-digit code
                here. The code works on any device, so you can read the email on your phone and type the code on your laptop.
              </p>
              {demo && <p className="notice info">Demo mode: no email is sent. The code is {DEMO_CODE}.</p>}
              <div className="field">
                <label htmlFor="otp">6-digit code</label>
                <input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  style={{ fontSize: '1.6rem', letterSpacing: '0.4em', textAlign: 'center' }}
                />
              </div>
              <button className="btn big" type="submit" disabled={busy || code.length !== 6}>
                {busy ? 'Checking' : 'Log in'}
              </button>
              <div className="row" style={{ marginTop: 14 }}>
                <button type="button" className="btn ghost" onClick={() => setStep('email')}>
                  Use a different email
                </button>
                <button type="button" className="btn ghost" onClick={() => backend.requestLogin(email)}>
                  Send again
                </button>
              </div>
            </form>
          )}

          {step === 'help' && (
            <form onSubmit={sendHelp} noValidate>
              <h1>Need help logging in?</h1>
              <p>Tell us who you are and a facilitator will add or fix your email. At the Summit, you can also visit the registration table.</p>
              <TextInput label="Email you tried" type="email" value={email} onChange={setEmail} max={200} />
              <TextInput label="Your name" value={help.name} onChange={(v) => setHelp({ ...help, name: v })} max={120} />
              <TextInput
                label="Email you may have registered with (if different)"
                type="email"
                value={help.registered_email}
                onChange={(v) => setHelp({ ...help, registered_email: v })}
                max={200}
              />
              <TextInput label="Anything else? (optional)" value={help.note} onChange={(v) => setHelp({ ...help, note: v })} max={500} multiline />
              <button className="btn big" type="submit" disabled={busy || !email.trim() || !help.name.trim()}>
                Send to a facilitator
              </button>
              <p style={{ marginTop: 14 }}>
                <button type="button" className="btn ghost" onClick={() => setStep('email')}>
                  Back to login
                </button>
              </p>
            </form>
          )}

          {step === 'help-sent' && (
            <div>
              <h1>Request sent</h1>
              <p>A facilitator will fix your email and let you know. You can then log in with the corrected address.</p>
              <button type="button" className="btn secondary" onClick={() => setStep('email')}>
                Back to login
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
