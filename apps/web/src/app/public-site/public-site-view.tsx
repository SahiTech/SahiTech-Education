'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { submitPublicAdmissionApplication } from '@/app/actions/admissions';
import { useI18n } from '@/lib/i18n';
import {
  Building2, Bell, Send, CheckCircle2, AlertCircle, X,
  Phone, MapPin, ShieldCheck,
} from 'lucide-react';

interface PublicSiteViewProps {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    curriculum_type: string;
    motto_bn?: string | null;
    motto_en?: string | null;
    established_year?: number | null;
    district?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    address?: string | null;
    logo_url?: string | null;
  };
  notices: Array<{
    id: string;
    title_bn: string;
    title_en?: string | null;
    content_bn: string;
    content_en?: string | null;
    published_at?: string | null;
    created_at: string;
  }>;
}

export function PublicSiteView({ tenant, notices }: PublicSiteViewProps) {
  const { t, locale } = useI18n();
  const copy = t.publicSite;
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; appNo?: string } | null>(null);

  const [fullNameBn, setFullNameBn] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [fatherNameBn, setFatherNameBn] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [isResidential, setIsResidential] = useState(true);
  const [isLillah, setIsLillah] = useState(false);
  const dateLocale = locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-GB' : 'bn-BD';
  const localized = (bn?: string | null, en?: string | null) =>
    locale === 'bn' ? bn || en || '' : en || bn || '';

  const handleApply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenant?.id || !tenant.subdomain) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const result = await submitPublicAdmissionApplication({
        tenantId: tenant.id,
        tenantSubdomain: tenant.subdomain,
        fullNameBn,
        fullNameEn,
        fatherNameBn,
        guardianPhone,
        isResidentialApplicant: isResidential,
        isLillahApplicant: isLillah,
      });

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `${copy.accepted} ${copy.trackingLabel}: ${result.applicationNo}`,
          appNo: result.applicationNo,
        });
        setShowApplyModal(false);
        setFullNameBn('');
        setFullNameEn('');
        setFatherNameBn('');
        setGuardianPhone('');
      } else {
        setStatusMessage({ type: 'error', text: result.error || copy.applicationFailed });
      }
    } catch {
      setStatusMessage({ type: 'error', text: copy.applicationFailed });
    } finally {
      setLoading(false);
    }
  };

  const curriculumLabel = tenant.curriculum_type === 'qawmi' ? copy.qawmi : copy.alia;

  return (
    <div className="space-y-10">
      {statusMessage && (
        <div role={statusMessage.type === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 rounded-2xl p-5 text-sm font-medium shadow-sm ${statusMessage.type === 'success' ? 'border border-emerald-300 bg-emerald-50 text-emerald-900' : 'border border-red-300 bg-red-50 text-red-900'}`}>
          <div className="flex items-start gap-3">
            {statusMessage.type === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
            <div>
              <p className="font-bold">{statusMessage.text}</p>
              {statusMessage.appNo && <p className="mt-1 text-xs text-emerald-800">{copy.trackingInstruction}</p>}
            </div>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} aria-label={copy.cancel} className="shrink-0 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-emerald-800/20 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-7 text-white shadow-xl sm:p-12">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-800/80 px-3.5 py-1 text-xs font-semibold text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {curriculumLabel}
          </div>
          <div className="flex items-center gap-3">
            {tenant.logo_url && <img src={tenant.logo_url} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-1" />}
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{tenant.name}</h1>
          </div>
          {(locale === 'en' ? tenant.motto_en || tenant.motto_bn : tenant.motto_bn || tenant.motto_en) && (
            <p className="font-serif text-base italic text-emerald-100 sm:text-lg">“{locale === 'en' ? tenant.motto_en || tenant.motto_bn : tenant.motto_bn || tenant.motto_en}”</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 font-mono text-xs text-emerald-100">
            {tenant.established_year && <span>{copy.establishedYear}: {tenant.established_year}</span>}
            {tenant.district && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tenant.district}</span>}
            {tenant.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{tenant.contact_phone}</span>}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={() => setShowApplyModal(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-300">
              <Send className="h-4 w-4" />{copy.applyOnline}
            </button>
            <Link href="/verify" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />{copy.verifySanad}
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><Bell className="h-4 w-4" /></span>
            <div><h2 className="text-xl font-bold text-slate-900">{copy.noticeBoard}</h2><span className="text-xs text-slate-400">{copy.officialAnnouncements}</span></div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">{notices.length} {copy.noticeCountSuffix}</span>
        </div>
        {notices.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">{copy.noNotices}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {notices.map((notice) => (
              <article key={notice.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900">{localized(notice.title_bn, notice.title_en)}</h3>
                  <time className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-600">{new Date(notice.published_at || notice.created_at).toLocaleDateString(dateLocale)}</time>
                </div>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600">{localized(notice.content_bn, notice.content_en)}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="public-admission-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div><h3 id="public-admission-title" className="text-lg font-bold text-slate-900">{copy.applyFormTitle}</h3><p className="mt-0.5 text-xs text-slate-500">{tenant.name}</p></div>
              <button type="button" onClick={() => setShowApplyModal(false)} aria-label={copy.cancel} className="text-slate-400 hover:text-slate-700"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div><label htmlFor="public-student-name-bn" className="mb-1 block font-bold text-slate-700">{copy.studentNameBn} *</label><input id="public-student-name-bn" type="text" required value={fullNameBn} onChange={(event) => setFullNameBn(event.target.value)} className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none" /></div>
              <div><label htmlFor="public-student-name-en" className="mb-1 block font-bold text-slate-700">{copy.studentNameEn} *</label><input id="public-student-name-en" type="text" required value={fullNameEn} onChange={(event) => setFullNameEn(event.target.value)} className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none" /></div>
              <div><label htmlFor="public-father-name" className="mb-1 block font-bold text-slate-700">{copy.fatherNameBn}</label><input id="public-father-name" type="text" value={fatherNameBn} onChange={(event) => setFatherNameBn(event.target.value)} className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none" /></div>
              <div><label htmlFor="public-guardian-phone" className="mb-1 block font-bold text-slate-700">{copy.guardianPhone} *</label><input id="public-guardian-phone" type="tel" required inputMode="tel" value={guardianPhone} onChange={(event) => setGuardianPhone(event.target.value)} placeholder="01XXXXXXXXX" className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-xs focus:border-emerald-600 focus:outline-none" /></div>
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 font-bold text-slate-700"><input type="checkbox" checked={isResidential} onChange={(event) => setIsResidential(event.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />{copy.residentialSeat}</label>
                <label className="flex items-center gap-2 font-bold text-slate-700"><input type="checkbox" checked={isLillah} onChange={(event) => setIsLillah(event.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />{copy.lillahSupport}</label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowApplyModal(false)} className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">{copy.cancel}</button>
                <button type="submit" disabled={loading} className="rounded-xl bg-emerald-700 px-6 py-2.5 font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-50">{loading ? copy.submitting : copy.submit}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
