'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStudent } from '@/app/actions/student';
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ClassOption {
  id: string;
  name_bn: string;
  name_en: string;
}

interface NewStudentFormProps {
  classes: ClassOption[];
}

export function NewStudentForm({ classes }: NewStudentFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const defaultAdmissionNo = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const [formData, setFormData] = useState({
    admissionNo: defaultAdmissionNo,
    fullNameBn: '',
    fullNameEn: '',
    guardianPhone: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
    bloodGroup: '',
    fatherNameBn: '',
    fatherNameEn: '',
    motherNameBn: '',
    presentAddress: '',
    permanentAddress: '',
    isResidential: true,
    isLillahBoarder: false,
    classId: classes[0]?.id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const res = await createStudent({
      admissionNo: formData.admissionNo,
      fullNameBn: formData.fullNameBn,
      fullNameEn: formData.fullNameEn,
      guardianPhone: formData.guardianPhone,
      dateOfBirth: formData.dateOfBirth || undefined,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup || undefined,
      fatherNameBn: formData.fatherNameBn || undefined,
      fatherNameEn: formData.fatherNameEn || undefined,
      motherNameBn: formData.motherNameBn || undefined,
      presentAddress: formData.presentAddress || undefined,
      permanentAddress: formData.permanentAddress || undefined,
      isResidential: formData.isResidential,
      isLillahBoarder: formData.isLillahBoarder,
      classId: formData.classId || undefined,
    });

    setIsPending(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/students');
      }, 1500);
    } else {
      setError(res.error || 'ভর্তি প্রক্রিয়া সম্পন্ন করা যায়নি।');
    }
  };

  if (success) {
    return (
      <div className="py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
        <h3 className="text-lg font-bold text-slate-900">ভর্তি সফলভাবে সম্পন্ন হয়েছে!</h3>
        <p className="text-xs text-slate-500 mt-1">শিক্ষার্থী তালিকা লোড করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Admission No & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ভর্তি / দাখেলা নম্বর (Admission No) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.admissionNo}
            onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
            placeholder="ADM-2026-001"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            লিঙ্গ (Gender)
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          >
            <option value="male">ছাত্র (Male)</option>
            <option value="female">ছাত্রী (Female)</option>
          </select>
        </div>
      </div>

      {/* Row 2: Names (Bangla & English) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            শিক্ষার্থীর পূর্ণ নাম (বাংলায়) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.fullNameBn}
            onChange={(e) => setFormData({ ...formData, fullNameBn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            placeholder="উদা: মুহাম্মদ আব্দুল্লাহ"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name in English <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.fullNameEn}
            onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            placeholder="e.g. Muhammad Abdullah"
          />
        </div>
      </div>

      {/* Row 3: Guardian Phone & Date of Birth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            অভিভাবকের মোবাইল নম্বর <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.guardianPhone}
            onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
            placeholder="017xxxxxxxx"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            জন্ম তারিখ (Date of Birth)
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            রক্তের গ্রুপ (Blood Group)
          </label>
          <select
            value={formData.bloodGroup}
            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          >
            <option value="">নির্বাচন করুন</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>
      </div>

      {/* Row 4: Parent Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            পিতার নাম (Father&apos;s Name)
          </label>
          <input
            type="text"
            value={formData.fatherNameBn}
            onChange={(e) => setFormData({ ...formData, fatherNameBn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            placeholder="পিতার নাম"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            মাতার নাম (Mother&apos;s Name)
          </label>
          <input
            type="text"
            value={formData.motherNameBn}
            onChange={(e) => setFormData({ ...formData, motherNameBn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            placeholder="মাতার নাম"
          />
        </div>
      </div>

      {/* Row 5: Residential & Lillah Boarder Status */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          আবাসিক ও বোর্ডিং সম্পর্কিত বিবরণ (Boarding Status)
        </h4>
        <div className="flex flex-col sm:flex-row gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isResidential}
              onChange={(e) => setFormData({ ...formData, isResidential: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-medium text-slate-700">
              আবাসিক ছাত্র (Residential Boarder)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isLillahBoarder}
              onChange={(e) => setFormData({ ...formData, isLillahBoarder: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs font-medium text-slate-700">
              লিল্লাহ বোর্ডিং ও যাকাত খোরাকি সুবিধাভোগী (Shariah Lillah Boarder)
            </span>
          </label>
        </div>
      </div>

      {/* Row 6: Class / Marhala if available */}
      {classes.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ভর্তিকৃত জামাত / শ্রেণি (Assigned Class)
          </label>
          <select
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_bn} ({c.name_en})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Submit button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          বাতিল করুন
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              সংরক্ষণ করা হচ্ছে...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              শিক্ষার্থী ভর্তি নিশ্চিত করুন
            </>
          )}
        </button>
      </div>
    </form>
  );
}
