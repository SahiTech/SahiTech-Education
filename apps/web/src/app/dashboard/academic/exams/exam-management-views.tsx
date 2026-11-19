'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { createExam, submitStudentMark, publishExamResults } from '@/app/actions/exams';
import { Plus, Award, CheckCircle2, AlertCircle, X, Check, Send } from 'lucide-react';

interface ExamManagementProps {
  students: Array<{ id: string; full_name_bn: string; full_name_en?: string | null; admission_no: string }>;
  subjects: Array<{ id: string; name_bn: string; name_en?: string | null; name_ar?: string | null; code: string; total_marks?: number }>;
  exams: Array<any>;
  canManageCurriculum: boolean;
  canInputMarks: boolean;
}

export function ExamManagementViews({ students, subjects, exams, canManageCurriculum, canInputMarks }: ExamManagementProps) {
  const { t, locale, direction } = useI18n();
  const termOptions: Array<[string, string]> = locale === 'en'
    ? [['chala_1', 'Chala 1 (Term 1)'], ['chala_2', 'Chala 2 (Term 2)'], ['chala_3', 'Chala 3 (Annual)'], ['annual', 'Annual Examination'], ['semester_1', 'Semester 1'], ['semester_2', 'Semester 2']]
    : locale === 'ar'
      ? [['chala_1', 'المرحلة الأولى'], ['chala_2', 'المرحلة الثانية'], ['chala_3', 'المرحلة الثالثة'], ['annual', 'الامتحان السنوي'], ['semester_1', 'الفصل الأول'], ['semester_2', 'الفصل الثاني']]
      : [['chala_1', '১ম ছালা (১ম সাময়িক)'], ['chala_2', '২য় ছালা (২য় সাময়িক)'], ['chala_3', '৩য় ছালা (বার্ষিক)'], ['annual', 'বার্ষিক পরীক্ষা'], ['semester_1', 'সেমিস্টার ১'], ['semester_2', 'সেমিস্টার ২']];
  const subjectName = (subject: ExamManagementProps['subjects'][number]) =>
    locale === 'ar' ? subject.name_ar || subject.name_en || subject.name_bn :
    locale === 'en' ? subject.name_en || subject.name_bn : subject.name_bn;
  const studentName = (student: ExamManagementProps['students'][number]) =>
    locale === 'en' ? student.full_name_en || student.full_name_bn : student.full_name_bn;
  const dharjaLabels: Record<string, string> = {
    mumtaz: t.academic.dharjaMumtaz,
    jayyid_jiddan: t.academic.dharjaJayyidJiddan,
    jayyid: t.academic.dharjaJayyid,
    maqbool: t.academic.dharjaMaqbool,
    rasib: t.academic.dharjaRasib,
  };
  const dharjaName = (value?: string) => dharjaLabels[value || ''] || value || '';
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
      setStatusMessage({ type: 'success', text: t.common.success });
      setShowCreateModal(false);
      setNameBn('');
      setNameEn('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || t.common.error });
    }
  };

  const handlePublish = async (examId: string) => {
    if (!confirm(locale === 'en' ? 'Publish these examination results?' : locale === 'ar' ? 'هل تريد نشر نتائج هذا الامتحان؟' : 'আপনি কি পরীক্ষার ফলাফল প্রকাশ করতে চান?')) return;
    setLoading(true);
    const res = await publishExamResults(examId);
    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: t.common.success });
    } else {
      setStatusMessage({ type: 'error', text: res.error || t.common.error });
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
      setCalculatedGrade(`${dharjaName(res.dharja)} · GPA: ${res.gpa}`);
      setStatusMessage({ type: 'success', text: t.common.success });
    } else {
      setStatusMessage({ type: 'error', text: res.error || t.common.error });
    }
  };

  return (
    <div className="space-y-4" dir={direction}>
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

      {canManageCurriculum && <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
        >
          <Plus className="h-4 w-4" />
          {t.academic.newExam}
        </button>
      </div>}

      {/* Create Exam Modal */}
      {canManageCurriculum && showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">{t.academic.newExam}</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.academic.examName} (বাংলা) *</label>
                <input
                  type="text"
                  required
                  placeholder={locale === 'en' ? 'e.g. Annual Examination' : locale === 'ar' ? 'مثال: الامتحان السنوي' : 'যেমন: বার্ষিক পরীক্ষা'}
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.academic.examName} (English)</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Examination 2026"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.academic.termCode}</label>
                  <select
                    value={termCode}
                    onChange={(e) => setTermCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    {termOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.academic.startDate} *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.academic.endDate} *</label>
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
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {loading ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marks Entry Modal */}
      {canInputMarks && showMarksModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.academic.enterMarks}</h3>
                <span className="text-xs text-emerald-700 font-medium">{selectedExam.name_bn}</span>
              </div>
              <button onClick={() => setShowMarksModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMark} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.common.name} *</label>
                <select
                  required
                  value={markStudentId}
                  onChange={(e) => setMarkStudentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">{t.common.select}</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {studentName(st)} ({st.admission_no})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.academic.canonicalKitabs} *</label>
                <select
                  required
                  value={markSubjectId}
                  onChange={(e) => { setMarkSubjectId(e.target.value); const subject = subjects.find((item) => item.id === e.target.value); setMarkTotal(String(subject?.total_marks || 100)); }}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">{t.common.select}</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {subjectName(sub)} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.academic.obtainedMarks} *</label>
                  <input
                    type="number"
                    min="0"
                    max={Number(markTotal) || 100}
                    required
                    disabled={isAbsent}
                    value={markObtained}
                    onChange={(e) => setMarkObtained(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.academic.totalMarks}</label>
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
                  {t.academic.absent}
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
                  {t.common.close}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {loading ? t.common.loading : t.common.save}
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
            {t.academic.examsTitle}
          </h2>
          <span className="text-xs text-slate-500 font-mono">{t.common.total}: {exams.length}</span>
        </div>

        {exams.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {locale === 'en' ? 'No examinations have been created.' : locale === 'ar' ? 'لم يتم إنشاء أي امتحان بعد.' : 'এখনো কোনো পরীক্ষা তৈরি করা হয়নি।'}
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
                        {t.academic.published}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                        {t.academic.draft}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                    <span>{t.academic.termCode}: <span className="font-mono font-bold text-slate-700 uppercase">{exam.term_code}</span></span>
                    <span>{t.academic.startDate}: {exam.start_date} · {t.academic.endDate}: {exam.end_date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canInputMarks && <button
                    onClick={() => {
                      setSelectedExam(exam);
                      setShowMarksModal(true);
                      setCalculatedGrade(null);
                    }}
                    className="rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    {t.academic.enterMarks}
                  </button>}

                  {canManageCurriculum && !exam.is_published && (
                    <button
                      onClick={() => handlePublish(exam.id)}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
                    >
                      {t.academic.publishResults}
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

