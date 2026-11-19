'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { updateAdmissionEvaluation, enrollApplicantToStudent } from '@/app/actions/admissions';
import { Loader2, Edit3, UserCheck, X } from 'lucide-react';

interface AdmissionModalProps {
  application: any;
  classes: Array<{ id: string; name_bn: string; name_en?: string | null; name_ar?: string | null }>;
  sections: Array<{ id: string; class_id: string; name: string }>;
}

export function AdmissionEvaluationModal({ application, classes, sections }: AdmissionModalProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writtenMarks, setWrittenMarks] = useState(application.written_exam_marks ?? '');
  const [oralMarks, setOralMarks] = useState(application.oral_exam_marks ?? '');
  const [remarks, setRemarks] = useState(application.interview_remarks || '');
  const [status, setStatus] = useState(application.status || 'applied');

  const initialClassId = application.target_class_id ||
    classes.find((item) => sections.some((section) => section.class_id === item.id))?.id ||
    classes[0]?.id || '';
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const initialSectionId = sections.find((section) => section.class_id === initialClassId)?.id || '';
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId);
  const [rollNo, setRollNo] = useState('1');

  const availableSections = sections.filter((section) => section.class_id === selectedClassId);
  const className = (item: AdmissionModalProps['classes'][number]) =>
    locale === 'ar' ? item.name_ar || item.name_en || item.name_bn :
    locale === 'en' ? item.name_en || item.name_bn : item.name_bn;

  const updateEvaluation = async (newStatus = status) => {
    return updateAdmissionEvaluation({
      applicationId: application.id,
      writtenExamMarks: writtenMarks !== '' ? Number(writtenMarks) : undefined,
      oralExamMarks: oralMarks !== '' ? Number(oralMarks) : undefined,
      interviewRemarks: remarks,
      newStatus: newStatus as any,
    });
  };

  const handleUpdateEvaluation = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    const result = await updateEvaluation();
    setIsPending(false);
    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setError(result.error || t.common.error);
    }
  };

  const handleEnrollNow = async () => {
    if (!selectedClassId || !selectedSectionId || !Number.isSafeInteger(Number(rollNo)) || Number(rollNo) < 1) {
      setError(t.students.assignedClass + ' / ' + t.students.assignedSection + ' / ' + t.students.rollNo);
      return;
    }
    if (status !== 'passed') {
      setError(t.admissions.statusPassed);
      return;
    }

    setIsPending(true);
    setError(null);

    // Persist the evaluation first so the server can verify the passed state.
    if (application.status !== 'passed') {
      const evaluation = await updateEvaluation('passed');
      if (!evaluation.success) {
        setIsPending(false);
        setError(evaluation.error || t.common.error);
        return;
      }
    }

    const result = await enrollApplicantToStudent({
      applicationId: application.id,
      classId: selectedClassId,
      sectionId: selectedSectionId,
      rollNo: Number(rollNo),
    });

    setIsPending(false);
    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setError(result.error || t.common.error);
    }
  };

  if (application.status === 'enrolled') {
    return (
      <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-800">
        {t.admissions.statusEnrolled}
      </span>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
      >
        <Edit3 className="h-3.5 w-3.5" />
        {t.admissions.title}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">{t.admissions.title}: {application.full_name_bn}</h3>
            <span className="font-mono text-xs text-slate-400">{application.application_no}</span>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} aria-label={t.common.close} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

        <form onSubmit={handleUpdateEvaluation} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-slate-700">{t.admissions.writtenScore}</label>
              <input type="number" min="0" value={writtenMarks} onChange={(event) => setWrittenMarks(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">{t.admissions.oralScore}</label>
              <input type="number" min="0" value={oralMarks} onChange={(event) => setOralMarks(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">{t.common.status}</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
              <option value="applied">{t.admissions.statusApplied}</option>
              <option value="exam_scheduled">{t.admissions.statusExamScheduled}</option>
              <option value="passed">{t.admissions.statusPassed}</option>
              <option value="rejected">{t.admissions.statusRejected}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">{t.admissions.interviewNotes}</label>
            <textarea rows={2} value={remarks} onChange={(event) => setRemarks(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>

          {status === 'passed' && (
            <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">{t.students.assignedClass}</label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(event) => {
                      const nextClassId = event.target.value;
                      setSelectedClassId(nextClassId);
                      setSelectedSectionId(sections.find((section) => section.class_id === nextClassId)?.id || '');
                    }}
                    className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="">{t.common.select}</option>
                    {classes.map((item) => <option key={item.id} value={item.id}>{className(item)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">{t.students.assignedSection}</label>
                  <select required value={selectedSectionId} onChange={(event) => setSelectedSectionId(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                    <option value="">{t.students.selectSection}</option>
                    {availableSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="max-w-[12rem]">
                <label className="mb-1 block font-semibold text-slate-700">{t.students.rollNo}</label>
                <input type="number" min="1" step="1" required value={rollNo} onChange={(event) => setRollNo(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            {status === 'passed' ? (
              <button type="button" onClick={handleEnrollNow} disabled={isPending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-2 font-bold text-white transition hover:bg-purple-800 disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                {t.admissions.enrollStudent}
              </button>
            ) : <span />}
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setIsOpen(false)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
              <button type="submit" disabled={isPending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.common.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
