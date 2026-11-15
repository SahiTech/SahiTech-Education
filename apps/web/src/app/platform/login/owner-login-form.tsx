'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Step = 'credentials' | 'enroll' | 'challenge';

export default function OwnerLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function beginLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const supabase = createClient();
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError || !data.user) throw new Error('Unable to sign in with these credentials.');

      // Only the UUID already bound by trusted administration may enter MFA setup.
      const { data: trustedIdentity, error: identityError } =
        await (supabase.rpc as any)('is_platform_owner_identity');
      if (identityError || trustedIdentity !== true) {
        await supabase.auth.signOut();
        throw new Error('Unable to sign in with these credentials.');
      }

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw new Error('Secure authentication is temporarily unavailable.');

      const verified = factors.totp.find((factor: any) => factor.status === 'verified');
      if (verified) {
        setFactorId(verified.id);
        setStep('challenge');
      } else {
        // Remove only an unfinished TOTP factor belonging to this already-trusted identity.
        const pending = factors.totp.find((factor: any) => factor.status === 'unverified');
        if (pending) {
          const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: pending.id });
          if (removeError) throw new Error('Authenticator setup could not be safely restarted.');
        }

        const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'MDI Global Platform Owner',
        });
        if (enrollError || !enrolled) throw new Error('Authenticator setup could not be started.');

        setFactorId(enrolled.id);
        setQr(enrolled.totp.qr_code);
        setSecret(enrolled.totp.secret);
        setStep('enroll');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge) throw new Error('Could not start authenticator verification.');

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) throw new Error('The authenticator code is invalid or expired.');

      const { data: isOwner, error: ownerError } = await (supabase.rpc as any)('is_platform_owner');
      if (ownerError || isOwner !== true) {
        await supabase.auth.signOut();
        throw new Error('Unable to complete secure Owner authentication.');
      }

      router.replace('/platform');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA verification failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 space-y-4">
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {step === 'credentials' && (
        <form onSubmit={beginLogin} className="space-y-3">
          <div>
            <label htmlFor="owner-email" className="mb-1 block text-xs font-bold text-slate-700">Email address</label>
            <input id="owner-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label htmlFor="owner-password" className="mb-1 block text-xs font-bold text-slate-700">Password</label>
            <input id="owner-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          </div>
          <button disabled={busy} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
            {busy ? 'Verifying identity…' : 'Continue securely'}
          </button>
          <a href="/forgot-password" className="block text-center text-xs font-semibold text-slate-500 underline">Forgot password?</a>
        </form>
      )}

      {step === 'enroll' && (
        <form onSubmit={verifyCode} className="space-y-4">
          <p className="text-sm font-semibold text-slate-800">Set up your authenticator app</p>
          {qr && <div className="flex justify-center rounded-lg bg-white p-3"><img src={`data:image/svg+xml;utf8,${encodeURIComponent(qr)}`} alt="Authenticator QR code" className="h-48 w-48" /></div>}
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] font-bold text-slate-500">Manual setup key</p>
            <p className="mt-1 break-all font-mono text-sm text-slate-900">{secret}</p>
          </div>
          <p className="text-xs leading-5 text-slate-500">Scan the QR code with an authenticator app. Keep the setup key private. After scanning, enter the current six-digit code to activate MFA.</p>
          <CodeInput value={code} onChange={setCode} />
          <button disabled={busy || code.length !== 6} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
            {busy ? 'Verifying…' : 'Verify and enable MFA'}
          </button>
        </form>
      )}

      {step === 'challenge' && (
        <form onSubmit={verifyCode} className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">Enter the current six-digit code from your registered authenticator app.</p>
          <CodeInput value={code} onChange={setCode} />
          <button disabled={busy || code.length !== 6} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
            {busy ? 'Verifying…' : 'Verify MFA and open Owner Portal'}
          </button>
        </form>
      )}
    </div>
  );
}

function CodeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label htmlFor="owner-totp" className="mb-1 block text-xs font-bold text-slate-700">Authenticator code</label>
      <input id="owner-totp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))} required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center font-mono text-xl tracking-[0.5em]" />
    </div>
  );
}
