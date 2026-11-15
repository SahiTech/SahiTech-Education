'use client';

import React, { useState, useEffect, useActionState, useTransition } from 'react';
import { submitMadrasaApplication, type ApplicationResult } from '@/app/actions/applications';
import {
  Building2,
  BookOpen,
  MapPin,
  UserCheck,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  PhoneCall,
  Mail,
  ShieldCheck,
  GraduationCap,
  Info,
  RotateCcw,
  Save,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Landmark,
  Eye,
  FileCheck
} from 'lucide-react';
import { ApplicationDocumentUpload } from './document-upload';

const initialState: ApplicationResult = { success: false };

type Lang = 'bn' | 'en' | 'ar';

const DICT = {
  bn: {
    bismillah: 'بِسْمِ اللهِ الرَّחْمٰنِ الرَّחِيْمِ',
    step1Title: 'মাদরাসার পরিচিতি',
    step1Subtitle: 'প্রতিষ্ঠানের মৌলিক নাম ও একাডেমিক ধরন',
    step2Title: 'অবস্থান ও ক্যাম্পাস',
    step2Subtitle: 'ঠিকানা ও ভৌগোলিক বিবরণ',
    step3Title: 'দায়িত্বশীল ও যোগাযোগ',
    step3Subtitle: 'মুহতামিম / প্রতিনিধির তথ্য',
    step4Title: 'ডিজিটাল পোর্টাল ও প্রিভিউ',
    step4Subtitle: 'সাবডোমেইন, কোড ও চূড়ান্ত যাচাই',
    
    // Help bar
    helpBadge: 'সহজ আবেদন নির্দেশিকা',
    helpTitle: 'দেশি ও বিদেশি মাদরাসা শিক্ষক ও টিমের জন্য সহায়তা',
    helpDesc: 'আপনি কি কোনো ধাপে আটকে গেছেন? ফর্মের যে কোনো সাহায্য পেতে আমাদের সরাসরি কল বা ইমেইল করতে পারেন। কোড বা সাবডোমেইন বুঝতে না পারলে সমস্যা নেই, সিস্টেম নিজে থেকেই তৈরি করে দেবে।',
    callSupport: 'সহায়তা হেল্পলাইন',
    draftSaved: 'খসড়া স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে',
    clearDraft: 'নতুন করে শুরু করুন',

    // Step 1
    instNameLabel: 'মাদরাসার অফিসিয়াল নাম (ইংরেজি)',
    instNameHelper: 'ইংরেজি অক্ষরে লিখুন, যেমন: Jamia Islamia Darul Ulum',
    instNameBnLabel: 'মাদরাসার নাম (বাংলা)',
    instNameBnHelper: 'বাংলায় প্রতিষ্ঠানের নাম, যেমন: জামিয়া ইসলামিয়া দারুল উলুম',
    instTypeLabel: 'মাদরাসার একাডেমিক ধরন',
    typeQawmi: 'কওমি (Dars-e-Nizami)',
    typeQawmiDesc: 'বেফাক / আল-হাইআতুল উলয়া অনুমোদিত দাওরায়ে হাদিস ও কিতাব বিভাগ',
    typeAlia: 'আলিয়া (BMEB Board)',
    typeAliaDesc: 'মাদরাসা শিক্ষা বোর্ড অনুমোদিত ইবতেদায়ি থেকে কামিল',
    typeHybrid: 'হিফজ ও সমন্বিত (Hybrid)',
    typeHybridDesc: 'হিফজুল কুরআন, নূরানী, কিন্ডারগার্টেন ও আধুনিক শিক্ষা',
    boardLabel: 'বোর্ড বা একাডেমি অধিভুক্তি',
    boardPlaceholder: 'বোর্ড নির্বাচন করুন বা লিখুন',
    regNumLabel: 'সরকারি / বোর্ড নিবন্ধন নম্বর (যদি থাকে)',
    regNumPlaceholder: 'রেজি: নং বা স্মারক নম্বর',
    estYearLabel: 'প্রতিষ্ঠার সাল',
    estYearPlaceholder: 'যেমন: 1985',

    // Step 2
    locationScopeLabel: 'প্রতিষ্ঠানের অবস্থান',
    scopeDomestic: 'বাংলাদেশ (অভ্যন্তরীণ)',
    scopeIntl: 'আন্তর্জাতিক / প্রবাসী (International)',
    divisionLabel: 'বিভাগ',
    selectDivision: 'বিভাগ নির্বাচন করুন',
    districtLabel: 'জেলা',
    selectDistrict: 'জেলা নির্বাচন করুন',
    countryLabel: 'দেশ (Country)',
    addressLabel: 'পূর্ণ ঠিকানা (গ্রাম/রোড, ডাকঘর, থানা/উপজেলা)',
    addressPlaceholder: 'যেমন: বায়তুল ফালাহ জামেয়া ক্যাম্পাস, বড়বাড়ি, গাজীপুর সদর',
    websiteLabel: 'বিদ্যমান ওয়েবসাইট (যদি থাকে)',
    websitePlaceholder: 'https://...',

    // Step 3
    contactNameLabel: 'দায়িত্বশীল ব্যক্তির নাম',
    contactNamePlaceholder: 'যেমন: মুফতি মোহাম্মদ জাহিদুল ইসলাম',
    contactRoleLabel: 'দায়িত্ব / পদবি',
    roleMuhtamim: 'মুহতামিম / প্রিন্সিপাল',
    roleDean: 'নাজেমে তালিমাত / ভাইস প্রিন্সিপাল',
    roleSecretary: 'সভাপতি / সাধারণ সম্পাদক (ম্যানেজমেন্ট)',
    roleAdmin: 'প্রশাসনিক কর্মকর্তা / সিনিয়র শিক্ষক',
    contactEmailLabel: 'অফিসিয়াল ইমেইল ঠিকানা',
    contactEmailHelper: 'এই ইমেইলে আবেদনের অনুমোদন ও নিরাপদ লগইন ইনভাইটেশন পাঠানো হবে',
    contactPhoneLabel: 'মোবাইল / হোয়াটসঅ্যাপ নম্বর',
    contactPhoneHelper: 'দেশের বাইরে হলে কান্ট্রি কোড সহ লিখুন (যেমন: +8801700000000)',

    // Step 4
    subdomainLabel: 'প্রস্তাবিত ডিজিটাল ওয়েবসাইট সাবডোমেইন',
    subdomainHelper: 'এটি হবে ইন্টারনেটে আপনার মাদরাসার ফ্রি আধুনিক ওয়েব পোর্টাল লিংক',
    subdomainSuffix: '.sahitech-edu.com',
    codeLabel: 'প্রাতিষ্ঠানিক কোড (MDI Institutional Code)',
    codeHelper: 'ডাটাবেজে শিক্ষার্থীদের রোল, আইডি ও সনদ নম্বরের শুরুতে ব্যবহৃত হবে',
    portalPreviewTitle: 'আপনার মাদরাসার ডিজিটাল পোর্টাল কার্ড প্রিভিউ',
    portalPreviewNotice: 'আবেদন অনুমোদিত হলে আপনার মাদরাসার এই ডোমেইন ও সিস্টেম স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে যাবে।',
    noteLabel: 'আবেদন সম্পর্কে অতিরিক্ত বার্তা বা বিশেষ চাহিদা (ঐচ্ছিক)',
    notePlaceholder: 'যেমন: আমাদের শাখা ৩টি, আবাসিক ছাত্রাবাস রয়েছে, বা কোনো বিশেষ সুবিধা প্রয়োজন...',
    privacyNotice: 'আপনার প্রেরিত সকল তথ্য সম্পূর্ণ নিরাপদ এবং এনক্রিপ্টেড। অনুমোদন প্রক্রিয়া সম্পন্ন করতে সর্বোচ্চ ২৪-৪৮ ঘণ্টা সময় লাগতে পারে।',
    
    // Actions
    nextStep: 'পরবর্তী ধাপ',
    prevStep: 'পূর্ববর্তী ধাপ',
    submitButton: 'আবেদন চূড়ান্তভাবে জমা দিন',
    submitting: 'আবেদন প্রসেস হচ্ছে...',
    reviewBadge: 'এক নজরে আপনার তথ্য',
    edit: 'সম্পাদনা',

    // Post Submit
    successTitle: 'আলহামদুলিল্লাহ! আপনার আবেদন সফলভাবে গৃহীত হয়েছে',
    successSubtitle: 'আপনার আবেদন ট্র্যাকিং আইডি নিচে দেওয়া হলো। এখন আপনার প্রতিষ্ঠানের সনদ বা প্রয়োজনীয় ডকুমেন্টস আপলোড করুন।',
    appIdLabel: 'আবেদন আইডি',
    copyId: 'আইডি কপি করুন',
    copied: 'কপি করা হয়েছে!',
    docUploadTitle: 'প্রতিষ্ঠানের কাগজপত্র সংযুক্ত করুন'
  },
  en: {
    bismillah: 'In the Name of Allah, Most Gracious, Most Merciful',
    step1Title: 'Madrasa Identity',
    step1Subtitle: 'Official institution name & academic type',
    step2Title: 'Campus & Location',
    step2Subtitle: 'Geographic and postal details',
    step3Title: 'Leadership & Contact',
    step3Subtitle: 'Principal / Management focal point',
    step4Title: 'Digital Portal & Review',
    step4Subtitle: 'Subdomain, code & final validation',

    helpBadge: 'Applicant Assistance Desk',
    helpTitle: 'Dedicated guidance for local & overseas Madrasa scholars',
    helpDesc: 'Are you unsure about any field? Don\'t worry—our system auto-generates your code and subdomain. You can also reach our support team anytime.',
    callSupport: 'Support Hotline',
    draftSaved: 'Draft automatically saved',
    clearDraft: 'Reset Form',

    instNameLabel: 'Madrasa Official Name (English)',
    instNameHelper: 'Write in English, e.g. Jamia Islamia Darul Ulum',
    instNameBnLabel: 'Madrasa Name (Native / Arabic)',
    instNameBnHelper: 'Native Bengali or Arabic script name',
    instTypeLabel: 'Academic Curriculum Engine',
    typeQawmi: 'Qawmi (Dars-e-Nizami)',
    typeQawmiDesc: 'Befaq / Al-Haiatul Ulya standard curriculum up to Dawra-e-Hadith',
    typeAlia: 'Alia (BMEB Board)',
    typeAliaDesc: 'Bangladesh Madrasa Education Board from Ebtedayee to Kamil',
    typeHybrid: 'Hifz & Integrated (Hybrid)',
    typeHybridDesc: 'Hifzul Quran, Noorani, Kindergarten and Modern Academics',
    boardLabel: 'Board / Council Affiliation',
    boardPlaceholder: 'Select or type board name',
    regNumLabel: 'Government / Board Registration No. (Optional)',
    regNumPlaceholder: 'Registration or Gazette Number',
    estYearLabel: 'Year of Establishment',
    estYearPlaceholder: 'e.g. 1985',

    locationScopeLabel: 'Campus Location Scope',
    scopeDomestic: 'Bangladesh (Domestic)',
    scopeIntl: 'International / Overseas',
    divisionLabel: 'Division',
    selectDivision: 'Select Division',
    districtLabel: 'District',
    selectDistrict: 'Select District',
    countryLabel: 'Country',
    addressLabel: 'Full Campus Address',
    addressPlaceholder: 'Village/Street, Post Office, Sub-district/Thana, District',
    websiteLabel: 'Current Website URL (If any)',
    websitePlaceholder: 'https://...',

    contactNameLabel: 'Authorized Representative Name',
    contactNamePlaceholder: 'e.g. Mufti Muhammad Zahidul Islam',
    contactRoleLabel: 'Designation / Responsibility',
    roleMuhtamim: 'Principal / Muhtamim',
    roleDean: 'Vice Principal / Academic Dean',
    roleSecretary: 'President / General Secretary (Trust)',
    roleAdmin: 'Administrative Officer / Senior Teacher',
    contactEmailLabel: 'Official Contact Email',
    contactEmailHelper: 'Confidential approval notices and owner setup link will be sent here',
    contactPhoneLabel: 'Phone / WhatsApp Number',
    contactPhoneHelper: 'Include international dial code (e.g. +8801700000000)',

    subdomainLabel: 'Proposed Web Portal Subdomain',
    subdomainHelper: 'This will be your institutional public website on the web',
    subdomainSuffix: '.sahitech-edu.com',
    codeLabel: 'Institutional Identifier Code',
    codeHelper: 'Used as the prefix for student admission, roll and certificate numbers',
    portalPreviewTitle: 'Live Madrasa Web Portal Preview',
    portalPreviewNotice: 'Once approved, your madrasa will instantly go live with this verified domain.',
    noteLabel: 'Additional Information or Special Requirements (Optional)',
    notePlaceholder: 'e.g. We operate 3 campuses, provide Lillah boarding...',
    privacyNotice: 'All data is cryptographically isolated and secure. Platform owner approval typically takes 24–48 hours.',

    nextStep: 'Next Step',
    prevStep: 'Back',
    submitButton: 'Submit Madrasa Application',
    submitting: 'Submitting application...',
    reviewBadge: 'Application Summary',
    edit: 'Edit',

    successTitle: 'Alhamdulillah! Application Successfully Received',
    successSubtitle: 'Your application tracking number is shown below. Please attach institutional supporting documents.',
    appIdLabel: 'Application Tracking ID',
    copyId: 'Copy Tracking ID',
    copied: 'Copied to clipboard!',
    docUploadTitle: 'Upload Supporting Documents'
  },
  ar: {
    bismillah: 'بِسْمِ اللهِ الرَّחْمٰنِ الرَّחِيْمِ',
    step1Title: 'هوية المعهد / الجامعة',
    step1Subtitle: 'الاسم الرسمي والمنهج الأكاديمي',
    step2Title: 'الموقع والمقر',
    step2Subtitle: 'العنوان الجغرافي وبيانات الحرم',
    step3Title: 'الإدارة والتواصل',
    step3Subtitle: 'بيانات المدير / المسؤول المفوض',
    step4Title: 'البوابة الرقمية والمراجعة',
    step4Subtitle: 'النطاق الفرعي والرمز والتحقق النهائي',

    helpBadge: 'مكتب مساعدة المتقدمين',
    helpTitle: 'إرشاد مخصص لعلماء وإدارات المعاهد الإسلامية',
    helpDesc: 'هل تحتاج إلى مساعدة في أي خطوة؟ لا تقلق، سيقوم النظام تلقائياً بإنشاء الرمز والنطاق الفرعي المناسب لك.',
    callSupport: 'خط المساعدة',
    draftSaved: 'تم حفظ المسودة تلقائياً',
    clearDraft: 'إعادة تعيين',

    instNameLabel: 'اسم المؤسسة بالإنجليزية (رسمي)',
    instNameHelper: 'اكتب بالأحرف اللاتينية، مثل: Jamia Islamia Darul Ulum',
    instNameBnLabel: 'اسم المؤسسة بالعربية / الوطنية',
    instNameBnHelper: 'الاسم بالعربية، مثل: الجامعة الإسلامية دار العلوم',
    instTypeLabel: 'نوع المنهج التعليمي',
    typeQawmi: 'قومي (درس نظامي)',
    typeQawmiDesc: 'منهج وفاق المدارس حتى مرحلة دورة الحديث الشريف والافتاء',
    typeAlia: 'عالية (منهج المجلس الحكومي BMEB)',
    typeAliaDesc: 'معتمد من مجلس تعليم المدارس من الابتداية إلى الكامل',
    typeHybrid: 'تحفيظ القرآن ومدمج (Hybrid)',
    typeHybridDesc: 'تحفيظ القرآن الكريم والتعليم الإسلامي والعصري',
    boardLabel: 'المجلس أو الوفاق التابع له',
    boardPlaceholder: 'اختر أو اكتب اسم الوفاق',
    regNumLabel: 'رقم التسجيل الرسمي (اختياري)',
    regNumPlaceholder: 'رقم القيد أو الترخيص',
    estYearLabel: 'سنة التأسيس',
    estYearPlaceholder: 'مثال: 1985',

    locationScopeLabel: 'نطاق الموقع الجغرافي',
    scopeDomestic: 'بنغلاديش (محلي)',
    scopeIntl: 'دولي / خارج بنغلاديش (International)',
    divisionLabel: 'القسم / الإقليم',
    selectDivision: 'اختر القسم',
    districtLabel: 'المديرية / المحافظة',
    selectDistrict: 'اختر المديرية',
    countryLabel: 'الدولة (Country)',
    addressLabel: 'العنوان البريدي الكامل',
    addressPlaceholder: 'القرية / الحي، المركز، المحافظة',
    websiteLabel: 'الموقع الإلكتروني الحالي (إن وجد)',
    websitePlaceholder: 'https://...',

    contactNameLabel: 'اسم المسؤول المفوض',
    contactNamePlaceholder: 'مثل: الشيخ محمد زاهد الإسلام',
    contactRoleLabel: 'الصفة / المنصب الإداري',
    roleMuhtamim: 'المهتمم / مدير الجامعة',
    roleDean: 'ناظم التعليمات / وكيل الشؤون العلمية',
    roleSecretary: 'رئيس مجلس الإدارة / الأمين العام',
    roleAdmin: 'المسؤول الإداري / أستاذ رئيسي',
    contactEmailLabel: 'البريد الإلكتروني الرسمي',
    contactEmailHelper: 'سيتم إرسال إشعار القبول ورابط تفعيل البوابة إلى هذا البريد',
    contactPhoneLabel: 'رقم الهاتف / واتساب',
    contactPhoneHelper: 'يرجى كتابة رمز الدولة الدولي (مثال: +8801700000000)',

    subdomainLabel: 'النطاق الفرعي المقترح للموقع الرقمي',
    subdomainHelper: 'سيكون هذا هو عنوان موقع جامعتكم على الإنترنت',
    subdomainSuffix: '.sahitech-edu.com',
    codeLabel: 'رمز المؤسسة التعريفي',
    codeHelper: 'يستخدم كبادئة لأرقام قبول الطلاب والسجلات والشهادات',
    portalPreviewTitle: 'معاينة بطاقة البوابة الرقمية',
    portalPreviewNotice: 'عند اعتماد الطلب سيتم تفعيل هذا النطاق والموقع مباشرة لمؤسستكم.',
    noteLabel: 'ملاحظات إضافية أو متطلبات خاصة (اختياري)',
    notePlaceholder: 'مثل: لدينا فروع متعددة وسكن داخلي للطلاب...',
    privacyNotice: 'جميع بياناتكم مشفرة ومحفوظة بسرية تامة. تستغرق المراجعة عادة بين 24 إلى 48 ساعة.',

    nextStep: 'الخطوة التالية',
    prevStep: 'الرجوع',
    submitButton: 'إرسال طلب التسجيل',
    submitting: 'جاري الإرسال...',
    reviewBadge: 'ملخص بيانات الطلب',
    edit: 'تعديل',

    successTitle: 'الحمد لله! تم استلام طلبكم بنجاح',
    successSubtitle: 'رقم متابعة الطلب موضح أدناه. يرجى إرفاق الوثائق الرسمية للمؤسسة.',
    appIdLabel: 'رقم تتبع الطلب',
    copyId: 'نسخ رقم التتبع',
    copied: 'تم النسخ!',
    docUploadTitle: 'إرفاق المستندات والوثائق'
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

const POPULAR_BOARDS = [
  'বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ (Befaq)',
  'আল-হাইআতুল উলয়া লিল-জামি\'আতিল কওমিয়া',
  'বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড (BMEB - আলিয়া)',
  'বেফাকুল মাদারিসিদ দ্বীনিয়া বাংলাদেশ',
  'তানযীমুল মাদারিসিদ দ্বীনিয়া',
  'জাতীয় দ্বীনি মাদ্রাসা শিক্ষা বোর্ড',
  'নূরানী তা\'লীমুল কুরআন বোর্ড',
  'আন্তর্জাতিক / স্বাধীন বোর্ড (International / Independent)'
];

export function RegisterForm() {
  const [lang, setLang] = useState<Lang>('bn');
  const t = DICT[lang];
  const isRTL = lang === 'ar';

  const [step, setStep] = useState<number>(1);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [draftLoaded, setDraftLoaded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Form Fields State
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
    contactRole: 'মুহতামিম / প্রিন্সিপাল',
    contactEmail: '',
    contactPhone: '',
    requestedCode: '',
    requestedSubdomain: '',
    applicationNote: '',
    companyWebsite: '' // honeypot
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState(submitMadrasaApplication, initialState);

  // Auto-generate Code and Subdomain from Institution Name
  function handleNameChange(name: string) {
    const updated = { ...formData, institutionName: name };

    // Auto generate subdomain: sanitize to alphanumeric kebab
    const cleanSubdomain = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 30);

    // Auto generate code: uppercase initials + random or prefix
    const words = name.trim().split(/\s+/).filter(Boolean);
    let code = '';
    if (words.length >= 2) {
      code = words.map(w => w[0]).join('').toUpperCase().slice(0, 6) + '-01';
    } else if (words.length === 1 && words[0].length >= 3) {
      code = words[0].slice(0, 5).toUpperCase() + '-01';
    }

    if (!formData.requestedSubdomain || formData.requestedSubdomain === cleanSubdomain.slice(0, -1)) {
      updated.requestedSubdomain = cleanSubdomain;
    }
    if (!formData.requestedCode && code) {
      updated.requestedCode = code;
    }

    setFormData(updated);
  }

  // Restore draft from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mdi_registration_draft_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
        setDraftLoaded(true);
      }
    } catch {}
  }, []);

  // Save draft to LocalStorage
  useEffect(() => {
    if (formData.institutionName || formData.contactEmail) {
      localStorage.setItem('mdi_registration_draft_v2', JSON.stringify(formData));
    }
  }, [formData]);

  function clearDraft() {
    localStorage.removeItem('mdi_registration_draft_v2');
    setFormData({
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
      contactRole: 'মুহতামিম / প্রিন্সিপাল',
      contactEmail: '',
      contactPhone: '',
      requestedCode: '',
      requestedSubdomain: '',
      applicationNote: '',
      companyWebsite: ''
    });
    setDraftLoaded(false);
    setStep(1);
    setErrors({});
  }

  // Validation per step
  function validateStep(currentStep: number): boolean {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.institutionName.trim() || formData.institutionName.trim().length < 3) {
        errs.institutionName = lang === 'bn' ? 'মাদরাসার অফিসিয়াল ইংরেজি নাম আবশ্যক (কমপক্ষে ৩ অক্ষর)।' : 'Official institution name is required.';
      }
    } else if (currentStep === 2) {
      if (!formData.address.trim()) {
        errs.address = lang === 'bn' ? 'মাদরাসার সম্পূর্ণ ঠিকানা আবশ্যক।' : 'Campus address is required.';
      }
      if (formData.websiteUrl && !/^https?:\/\/.+/i.test(formData.websiteUrl)) {
        errs.websiteUrl = lang === 'bn' ? 'ওয়েবসাইট URL সঠিক নয় (https:// সহ দিন)।' : 'Valid URL required.';
      }
    } else if (currentStep === 3) {
      if (!formData.contactPersonName.trim()) {
        errs.contactPersonName = lang === 'bn' ? 'দায়িত্বশীল ব্যক্তির নাম আবশ্যক।' : 'Contact person name is required.';
      }
      if (!formData.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) {
        errs.contactEmail = lang === 'bn' ? 'সঠিক অফিসিয়াল ইমেইল প্রদান করুন।' : 'Valid email address required.';
      }
      if (!formData.contactPhone.trim() || formData.contactPhone.trim().length < 8) {
        errs.contactPhone = lang === 'bn' ? 'সঠিক ফোন বা হোয়াটসঅ্যাপ নম্বর আবশ্যক।' : 'Valid phone number required.';
      }
    } else if (currentStep === 4) {
      if (!formData.requestedCode.trim() || !/^[A-Z0-9][A-Z0-9_-]{1,19}$/.test(formData.requestedCode.trim().toUpperCase())) {
        errs.requestedCode = lang === 'bn' ? 'কোড ২-২০ অক্ষরের ইংরেজি বর্ণ/সংখ্যা হতে হবে (যেমন: JAMIA-01)।' : 'Valid code required (2-20 uppercase chars).';
      }
      if (!formData.requestedSubdomain.trim() || !/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(formData.requestedSubdomain.trim().toLowerCase())) {
        errs.requestedSubdomain = lang === 'bn' ? 'সাবডোমেইনে শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা বা হাইফেন দিন।' : 'Valid subdomain required (e.g. jamia-islamia).';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 4));
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
    setTimeout(() => setCopied(false), 2500);
  }

  // If application is successfully submitted:
  if (state.success && state.applicationId && state.uploadToken) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <p className="font-serif text-xs text-emerald-300 font-bold tracking-widest">{t.bismillah}</p>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{t.successTitle}</h2>
              <p className="mt-1 text-sm text-emerald-100/90 leading-relaxed">{t.successSubtitle}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-900/80 border border-emerald-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider block">{t.appIdLabel}</span>
              <span className="font-mono text-base sm:text-lg font-bold text-white break-all">{state.applicationId}</span>
            </div>
            <button
              type="button"
              onClick={() => copyTrackingId(state.applicationId!)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition shadow-sm"
            >
              {copied ? <><Check className="h-4 w-4" /> {t.copied}</> : <><Copy className="h-4 w-4" /> {t.copyId}</>}
            </button>
          </div>
        </div>

        {/* Document Upload Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t.docUploadTitle}</h3>
              <p className="text-xs text-slate-500">অনুমোদন দ্রুত সম্পন্ন করতে প্রয়োজনীয় কাগজপত্র এখনই আপলোড করুন</p>
            </div>
          </div>

          <ApplicationDocumentUpload applicationId={state.applicationId} uploadToken={state.uploadToken} />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar: Language Switcher, Draft Notice, Help Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-900/10 bg-emerald-50/60 p-3 text-xs">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-700 shrink-0" />
          <div className="inline-flex rounded-lg border border-emerald-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`rounded-md px-2.5 py-1 font-bold transition ${lang === 'bn' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-md px-2.5 py-1 font-bold transition ${lang === 'en' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ar')}
              className={`rounded-md px-2.5 py-1 font-bold transition font-serif ${lang === 'ar' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              العربية
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {draftLoaded && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800">
              <Check className="h-3 w-3 text-emerald-600" /> {t.draftSaved}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1 font-bold text-emerald-800 hover:bg-emerald-100 transition"
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-700" />
            <span>{t.helpBadge}</span>
          </button>
          {draftLoaded && (
            <button
              type="button"
              onClick={clearDraft}
              className="text-[11px] text-slate-400 hover:text-red-600 underline transition"
            >
              {t.clearDraft}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Help & Teacher Support Desk */}
      {showHelp && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-xs text-xs space-y-3 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{t.helpTitle}</h4>
              <p className="mt-1 leading-relaxed text-slate-700">{t.helpDesc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
            <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200">
              <Mail className="h-4 w-4 text-emerald-700 shrink-0" />
              <span className="font-mono font-bold text-slate-800">helpline.sahitech@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200">
              <PhoneCall className="h-4 w-4 text-emerald-700 shrink-0" />
              <span className="text-slate-800 font-semibold">{t.callSupport}: +880 1800-SAHITECH</span>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Progress Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { num: 1, title: t.step1Title, icon: Building2 },
            { num: 2, title: t.step2Title, icon: MapPin },
            { num: 3, title: t.step3Title, icon: UserCheck },
            { num: 4, title: t.step4Title, icon: Sparkles }
          ].map(s => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isCompleted = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < step || validateStep(step)) setStep(s.num);
                }}
                className={`flex flex-col sm:flex-row items-center gap-2 rounded-xl p-2 sm:p-2.5 transition text-center sm:text-left ${
                  isCurrent
                    ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20 font-bold'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isCurrent
                      ? 'bg-white text-emerald-900'
                      : isCompleted
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <span className="block text-xs font-bold leading-tight truncate">{s.title}</span>
                  <span className={`block text-[10px] leading-none mt-0.5 truncate ${isCurrent ? 'text-emerald-200' : 'text-slate-500'}`}>
                    {s.num === 1 ? 'মৌলিক তথ্য' : s.num === 2 ? 'ক্যাম্পাস' : s.num === 3 ? 'যোগাযোগ' : 'প্রিভিউ'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Multi-Step Form */}
      <form action={formAction} className="space-y-6">
        {state.error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-2xs">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
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
        {/* Anti-spam honeypot */}
        <input type="hidden" name="companyWebsite" value={formData.companyWebsite} />

        {/* STEP 1: Institution Identity */}
        {step === 1 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-700" />
                <span>{t.step1Title}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">{t.step1Subtitle}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.instNameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.institutionName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder={t.instNameHelper}
                  className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-600/20 ${
                    errors.institutionName ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-600'
                  }`}
                />
                {errors.institutionName && <p className="text-xs text-red-600 mt-1">{errors.institutionName}</p>}
                <p className="text-[11px] text-slate-400 mt-1">{t.instNameHelper}</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.instNameBnLabel}
                </label>
                <input
                  type="text"
                  value={formData.institutionNameBn}
                  onChange={e => setFormData({ ...formData, institutionNameBn: e.target.value })}
                  placeholder={t.instNameBnHelper}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">{t.instNameBnHelper}</p>
              </div>

              {/* Institution Type Cards */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  {t.instTypeLabel} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'qawmi', title: t.typeQawmi, desc: t.typeQawmiDesc, badge: 'দরসে নেজামী' },
                    { id: 'alia', title: t.typeAlia, desc: t.typeAliaDesc, badge: 'BMEB বোর্ড' },
                    { id: 'hybrid', title: t.typeHybrid, desc: t.typeHybridDesc, badge: 'হিফজ ও মডার্ন' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, institutionType: item.id })}
                      className={`flex flex-col justify-between rounded-xl p-4 border text-left transition ${
                        formData.institutionType === item.id
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-2">
                          {item.badge}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          formData.institutionType === item.id ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}>
                          {formData.institutionType === item.id && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Board Affiliation */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.boardLabel}
                </label>
                <select
                  value={formData.boardAffiliation}
                  onChange={e => setFormData({ ...formData, boardAffiliation: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                >
                  {POPULAR_BOARDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.regNumLabel}
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder={t.regNumPlaceholder}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.estYearLabel}
                </label>
                <input
                  type="number"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={formData.establishedYear}
                  onChange={e => setFormData({ ...formData, establishedYear: e.target.value })}
                  placeholder={t.estYearPlaceholder}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Campus Location & Address */}
        {step === 2 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-700" />
                <span>{t.step2Title}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">{t.step2Subtitle}</p>
            </div>

            {/* Domestic vs International Toggle */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">{t.locationScopeLabel}</label>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, locationScope: 'domestic' })}
                  className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition ${
                    formData.locationScope === 'domestic' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.scopeDomestic}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, locationScope: 'intl' })}
                  className={`flex-1 sm:flex-initial rounded-lg px-4 py-2 text-xs font-bold transition ${
                    formData.locationScope === 'intl' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.scopeIntl}
                </button>
              </div>
            </div>

            {formData.locationScope === 'domestic' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.divisionLabel} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.division}
                    onChange={e => {
                      const div = e.target.value;
                      const firstDist = BD_DIVISIONS[div]?.[0] || '';
                      setFormData({ ...formData, division: div, district: firstDist });
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  >
                    {Object.keys(BD_DIVISIONS).map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.districtLabel} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  >
                    {(BD_DIVISIONS[formData.division] || []).map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.countryLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g. United Kingdom, India, Saudi Arabia..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {t.addressLabel} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder={t.addressPlaceholder}
                className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-600/20 ${
                  errors.address ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-600'
                }`}
              />
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {t.websiteLabel}
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder={t.websitePlaceholder}
                className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-600/20 ${
                  errors.websiteUrl ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-600'
                }`}
              />
              {errors.websiteUrl && <p className="text-xs text-red-600 mt-1">{errors.websiteUrl}</p>}
            </div>
          </div>
        )}

        {/* STEP 3: Leadership & Authority Contact */}
        {step === 3 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-700" />
                <span>{t.step3Title}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">{t.step3Subtitle}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.contactNameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPersonName}
                  onChange={e => setFormData({ ...formData, contactPersonName: e.target.value })}
                  placeholder={t.contactNamePlaceholder}
                  className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-600/20 ${
                    errors.contactPersonName ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-600'
                  }`}
                />
                {errors.contactPersonName && <p className="text-xs text-red-600 mt-1">{errors.contactPersonName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.contactRoleLabel}
                </label>
                <select
                  value={formData.contactRole}
                  onChange={e => setFormData({ ...formData, contactRole: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                >
                  <option value="মুহতামিম / প্রিন্সিপাল">{t.roleMuhtamim}</option>
                  <option value="নাজেমে তালিমাত / ভাইস প্রিন্সিপাল">{t.roleDean}</option>
                  <option value="সভাপতি / সাধারণ সম্পাদক">{t.roleSecretary}</option>
                  <option value="প্রশাসনিক কর্মকর্তা / সিনিয়র শিক্ষক">{t.roleAdmin}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.contactEmailLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@jamia.edu"
                  className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-600/20 ${
                    errors.contactEmail ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-600'
                  }`}
                />
                {errors.contactEmail && <p className="text-xs text-red-600 mt-1">{errors.contactEmail}</p>}
                <p className="text-[11px] text-slate-400 mt-1">{t.contactEmailHelper}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.contactPhoneLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+8801700000000"
                  className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-600/20 ${
                    errors.contactPhone ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-600'
                  }`}
                />
                {errors.contactPhone && <p className="text-xs text-red-600 mt-1">{errors.contactPhone}</p>}
                <p className="text-[11px] text-slate-400 mt-1">{t.contactPhoneHelper}</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Portal Customization & Live Card Preview */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Live Madrasa Digital Card Preview */}
            <div className="rounded-2xl border-2 border-emerald-600/40 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-52 h-52 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-4">
                <span className="text-xs uppercase tracking-widest font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t.portalPreviewTitle}</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold text-emerald-200">
                  {formData.institutionType === 'qawmi' ? 'কওমি কারিকুলাম' : formData.institutionType === 'alia' ? 'BMEB বোর্ড' : 'সমন্বিত মডেল'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {formData.institutionName || 'আপনার মাদরাসার নাম'}
                  </h3>
                  {formData.institutionNameBn && (
                    <p className="text-sm text-emerald-200/90 font-medium">{formData.institutionNameBn}</p>
                  )}
                  <p className="text-xs text-slate-300 flex items-center gap-1 pt-1">
                    <MapPin className="h-3 w-3 text-emerald-400" />
                    <span>{formData.district || 'ঢাকা'}, {formData.country || 'বাংলাদেশ'}</span>
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-emerald-500/30 p-3 text-right">
                  <span className="text-[10px] uppercase text-emerald-400 font-bold block">পোর্টাল ওয়েব ঠিকানা</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-amber-200 block mt-0.5">
                    https://{formData.requestedSubdomain || 'your-madrasa'}.sahitech-edu.com
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    ID: {formData.requestedCode || 'JAMIA-01'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subdomain & Code Configuration */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-700" />
                  <span>{t.step4Title}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">{t.step4Subtitle}</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.subdomainLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex overflow-hidden rounded-xl border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20">
                    <input
                      type="text"
                      required
                      value={formData.requestedSubdomain}
                      onChange={e => setFormData({ ...formData, requestedSubdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="jamia-madania"
                      className="min-w-0 flex-1 px-3.5 py-3 text-sm outline-none font-mono"
                    />
                    <span className="flex items-center border-l bg-slate-50 px-3 text-xs text-slate-500 font-mono">
                      {t.subdomainSuffix}
                    </span>
                  </div>
                  {errors.requestedSubdomain && <p className="text-xs text-red-600 mt-1">{errors.requestedSubdomain}</p>}
                  <p className="text-[11px] text-slate-400 mt-1">{t.subdomainHelper}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.codeLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requestedCode}
                    onChange={e => setFormData({ ...formData, requestedCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                    placeholder="JAMIA-01"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition font-mono focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 uppercase"
                  />
                  {errors.requestedCode && <p className="text-xs text-red-600 mt-1">{errors.requestedCode}</p>}
                  <p className="text-[11px] text-slate-400 mt-1">{t.codeHelper}</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.noteLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1500}
                    value={formData.applicationNote}
                    onChange={e => setFormData({ ...formData, applicationNote: e.target.value })}
                    placeholder={t.notePlaceholder}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              {/* Review summary cards */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">{t.reviewBadge}</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">মাদরাসা:</span>
                    <span className="font-bold text-slate-800 truncate block">{formData.institutionName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ধরন:</span>
                    <span className="font-bold text-slate-800">{formData.institutionType.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">যোগাযোগ:</span>
                    <span className="font-bold text-slate-800 truncate block">{formData.contactPersonName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ইমেইল:</span>
                    <span className="font-bold text-slate-800 truncate block">{formData.contactEmail}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-emerald-950 font-medium">
                  {t.privacyNotice}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={pending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition min-h-[48px]"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              <span>{t.prevStep}</span>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-800/20 transition min-h-[48px]"
            >
              <span>{t.nextStep}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-900/30 disabled:opacity-50 transition min-h-[48px]"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.submitting}</span>
                </>
              ) : (
                <>
                  <span>{t.submitButton}</span>
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
