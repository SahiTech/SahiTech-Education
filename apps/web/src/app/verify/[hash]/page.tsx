import React from 'react';
import Link from 'next/link';
import { verifySanadPublic } from '@/app/actions/sanad';
import { ShieldCheck, AlertCircle, Award, CheckCircle2, Search, Building2, Calendar, Printer } from 'lucide-react';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

interface VerifySanadProps {
  params: Promise<{
    hash: string;
  }>;
}

export default async function PublicSanadVerificationPage({ params }: VerifySanadProps) {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();

  const { hash } = await params;
  const decodedHash = decodeURIComponent(hash || '').trim();

  const result = await verifySanadPublic(decodedHash);
  const sanad = result.verified ? (result.sanad as any) : null;
  const tenantData = sanad?.tenants ? (Array.isArray(sanad.tenants) ? sanad.tenants[0] : sanad.tenants) : null;
  const studentData = sanad?.students ? (Array.isArray(sanad.students) ? sanad.students[0] : sanad.students) : null;

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Brand */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-lg text-emerald-800">SahiTech Education</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
              MDI Sanad Verification
            </span>
          </Link>

          <Link
            href="/verify"
            className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 min-h-[36px]"
          >
            <Search className="h-3.5 w-3.5" />
            <span>{dict.verify.searchAgain}</span>
          </Link>
        </div>

        {/* Verification Result */}
        {!sanad ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{dict.verify.invalidSanad}</h1>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              {result.error || dict.verify.invalidMessage}
            </p>
            <div className="mt-6">
              <Link
                href="/verify"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition min-h-[40px]"
              >
                {dict.verify.searchAgain}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Header */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-950 text-base">{dict.verify.validSanad}</span>
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      {dict.verify.disclaimer}
                    </p>
                  </div>
                </div>

                  <div className="text-right rtl:text-left">
                    <span className="text-[11px] font-mono text-slate-500 block">{dict.verify.serialNo}</span>
                    <span className="font-mono text-sm font-bold text-slate-900">{sanad.sanad_serial_no}</span>
                  </div>
                </div>

                {/* Certificate Display Sheet */}
                <div className="rounded-2xl border-4 border-amber-600/30 bg-white p-8 sm:p-12 shadow-md relative overflow-hidden print:p-0 print:border-none">
                  {/* Islamic Decorative Header */}
                  <div className="text-center space-y-2 mb-8">
                    <div className="text-xl font-serif text-emerald-900" dir="rtl">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </div>
                    <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                      SahiTech Education · Madrasa Digitalization Initiative
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {tenantData?.name || 'মাদরাসা'}
                    </h2>
                    <div className="text-xs text-slate-500 font-mono">
                      {dict.common.code}: {tenantData?.code || 'N/A'}
                    </div>
                  </div>

                  <div className="border-t-2 border-b-2 border-amber-100 py-6 my-6 text-center space-y-4">
                    <div className="inline-block rounded-full bg-amber-50 px-4 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                      {sanad.title_bn}
                    </div>
                    {sanad.title_ar && (
                      <div className="text-lg font-serif text-slate-800" dir="rtl">
                        {sanad.title_ar}
                      </div>
                    )}
                    {sanad.title_en && (
                      <div className="text-xs text-slate-500 font-medium">
                        {sanad.title_en}
                      </div>
                    )}

                    <div className="py-2">
                      <span className="text-xs text-slate-400 block mb-1">{dict.verify.recipientStudent}</span>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900">
                        {studentData?.full_name_bn}
                      </div>
                      {studentData?.full_name_en && (
                        <div className="text-xs text-slate-500 font-medium">
                          {studentData?.full_name_en} · {dict.verify.admissionNo}: {studentData?.admission_no}
                        </div>
                      )}
                    </div>

                    {sanad.marhala_name_ar && (
                      <div className="text-base font-serif text-emerald-800 font-semibold" dir="rtl">
                        المرحلة: {sanad.marhala_name_ar}
                      </div>
                    )}

                      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
                        {sanad.result_dharja && (
                          <div className="rounded-lg bg-emerald-50 px-3 py-1.5 border border-emerald-200 text-center">
                            <span className="text-[10px] text-emerald-700 block uppercase font-bold">{dict.verify.obtainedGrade}</span>
                            <span className="text-sm font-bold text-emerald-900 capitalize">
                              {sanad.result_dharja === 'mumtaz' ? 'مُمْتَاز (Mumtaz)' :
                                sanad.result_dharja === 'jayyid_jiddan' ? 'جَيِّد جِدًّا (Jayyid Jiddan)' :
                                  sanad.result_dharja === 'jayyid' ? 'جَيِّد (Jayyid)' : 'مَقْبُول (Maqbool)'}
                            </span>
                          </div>
                        )}

                        {sanad.gpa && (
                          <div className="rounded-lg bg-blue-50 px-3 py-1.5 border border-blue-200 text-center">
                            <span className="text-[10px] text-blue-700 block uppercase font-bold">GPA</span>
                            <span className="text-sm font-bold text-blue-900 font-mono">
                              {Number(sanad.gpa).toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">{dict.verify.issueDate}</span>
                          <span className="text-sm font-mono text-slate-800">
                            {new Date(sanad.issue_date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'bn-BD')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-6 text-center text-xs text-slate-600">
                        <div className="space-y-1">
                          <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center font-serif text-slate-700">
                            {sanad.signatory_dean || dict.verify.signatoryDean}
                          </div>
                          <div className="font-bold text-slate-800">{dict.verify.signatoryDean}</div>
                          <div className="text-[10px] text-slate-400">স্বাক্ষর ও মোহর</div>
                        </div>

                        <div className="space-y-1">
                          <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center font-serif text-slate-700">
                            {sanad.signatory_muhtamim || dict.verify.signatoryMuhtamim}
                          </div>
                          <div className="font-bold text-slate-800">{dict.verify.signatoryMuhtamim}</div>
                          <div className="text-[10px] text-slate-400">স্বাক্ষর ও প্রাতিষ্ঠানিক সীল</div>
                        </div>
                      </div>

                      {/* Verification Footer & QR Token */}
                      <div className="mt-10 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
                        <div>
                          <span className="text-slate-500 font-bold block">Verification Hash Token:</span>
                          <span className="select-all text-slate-700 text-xs break-all">{sanad.verification_hash}</span>
                        </div>
                          <div className="sm:text-right">
                            <span>MDI Immutable Sanad Registry</span>
                          </div>
                        </div>
                      </div>
                    </div>
        )}
                  </div>
                </div>
                );
}
