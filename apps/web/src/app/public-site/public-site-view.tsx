'use client';

import React, { useState } from 'react';
import { submitPublicAdmissionApplication } from '@/app/actions/admissions';
import { 
  Building2, 
  Bell, 
  BookOpen, 
  GraduationCap, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface PublicSiteViewProps {
  tenant: any;
  notices: Array<any>;
}

export function PublicSiteView({ tenant, notices }: PublicSiteViewProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; appNo?: string } | null>(null);

  // Form states
  const [fullNameBn, setFullNameBn] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [fatherNameBn, setFatherNameBn] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [isResidential, setIsResidential] = useState(true);
  const [isLillah, setIsLillah] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setLoading(true);
    setStatusMessage(null);

    const res = await submitPublicAdmissionApplication({
      tenantId: tenant.id,
      fullNameBn,
      fullNameEn,
      fatherNameBn,
      guardianPhone,
      isResidentialApplicant: isResidential,
      isLillahApplicant: isLillah,
    });

    setLoading(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `আলহামদুলিল্লাহ! আপনার ভর্তি আবেদন গৃহীত হয়েছে। আবেদন ট্র্যাকিং নম্বর: ${res.applicationNo}`,
        appNo: res.applicationNo,
      });
      setShowApplyModal(false);
      setFullNameBn('');
      setFullNameEn('');
      setFatherNameBn('');
      setGuardianPhone('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'আবেদন জমাদান ব্যর্থ হয়েছে।' });
    }
  };

  return (
    <div className="space-y-12">
      {statusMessage && (
        <div
          className={`rounded-2xl p-6 text-sm font-medium shadow-md flex items-start justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-red-50 text-red-900 border border-red-300'
          }`}
        >
          <div className="flex items-start gap-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-base">{statusMessage.text}</div>
              {statusMessage.appNo && (
                <p className="text-xs text-emerald-700 mt-1">
                  ভর্তি পরীক্ষার দিন এই ট্র্যাকিং নম্বর সঙ্গে আনুন। সংশ্লিষ্ট মাদরাসা কর্তৃপক্ষ আপনার সাথে যোগাযোগ করবে।
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="rounded-3xl border border-emerald-800/20 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-8 sm:p-14 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800/80 px-3.5 py-1 text-xs font-semibold text-emerald-200 border border-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {tenant?.curriculum_type === 'qawmi' ? 'কওমি দরসে নেজামী' : 'আলিয়া মাদ্রাসা শিক্ষা বোর্ড'}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {tenant?.name || 'মাদরাসা ওয়েব পোর্টাল'}
          </h1>

          {tenant?.motto_bn && (
            <p className="text-base sm:text-lg text-emerald-100 font-serif italic">
              &ldquo;{tenant.motto_bn}&rdquo;
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-200 pt-2 font-mono">
            {tenant?.established_year && <span>স্থাপিত: {tenant.established_year} খ্রি.</span>}
            {tenant?.district && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {tenant.district}
              </span>
            )}
            {tenant?.contact_phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {tenant.contact_phone}
              </span>
            )}
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setShowApplyModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg hover:bg-amber-400 transition"
            >
              <Send className="h-4 w-4" />
              অনলাইনে ভর্তি আবেদন করুন
            </button>

            <Link
              href="/verify"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              সনদপত্র অনলাইন যাচাই
            </Link>
          </div>
        </div>
      </div>

      {/* Notice Board Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">প্রাতিষ্ঠানিক নোটিশ বোর্ড</h2>
              <span className="text-xs text-slate-400 font-mono">Official Announcements</span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {notices.length}টি নোটিশ
          </span>
        </div>

        {notices.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
            বর্তমানে কোনো পাবলিক নোটিশ প্রকাশিত নেই।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((n) => (
              <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 transition space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{n.title}</h3>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-mono text-slate-600">
                    {new Date(n.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {n.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Online Admission Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">অনলাইন ভর্তি আবেদন ফরম</h3>
                <p className="text-xs text-slate-500 mt-0.5">{tenant?.name}</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">তালিবুল ইলমের নাম (বাংলায়) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মুহাম্মাদ তালহা"
                  value={fullNameBn}
                  onChange={(e) => setFullNameBn(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Name (in English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Talha"
                  value={fullNameEn}
                  onChange={(e) => setFullNameEn(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">পিতার নাম (বাংলায়) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মাওলানা আব্দুস সামাদ"
                  value={fatherNameBn}
                  onChange={(e) => setFatherNameBn(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">অভিভাবকের মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pubRes"
                    checked={isResidential}
                    onChange={(e) => setIsResidential(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="pubRes" className="font-bold text-slate-700">
                    আবাসিক ছাত্রাবাসে সিট বরাদ্দ আবেদন (Residential)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pubLil"
                    checked={isLillah}
                    onChange={(e) => setIsLillah(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="pubLil" className="font-bold text-slate-700">
                    লিল্লাহ বোর্ডিং ও যাকাত সহায়তা আবেদন (অনাথ ও অস্বচ্ছলদের জন্য)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-700 px-6 py-2.5 font-bold text-white hover:bg-emerald-800 disabled:opacity-50 shadow"
                >
                  {loading ? 'আবেদন জমাদান হচ্ছে...' : 'আবেদন জমা দিন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

