'use client';

import React, { useState } from 'react';
import { issueDigitalSanad } from '@/app/actions/sanad';
import { Award, Plus, CheckCircle2, AlertCircle, X, ExternalLink, ShieldCheck, Printer } from 'lucide-react';
import Link from 'next/link';

interface SanadManagementProps {
  students: Array<{ id: string; full_name_bn: string; admission_no: string }>;
  classes: Array<{ id: string; name_bn: string }>;
  academicYears: Array<{ id: string; name_bn: string }>;
  sanads: Array<any>;
}

export function SanadManagementViews({ students, classes, academicYears, sanads }: SanadManagementProps) {
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; hash?: string } | null>(null);

  // Issue Form States
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [academicYearId, setAcademicYearId] = useState(academicYears[0]?.id || '');
  const [titleBn, setTitleBn] = useState('দাওরায়ে হাদীস (মাস্টার্স সমমান) সনদপত্র');
  const [titleEn, setTitleEn] = useState('Certificate of Dawra-e-Hadith');
  const [titleAr, setTitleAr] = useState('شهادة الفضيلة والتخرج في الحديث الشريف');
  const [marhalaNameAr, setMarhalaNameAr] = useState('مرحلة الفضيلة (دورة الحديث)');
  const [resultDharja, setResultDharja] = useState('mumtaz');
  const [gpa, setGpa] = useState('5.00');
  const [signatoryMuhtamim, setSignatoryMuhtamim] = useState('মুহতামিম ও শায়খুল হাদীস');
  const [signatoryDean, setSignatoryDean] = useState("নাজেমে তা'লীমাত");

  const handleIssueSanad = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const res = await issueDigitalSanad({
      studentId,
      classId,
      academicYearId,
      titleBn,
      titleEn,
      titleAr,
      marhalaNameAr,
      resultDharja,
      gpa: Number(gpa) || undefined,
      signatoryMuhtamim,
      signatoryDean,
    });

    setLoading(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `সনদ সফলভাবে ইস্যু হয়েছে! ক্রমিক নং: ${res.serialNo}`,
        hash: res.verificationHash,
      });
      setShowIssueModal(false);
      setStudentId('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'সনদ প্রদানে ব্যর্থতা।' });
    }
  };

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div
          className={`rounded-lg p-4 text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <div>
              <span>{statusMessage.text}</span>
              {statusMessage.hash && (
                <div className="mt-1">
                  <Link
                    href={`/verify/${statusMessage.hash}`}
                    target="_blank"
                    className="underline font-bold text-emerald-900 inline-flex items-center gap-1"
                  >
                    অনলাইন সনদ প্রিভিউ ও ভেরিফিকেশন লিংক দেখুন
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowIssueModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
        >
          <Plus className="h-4 w-4" />
          নতুন ডিজিটাল সনদ প্রদান
        </button>
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-700" />
                নতুন ডিজিটাল সনদ ইস্যু ফরম
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSanad} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সনদ প্রাপক তালিবুল ইলম *</label>
                  <select
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- তালিবুল ইলম বেছে নিন --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name_bn} (দাখেলা নং: {st.admission_no})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">শ্রেণী বা মারহালা স্তর *</label>
                  <select
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- শ্রেণী বা মারহালা --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name_bn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">সনদের শিরোনাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">عنوان الشهادة (العربية)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-serif focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Title (English)</label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">কওমি দরজা (মর্যাদা)</label>
                  <select
                    value={resultDharja}
                    onChange={(e) => setResultDharja(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="mumtaz">মুমতাজ (ممتاز - ১ম বিভাগ)</option>
                    <option value="jayyid_jiddan">জাইয়্যিদ জিদ্দান (جيد جدا - ২য় বিভাগ)</option>
                    <option value="jayyid">জাইয়্যিদ (جيد - ৩য় বিভাগ)</option>
                    <option value="maqbul">মাকবুল (مقبول - পাস)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">বোর্ড জিপিএ (GPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">শিক্ষাবর্ষ</label>
                  <select
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name_bn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মুহতামিম স্বাক্ষরকারী নাম</label>
                  <input
                    type="text"
                    value={signatoryMuhtamim}
                    onChange={(e) => setSignatoryMuhtamim(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">নাজেমে তা&apos;লীমাত স্বাক্ষরকারী</label>
                  <input
                    type="text"
                    value={signatoryDean}
                    onChange={(e) => setSignatoryDean(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {loading ? 'প্রস্তুত হচ্ছে...' : 'সনদ ইস্যু ও রেজিস্ট্রি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sanads Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            ইস্যুকৃত ডিজিটাল সনদপত্র ও অনলাইন ভেরিফিকেশন রেজিস্ট্রি
          </h2>
          <span className="text-xs text-slate-500 font-mono">মোট: {sanads.length}টি সনদ</span>
        </div>

        {sanads.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            এখনো কোনো সনদ ইস্যু করা হয়নি। উপরের বোতাম চেপে নতুন সনদ প্রদান করুন।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sanads.map((s) => (
              <div key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {s.sanad_serial_no}
                    </span>
                    <span className="font-bold text-slate-900">{s.title_bn}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      ইস্যুকৃত
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    প্রাপক: <span className="font-bold text-slate-800">{s.students?.full_name_bn}</span> (দাখেলা: {s.students?.admission_no}) · মারহালা: {s.classes?.name_bn || 'সাধারণ'}
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                    <span>দরজা: <span className="font-bold text-emerald-700 uppercase">{s.result_dharja || 'N/A'}</span></span>
                    <span>জিপিএ: {s.gpa ? Number(s.gpa).toFixed(2) : 'N/A'}</span>
                    <span>তারিখ: {new Date(s.issue_date).toLocaleDateString('bn-BD')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/verify/${s.verification_hash}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    যাচাই ও প্রিভিউ
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

