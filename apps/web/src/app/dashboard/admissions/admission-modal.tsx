'use client';

import React, { useState } from 'react';
import { updateAdmissionEvaluation, enrollApplicantToStudent } from '@/app/actions/admissions';
import { Loader2, CheckCircle, Edit3, UserCheck, X } from 'lucide-react';

interface AdmissionModalProps {
  application: any;
  classes: any[];
}

export function AdmissionEvaluationModal({ application, classes }: AdmissionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [writtenMarks, setWrittenMarks] = useState(application.written_exam_marks || '');
  const [oralMarks, setOralMarks] = useState(application.oral_exam_marks || '');
  const [remarks, setRemarks] = useState(application.interview_remarks || '');
  const [status, setStatus] = useState(application.status || 'applied');
  const [rollNo, setRollNo] = useState(1);

  const handleUpdateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const res = await updateAdmissionEvaluation({
      applicationId: application.id,
      writtenExamMarks: writtenMarks !== '' ? Number(writtenMarks) : undefined,
      oralExamMarks: oralMarks !== '' ? Number(oralMarks) : undefined,
      interviewRemarks: remarks,
      newStatus: status as any,
    });

    setIsPending(false);
    if (res.success) {
      setIsOpen(false);
    } else {
      setError(res.error || 'মূল্যায়ন সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleEnrollNow = async () => {
    if (!confirm(`আপনি কি নিশ্চিত যে ${application.full_name_bn}-কে সরাসরি ভর্তি তালিকায় অন্তর্ভুক্ত করতে চান?`)) {
      return;
    }
    setIsPending(true);
    setError(null);

    const res = await enrollApplicantToStudent({
      applicationId: application.id,
      rollNo: Number(rollNo) || 1,
    });

    setIsPending(false);
    if (res.success) {
      alert(`ভর্তি সফল! দাখেলা নং: ${res.admissionNo}`);
      setIsOpen(false);
    } else {
      setError(res.error || 'ভর্তি প্রক্রিয়া ব্যর্থ হয়েছে।');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-200 bg-emerald-50/60 px-2.5 py-1 rounded-md"
      >
        <Edit3 className="h-3 w-3" />
        মূল্যায়ন / ভর্তি
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              ভর্তি মূল্যায়ন: {application.full_name_bn}
            </h3>
            <span className="font-mono text-xs text-slate-400">{application.application_no}</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdateEvaluation} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">লিখিত পরীক্ষা নম্বর</label>
              <input
                type="number"
                value={writtenMarks}
                onChange={(e) => setWrittenMarks(e.target.value)}
                placeholder="যেমন: ৮০"
                className="w-full rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">মৌখিক / কুরআন সবক</label>
              <input
                type="number"
                value={oralMarks}
                onChange={(e) => setOralMarks(e.target.value)}
                placeholder="যেমন: ৯০"
                className="w-full rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">আবেদন অবস্থা (Status)</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2"
            >
              <option value="applied">আবেদন জমা (Applied)</option>
              <option value="exam_scheduled">পরীক্ষা নির্ধারিত (Exam Scheduled)</option>
              <option value="passed">উত্তীর্ণ (Passed / Eligible)</option>
              <option value="rejected">অননুমোদিত (Rejected)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">সাক্ষাৎকার মন্তব্য</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="আচরণের মূল্যায়ন ও বিশেষ সুপারিশ..."
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            {status === 'passed' && (
              <button
                type="button"
                onClick={handleEnrollNow}
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-purple-700 text-white px-3 py-1.5 font-bold hover:bg-purple-800 transition"
              >
                <UserCheck className="h-3.5 w-3.5" />
                সরাসরি ভর্তি করুন
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-emerald-700 text-white px-4 py-1.5 font-bold hover:bg-emerald-800 disabled:opacity-50"
              >
                {isPending ? 'সংরক্ষণ...' : 'আপডেট করুন'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

