'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { submitMadrasaApplication, type ApplicationResult } from '@/app/actions/applications';
import { useI18n } from '@/lib/i18n';
import {
  Building2,
  BookOpen,
  MapPin,
  User,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { ApplicationDocumentUpload } from './document-upload';

const initialState: ApplicationResult = { success: false };

type Lang = 'bn' | 'en' | 'ar';

const SUPPORT_PHONE = '+8801601654316';
const SUPPORT_EMAIL = 'sahitecheducation@gmail.com';

const DICT = {
  bn: {
    bismillah: 'بِسْمِ اللهِ الرَّחْمٰنِ الرَّחِيْمِ',
    step1: 'প্রতিষ্ঠানের বিবরণ',
    step2: 'ক্যাম্পাস ও যোগাযোগ',
    step3: 'পোর্টাল ও সাবমিট',
    
    // Step 1
    instNameLabel: 'মাদরাসার পূর্ণ নাম (ইংরেজি)',
    instNamePlaceholder: 'যেমন: Jamia Islamia Darul Ulum',
    instNameBnLabel: 'মাদরাসার নাম (বাংলা)',
    instNameBnPlaceholder: 'যেমন: জামিয়া ইসলামিয়া দারুল উলুম',
    instTypeLabel: 'পাঠ্যক্রম ও একাডেমিক ধারা',
    typeQawmi: 'কওমি (দাওরায়ে হাদিস / বেফাক)',
    typeAlia: 'আলিয়া (ইবতেদায়ি–কামিল / BMEB)',
    typeHybrid: 'সমন্বিত (হিফজ ও আধুনিক শিক্ষা)',
    boardLabel: 'বোর্ড বা শিক্ষাবোর্ড অধিভুক্তি',
    regNumLabel: 'নিবন্ধন নম্বর (যদি থাকে)',
    estYearLabel: 'প্রতিষ্ঠার সাল',

    // Step 2
    scopeLabel: 'ক্যাম্পাসের অবস্থান',
    scopeBD: 'বাংলাদেশ',
    scopeIntl: 'আন্তর্জাতিক / প্রবাসী',
    divisionLabel: 'বিভাগ',
    districtLabel: 'জেলা',
    countryLabel: 'দেশ (Country)',
    addressLabel: 'পূর্ণ ঠিকানা',
    addressPlaceholder: 'গ্রাম/মহল্লা, ডাকঘর, থানা/উপজেলা, জেলা',
    contactPersonLabel: 'মুহতামিম / দায়িত্বশীল ব্যক্তির নাম',
    contactPersonPlaceholder: 'যেমন: মাওলানা মুহিউদ্দীন আহমদ',
    contactEmailLabel: 'অফিসিয়াল ইমেইল ঠিকানা',
    contactEmailHelper: 'এই ঠিকানায় নিরাপদ অনুমোদন ও লগইন অ্যাক্সেস পাঠানো হবে',
    contactPhoneLabel: 'মোবাইল / হোয়াটসঅ্যাপ নম্বর',
    websiteLabel: 'ওয়েবসাইট লিংক (যদি থাকে)',

    // Step 3
    subdomainLabel: 'প্রস্তাবিত ওয়েব পোর্টাল সাবডোমেইন',
    subdomainSuffix: '.sahitech-edu.com',
    codeLabel: 'প্রাতিষ্ঠানিক কোড',
    previewBadge: 'আপনার মাদরাসার ডিজিটাল পরিচয় প্রিভিউ',
    noteLabel: 'কোনো বিশেষ চাহিদা বা মন্তব্য (ঐচ্ছিক)',
    notePlaceholder: 'আবাসিক শাখা, লিল্লাহ তহবিল বা বিশেষ চাহিদা থাকলে লিখতে পারেন...',
    termsText: 'তথ্য যাচাই সাপেক্ষে ২৪–৪৮ ঘণ্টার মধ্যে আমন্ত্রণ পাঠানো হবে।',

    // Actions
    next: 'পরবর্তী ধাপ',
    back: 'পূর্ববর্তী ধাপ',
    submit: 'আবেদন নিশ্চিত করুন',
    submitting: 'আবেদন জমা হচ্ছে...',

    // Success
    successHeading: 'আলহামদুলিল্লাহ! আপনার আবেদন গৃহীত হয়েছে',
    successText: 'আবেদন সফলভাবে সিস্টেমে নিবন্ধিত হয়েছে। এখন প্রয়োজনীয় কাগজপত্র যুক্ত করুন।',
    appId: 'আবেদন ট্র্যাকিং আইডি',
    copy: 'কপি করুন',
    copied: 'কপি হয়েছে'
  },
  en: {
    bismillah: 'In the Name of Allah, Most Gracious, Most Merciful',
    step1: 'Institution Profile',
    step2: 'Campus & Contact',
    step3: 'Portal & Submit',

    instNameLabel: 'Madrasa Official Name (English)',
    instNamePlaceholder: 'e.g. Jamia Islamia Darul Ulum',
    instNameBnLabel: 'Madrasa Name (Native / Arabic)',
    instNameBnPlaceholder: 'e.g. الجامعة الإسلامية دار العلوم',
    instTypeLabel: 'Academic Curriculum Stream',
    typeQawmi: 'Qawmi (Dars-e-Nizami)',
    typeAlia: 'Alia (BMEB Board)',
    typeHybrid: 'Integrated (Hifz & Modern)',
    boardLabel: 'Board / Education Council',
    regNumLabel: 'Registration Number (Optional)',
    estYearLabel: 'Year Established',

    scopeLabel: 'Campus Location',
    scopeBD: 'Bangladesh',
    scopeIntl: 'International / Overseas',
    divisionLabel: 'Division',
    districtLabel: 'District',
    countryLabel: 'Country',
    addressLabel: 'Campus Address',
    addressPlaceholder: 'Street, Post Office, Sub-district, District',
    contactPersonLabel: 'Principal / Authorized Representative',
    contactPersonPlaceholder: 'e.g. Mawlana Mohiuddin Ahmad',
    contactEmailLabel: 'Official Email Address',
    contactEmailHelper: 'Secure invitation and setup link will be delivered here',
    contactPhoneLabel: 'Phone / WhatsApp Number',
    websiteLabel: 'Website (Optional)',

    subdomainLabel: 'Proposed Web Subdomain',
    subdomainSuffix: '.sahitech-edu.com',
    codeLabel: 'Institution Code',
    previewBadge: 'Madrasa Digital Portal Preview',
    noteLabel: 'Special Requirements / Notes (Optional)',
    notePlaceholder: 'Hostel accommodation, campuses, or specific requirements...',
    termsText: 'Verification and onboarding link will be sent within 24–48 hours.',

    next: 'Continue',
    back: 'Back',
    submit: 'Confirm Application',
    submitting: 'Submitting...',

    successHeading: 'Alhamdulillah! Application Received',
    successText: 'Your application has been logged. Please upload supporting institutional documents.',
    appId: 'Application ID',
    copy: 'Copy',
    copied: 'Copied'
  },
  ar: {
    bismillah: 'بِسْمِ اللهِ الرَّחْمٰنِ الرَّחِيْمِ',
    step1: 'بيانات المؤسسة',
    step2: 'المقر والتواصل',
    step3: 'البوابة والاعتماد',

    instNameLabel: 'اسم المؤسسة بالإنجليزية (رسمي)',
    instNamePlaceholder: 'مثل: Jamia Islamia Darul Ulum',
    instNameBnLabel: 'اسم المؤسسة بالعربية',
    instNameBnPlaceholder: 'مثل: الجامعة الإسلامية دار العلوم',
    instTypeLabel: 'المنهج التعليمي',
    typeQawmi: 'قومي (درس نظامي)',
    typeAlia: 'عالية (مجلس BMEB)',
    typeHybrid: 'مدمج (تحفيظ وعصري)',
    boardLabel: 'المجلس أو الوفاق التابع له',
    regNumLabel: 'رقم الترخيص / التسجيل',
    estYearLabel: 'سنة التأسيس',

    scopeLabel: 'مقر الجامعة',
    scopeBD: 'بنغلاديش',
    scopeIntl: 'دولي / خارج بنغلاديش',
    divisionLabel: 'الإقليم',
    districtLabel: 'المحافظة',
    countryLabel: 'الدولة (Country)',
    addressLabel: 'العنوان التفصيلي',
    addressPlaceholder: 'الحي، المركز، المحافظة',
    contactPersonLabel: 'اسم المهتمم / المدير المفوض',
    contactPersonPlaceholder: 'مثل: الشيخ محيي الدين أحمد',
    contactEmailLabel: 'البريد الإلكتروني الرسمي',
    contactEmailHelper: 'سيصلك رابط التفعيل والاعتماد الرسمي عبر هذا البريد',
    contactPhoneLabel: 'رقم الهاتف / واتساب',
    websiteLabel: 'الموقع الإلكتروني الحالي (إن وجد)',

    subdomainLabel: 'النطاق الفرعي المقترح للموقع',
    subdomainSuffix: '.sahitech-edu.com',
    codeLabel: 'رمز المؤسسة',
    previewBadge: 'معاينة هوية البوابة الرقمية',
    noteLabel: 'ملاحظات إضافية (اختياري)',
    notePlaceholder: 'مثل: لدينا فروع متعددة أو سكن داخلي للطلاب...',
    termsText: 'تتم مراجعة الطلب وإرسال رابط التفعيل في غضون 24-48 ساعة.',

    next: 'التالي',
    back: 'السابق',
    submit: 'تأكيد إرسال الطلب',
    submitting: 'جاري الإرسال...',

    successHeading: 'الحمد لله! تم استلام الطلب بنجاح',
    successText: 'تم تسجيل الطلب في النظام. يرجى إرفاق الوثائق الرسمية للمؤسسة.',
    appId: 'رقم الطلب',
    copy: 'نسخ',
    copied: 'تم النسخ'
  }
};

const BD_DIVISIONS: Record<string, string[]> = {
  'ঢাকা (Dhaka)': ['ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'নরসিংদী', 'মুন্সীগঞ্জ', 'মানিকগঞ্জ', 'ফরিদপুর', 'রাজবাড়ী', 'গোপালগঞ্জ', 'মাদারীপুর', 'শরীয়তপুর', 'টাঙ্গাইল', 'কিশোরগঞ্জ'],
  'চট্টগ্রাম (Chattogram)': ['চট্টগ্রাম', 'কক্সবাজার', 'কুমিল্লা', 'ফেনী', 'ব্রাহ্মণবাড়িয়া', 'নোয়াখালী', 'লক্ষ্মীপুর', 'চাঁদপুর', 'রাঙ্গামাটি', 'খাগড়াছড়ি', 'বান্দরবান'],
  'রাজশাহী (Rajshahi)': ['রাজশাহী', 'বগুড়া', 'পাবনা', 'সিরাজগঞ্জ', 'নওগাঁ', 'নাটোর', 'জয়পুরহাট', 'চাঁপাইনবাবগঞ্জ'],
  'খুলনা (Khulna)': ['খুলনা', 'যশোর', 'সাতক্ষীরা', 'ঝিনাইদহ', 'কুষ্টিয়া', 'চুয়াডাঙ্গা', 'মেহেরপুর', 'মাগুরা', 'নড়াইল', 'বাগেরহাট'],
  'বরিশাল (Barishal)': ['বরিশাল', 'পটুয়াখালী', 'ভোলা', 'পিরোজপুর', 'বরগুনা', 'ঝালকাঠি'],
  'সিলেট (Sylhet)': ['সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ'],
  'রংপুর (Rangpur)': ['রংপুর', 'দিনাজপুর', 'কুড়িগ্রাম', 'গাইবান্ধা', 'নীলফামারী', 'পঞ্চগড়', 'ঠাকুরগাঁও', 'লালমনিরহাট'],
  'ময়মনসিংহ (Mymensingh)': ['ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর']
};

const BOARDS_LIST = [
  'বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ (Befaq)',
  'আল-হাইআতুল উলয়া লিল-জামি\'আতিল কওমিয়া',
  'বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড (BMEB - আলিয়া)',
  'বেফাকুল মাদারিসিদ দ্বীনিয়া বাংলাদেশ',
  'তানযীমুল মাদারিসিদ দ্বীনিয়া',
  'জাতীয় দ্বীনি মাদ্রাসা শিক্ষা বোর্ড',
  'নূরানী তা\'লীমুল কুরআন বোর্ড',
  'অন্যান্য / স্বতন্ত্র বোর্ড (Independent / Other)'
];

export function RegisterForm() {
  const { locale } = useI18n();
  const lang: Lang = (locale === 'en' || locale === 'ar') ? locale : 'bn';
  const t = DICT[lang];
  const isRTL = lang === 'ar';

  const [step, setStep] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    institutionName: '',
    institutionNameBn: '',
    institutionType: 'qawmi',
    boardAffiliation: 'বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ (Befaq)',
    registrationNumber: '',
    establishedYear: '',
    locationScope: 'domestic',
    division: 'ঢাকা (Dhaka)',
    district: 'ঢাকা',
    country: 'Bangladesh',
    address: '',
    websiteUrl: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    requestedCode: '',
    requestedSubdomain: '',
    applicationNote: '',
    companyWebsite: '' // honeypot
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState(submitMadrasaApplication, initialState);

  // Auto-generate Code and Subdomain
  function handleNameChange(name: string) {
    const updated = { ...formData, institutionName: name };

    const cleanSub = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 30);

    const words = name.trim().split(/\s+/).filter(Boolean);
    let code = '';
    if (words.length >= 2) {
      code = words.map(w => w[0]).join('').toUpperCase().slice(0, 6) + '-01';
    } else if (words.length === 1 && words[0].length >= 3) {
      code = words[0].slice(0, 5).toUpperCase() + '-01';
    }

    if (!formData.requestedSubdomain || formData.requestedSubdomain === cleanSub.slice(0, -1)) {
      updated.requestedSubdomain = cleanSub;
    }
    if (!formData.requestedCode && code) {
      updated.requestedCode = code;
    }

    setFormData(updated);
  }

  // Restore draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mdi_registration_draft_v3');
      if (saved) {
        setFormData(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {}
  }, []);

  // Save draft
  useEffect(() => {
    if (formData.institutionName || formData.contactEmail) {
      localStorage.setItem('mdi_registration_draft_v3', JSON.stringify(formData));
    }
  }, [formData]);

  function validateStep(currentStep: number): boolean {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.institutionName.trim() || formData.institutionName.trim().length < 3) {
        errs.institutionName = lang === 'bn' ? 'মাদরাসার পূর্ণ নাম আবশ্যক (কমপক্ষে ৩ অক্ষর)।' : 'Official madrasa name is required.';
      }
    } else if (currentStep === 2) {
      if (!formData.address.trim()) {
        errs.address = lang === 'bn' ? 'ক্যাম্পাসের ঠিকানা লিখুন।' : 'Address is required.';
      }
      if (!formData.contactPersonName.trim()) {
        errs.contactPersonName = lang === 'bn' ? 'দায়িত্বশীল ব্যক্তির নাম লিখুন।' : 'Contact person is required.';
      }
      if (!formData.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) {
        errs.contactEmail = lang === 'bn' ? 'সঠিক অফিসিয়াল ইমেইল দিন।' : 'Valid email is required.';
      }
      if (!formData.contactPhone.trim() || formData.contactPhone.trim().length < 8) {
        errs.contactPhone = lang === 'bn' ? 'মোবাইল বা হোয়াটসঅ্যাপ নম্বর দিন।' : 'Valid phone is required.';
      }
      if (formData.websiteUrl && !/^https?:\/\/.+/i.test(formData.websiteUrl)) {
        errs.websiteUrl = lang === 'bn' ? 'সঠিক URL (https:// সহ) দিন।' : 'Valid URL required.';
      }
    } else if (currentStep === 3) {
      if (!formData.requestedCode.trim() || !/^[A-Z0-9][A-Z0-9_-]{1,19}$/.test(formData.requestedCode.trim().toUpperCase())) {
        errs.requestedCode = lang === 'bn' ? 'কোড ২–২০ অক্ষরের বর্ণ বা সংখ্যা হতে হবে।' : 'Valid code required.';
      }
      if (!formData.requestedSubdomain.trim() || !/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(formData.requestedSubdomain.trim().toLowerCase())) {
        errs.requestedSubdomain = lang === 'bn' ? 'সাবডোমেইনে শুধু ইংরেজি ছোট হাতের অক্ষর বা হাইফেন দিন।' : 'Valid subdomain required.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 3));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }

  function handlePrev() {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  function copyTrackingId(id: string) {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Success view
  if (state.success && state.applicationId && state.uploadToken) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-md">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="font-serif text-xs text-emerald-300 font-bold">{t.bismillah}</p>
              <h2 className="text-xl sm:text-2xl font-black text-white">{t.successHeading}</h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">{t.successText}</p>

          <div className="mt-5 rounded-xl bg-slate-900/90 border border-emerald-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">{t.appId}</span>
              <span className="font-mono text-sm sm:text-base font-bold text-white break-all">{state.applicationId}</span>
            </div>
            <button
              type="button"
              onClick={() => copyTrackingId(state.applicationId!)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition shrink-0"
            >
              {copied ? <><Check className="h-3.5 w-3.5" /> {t.copied}</> : <><Copy className="h-3.5 w-3.5" /> {t.copy}</>}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-sm">
          <ApplicationDocumentUpload applicationId={state.applicationId} uploadToken={state.uploadToken} />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Streamlined Card Header without duplicate translation buttons */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {lang === 'bn' ? 'অফিসিয়াল রেজিস্ট্রেশন উইজার্ড' : lang === 'en' ? 'Official Registration Wizard' : 'معالج التسجيل الرسمي'}
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {lang === 'bn' ? `ধাপ ${step} / ৩` : lang === 'en' ? `Step ${step} of 3` : `الخطوة ${step} من 3`}
        </span>
      </div>

      {/* Human 3-Step Clean Stepper with High-Contrast Islamic Theme */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: 1, title: t.step1, icon: Building2 },
            { num: 2, title: t.step2, icon: MapPin },
            { num: 3, title: t.step3, icon: Sparkles }
          ].map(s => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < step || validateStep(step)) setStep(s.num);
                }}
                className={`flex items-center gap-2.5 rounded-xl p-3 text-left transition border ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-950/80 text-white font-bold shadow-sm ring-1 ring-emerald-500/40'
                    : isDone
                    ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950'
                      : isDone
                      ? 'bg-emerald-900 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-xs font-bold truncate hidden sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form */}
      <form action={formAction} className="space-y-6">
        {state.error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs font-semibold text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Hidden inputs to preserve full payload across all steps */}
        <input type="hidden" name="institutionName" value={formData.institutionName} />
        <input type="hidden" name="institutionNameBn" value={formData.institutionNameBn} />
        <input type="hidden" name="institutionType" value={formData.institutionType} />
        <input type="hidden" name="boardAffiliation" value={formData.boardAffiliation} />
        <input type="hidden" name="registrationNumber" value={formData.registrationNumber} />
        <input type="hidden" name="establishedYear" value={formData.establishedYear} />
        <input type="hidden" name="division" value={formData.locationScope === 'domestic' ? formData.division : 'International'} />
        <input type="hidden" name="district" value={formData.locationScope === 'domestic' ? formData.district : formData.country} />
        <input type="hidden" name="address" value={formData.address} />
        <input type="hidden" name="websiteUrl" value={formData.websiteUrl} />
        <input type="hidden" name="contactPersonName" value={formData.contactPersonName} />
        <input type="hidden" name="contactEmail" value={formData.contactEmail} />
        <input type="hidden" name="contactPhone" value={formData.contactPhone} />
        <input type="hidden" name="requestedCode" value={formData.requestedCode} />
        <input type="hidden" name="requestedSubdomain" value={formData.requestedSubdomain} />
        <input type="hidden" name="applicationNote" value={formData.applicationNote} />
        <input type="hidden" name="companyWebsite" value={formData.companyWebsite} />

        {/* STEP 1: Institution Details */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Official Name (English) - High Contrast Visible Label */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.instNameLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.institutionName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder={t.instNamePlaceholder}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium ${
                    errors.institutionName ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-300'
                  }`}
                />
                {errors.institutionName && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.institutionName}</p>}
              </div>

              {/* Name in Native Language (Bangla / Arabic) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.instNameBnLabel}
                </label>
                <input
                  type="text"
                  value={formData.institutionNameBn}
                  onChange={e => setFormData({ ...formData, institutionNameBn: e.target.value })}
                  placeholder={t.instNameBnPlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              {/* Institution Type Stream */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-100">
                  {t.instTypeLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'qawmi', title: t.typeQawmi },
                    { id: 'alia', title: t.typeAlia },
                    { id: 'hybrid', title: t.typeHybrid }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, institutionType: item.id })}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-3 border text-xs font-bold transition ${
                        formData.institutionType === item.id
                          ? 'border-emerald-500 bg-emerald-950/80 text-white ring-1 ring-emerald-500/50 shadow-xs'
                          : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <span>{item.title}</span>
                      {formData.institutionType === item.id && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Board Affiliation */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.boardLabel}
                </label>
                <select
                  value={formData.boardAffiliation}
                  onChange={e => setFormData({ ...formData, boardAffiliation: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                >
                  {BOARDS_LIST.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.regNumLabel}
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="রেজিস্ট্রেশন বা স্মারক নং"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              {/* Established Year */}
              <div>
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.estYearLabel}
                </label>
                <input
                  type="number"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={formData.establishedYear}
                  onChange={e => setFormData({ ...formData, establishedYear: e.target.value })}
                  placeholder="যেমন: 1985"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Campus Location & Focal Leadership Contact */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Location Scope Toggle */}
            <div className="flex items-center gap-3 pb-1">
              <span className="text-xs font-bold text-slate-100">{t.scopeLabel}:</span>
              <div className="inline-flex rounded-lg border border-slate-700 bg-slate-950/80 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, locationScope: 'domestic' })}
                  className={`rounded-md px-3 py-1 font-bold transition ${
                    formData.locationScope === 'domestic' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.scopeBD}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, locationScope: 'intl' })}
                  className={`rounded-md px-3 py-1 font-bold transition ${
                    formData.locationScope === 'intl' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.scopeIntl}
                </button>
              </div>
            </div>

            {formData.locationScope === 'domestic' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-100 mb-1.5">
                    {t.divisionLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={formData.division}
                    onChange={e => {
                      const div = e.target.value;
                      const firstDist = BD_DIVISIONS[div]?.[0] || '';
                      setFormData({ ...formData, division: div, district: firstDist });
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  >
                    {Object.keys(BD_DIVISIONS).map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-100 mb-1.5">
                    {t.districtLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  >
                    {(BD_DIVISIONS[formData.division] || []).map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.countryLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  placeholder="United Kingdom, India, Saudi Arabia..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-100 mb-1.5">
                {t.addressLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder={t.addressPlaceholder}
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium ${
                  errors.address ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-300'
                }`}
              />
              {errors.address && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.address}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-800">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.contactPersonLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPersonName}
                  onChange={e => setFormData({ ...formData, contactPersonName: e.target.value })}
                  placeholder={t.contactPersonPlaceholder}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium ${
                    errors.contactPersonName ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-300'
                  }`}
                />
                {errors.contactPersonName && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.contactPersonName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.contactEmailLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@institution.edu"
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium ${
                    errors.contactEmail ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-300'
                  }`}
                />
                {errors.contactEmail && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.contactEmail}</p>}
                <p className="text-[11px] text-emerald-300/80 mt-1 font-medium">{t.contactEmailHelper}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.contactPhoneLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+8801700000000"
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium ${
                    errors.contactPhone ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-300'
                  }`}
                />
                {errors.contactPhone && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.contactPhone}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.websiteLabel}
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://..."
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium ${
                    errors.websiteUrl ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-300'
                  }`}
                />
                {errors.websiteUrl && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.websiteUrl}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Portal Customization & Clean Preview */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Elegant Preview Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t.previewBadge}</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold text-emerald-200">
                  {formData.institutionType === 'qawmi' ? 'কওমি কারিকুলাম' : formData.institutionType === 'alia' ? 'BMEB বোর্ড' : 'সমন্বিত মডেল'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-white">
                    {formData.institutionName || 'আপনার মাদরাসার নাম'}
                  </h4>
                  {formData.institutionNameBn && (
                    <p className="text-xs text-emerald-200/80 mt-0.5">{formData.institutionNameBn}</p>
                  )}
                  <p className="text-[11px] text-slate-300 mt-1">
                    {formData.district || 'ঢাকা'}, {formData.country || 'বাংলাদেশ'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-white/10 p-3 text-right shrink-0">
                  <span className="text-[10px] text-emerald-400 font-bold block">ওয়েব ঠিকানা</span>
                  <span className="font-mono text-xs font-bold text-amber-200 block">
                    https://{formData.requestedSubdomain || 'your-madrasa'}.sahitech-edu.com
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    Code: {formData.requestedCode || 'JAMIA-01'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customization Inputs with High-Contrast Labels */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.subdomainLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <input
                    type="text"
                    required
                    value={formData.requestedSubdomain}
                    onChange={e => setFormData({ ...formData, requestedSubdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="jamia-madania"
                    className="min-w-0 flex-1 px-3.5 py-2.5 text-sm text-slate-900 outline-none font-mono"
                  />
                  <span className="flex items-center border-l bg-slate-100 px-2.5 text-xs text-slate-700 font-mono font-semibold">
                    {t.subdomainSuffix}
                  </span>
                </div>
                {errors.requestedSubdomain && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.requestedSubdomain}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.codeLabel} <span className="text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.requestedCode}
                  onChange={e => setFormData({ ...formData, requestedCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                  placeholder="JAMIA-01"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-mono uppercase outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
                {errors.requestedCode && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.requestedCode}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-100 mb-1.5">
                  {t.noteLabel}
                </label>
                <textarea
                  rows={2}
                  maxLength={1500}
                  value={formData.applicationNote}
                  onChange={e => setFormData({ ...formData, applicationNote: e.target.value })}
                  placeholder={t.notePlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-slate-950/70 p-3 text-xs text-slate-300 border border-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{t.termsText}</span>
            </div>
          </div>
        )}

        {/* Wizard Navigation Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              <span>{t.back}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <span>{t.next}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-7 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/40 disabled:opacity-50 transition"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.submitting}</span>
                </>
              ) : (
                <>
                  <span>{t.submit}</span>
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Clean Support Focal Strip with High Contrast */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-300 font-medium text-center sm:text-left">
          আবেদন সম্পন্ন করতে কোনো কারিগরি সহায়তার প্রয়োজন হলে আমাদের সাথে সরাসরি যোগাযোগ করুন:
        </span>
        <div className="flex items-center gap-4 shrink-0">
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 transition"
          >
            <Phone className="h-3.5 w-3.5 text-emerald-400" />
            <span>{SUPPORT_PHONE}</span>
          </a>
          <a
            href={`https://wa.me/${SUPPORT_PHONE.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 transition"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}