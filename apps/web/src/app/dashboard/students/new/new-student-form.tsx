'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStudent } from '@/app/actions/student';
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

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
  const { t, locale, direction } = useI18n();
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
      setError(res.error || t.common.error);
    }
  };

  if (success) {
    return (
      <div className="py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
        <h3 className="text-lg font-bold text-slate-900">{t.students.successMessage}</h3>
        <p className="text-xs text-slate-500 mt-1">{t.common.loading}</p>
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
            {t.students.admissionNo} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.admissionNo}
            onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none min-h-[42px]"
            placeholder="ADM-2026-001"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.students.gender}
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
          >
            <option value="male">{t.students.male}</option>
            <option value="female">{t.students.female}</option>
          </select>
        </div>
      </div>

      {/* Row 2: Names (Bangla & English) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.students.fullNameBn} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.fullNameBn}
            onChange={(e) => setFormData({ ...formData, fullNameBn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
            placeholder={locale === 'ar' ? 'محمد عبد الله' : 'মুহাম্মদ আব্দুল্লাহ'}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.students.fullNameEn} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.fullNameEn}
            onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
            placeholder="Muhammad Abdullah"
          />
        </div>
      </div>

      {/* Row 3: Guardian Phone & Date of Birth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.students.guardianPhone} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.guardianPhone}
            onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none min-h-[42px]"
            placeholder="017xxxxxxxx"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.students.dateOfBirth}
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.students.bloodGroup}
          </label>
          <select
            value={formData.bloodGroup}
            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
          >
            <option value="">{t.students.selectBloodGroup}</option>
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
            {t.students.fatherName}
          </label>
          <input
            type="text"
            value={formData.fatherNameBn}
            onChange={(e) => setFormData({ ...formData, fatherNameBn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
            placeholder={t.students.fatherName}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.students.motherName}
          </label>
          <input
            type="text"
            value={formData.motherNameBn}
            onChange={(e) => setFormData({ ...formData, motherNameBn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
            placeholder={t.students.motherName}
          />
        </div>
      </div>

      {/* Row 5: Residential & Lillah Boarder Status */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t.students.boardingStatusTitle}
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
              {t.students.residentialCheckbox}
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
              {t.students.lillahCheckbox}
            </span>
          </label>
        </div>
      </div>

      {/* Row 6: Class / Marhala if available */}
      {classes.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.students.assignedClass}
          </label>
          <select
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === 'en' ? c.name_en || c.name_bn : c.name_bn}
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
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition min-h-[42px]"
        >
          {t.common.cancel}
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition min-h-[42px]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t.students.saving}</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>{t.students.confirmAdmissionBtn}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
