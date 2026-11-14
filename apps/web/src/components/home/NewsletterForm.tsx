'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react';

type Labels = {
  emailLabel: string;
  placeholder: string;
  button: string;
  consent: string;
  success: string;
  error: string;
};

export function NewsletterForm({ locale, labels }: { locale: 'bn' | 'en' | 'ar'; labels: Labels }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || busy) return;
    setBusy(true);
    setMessage('');
    setSuccess(false);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, locale, consent, website: '' }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success !== true) throw new Error('newsletter_request_failed');
      setSuccess(true);
      setMessage(labels.success);
      setEmail('');
      setConsent(false);
    } catch {
      setSuccess(false);
      setMessage(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full space-y-3" noValidate>
      <label htmlFor="mdi-newsletter-email" className="block text-xs font-semibold text-white/85">{labels.emailLabel}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="mdi-newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={labels.placeholder}
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-[#202B27] placeholder:text-[#8A938D] outline-none transition focus:border-[#D8BD86] focus:ring-2 focus:ring-[#D8BD86]/30"
        />
        <button
          type="submit"
          disabled={busy || !consent || !email.trim()}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C5A66B] px-5 py-3 text-sm font-bold text-[#172D25] transition hover:bg-[#D9BC83] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
          {labels.button}
        </button>
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-white/75">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#C5A66B]"
        />
        <span>{labels.consent}</span>
      </label>
      {message && (
        <p role={success ? 'status' : 'alert'} className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5 ${success ? 'border-[#C5A66B]/40 bg-white/10 text-[#F2E4C9]' : 'border-red-200/30 bg-red-950/30 text-red-100'}`}>
          {success && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {message}
        </p>
      )}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="mdi-newsletter-website">Leave this field empty</label>
        <input id="mdi-newsletter-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="locale" value={locale} />
    </form>
  );
}
