'use client';

import React, { useState } from 'react';
import { submitLillahEvaluation } from '@/app/actions/lillah';
import { Plus, HeartHandshake, X, Loader2 } from 'lucide-react';

interface LillahModalProps {
  students: any[];
}

export function LillahEvaluationModal({ students }: LillahModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [familyIncome, setFamilyIncome] = useState(8000);
  const [siblings, setSiblings] = useState(3);
  const [isOrphan, setIsOrphan] = useState(false);
  const [fatherOccupation, setFatherOccupation] = useState('কৃষক / দিনমজুর');
  const [recommender, setRecommender] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const res = await submitLillahEvaluation({
      studentId,
      familyMonthlyIncome: Number(familyIncome),
      numberOfSiblings: Number(siblings),
      isOrphan,
      fatherOccupation,
      localRecommenderName: recommender,
      notes,
    });

    setIsPending(false);
    if (res.success) {
      alert('লিল্লাহ মূল্যায়ন সফলভাবে সম্পন্ন ও তালিকাভুক্ত হয়েছে!');
      setIsOpen(false);
    } else {
      setError(res.error || 'মূল্যায়ন সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={students.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-purple-800 disabled:opacity-50 transition"
      >
        <Plus className="h-4 w-4" />
        + নতুন লিল্লাহ মূল্যায়ন
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-purple-700" />
            শরীয়াহ লিল্লাহ বোর্ডিং মূল্যায়ন ফরম
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">শিক্ষার্থী নির্বাচন করুন *</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.full_name_bn} ({st.admission_no})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOrphan}
                onChange={(e) => setIsOrphan(e.target.checked)}
                className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="font-bold text-slate-800">শিক্ষার্থী এতিম (পিতা মৃত)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">পারিবারিক মাসিক আয় (টাকা) *</label>
              <input
                type="number"
                required
                value={familyIncome}
                onChange={(e) => setFamilyIncome(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ভাইবোনের সংখ্যা</label>
              <input
                type="number"
                value={siblings}
                onChange={(e) => setSiblings(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">পিতার পেশা / পারিবারিক অবস্থা</label>
            <input
              type="text"
              value={fatherOccupation}
              onChange={(e) => setFatherOccupation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">স্থানীয় সুপারিশকারী (মুহতামিম/ইমাম)</label>
            <input
              type="text"
              value={recommender}
              onChange={(e) => setRecommender(e.target.value)}
              placeholder="স্থানীয় আলেমের নাম ও ফোন"
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">তদন্তকারীর বিশেষ মন্তব্য</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যাকাত গ্রহণের উপযুক্ততা ও আর্থিক অসচ্ছলতা সম্পর্কিত নোট..."
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
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
              className="rounded-lg bg-purple-700 text-white px-4 py-1.5 font-bold hover:bg-purple-800 disabled:opacity-50"
            >
              {isPending ? 'যাচাই হচ্ছে...' : 'লিল্লাহ অনুমোদন নিশ্চিত করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

