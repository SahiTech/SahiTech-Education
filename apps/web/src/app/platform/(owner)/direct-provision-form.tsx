'use client';

import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, Copy, Check, RefreshCw, Sparkles, AlertCircle, Eye, EyeOff, Clock3 } from 'lucide-react';

interface DirectProvisionFormProps {
  applicationId: string;
  institutionName: string;
  contactEmail: string;
  isAlreadyProvisioned?: boolean;
  tenantCode?: string;
  tenantSubdomain?: string;
}

interface CredentialResult {
  loginIdentifier: string;
  temporaryPassword: string;
  institutionName?: string;
  contactEmail?: string;
  activationStatus?: string;
  tenantId?: string;
  message?: string;
}

const verificationOptions = [
  { value: 'phone_call', label: 'ফোন কলে পরিচয় যাচাই করেছি' },
  { value: 'whatsapp', label: 'WhatsApp-এ পরিচয় যাচাই করেছি' },
  { value: 'in_person', label: 'সরাসরি উপস্থিতিতে পরিচয় যাচাই করেছি' },
];

export function DirectProvisionForm({
  applicationId,
  institutionName,
  contactEmail,
  isAlreadyProvisioned = false,
  tenantCode,
  tenantSubdomain,
}: DirectProvisionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('phone_call');
  const [manualContactVerified, setManualContactVerified] = useState(false);
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CredentialResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!result) return;
    const timeout = window.setTimeout(() => setResult(null), 5 * 60 * 1000);
    return () => window.clearTimeout(timeout);
  }, [result]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = isAlreadyProvisioned ? '/api/platform/recover' : '/api/platform/provision';
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          activateImmediately: !isAlreadyProvisioned && activateImmediately,
          manualContactVerified,
          verificationMethod,
          reason,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'নিরাপদভাবে অনুরোধ সম্পন্ন করা যায়নি।');
      }
      setResult(payload as CredentialResult);
    } catch (submissionError: any) {
      setError(submissionError?.message || 'সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  }

  const [activateImmediately, setActivateImmediately] = useState(true);

  async function handleCopyCredentials() {
    if (!result) return;
    const statusText = result.activationStatus === 'active'
      ? 'প্রতিষ্ঠান সক্রিয় করা হয়েছে'
      : result.activationStatus === 'pending_activation'
        ? 'প্রতিষ্ঠান অনুমোদিত; অনবোর্ডিং সম্পন্ন করে Owner-এর চূড়ান্ত সক্রিয়করণ প্রয়োজন'
        : 'অ্যাকাউন্টের প্রাথমিক প্রবেশাধিকার প্রস্তুত';
    const message = `আসসালামু আলাইকুম,

${result.institutionName || institutionName}-এর SahiTech Education MDI Admin Account প্রস্তুত হয়েছে।

লগইন লিঙ্ক: https://sahitech.dpdns.org/login
MDI Login ID: ${result.loginIdentifier}
Temporary Password: ${result.temporaryPassword}

${statusText}

নিরাপত্তার জন্য প্রথম Login-এর পর অবশ্যই নতুন Password সেট করবেন। আপনার প্রকৃত যোগাযোগের ইমেইলটি এখনো আলাদাভাবে যাচাই করা হয়নি; উপরের MDI Login ID-ই ব্যবহার করবেন।

SahiTech Education Support
+8801601654316 | sahitecheducation@gmail.com`;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Clipboard অনুমতি পাওয়া যায়নি। Login ID ও Password আলাদাভাবে কপি করুন।');
    }
  }

  return (
    <div className="w-full">
      {!isOpen && !result && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition shadow-xs ${
            isAlreadyProvisioned
              ? 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
              : 'border border-emerald-600 bg-[#123b32] text-white hover:bg-[#0d2d26]'
          }`}
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          <span>{isAlreadyProvisioned ? 'ম্যানুয়াল Admin Password Recovery' : 'Secure Manual Admin Activation'}</span>
        </button>
      )}

      {isOpen && !result && (
        <div className="mt-2 rounded-2xl border-2 border-emerald-600/40 bg-emerald-50/70 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2 border-b border-emerald-200/60 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <h4 className="text-xs font-black text-emerald-950">
                  {isAlreadyProvisioned ? 'Owner-assisted Admin Recovery' : 'Email-independent Admin Activation'}
                </h4>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/80">
                {isAlreadyProvisioned
                  ? 'নতুন অস্থায়ী Password ইস্যুর আগে নিবন্ধিত যোগাযোগ মাধ্যমে পরিচয় পুনরায় যাচাই করুন।'
                  : 'ইমেইল পাঠানো ছাড়াই MDI Login ID ও একবার দেখানো Temporary Password তৈরি হবে।'}
              </p>
              {isAlreadyProvisioned && tenantCode && (
                <p className="mt-1 font-mono text-[10px] font-bold text-emerald-900">
                  প্রতিষ্ঠান কোড: {tenantCode} {tenantSubdomain ? `· সাবডোমেইন: ${tenantSubdomain}` : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setError(null); }}
              aria-label="Close"
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >✕</button>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700">আবেদনে দেওয়া যোগাযোগের ইমেইল (Login ID নয়)</label>
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-mono text-slate-800">{contactEmail}</div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
                এই ইমেইলটি Supabase Auth-এ Verified করা হবে না। Login-এর জন্য আলাদা MDI Login ID তৈরি হবে।
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700">পরিচয় যাচাইয়ের মাধ্যম</label>
              <select
                value={verificationMethod}
                onChange={(event) => setVerificationMethod(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {verificationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-emerald-200 bg-white p-2.5 text-xs">
              <input
                type="checkbox"
                checked={manualContactVerified}
                onChange={(event) => setManualContactVerified(event.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                required
              />
              <span className="text-[11px] leading-relaxed text-slate-700">
                <b>আমি আবেদনকারীর সঙ্গে নির্বাচিত মাধ্যমে যোগাযোগ করে পরিচয় ও Admin Account গ্রহণের অনুমতি যাচাই করেছি।</b>
                <span className="mt-1 block text-[10px] text-slate-500">এটি Owner-এর audit-যোগ্য ঘোষণা; এটি ইমেইল যাচাইয়ের সমতুল্য নয়।</span>
              </span>
            </label>

            {isAlreadyProvisioned ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-700">Recovery-এর কারণ (কমপক্ষে ২০ অক্ষর)</label>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  minLength={20}
                  maxLength={500}
                  required
                  rows={3}
                  placeholder="যেমন: দায়িত্বপ্রাপ্ত মুহতামিম ফোনে পরিচয় নিশ্চিত করেছেন এবং আগের অস্থায়ী পাসওয়ার্ড হারিয়েছেন।"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                />
              </div>
            ) : (
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-emerald-200 bg-white p-2.5 text-xs">
                <input
                  type="checkbox"
                  checked={activateImmediately}
                  onChange={(event) => setActivateImmediately(event.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span className="text-[11px] leading-tight text-slate-700">
                  <b>প্রতিষ্ঠান তাৎক্ষণিকভাবে সম্পূর্ণ সক্রিয় করুন</b>
                  <span className="mt-1 block text-[10px] text-slate-500">বন্ধ রাখলে প্রতিষ্ঠান Pending Activation-এ থাকবে; Admin শুধু onboarding সম্পন্ন করতে পারবে।</span>
                </span>
              </label>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setIsOpen(false); setError(null); }}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >বাতিল</button>
              <button
                type="submit"
                disabled={isSubmitting || !manualContactVerified || (isAlreadyProvisioned && reason.trim().length < 20)}
                className="inline-flex flex-[2] items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
              >
                {isSubmitting ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />প্রসেস হচ্ছে…</> :
                  <><Sparkles className="h-3.5 w-3.5" />{isAlreadyProvisioned ? 'নতুন Temporary Password দিন' : 'অ্যাকাউন্ট তৈরি ও সক্রিয় করুন'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {result && (
        <div className="mt-2 rounded-2xl border-2 border-emerald-500 bg-emerald-950 p-4 text-white shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950"><Check className="h-3.5 w-3.5 stroke-[3]" /></div>
            <h4 className="text-xs font-black text-emerald-300">{isAlreadyProvisioned ? 'Recovery credential তৈরি হয়েছে' : 'Admin Account প্রস্তুত হয়েছে'}</h4>
          </div>

          <div className="mt-3 space-y-3 rounded-xl bg-white/10 p-3 text-xs">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/70">প্রতিষ্ঠান</span>
              <span className="font-bold text-emerald-50">{result.institutionName || institutionName}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/70">Login URL</span>
              <a href="https://sahitech.dpdns.org/login" target="_blank" rel="noreferrer" className="font-mono text-[11px] text-emerald-300 underline">https://sahitech.dpdns.org/login</a>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/70">MDI Login ID (আলাদা করে কপি করুন)</span>
              <span className="break-all font-mono font-bold text-emerald-100">{result.loginIdentifier}</span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="block text-[10px] uppercase tracking-wider text-emerald-200/70">Temporary Password (একবার দেখানো হচ্ছে)</span>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="inline-flex items-center gap-1 text-[10px] text-emerald-200">
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{showPassword ? 'লুকান' : 'দেখান'}
                </button>
              </div>
              <span className="mt-1 block break-all rounded bg-black/40 px-2 py-1 font-mono text-[13px] font-bold text-amber-300">
                {showPassword ? result.temporaryPassword : '••••••••••••••••'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-2 text-[10px] leading-relaxed text-amber-100">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              এই পাসওয়ার্ড ৫ মিনিট পর এই স্ক্রিন থেকে মুছে যাবে। প্রথম Login-এ নতুন Password বাধ্যতামূলক।
            </div>
            {result.message && <p className="text-[10px] text-emerald-100">{result.message}</p>}
          </div>

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={handleCopyCredentials} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400">
              {copied ? <><Check className="h-3.5 w-3.5" />কপি হয়েছে</> : <><Copy className="h-3.5 w-3.5" />WhatsApp/SMS মেসেজ কপি</>}
            </button>
            <button type="button" onClick={() => { setResult(null); setIsOpen(false); setReason(''); setManualContactVerified(false); }} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20">
              Credential মুছুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
