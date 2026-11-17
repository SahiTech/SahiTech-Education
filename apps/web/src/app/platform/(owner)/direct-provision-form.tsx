'use client';

import React, { useState } from 'react';
import {
  KeyRound, ShieldCheck, Copy, Check, Eye, EyeOff, RefreshCw,
  Sparkles, AlertCircle, ClipboardCheck, LockKeyhole,
} from 'lucide-react';
import {
  provisionMadrasaAdminManually,
  resetMadrasaAdminPasswordManually,
  type ManualAdminCredentials,
} from '@/app/actions/platform';

interface DirectProvisionFormProps {
  applicationId: string;
  institutionName: string;
  contactEmail: string;
  isAlreadyProvisioned?: boolean;
  tenantCode?: string;
  tenantSubdomain?: string;
}

type VerificationMethod = 'phone_call' | 'in_person' | 'signed_authorization';

export function DirectProvisionForm({
  applicationId,
  institutionName,
  contactEmail,
  isAlreadyProvisioned = false,
  tenantCode,
  tenantSubdomain,
}: DirectProvisionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activateImmediately, setActivateImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ManualAdminCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('phone_call');
  const [verificationNote, setVerificationNote] = useState('');
  const [identityVerified, setIdentityVerified] = useState(false);

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await provisionMadrasaAdminManually({
        applicationId,
        activateImmediately,
      });
      if (!response.success || !response.data) {
        setError(response.error || 'অ্যাকাউন্ট তৈরি করা যায়নি।');
        return;
      }
      setResult(response.data);
    } catch {
      setError('সার্ভারে নিরাপদ Account Setup সম্পন্ন করা যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleManualReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identityVerified) {
      setError('পাসওয়ার্ড Reset করার আগে Account Holder-এর পরিচয় যাচাই নিশ্চিত করুন।');
      return;
    }
    if (verificationNote.trim().length < 20) {
      setError('পরিচয় যাচাইয়ের বিস্তারিত কারণ কমপক্ষে ২০ অক্ষরে লিখুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetMadrasaAdminPasswordManually({
        applicationId,
        verificationMethod,
        verificationNote: verificationNote.trim(),
      });
      if (!response.success || !response.data) {
        setError(response.error || 'Password Reset করা যায়নি।');
        return;
      }
      setResult(response.data);
    } catch {
      setError('Owner-assisted Password Recovery সম্পন্ন করা যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyCredentials() {
    if (!result) return;
    const textToCopy = `Assalamu Alaikum,

Your SahiTech Education MDI administrator access is ready for ${result.institution_name}.

Login page: https://sahitech.dpdns.org/login
MDI Login ID: ${result.login_identifier}
Temporary password: ${result.temporary_password}

Please sign in and immediately create a new private password when prompted. Do not share your new password with anyone.

Application contact email (${contactEmail}): ${result.contact_email_verified ? 'previously verified' : 'not email-verified'}. ${result.login_identifier.endsWith('@login.sahitech.invalid') ? 'The MDI Login ID is a non-routable system-generated sign-in identifier and does not receive email.' : 'The MDI Login ID is the verified email-based sign-in address.'}

SahiTech Education Support: +8801601654316 | sahitecheducation@gmail.com`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
    } catch {
      setError('Clipboard access পাওয়া যায়নি। তথ্যগুলো নিরাপদে হাতে কপি করুন।');
    }
  }

  function clearCredentials() {
    setResult(null);
    setIsOpen(false);
    setCopied(false);
    setShowPassword(false);
    setVerificationNote('');
    setIdentityVerified(false);
    setError(null);
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
          <span>{isAlreadyProvisioned ? 'মাদ্রাসা Admin Password Reset' : 'Email ছাড়া Admin Account তৈরি করুন'}</span>
        </button>
      )}

      {isOpen && !result && (
        <div className="mt-2 rounded-2xl border-2 border-emerald-600/40 bg-emerald-50/70 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2 border-b border-emerald-200/60 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <h4 className="text-xs font-black text-emerald-950">
                  {isAlreadyProvisioned ? 'নিরাপদ Owner-assisted Password Reset' : 'Manual Madrasa Admin Activation'}
                </h4>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/80">
                {isAlreadyProvisioned
                  ? 'শুধুমাত্র Account Holder-এর পরিচয় যাচাই ও কারণ নথিভুক্ত করার পর অস্থায়ী পাসওয়ার্ড Reset করা যাবে।'
                  : 'ইমেইল ছাড়াই নতুন Admin Login তৈরি হবে। প্রাথমিক পাসওয়ার্ড সার্ভার তৈরি করবে এবং একবারই দেখাবে।'}
              </p>
              {tenantCode && (
                <p className="mt-1 font-mono text-[10px] font-bold text-emerald-900">
                  Institution: {tenantCode}{tenantSubdomain ? ` · ${tenantSubdomain}` : ''}
                </p>
              )}
            </div>
            <button type="button" onClick={clearCredentials} className="text-xs font-bold text-slate-400 hover:text-slate-700">✕</button>
          </div>

          {error && (
            <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
            <p className="font-bold text-slate-800">{institutionName}</p>
            <p className="mt-1 text-slate-600">Application contact email: <span className="font-mono">{contactEmail}</span></p>
            <p className="mt-1 text-[10px] font-semibold text-amber-700">Contact email is not verified and will not be used as the login identity.</p>
          </div>

          {isAlreadyProvisioned ? (
            <form onSubmit={handleManualReset} className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">পরিচয় যাচাইয়ের পদ্ধতি</label>
                <select
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value as VerificationMethod)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="phone_call">Registered phone number-এ সরাসরি কথা বলে</option>
                  <option value="in_person">সরাসরি উপস্থিতি ও পরিচয়পত্র দেখে</option>
                  <option value="signed_authorization">স্বাক্ষরিত অনুমোদনপত্র যাচাই করে</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">যাচাইয়ের বিস্তারিত নোট (কমপক্ষে ২০ অক্ষর)</label>
                <textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  minLength={20}
                  maxLength={500}
                  required
                  rows={3}
                  placeholder="কার সঙ্গে, কোন নম্বরে বা কীভাবে পরিচয় যাচাই করেছেন তা লিখুন..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                />
              </div>
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-white p-2.5 text-[11px] text-slate-700">
                <input type="checkbox" checked={identityVerified} onChange={(e) => setIdentityVerified(e.target.checked)} className="mt-0.5" />
                <span>আমি নিশ্চিত করছি যে Account Holder-এর পরিচয় আবেদনকৃত মাদ্রাসার দায়িত্বশীল ব্যক্তির সঙ্গে যাচাই করেছি এবং এই Reset অনুমোদিত।</span>
              </label>
              <button
                type="submit"
                disabled={isSubmitting || !identityVerified || verificationNote.trim().length < 20}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-700 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                {isSubmitting ? 'Reset হচ্ছে...' : 'পরিচয় যাচাই করে Temporary Password Reset'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleProvision} className="mt-3 space-y-3">
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-emerald-200 bg-white p-2.5 text-xs">
                <input
                  type="checkbox"
                  checked={activateImmediately}
                  onChange={(e) => setActivateImmediately(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700"
                />
                <span className="text-[11px] leading-tight text-slate-700">
                  <b>তাত্ক্ষণিকভাবে প্রতিষ্ঠান Active করুন</b>
                  <span className="mt-1 block text-[10px] text-slate-500">চেক না করলে মাদ্রাসা Pending Activation অবস্থায় থাকবে; Admin প্রথমে সীমিত Onboarding সম্পন্ন করতে পারবে।</span>
                </span>
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isSubmitting ? 'নিরাপদ Account Setup হচ্ছে...' : 'Admin Account তৈরি ও Approve করুন'}
              </button>
            </form>
          )}
        </div>
      )}

      {result && (
        <div className="mt-2 rounded-2xl border-2 border-emerald-500 bg-emerald-950 p-4 text-white shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
            <h4 className="text-xs font-black text-emerald-300">
              {isAlreadyProvisioned ? 'Temporary Password Reset সম্পন্ন' : 'Admin Account সফলভাবে তৈরি হয়েছে'}
            </h4>
          </div>
          <div className="mt-3 space-y-2 rounded-xl bg-white/10 p-3 text-xs">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/70">Institution</span>
              <span className="font-bold text-emerald-50">{result.institution_name}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/70">Login page</span>
              <a href="/login" target="_blank" rel="noreferrer" className="font-mono text-[11px] text-emerald-300 underline">https://sahitech.dpdns.org/login</a>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/70">MDI Login ID</span>
              <span className="break-all font-mono font-bold text-emerald-100">{result.login_identifier}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/70">One-time temporary password</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="min-w-0 flex-1 break-all rounded bg-black/40 px-2 py-1 font-mono text-[13px] font-bold text-amber-300">
                  {showPassword ? result.temporary_password : '••••••••••••••••••••'}
                </span>
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="rounded p-1 text-emerald-100 hover:bg-white/10">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-2 text-[10px] leading-relaxed text-amber-100">
              {result.login_identifier.endsWith('@login.sahitech.invalid')
                ? 'আবেদনের Contact Email verified নয়। MDI Login ID একটি system-generated sign-in identity; এটি কোনো ইমেইল গ্রহণ করে না।'
                : 'MDI Login ID একটি verified email-based sign-in address।'}
              প্রথম Login-এ Admin-কে নিজের নতুন Password সেট করতেই হবে।
            </p>
            <p className="text-[10px] text-emerald-100/80">
              Institution status: {result.activated ? 'Active' : 'Pending Activation'}
            </p>
            {result.audit_warning && <p role="alert" className="text-[10px] text-amber-200">{result.audit_warning}</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={handleCopyCredentials} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400">
              {copied ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'WhatsApp/SMS Message Copied' : 'Copy WhatsApp/SMS Message'}
            </button>
            <button type="button" onClick={clearCredentials} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20">
              Credential মুছে ফেলুন
            </button>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald-100/70">
            <ClipboardCheck className="h-3 w-3" /> একবারের Credential Display — Dashboard বন্ধ করলে আর দেখা যাবে না।
          </p>
        </div>
      )}
    </div>
  );
}
