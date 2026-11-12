'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveOnboardingStep1,
  saveOnboardingStep2,
  saveOnboardingStep3,
  saveOnboardingStep4,
  saveOnboardingStep5,
  finalizeOnboarding,
} from '@/app/actions/onboarding';
import {
  Building2,
  GitBranch,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';

interface WizardProps {
  initialState: {
    context: any;
    tenant: any;
    branches: any[];
    academicYear: any;
    departments: any[];
    classes: any[];
  };
}

export function OnboardingWizard({ initialState }: WizardProps) {
  const router = useRouter();
  const tenant = initialState.tenant || {};
  const currentInitialStep = Math.min(tenant.onboarding_step || 1, 6);

  const [activeStep, setActiveStep] = useState<number>(currentInitialStep);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1 State: Profile & Identity
  const [step1Data, setStep1Data] = useState({
    name: tenant.name || '',
    code: tenant.code || '',
    subdomain: tenant.subdomain || '',
    curriculumType: (tenant.curriculum_type || 'qawmi') as 'qawmi' | 'alia' | 'hybrid',
    boardAffiliation: tenant.board_affiliation || 'বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ (বেফাক)',
    registrationNo: tenant.registration_no || '',
    establishedYear: tenant.established_year || 1995,
    contactEmail: tenant.contact_email || '',
    contactPhone: tenant.contact_phone || '',
    division: tenant.division || 'ঢাকা',
    district: tenant.district || 'ঢাকা',
    address: tenant.address || '',
    mottoBn: tenant.motto_bn || 'ইলম, আমল ও খুলুসিয়্যাত',
    mottoEn: tenant.motto_en || 'Knowledge, Practice and Sincerity',
    residentialQuota: tenant.program_policies?.residentialQuota || 500,
    lillahFundEnabled: tenant.program_policies?.lillahFundEnabled !== false,
    termSystem: tenant.program_policies?.termSystem || 'chala',
  });

  // Step 2 State: Branches
  const mainBranch = initialState.branches.find((b) => b.is_main_branch) || initialState.branches[0];
  const [step2Data, setStep2Data] = useState({
    mainBranchName: mainBranch?.name || `${step1Data.name} (মূল ক্যাম্পাস)`,
    mainBranchCode: mainBranch?.code || 'MAIN',
    mainBranchAddress: mainBranch?.address || step1Data.address,
    mainBranchPhone: mainBranch?.phone || step1Data.contactPhone,
    hasSecondaryBranch: false,
    secondaryBranchName: '',
    secondaryBranchCode: 'CAMPUS-2',
  });

  // Step 3 State: Academic Year
  const curYear = initialState.academicYear;
  const [step3Data, setStep3Data] = useState({
    nameBn: curYear?.name_bn || '১৪৪৭-১৪৪৮ হিজরি / ২০২৬-২০২৭ শিক্ষাবর্ষ',
    nameEn: curYear?.name_en || 'Academic Year 2026-2027',
    hijriYear: curYear?.hijri_year || '১৪৪৭-১৪৪৮',
    startDate: curYear?.start_date || '2026-06-01',
    endDate: curYear?.end_date || '2027-05-31',
  });

  // Step 4 State: Departments & Classes
  const [step4Data, setStep4Data] = useState({
    departments: [
      { code: 'KITAB', nameBn: 'কিতাব বিভাগ (দরসে নেজামী)', nameEn: 'Kitab Department', curriculumType: 'qawmi' as const, selected: true },
      { code: 'HIFZ', nameBn: 'হিফজুল কুরআন বিভাগ', nameEn: 'Hifzul Quran Department', curriculumType: 'qawmi' as const, selected: true },
      { code: 'NURANI', nameBn: 'নূরানী ও মক্তব বিভাগ', nameEn: 'Nurani & Maktab Department', curriculumType: 'qawmi' as const, selected: true },
      { code: 'TAJWEED', nameBn: 'তাজবীদ ও ক্বিরাআত বিভাগ', nameEn: 'Tajweed Department', curriculumType: 'qawmi' as const, selected: false },
    ],
    generateDefaultClasses: true,
  });

  // Step 5 State: Leadership
  const leadership = tenant.program_policies?.leadership || {};
  const [step5Data, setStep5Data] = useState({
    deanName: leadership.deanName || '',
    deanPhone: leadership.deanPhone || '',
    bursarName: leadership.bursarName || '',
    bursarPhone: leadership.bursarPhone || '',
  });

  const steps = [
    { num: 1, title: 'প্রতিষ্ঠান পরিচিতি', enTitle: 'Identity & Policies', icon: Building2 },
    { num: 2, title: 'শাখা ও ক্যাম্পাস', enTitle: 'Campuses', icon: GitBranch },
    { num: 3, title: 'শিক্ষাবর্ষ ও ক্যালেন্ডার', enTitle: 'Academic Year', icon: Calendar },
    { num: 4, title: 'বিভাগ ও মারহালা', enTitle: 'Departments & Marhalas', icon: Layers },
    { num: 5, title: 'দায়িত্বশীল ও প্রশাসন', enTitle: 'Leadership & Staff', icon: Users },
    { num: 6, title: 'যাচাই ও সম্পন্নকরণ', enTitle: 'Review & Launch', icon: CheckCircle2 },
  ];

  // Handlers for step submissions
  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const res = await saveOnboardingStep1({
      name: step1Data.name,
      code: step1Data.code,
      subdomain: step1Data.subdomain,
      curriculumType: step1Data.curriculumType,
      boardAffiliation: step1Data.boardAffiliation,
      registrationNo: step1Data.registrationNo,
      establishedYear: Number(step1Data.establishedYear) || undefined,
      contactEmail: step1Data.contactEmail,
      contactPhone: step1Data.contactPhone,
      division: step1Data.division,
      district: step1Data.district,
      address: step1Data.address,
      mottoBn: step1Data.mottoBn,
      mottoEn: step1Data.mottoEn,
      programPolicies: {
        residentialQuota: Number(step1Data.residentialQuota),
        lillahFundEnabled: step1Data.lillahFundEnabled,
        termSystem: step1Data.termSystem as any,
      },
    });

    setIsPending(false);
    if (res.success) {
      setSuccessMessage('প্রতিষ্ঠান পরিচিতি ও পলিসি সফলভাবে সংরক্ষিত হয়েছে।');
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveStep(2);
      }, 700);
    } else {
      setError(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleSaveStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const additional = step2Data.hasSecondaryBranch && step2Data.secondaryBranchName
      ? [{ name: step2Data.secondaryBranchName, code: step2Data.secondaryBranchCode }]
      : undefined;

    const res = await saveOnboardingStep2({
      mainBranchName: step2Data.mainBranchName,
      mainBranchCode: step2Data.mainBranchCode,
      mainBranchAddress: step2Data.mainBranchAddress,
      mainBranchPhone: step2Data.mainBranchPhone,
      additionalBranches: additional,
    });

    setIsPending(false);
    if (res.success) {
      setSuccessMessage('ক্যাম্পাস ও শাখা তথ্য সংরক্ষিত হয়েছে।');
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveStep(3);
      }, 700);
    } else {
      setError(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleSaveStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const res = await saveOnboardingStep3({
      nameBn: step3Data.nameBn,
      nameEn: step3Data.nameEn,
      hijriYear: step3Data.hijriYear,
      startDate: step3Data.startDate,
      endDate: step3Data.endDate,
    });

    setIsPending(false);
    if (res.success) {
      setSuccessMessage('শিক্ষাবর্ষ তথ্য সংরক্ষিত হয়েছে।');
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveStep(4);
      }, 700);
    } else {
      setError(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleSaveStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const selected = step4Data.departments.filter((d) => d.selected);

    const res = await saveOnboardingStep4({
      selectedDepartments: selected.map((d) => ({
        code: d.code,
        nameBn: d.nameBn,
        nameEn: d.nameEn,
        curriculumType: d.curriculumType,
      })),
      generateDefaultClasses: step4Data.generateDefaultClasses,
    });

    setIsPending(false);
    if (res.success) {
      setSuccessMessage('বিভাগ ও মারহালা সফলভাবে যুক্ত হয়েছে।');
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveStep(5);
      }, 700);
    } else {
      setError(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleSaveStep5 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const res = await saveOnboardingStep5({
      deanName: step5Data.deanName,
      deanPhone: step5Data.deanPhone,
      bursarName: step5Data.bursarName,
      bursarPhone: step5Data.bursarPhone,
    });

    setIsPending(false);
    if (res.success) {
      setSuccessMessage('দায়িত্বশীলদের তথ্য সংরক্ষিত হয়েছে।');
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveStep(6);
      }, 700);
    } else {
      setError(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleFinalize = async () => {
    setIsPending(true);
    setError(null);

    const res = await finalizeOnboarding();
    setIsPending(false);

    if (res.success) {
      setSuccessMessage('অভিনন্দন! আপনার প্রতিষ্ঠানের অনবোর্ডিং সম্পূর্ণ সফল হয়েছে।');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      setError(res.error || 'অনবোর্ডিং সমাপ্তি ব্যর্থ হয়েছে।');
    }
  };

  const progressPercent = Math.round(((activeStep - 1) / 5) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Bar & Step Indicators */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">অনবোর্ডিং অগ্রগতি: ধাপ {activeStep} / ৬</span>
          <span className="font-mono font-bold text-emerald-700">{progressPercent}% সম্পন্ন</span>
        </div>

        {/* Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progressPercent, 10)}%` }}
          />
        </div>

        {/* Step Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCompleted = st.num < activeStep;
            const isCurrent = st.num === activeStep;

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => st.num <= Math.max(tenant.onboarding_step || 1, activeStep) && setActiveStep(st.num)}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-sm ring-1 ring-emerald-600'
                    : isCompleted
                    ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
                    : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Icon className={`h-4 w-4 ${isCurrent ? 'text-emerald-700' : 'text-slate-400'}`} />
                  )}
                  <span className="text-xs font-mono font-bold">ধাপ {st.num}</span>
                </div>
                <span className="text-[11px] leading-tight line-clamp-1">{st.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Step 1: Profile & Identity */}
      {activeStep === 1 && (
        <form onSubmit={handleSaveStep1} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-700" />
              ধাপ ১: প্রতিষ্ঠান পরিচিতি, স্বীকৃতি ও পলিসি কনফিগারেশন
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              মাদরাসার অফিশিয়াল নাম, কোড, শিক্ষা বোর্ড স্বীকৃতি ও প্রাতিষ্ঠানিক নীতি নির্ধারণ করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">মাদরাসার নাম (বাংলায়) *</label>
              <input
                type="text"
                required
                value={step1Data.name}
                onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">প্রাতিষ্ঠানিক ইউনিক কোড *</label>
              <input
                type="text"
                required
                value={step1Data.code}
                onChange={(e) => setStep1Data({ ...step1Data, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">পাঠ্যক্রম কাঠামো (Curriculum Type) *</label>
              <select
                value={step1Data.curriculumType}
                onChange={(e) => setStep1Data({ ...step1Data, curriculumType: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="qawmi">কওমি দরসে নেজামী (Qawmi Engine)</option>
                <option value="alia">বাংলাদেশ মাদরাসা শিক্ষা বোর্ড (Alia Engine)</option>
                <option value="hybrid">সমন্বিত পাঠ্যক্রম (Hybrid Model)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">অনুমোদিত শিক্ষা বোর্ড / ওয়াকফ</label>
              <input
                type="text"
                value={step1Data.boardAffiliation}
                onChange={(e) => setStep1Data({ ...step1Data, boardAffiliation: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                placeholder="যেমন: বেফাকুল মাদারিস / BMEB"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বোর্ড রেজিস্ট্রেশন / ইনডেক্স নং</label>
              <input
                type="text"
                value={step1Data.registrationNo}
                onChange={(e) => setStep1Data({ ...step1Data, registrationNo: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
                placeholder="REG-10492"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">যোগাযোগ ফোন *</label>
              <input
                type="text"
                required
                value={step1Data.contactPhone}
                onChange={(e) => setStep1Data({ ...step1Data, contactPhone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">যোগাযোগ ইমেইল *</label>
              <input
                type="email"
                required
                value={step1Data.contactEmail}
                onChange={(e) => setStep1Data({ ...step1Data, contactEmail: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">প্রতিষ্ঠার সন (Established Year)</label>
              <input
                type="number"
                value={step1Data.establishedYear}
                onChange={(e) => setStep1Data({ ...step1Data, establishedYear: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বিভাগ (Division) ও জেলা (District)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="বিভাগ"
                  value={step1Data.division}
                  onChange={(e) => setStep1Data({ ...step1Data, division: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="জেলা"
                  value={step1Data.district}
                  onChange={(e) => setStep1Data({ ...step1Data, district: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বিস্তারিত ঠিকানা (Full Address)</label>
              <input
                type="text"
                value={step1Data.address}
                onChange={(e) => setStep1Data({ ...step1Data, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Configurable Program Policies */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              কনফিগারযোগ্য প্রাতিষ্ঠানিক পলিসি (Configurable Program Policies)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">সর্বোচ্চ আবাসিক কোটা</label>
                <input
                  type="number"
                  value={step1Data.residentialQuota}
                  onChange={(e) => setStep1Data({ ...step1Data, residentialQuota: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">টার্ম / পরীক্ষা পদ্ধতি</label>
                <select
                  value={step1Data.termSystem}
                  onChange={(e) => setStep1Data({ ...step1Data, termSystem: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                >
                  <option value="chala">৩ ছালা সাময়িকী (Qawmi Standard)</option>
                  <option value="semester">দ্বি-সেমিস্টার বা ত্রি-সেমিস্টার</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step1Data.lillahFundEnabled}
                    onChange={(e) => setStep1Data({ ...step1Data, lillahFundEnabled: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">লিল্লাহ বোর্ডিং ও যাকাত তহবিল সক্রিয়</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              ধাপ ২ এ এগিয়ে যান (Next: Branches)
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Campuses & Branches */}
      {activeStep === 2 && (
        <form onSubmit={handleSaveStep2} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              ধাপ ২: ক্যাম্পাস ও শাখা অবকাঠামো (Campuses & Branches)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              প্রতিষ্ঠানের মূল শাখা ও অতিরিক্ত ক্যাম্পাস বা ছাত্রাবাস শাখা কনফিগার করুন।
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">প্রধান শাখা (Main Branch)</h3>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">প্রাথমিক ক্যাম্পাস</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">প্রধান শাখার নাম *</label>
                <input
                  type="text"
                  required
                  value={step2Data.mainBranchName}
                  onChange={(e) => setStep2Data({ ...step2Data, mainBranchName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শাখা কোড *</label>
                <input
                  type="text"
                  required
                  value={step2Data.mainBranchCode}
                  onChange={(e) => setStep2Data({ ...step2Data, mainBranchCode: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border border-dashed border-slate-300 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={step2Data.hasSecondaryBranch}
                onChange={(e) => setStep2Data({ ...step2Data, hasSecondaryBranch: e.target.checked })}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">অতিরিক্ত ক্যাম্পাস / শাখা যোগ করুন (Secondary Campus)</span>
            </label>

            {step2Data.hasSecondaryBranch && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">২য় শাখার নাম</label>
                  <input
                    type="text"
                    placeholder="যেমন: দারুল উলুম বালিকা শাখা / হিফজ ক্যাম্পাস"
                    value={step2Data.secondaryBranchName}
                    onChange={(e) => setStep2Data({ ...step2Data, secondaryBranchName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">২য় শাখা কোড</label>
                  <input
                    type="text"
                    value={step2Data.secondaryBranchCode}
                    onChange={(e) => setStep2Data({ ...step2Data, secondaryBranchCode: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              পূর্ববর্তী ধাপ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              ধাপ ৩ এ এগিয়ে যান (Next: Calendar)
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Academic Year & Calendar */}
      {activeStep === 3 && (
        <form onSubmit={handleSaveStep3} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-700" />
              ধাপ ৩: চলতি শিক্ষাবর্ষ ও টার্ম ক্যালেন্ডার (Academic Calendar)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              হিজরি ও ইংরেজি সন সম্বলিত চলতি সেশনের শুরু ও সমাপ্তি নির্ধারণ করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">শিক্ষাবর্ষের নাম (বাংলায়) *</label>
              <input
                type="text"
                required
                value={step3Data.nameBn}
                onChange={(e) => setStep3Data({ ...step3Data, nameBn: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">হিজরি সন (Hijri Year) *</label>
              <input
                type="text"
                required
                value={step3Data.hijriYear}
                onChange={(e) => setStep3Data({ ...step3Data, hijriYear: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
                placeholder="১৪৪৭-১৪৪৮"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">সেশন শুরু তারিখ *</label>
              <input
                type="date"
                required
                value={step3Data.startDate}
                onChange={(e) => setStep3Data({ ...step3Data, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">সেশন সমাপ্তি তারিখ *</label>
              <input
                type="date"
                required
                value={step3Data.endDate}
                onChange={(e) => setStep3Data({ ...step3Data, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              পূর্ববর্তী ধাপ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              ধাপ ৪ এ এগিয়ে যান (Next: Departments)
            </button>
          </div>
        </form>
      )}

      {/* Step 4: Departments & Classes */}
      {activeStep === 4 && (
        <form onSubmit={handleSaveStep4} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              ধাপ ৪: একাডেমিক বিভাগ ও জামাত মারহালা কনফিগারেশন
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              প্রতিষ্ঠানে পরিচালিত বিভাগসমূহ নির্বাচন করুন। প্রামাণ্য কিতাব ও মারহালা স্বয়ংক্রিয়ভাবে বিন্যস্ত হবে।
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">চালু রাখতে চাওয়া বিভাগসমূহ টিক দিন:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {step4Data.departments.map((dept, idx) => (
                <div
                  key={dept.code}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    dept.selected
                      ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    const copy = [...step4Data.departments];
                    copy[idx].selected = !copy[idx].selected;
                    setStep4Data({ ...step4Data, departments: copy });
                  }}
                >
                  <div>
                    <div className="text-sm font-bold">{dept.nameBn}</div>
                    <div className="text-xs text-slate-500 font-normal">{dept.nameEn}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={dept.selected}
                    onChange={() => {}} // handled by parent div click
                    className="h-4 w-4 rounded text-emerald-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={step4Data.generateDefaultClasses}
                onChange={(e) => setStep4Data({ ...step4Data, generateDefaultClasses: e.target.checked })}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-800">
                নির্বাচিত কারিকুলামের সকল অনুমোদিত জামাত / মারহালা স্বয়ংক্রিয়ভাবে তৈরি করুন (Auto-Seed Marhalas)
              </span>
            </label>
            <p className="text-[11px] text-slate-500 mt-1 ml-6">
              কওমি দরসে নেজামীর ক্ষেত্রে ইবতিদায়িয়্যাহ থেকে দাওরায়ে হাদীস ও ইফতা এবং আলিয়ার ক্ষেত্রে ১ম শ্রেণি থেকে কামিল পর্যন্ত স্তরসমূহ সরাসরি যুক্ত হবে।
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              পূর্ববর্তী ধাপ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              ধাপ ৫ এ এগিয়ে যান (Next: Leadership)
            </button>
          </div>
        </form>
      )}

      {/* Step 5: Leadership & Staff */}
      {activeStep === 5 && (
        <form onSubmit={handleSaveStep5} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-700" />
              ধাপ ৫: প্রশাসনিক দায়িত্বশীল ও মূল বিভাগীয় প্রধান (Leadership & Staff)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              মুহতামিম / প্রিন্সিপাল ছাড়া অন্যান্য মূল দায়িত্বশীলদের প্রাথমিক পরিচিতি লিপিবদ্ধ করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Academic Dean */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/60">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                নাজেমে তা&apos;লীমাত / শিক্ষা সচিব (Academic Dean)
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নাম</label>
                <input
                  type="text"
                  placeholder="মাওলানা ..."
                  value={step5Data.deanName}
                  onChange={(e) => setStep5Data({ ...step5Data, deanName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={step5Data.deanPhone}
                  onChange={(e) => setStep5Data({ ...step5Data, deanPhone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Bursar */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/60">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                হিসাবরক্ষক / প্রধান ক্যাশিয়ার (Bursar / Accountant)
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নাম</label>
                <input
                  type="text"
                  placeholder="নাম"
                  value={step5Data.bursarName}
                  onChange={(e) => setStep5Data({ ...step5Data, bursarName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="018xxxxxxxx"
                  value={step5Data.bursarPhone}
                  onChange={(e) => setStep5Data({ ...step5Data, bursarPhone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              পূর্ববর্তী ধাপ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              ধাপ ৬ এ এগিয়ে যান (Next: Review)
            </button>
          </div>
        </form>
      )}

      {/* Step 6: Review, Program Eligibility Verification & Launch */}
      {activeStep === 6 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              ধাপ ৬: চূড়ান্ত পর্যালোচনা ও প্রতিষ্ঠান সক্রিয়করণ (Review & Launch)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              সকল কনফিগারেশন যাচাই করুন এবং মাদরাসা পূর্ণাঙ্গ কার্যক্রমে চালু করুন।
            </p>
          </div>

          {/* Compliance & Verification Badge */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-emerald-950">
                প্রাতিষ্ঠানিক পলিসি ও নিরাপত্তা মানদণ্ড উত্তীর্ণ (MDI Ready)
              </div>
              <div className="text-xs text-emerald-800 mt-0.5">
                পোস্টগ্রেস ১৭ রো-লেভেল সিকিউরিটি, শরীয়াহ যাকাত ফান্ড পৃথকীকরণ এবং কওমি/আলিয়া ইঞ্জিন সম্পূর্ণ প্রস্তুত।
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-slate-200 p-4 space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider block">১. প্রতিষ্ঠান পরিচিতি</span>
              <div>নাম: <strong className="text-slate-900">{step1Data.name}</strong></div>
              <div>কোড: <span className="font-mono">{step1Data.code}</span></div>
              <div>কারিকুলাম: <strong className="text-emerald-700 capitalize">{step1Data.curriculumType}</strong></div>
              <div>বোর্ড: {step1Data.boardAffiliation}</div>
              <div>অবস্থান: {step1Data.district}, {step1Data.division}</div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider block">২. ক্যাম্পাস ও শিক্ষাবর্ষ</span>
              <div>প্রধান শাখা: <strong>{step2Data.mainBranchName}</strong> ({step2Data.mainBranchCode})</div>
              <div>চলতি শিক্ষাবর্ষ: <strong>{step3Data.nameBn}</strong></div>
              <div>হিজরি সন: {step3Data.hijriYear} হিজরি</div>
              <div>মেয়াদ: {step3Data.startDate} হতে {step3Data.endDate}</div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveStep(5)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              পূর্ববর্তী ধাপ
            </button>
            <button
              type="button"
              onClick={handleFinalize}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  সক্রিয় করা হচ্ছে...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  চূড়ান্ত অনবোর্ডিং সম্পন্ন করুন (Launch Madrasa)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
