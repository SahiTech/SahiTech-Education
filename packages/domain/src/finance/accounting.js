"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_CHART_OF_ACCOUNTS = void 0;
exports.validateJournalEntry = validateJournalEntry;
exports.validateFundSegregation = validateFundSegregation;
/**
 * Validates double-entry invariants according to Document 26:
 * 1. At least two lines required (one debit, one credit).
 * 2. Sum(Debits) must exactly equal Sum(Credits).
 * 3. Individual line amounts must be strictly non-negative and mutually exclusive (debit OR credit).
 */
function validateJournalEntry(lines) {
    const errors = [];
    if (!lines || lines.length < 2) {
        errors.push('জাবেদা এন্ট্রিতে কমপক্ষে দুটি হিসাব লাইন আবশ্যক (At least two ledger lines required).');
    }
    let totalDebit = 0;
    let totalCredit = 0;
    let hasDebit = false;
    let hasCredit = false;
    for (let i = 0; i < (lines || []).length; i++) {
        const line = lines[i];
        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;
        if (debit < 0 || credit < 0) {
            errors.push(`লাইন নং ${i + 1}: ডেবিট বা ক্রেডিট ঋণাত্মক হতে পারবে না।`);
        }
        if (debit > 0 && credit > 0) {
            errors.push(`লাইন নং ${i + 1}: একই লাইনে ডেবিট এবং ক্রেডিট উভয়ই থাকতে পারবে না।`);
        }
        if (debit === 0 && credit === 0) {
            errors.push(`লাইন নং ${i + 1}: ডেবিট অথবা ক্রেডিট পরিমাণ শূন্যের অধিক হতে হবে।`);
        }
        if (debit > 0)
            hasDebit = true;
        if (credit > 0)
            hasCredit = true;
        totalDebit += debit;
        totalCredit += credit;
    }
    if (!hasDebit || !hasCredit) {
        errors.push('জাবেদায় কমপক্ষে একটি ডেবিট এবং একটি ক্রেডিট থাকা আবশ্যক।');
    }
    // Rounded to 2 decimal places to avoid floating point precision issues
    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;
    const imbalance = Math.abs(roundedDebit - roundedCredit);
    if (imbalance > 0.001) {
        errors.push(`জাবেদা অসমতুল্য! মোট ডেবিট (৳${roundedDebit}) মোট ক্রেডিটের (৳${roundedCredit}) সমান নয়।`);
    }
    return {
        isValid: errors.length === 0,
        totalDebit: roundedDebit,
        totalCredit: roundedCredit,
        imbalance,
        errors,
    };
}
/**
 * Validates Shariah Fund Segregation:
 * Ensures all accounts referenced in a voucher belong to the voucher's designated fund_type.
 * Prevents commingling between general institutional funds and Zakat/Lillah funds.
 */
function validateFundSegregation(voucherFund, lines, accountMap) {
    const violationErrors = [];
    for (const line of lines) {
        const acc = accountMap.get(line.accountId);
        if (!acc)
            continue;
        if (acc.fundType !== voucherFund) {
            violationErrors.push(`তহবিল লঙ্ঘন: হিসাব '${acc.nameBn}' (${acc.code}) তহবিল '${acc.fundType}'-এর অন্তর্ভুক্ত, যা চলতি ভাউচারের '${voucherFund}'-এর সাথে মিশ্রণ করা যাবে না (Doc 26 Segregation Rule).`);
        }
    }
    return {
        isSegregated: violationErrors.length === 0,
        violationErrors,
    };
}
exports.STANDARD_CHART_OF_ACCOUNTS = [
    // 1000s: Assets
    { code: '1001', nameBn: 'নগদ ক্যাশ (প্রধান কাউন্টার)', nameEn: 'Cash on Hand - Main Counter', category: 'asset', fundType: 'general_fund' },
    { code: '1002', nameBn: 'সোনালী ব্যাংক সাধারণ একাউন্ট', nameEn: 'Sonali Bank - General Account', category: 'asset', fundType: 'general_fund' },
    { code: '1003', nameBn: 'ইসলামী ব্যাংক যাকাত ও লিল্লাহ ফান্ড', nameEn: 'Islami Bank - Zakat & Lillah Fund', category: 'asset', fundType: 'lillah_zakat_fund' },
    { code: '1004', nameBn: 'নগদ ক্যাশ (লিল্লাহ বোর্ডিং)', nameEn: 'Cash on Hand - Lillah Boarding', category: 'asset', fundType: 'lillah_zakat_fund' },
    { code: '1005', nameBn: 'ওয়াকফ সম্পত্তি ও ইমারত তহবিল', nameEn: 'Waqf Building Fund Account', category: 'asset', fundType: 'waqf_restricted_fund' },
    // 2000s: Liabilities
    { code: '2001', nameBn: 'বকেয়া বিল ও সরবরাহকারী প্রদেয়', nameEn: 'Accounts Payable', category: 'liability', fundType: 'general_fund' },
    { code: '2002', nameBn: 'শিক্ষার্থী জামানত (ফেরতযোগ্য)', nameEn: 'Student Caution Deposit', category: 'liability', fundType: 'general_fund' },
    // 3000s: Equity & Net Assets
    { code: '3001', nameBn: 'সাধারণ প্রাতিষ্ঠানিক তহবিল স্থিতি', nameEn: 'General Accumulated Fund', category: 'equity', fundType: 'general_fund' },
    { code: '3002', nameBn: 'লিল্লাহ বোর্ডিং ও যাকাত তহবিল স্থিতি', nameEn: 'Lillah & Zakat Restricted Reserve', category: 'equity', fundType: 'lillah_zakat_fund' },
    // 4000s: Revenue
    { code: '4001', nameBn: 'শিক্ষার্থী মাসিক বেতন আদায়', nameEn: 'Student Monthly Tuition Revenue', category: 'revenue', fundType: 'general_fund' },
    { code: '4002', nameBn: 'নতুন ভর্তি ফি আদায়', nameEn: 'Admission Fee Revenue', category: 'revenue', fundType: 'general_fund' },
    { code: '4003', nameBn: 'পরীক্ষা ও সনদ ফি', nameEn: 'Examination & Sanad Fees', category: 'revenue', fundType: 'general_fund' },
    { code: '4004', nameBn: 'যাকাত ও ফিতরাহ বাবদ প্রাপ্তি', nameEn: 'Zakat & Fitrah Inflows', category: 'revenue', fundType: 'lillah_zakat_fund' },
    { code: '4005', nameBn: 'লিল্লাহ খোরাকি ও দান অনুদান', nameEn: 'Lillah Boarding Public Donations', category: 'revenue', fundType: 'lillah_zakat_fund' },
    { code: '4006', nameBn: 'সাধারণ দান বাক্স ও এককালীন অনুদান', nameEn: 'General Donation Box Receipts', category: 'revenue', fundType: 'general_fund' },
    // 5000s: Expenses
    { code: '5001', nameBn: 'আসতিযা ও স্টাফ মাসিক বেতন', nameEn: 'Teacher & Staff Salaries', category: 'expense', fundType: 'general_fund' },
    { code: '5002', nameBn: 'লিল্লাহ বোর্ডিং খাদ্য ও কাঁচা বাজার', nameEn: 'Lillah Boarding Groceries & Food', category: 'expense', fundType: 'lillah_zakat_fund' },
    { code: '5003', nameBn: 'বিদ্যুৎ, গ্যাস ও পানির বিল', nameEn: 'Utilities (Electricity & Gas)', category: 'expense', fundType: 'general_fund' },
    { code: '5004', nameBn: 'কিতাব, খাতা ও শিক্ষা উপকরণ ব্যয়', nameEn: 'Books & Educational Materials', category: 'expense', fundType: 'general_fund' },
    { code: '5005', nameBn: 'চিকিৎসা ও ওষুধ বাবদ ব্যয় (লিল্লাহ)', nameEn: 'Student Medical Expenses (Lillah)', category: 'expense', fundType: 'lillah_zakat_fund' },
];
