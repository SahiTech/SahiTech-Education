export const QAWMI_MARHALAS = [
    {
        id: 'nurani',
        code: 'NUR',
        levelOrder: 1,
        name: {
            bn: 'নূরানী / মক্তব',
            en: 'Nurani / Maktab',
            ar: 'المكتب النوراني'
        },
        description: {
            bn: 'কুরআন তিলাওয়াত, তাজবীদ ও প্রাথমিক দীনি শিক্ষা',
            en: 'Quran recitation, Tajweed, and fundamental Islamic manners',
            ar: 'تلاوة القرآن الكريم والتجويد والآداب الأساسية'
        },
        canonicalKitabs: ['কায়দা', 'আমপারা', 'নাজেরা', 'জরুরি মাসায়েল']
    },
    {
        id: 'hifz',
        code: 'HFZ',
        levelOrder: 2,
        name: {
            bn: 'হিফজুল কুরআন',
            en: 'Hifzul Quran',
            ar: 'تحفيظ القرآن الكريم'
        },
        description: {
            bn: 'সম্পূর্ণ ৩০ পারা পবিত্র কুরআন হিফজ',
            en: 'Full 30 Juz memorization of the Holy Quran',
            ar: 'حفظ القرآن الكريم كاملاً ثلاثين جزءاً'
        },
        canonicalKitabs: ['সবক', 'সবকি', 'আমপারা/আমোখতা']
    },
    {
        id: 'ibtidaiyyah',
        code: 'IBT',
        levelOrder: 3,
        name: {
            bn: 'মারহালাতুল ইবতিদায়িয়্যাহ',
            en: 'Ibtidaiyyah (Primary Stage)',
            ar: 'المرحلة الابتدائية'
        },
        description: {
            bn: 'প্রাথমিক কিতাব বিভাগ (উর্দু, ফার্সি, আরবি ব্যাকরণ প্রারম্ভিক)',
            en: 'Primary Kitab stage covering basic Arabic, Urdu, Persian, and Fiqh',
            ar: 'المرحلة التمهيدية لدراسة العلوم الشرعية والعربية'
        },
        canonicalKitabs: ['মিযান', 'মুনশাইব', 'তালীমুল ইসলাম', 'কারিমা']
    },
    {
        id: 'mutawassitah',
        code: 'MUT',
        levelOrder: 4,
        name: {
            bn: 'মারহালাতুল মুতাওয়াসসিতাহ',
            en: 'Mutawassitah (Middle Stage)',
            ar: 'المرحلة المتوسطة'
        },
        description: {
            bn: 'নাহবেমীর, হেদায়াতুন্নাহব ও কুদুরী পর্যায়',
            en: 'Intermediate syntax, morphology and foundational jurisprudence',
            ar: 'المرحلة المتوسطة في النحو والصرف والفقه'
        },
        canonicalKitabs: ['নাহবেমীর', 'হেদায়াতুন্নাহব', 'ইলমুস সরফ', 'মুখতাসারুল কুদূরী']
    },
    {
        id: 'sanawiyyah_aammah',
        code: 'SNA',
        levelOrder: 5,
        name: {
            bn: 'মারহালাতুস সানাবিয়্যাহ আল-আম্মাহ',
            en: 'Sanawiyyah Aammah (Secondary Stage)',
            ar: 'المرحلة الثانوية العامة'
        },
        description: {
            bn: 'কাফিয়া, শরহে জামী ও কানযুদ্দাকায়েক',
            en: 'Secondary level classical texts and principles of jurisprudence',
            ar: 'المرحلة الثانوية العامة لدراسة كافية وشرح جامي'
        },
        canonicalKitabs: ['আল-কাফিয়া', 'শরহে জামী', 'কানযুদ্দাকায়েক', 'নূরুল আনওয়ার']
    },
    {
        id: 'sanawiyyah_khassah',
        code: 'SNK',
        levelOrder: 6,
        name: {
            bn: 'মারহালাতুস সানাবিয়্যাহ আল-খাসসাহ',
            en: 'Sanawiyyah Khassah (Higher Secondary)',
            ar: 'المرحلة الثانوية الخاصة'
        },
        description: {
            bn: 'জালালাইন, হেদায়া (আউয়ালাইন) ও মুখতাসারুল মাআনী',
            en: 'Higher secondary stage: Tafseer Jalalayn, Hidayah 1st part, Rhetoric',
            ar: 'المرحلة الثانوية الخاصة: تفسير الجلالين والهداية'
        },
        canonicalKitabs: ['তফসীরে জালালাইন', 'আল-হেদায়া (আউয়ালাইন)', 'মুখতাসারুল মাআনী', 'উসূলুশ শাশী']
    },
    {
        id: 'fazilat',
        code: 'FAZ',
        levelOrder: 7,
        name: {
            bn: 'মারহালাতুল ফযীলত',
            en: 'Fazilat (Graduate Stage / Mishkat)',
            ar: 'مرحلة الفضيلة (المشكاة)'
        },
        description: {
            bn: 'মিশকাতুল মাসাবীহ ও হেদায়া সালাইস/রাবে',
            en: 'Graduate Hadith stage: Mishkat al-Masabih and advanced jurisprudence',
            ar: 'مرحلة الفضيلة: دراسة مشكاة المصابيح والهداية الأخيرة'
        },
        canonicalKitabs: ['মিশকাতুল মাসাবীহ', 'আল-হেদায়া (সালাইস ও রাবে)', 'শরহুল আকাঈদ', 'সিরাজী']
    },
    {
        id: 'takmil_dawra',
        code: 'TAK',
        levelOrder: 8,
        name: {
            bn: 'দাওরায়ে হাদীস (তাকমীল)',
            en: 'Dawra-e-Hadith (Takmil / Master Level Equivalent)',
            ar: 'مرحلة التكميل (دورة الحديث الشريف)'
        },
        description: {
            bn: 'সিহাহ সিত্তাহ হাদীস পাঠ ও সমাপ্তি (মাস্টার্স সমমান)',
            en: 'Comprehensive study of Kutub al-Sittah (Sihah Sittah) Hadith canons',
            ar: 'دراسة كتب الصحاح الستة في الحديث النبوي الشريف'
        },
        canonicalKitabs: [
            'সহীহুল বুখারী (১ম ও ২য় খণ্ড)',
            'সহীহ মুসলিম (১ম ও ২য় খণ্ড)',
            'জামেউত তিরমিযী',
            'সুনানে আবু দাউদ',
            'সুনানে নাসাঈ',
            'সুনানে ইবনে মাজাহ',
            'তাহাবী শরীফ',
            'মুয়াত্তা ইমাম মালিক',
            'মুয়াত্তা ইমাম মুহাম্মদ'
        ]
    },
    {
        id: 'ifta_takhassus',
        code: 'IFT',
        levelOrder: 9,
        name: {
            bn: 'তাখাসসুস ফিল ইফতা (উচ্চতর গবেষণা)',
            en: 'Takhassus fil Ifta (Postgraduate Islamic Jurisprudence)',
            ar: 'التخصص في الإفتاء والدراسات الإسلامية العليا'
        },
        description: {
            bn: 'উচ্চতর ফিকহ ও ফতোয়া প্রশিক্ষণ বিভাগ',
            en: 'Postgraduate specialization in Fatwa research and Islamic rulings',
            ar: 'التخصص العالي في الفقه الإسلامي وبحوث الفتاوى'
        },
        canonicalKitabs: ['রমজুদ্দাকায়েক', 'আল-আশবাহ ওয়ান-নাজায়ের', 'উসূলুল ইফতা', 'ফাতাওয়া শামী']
    }
];
export function calculateQawmiGrade(percentage) {
    if (percentage >= 80)
        return 'mumtaz';
    if (percentage >= 65)
        return 'jayyid_jiddan';
    if (percentage >= 50)
        return 'jayyid';
    if (percentage >= 33)
        return 'maqbool';
    return 'rasib';
}
export function getQawmiGradeLabel(grade, locale = 'bn') {
    const labels = {
        mumtaz: { bn: 'মুমতাজ (প্রথম বিভাগ স্টার)', en: 'Mumtaz (Distinction)', ar: 'ممتاز' },
        jayyid_jiddan: { bn: 'জায়্যিদ জিদ্দান (প্রথম বিভাগ)', en: 'Jayyid Jiddan (Very Good)', ar: 'جيد جداً' },
        jayyid: { bn: 'জায়্যিদ (দ্বিতীয় বিভাগ)', en: 'Jayyid (Good)', ar: 'جيد' },
        maqbool: { bn: 'মাকবুল (উত্তীর্ণ)', en: 'Maqbool (Pass)', ar: 'مقبول' },
        rasib: { bn: 'রাসিব (অনুত্তীর্ণ)', en: 'Rasib (Fail)', ar: 'راسب' },
    };
    return labels[grade][locale];
}
