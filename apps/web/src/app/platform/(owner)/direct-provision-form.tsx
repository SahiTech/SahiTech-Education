'use client';

import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Copy, Check, Eye, EyeOff, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { directProvisionTenant, type DirectProvisionResult } from '@/app/actions/platform';

interface DirectProvisionFormProps {
  applicationId: string;
  institutionName: string;
  contactEmail: string;
  isAlreadyProvisioned?: boolean;
  tenantCode?: string;
  tenantSubdomain?: string;
}

export function DirectProvisionForm({
  applicationId,
  institutionName,
  contactEmail,
  isAlreadyProvisioned = false,
  tenantCode,
  tenantSubdomain,
}: DirectProvisionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState(() => generateSecurePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [activateImmediately, setActivateImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DirectProvisionResult['data'] | null>(null);
  const [copied, setCopied] = useState(false);

  function generateSecurePassword() {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `Mdi#${randomDigits}!`;
  }

  function handleRegeneratePassword() {
    setPassword(generateSecurePassword());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await directProvisionTenant({
        applicationId,
        initialPassword: password,
        activateImmediately,
      });

      if (!res.success) {
        setError(res.error || 'অ্যাকাউন্ট তৈরি করা যায়নি।');
      } else if (res.data) {
        setResult(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyCredentials() {
    const passwordText = result?.password_used || password || '(পূর্বের পাসওয়ার্ড)';
    const textToCopy = `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ,
${institutionName}-এর MDI ডিজিটাল এডুকেশন প্ল্যাটফর্ম অ্যাকাউন্ট সক্রিয় করা হয়েছে।

🌐 লগইন লিঙ্ক: https://sahitech.dpdns.org/login
📧 ইউজার / ইমেইল: ${contactEmail}
🔑 প্রাথমিক পাসওয়ার্ড: ${passwordText}

লগইন করার পর মাদরাসার সকল প্রশাসনিক ও একাডেমিক কার্যক্রম পরিচালনা করতে পারবেন।
কারিগরি সহায়তা ও তথ্য: +8801601654316 | sahitecheducation@gmail.com`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
          <KeyRound className="h-4 w-4 shrink-0 text-emerald-300" />
          <span>
            {isAlreadyProvisioned
              ? '🔑 পাসওয়ার্ড পুনঃসেট / সরাসরি পরিচালনা'
              : '⚡ সরাসরি অ্যাকাউন্ট সেটআপ (Super Admin Provision)'}
          </span>
        </button>
      )}

      {isOpen && !result && (
        <div className="mt-2 rounded-2xl border-2 border-emerald-600/40 bg-emerald-50/70 p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-emerald-200/60 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <h4 className="text-xs font-black text-emerald-950">
                  {isAlreadyProvisioned ? 'সরাসরি পাসওয়ার্ড আপডেট ও সক্রিয়করণ' : 'সুপার এডমিন সরাসরি অ্যাকাউন্ট সেটআপ'}
                </h4>
              </div>
              <p className="mt-1 text-[11px] text-emerald-900/80 leading-relaxed">
                মাদরাসা শিক্ষককে ইমেইল ভেরিফিকেশন বা টোকেনের ঝামেলা ছাড়া সরাসরি অ্যাকাউন্ট ও পাসওয়ার্ড বুঝিয়ে দিন।
              </p>
              {isAlreadyProvisioned && tenantCode && (
                <p className="mt-1 font-mono text-[10px] text-emerald-900 font-bold">
                  প্রতিষ্ঠান কোড: {tenantCode} {tenantSubdomain ? `· সাবডোমেইন: ${tenantSubdomain}` : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700">লগইন অফিসিয়াল ইমেইল</label>
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-mono text-slate-800">
                {contactEmail}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700">
                  প্রাথমিক পাসওয়ার্ড (Initial Password)
                </label>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline"
                >
                  <RefreshCw className="h-3 w-3" /> নতুন তৈরি করুন
                </button>
              </div>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono tracking-wider text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  placeholder="যেমন: Mdi#2026!Jamia"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                শিক্ষক এই পাসওয়ার্ড দিয়েই <b className="font-mono">https://sahitech.dpdns.org/login</b> এ সরাসরি ঢুকতে পারবেন।
              </p>
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-white p-2.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={activateImmediately}
                onChange={(e) => setActivateImmediately(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-[11px] text-slate-700 leading-tight">
                <b>তাত্ক্ষণিকভাবে সম্পূর্ণ সক্রিয় করুন (Instant 100% Activation)</b>
                <br />
                <span className="text-slate-500 text-[10px]">
                  চেক করা থাকলে অনবোর্ডিং উইজার্ড স্কিপ হয়ে প্রতিষ্ঠান সরাসরি চালু হবে।
                </span>
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="flex-[2] inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>সেটআপ হচ্ছে…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>অ্যাকাউন্ট প্রস্তুত ও সক্রিয় করুন</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {result && (
        <div className="mt-2 rounded-2xl border-2 border-emerald-500 bg-emerald-950 p-4 text-white shadow-md animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
            <h4 className="text-xs font-black text-emerald-300">অ্যাকাউন্ট সফলভাবে প্রস্তুত ও সক্রিয় হয়েছে!</h4>
          </div>

          <div className="mt-3 space-y-2 rounded-xl bg-white/10 p-3 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200/70 block">প্রতিষ্ঠান:</span>
              <span className="font-bold text-emerald-50">{result.institution_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200/70 block">লগইন লিঙ্ক:</span>
              <a
                href="/login"
                target="_blank"
                className="font-mono text-[11px] text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
              >
                https://sahitech.dpdns.org/login
              </a>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200/70 block">অফিসিয়াল ইউজার / ইমেইল:</span>
              <span className="font-mono font-bold text-emerald-100">{result.email}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200/70 block">পাসওয়ার্ড:</span>
              <span className="font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded text-[13px]">
                {result.password_used || password || '(অপরিবর্তিত)'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>কপি হয়েছে! ✓</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>WhatsApp/SMS মেসেজ কপি করুন</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setIsOpen(false);
              }}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
            >
              সম্পন্ন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
