'use client';

import React, { useState } from 'react';
import { createExam, submitStudentMark, publishExamResults } from '@/app/actions/exams';
import { Plus, Award, CheckCircle2, AlertCircle, X, Check, Send } from 'lucide-react';

interface ExamManagementProps {
  students: Array<{ id: string; full_name_bn: string; admission_no: string }>;
  subjects: Array<{ id: string; name_bn: string; code: string }>;
  exams: Array<any>;
}

export function ExamManagementViews({ students, subjects, exams }: ExamManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for creating exam
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [termCode, setTermCode] = useState('chala_1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form states for marks entry
  const [markStudentId, setMarkStudentId] = useState('');
  const [markSubjectId, setMarkSubjectId] = useState('');
  const [markObtained, setMarkObtained] = useState('85');
  const [markTotal, setMarkTotal] = useState('100');
  const [isAbsent, setIsAbsent] = useState(false);
  const [calculatedGrade, setCalculatedGrade] = useState<string | null>(null);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const res = await createExam({
      nameBn,
      nameEn,
      termCode,
      startDate,
      endDate,
    });

    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'পরীক্ষা সফলভাবে তৈরি হয়েছে!' });
      setShowCreateModal(false);
      setNameBn('');
      setNameEn('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'পরীক্ষা তৈরিতে ব্যর্থতা।' });
    }
  };

  const handlePublish = async (examId: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই পরীক্ষার ফলাফল প্রকাশ করতে চান?')) return;
    setLoading(true);
    const res = await publishExamResults(examId);
    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'পরীক্ষার ফলাফল সফলভাবে প্রকাশিত হয়েছে।' });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'প্রকাশনা ব্যর্থ।' });
    }
  };

  const handleSubmitMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    setLoading(true);
    setStatusMessage(null);

    const res = await submitStudentMark({
      examId: selectedExam.id,
      studentId: markStudentId,
      subjectId: markSubjectId,
      marksObtained: Number(markObtained),
      totalMarks: Number(markTotal),
      isAbsent,
    });

    setLoading(false);
    if (res.success) {
      setCalculatedGrade(`দরজা: ${res.dharja?.toUpperCase()} | জিপিএ: ${res.gpa}`);
      setStatusMessage({ type: 'success', text: `নম্বর সংরক্ষিত! অর্জিত মর্যাদা: ${res.dharja}` });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'নম্বর এন্ট্রি ব্যর্থ।' });
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
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
        >
          <Plus className="h-4 w-4" />
          নতুন পরীক্ষা সূচি তৈরি
        </button>
      </div>

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">নতুন পরীক্ষা সূচি তৈরি</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">পরীক্ষার নাম (বাংলায়) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ১ম সাময়িক পরীক্ষা / ১ম ছালা ইমতিহান ১৪৪৬ হি."
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">পরীক্ষার নাম (ইংরেজিতে)</label>
                <input
                  type="text"
                  placeholder="e.g. 1st Term Examination 2026"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">টার্ম বা পর্যায়</label>
                  <select
                    value={termCode}
                    onChange={(e) => setTermCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="chala_1">১ম ছালা (১ম সাময়িক)</option>
                    <option value="chala_2">২য় ছালা (২য় সাময়িক)</option>
                    <option value="chala_3">৩য় ছালা (বার্ষিক)</option>
                    <option value="annual">বার্ষিক পরীক্ষা</option>
                    <option value="semester_1">সেমিস্টার ১</option>
                    <option value="semester_2">সেমিস্টার ২</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">সমাপ্তির তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marks Entry Modal */}
      {showMarksModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">নম্বর এন্ট্রি ও ফলাফল গণনা</h3>
                <span className="text-xs text-emerald-700 font-medium">{selectedExam.name_bn}</span>
              </div>
              <button onClick={() => setShowMarksModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMark} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">শিক্ষার্থী নির্বাচন *</label>
                <select
                  required
                  value={markStudentId}
                  onChange={(e) => setMarkStudentId(e.target.value)}
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
                <label className="font-bold text-slate-700 block mb-1">বিষয় বা কিতাব নির্বাচন *</label>
                <select
                  required
                  value={markSubjectId}
                  onChange={(e) => setMarkSubjectId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">-- বিষয় / কিতাব বেছে নিন --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name_bn} (কোড: {sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">প্রাপ্ত নম্বর *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    disabled={isAbsent}
                    value={markObtained}
                    onChange={(e) => setMarkObtained(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">পূর্ণমান</label>
                  <input
                    type="number"
                    disabled
                    value={markTotal}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-mono text-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="absent"
                  checked={isAbsent}
                  onChange={(e) => setIsAbsent(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="absent" className="font-bold text-slate-700">
                  পরীক্ষায় অনুপস্থিত (Absent)
                </label>
              </div>

              {calculatedGrade && (
                <div className="rounded-lg bg-emerald-50 p-2.5 text-center font-bold text-emerald-900 border border-emerald-200 text-xs">
                  {calculatedGrade}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMarksModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'নম্বর সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exams List Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-700" />
            নির্ধারিত ইমতিহান ও পরীক্ষা সূচিসমূহ
          </h2>
          <span className="text-xs text-slate-500 font-mono">মোট: {exams.length}টি পরীক্ষা</span>
        </div>

        {exams.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            এখনো কোনো পরীক্ষা তৈরি করা হয়নি। নতুন পরীক্ষা সূচি তৈরি করুন।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {exams.map((exam) => (
              <div key={exam.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{exam.name_bn}</span>
                    {exam.is_published ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        ফলাফল প্রকাশিত
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                        খসড়া / চলমান
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                    <span>টার্ম: <span className="font-mono font-bold text-slate-700 uppercase">{exam.term_code}</span></span>
                    <span>সময়সীমা: {exam.start_date} হতে {exam.end_date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedExam(exam);
                      setShowMarksModal(true);
                      setCalculatedGrade(null);
                    }}
                    className="rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    নম্বর এন্ট্রি
                  </button>

                  {!exam.is_published && (
                    <button
                      onClick={() => handlePublish(exam.id)}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
                    >
                      ফল প্রকাশ করুন
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

