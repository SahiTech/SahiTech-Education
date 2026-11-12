import { JournalEntryLine, FundClassification, Account } from './types';
export interface ValidationResult {
    isValid: boolean;
    totalDebit: number;
    totalCredit: number;
    imbalance: number;
    errors: string[];
}
/**
 * Validates double-entry invariants according to Document 26:
 * 1. At least two lines required (one debit, one credit).
 * 2. Sum(Debits) must exactly equal Sum(Credits).
 * 3. Individual line amounts must be strictly non-negative and mutually exclusive (debit OR credit).
 */
export declare function validateJournalEntry(lines: JournalEntryLine[]): ValidationResult;
/**
 * Validates Shariah Fund Segregation:
 * Ensures all accounts referenced in a voucher belong to the voucher's designated fund_type.
 * Prevents commingling between general institutional funds and Zakat/Lillah funds.
 */
export declare function validateFundSegregation(voucherFund: FundClassification, lines: Array<{
    accountId: string;
}>, accountMap: Map<string, Account>): {
    isSegregated: boolean;
    violationErrors: string[];
};
export declare const STANDARD_CHART_OF_ACCOUNTS: readonly [{
    readonly code: "1001";
    readonly nameBn: "নগদ ক্যাশ (প্রধান কাউন্টার)";
    readonly nameEn: "Cash on Hand - Main Counter";
    readonly category: "asset";
    readonly fundType: "general_fund";
}, {
    readonly code: "1002";
    readonly nameBn: "সোনালী ব্যাংক সাধারণ একাউন্ট";
    readonly nameEn: "Sonali Bank - General Account";
    readonly category: "asset";
    readonly fundType: "general_fund";
}, {
    readonly code: "1003";
    readonly nameBn: "ইসলামী ব্যাংক যাকাত ও লিল্লাহ ফান্ড";
    readonly nameEn: "Islami Bank - Zakat & Lillah Fund";
    readonly category: "asset";
    readonly fundType: "lillah_zakat_fund";
}, {
    readonly code: "1004";
    readonly nameBn: "নগদ ক্যাশ (লিল্লাহ বোর্ডিং)";
    readonly nameEn: "Cash on Hand - Lillah Boarding";
    readonly category: "asset";
    readonly fundType: "lillah_zakat_fund";
}, {
    readonly code: "1005";
    readonly nameBn: "ওয়াকফ সম্পত্তি ও ইমারত তহবিল";
    readonly nameEn: "Waqf Building Fund Account";
    readonly category: "asset";
    readonly fundType: "waqf_restricted_fund";
}, {
    readonly code: "2001";
    readonly nameBn: "বকেয়া বিল ও সরবরাহকারী প্রদেয়";
    readonly nameEn: "Accounts Payable";
    readonly category: "liability";
    readonly fundType: "general_fund";
}, {
    readonly code: "2002";
    readonly nameBn: "শিক্ষার্থী জামানত (ফেরতযোগ্য)";
    readonly nameEn: "Student Caution Deposit";
    readonly category: "liability";
    readonly fundType: "general_fund";
}, {
    readonly code: "3001";
    readonly nameBn: "সাধারণ প্রাতিষ্ঠানিক তহবিল স্থিতি";
    readonly nameEn: "General Accumulated Fund";
    readonly category: "equity";
    readonly fundType: "general_fund";
}, {
    readonly code: "3002";
    readonly nameBn: "লিল্লাহ বোর্ডিং ও যাকাত তহবিল স্থিতি";
    readonly nameEn: "Lillah & Zakat Restricted Reserve";
    readonly category: "equity";
    readonly fundType: "lillah_zakat_fund";
}, {
    readonly code: "4001";
    readonly nameBn: "শিক্ষার্থী মাসিক বেতন আদায়";
    readonly nameEn: "Student Monthly Tuition Revenue";
    readonly category: "revenue";
    readonly fundType: "general_fund";
}, {
    readonly code: "4002";
    readonly nameBn: "নতুন ভর্তি ফি আদায়";
    readonly nameEn: "Admission Fee Revenue";
    readonly category: "revenue";
    readonly fundType: "general_fund";
}, {
    readonly code: "4003";
    readonly nameBn: "পরীক্ষা ও সনদ ফি";
    readonly nameEn: "Examination & Sanad Fees";
    readonly category: "revenue";
    readonly fundType: "general_fund";
}, {
    readonly code: "4004";
    readonly nameBn: "যাকাত ও ফিতরাহ বাবদ প্রাপ্তি";
    readonly nameEn: "Zakat & Fitrah Inflows";
    readonly category: "revenue";
    readonly fundType: "lillah_zakat_fund";
}, {
    readonly code: "4005";
    readonly nameBn: "লিল্লাহ খোরাকি ও দান অনুদান";
    readonly nameEn: "Lillah Boarding Public Donations";
    readonly category: "revenue";
    readonly fundType: "lillah_zakat_fund";
}, {
    readonly code: "4006";
    readonly nameBn: "সাধারণ দান বাক্স ও এককালীন অনুদান";
    readonly nameEn: "General Donation Box Receipts";
    readonly category: "revenue";
    readonly fundType: "general_fund";
}, {
    readonly code: "5001";
    readonly nameBn: "আসতিযা ও স্টাফ মাসিক বেতন";
    readonly nameEn: "Teacher & Staff Salaries";
    readonly category: "expense";
    readonly fundType: "general_fund";
}, {
    readonly code: "5002";
    readonly nameBn: "লিল্লাহ বোর্ডিং খাদ্য ও কাঁচা বাজার";
    readonly nameEn: "Lillah Boarding Groceries & Food";
    readonly category: "expense";
    readonly fundType: "lillah_zakat_fund";
}, {
    readonly code: "5003";
    readonly nameBn: "বিদ্যুৎ, গ্যাস ও পানির বিল";
    readonly nameEn: "Utilities (Electricity & Gas)";
    readonly category: "expense";
    readonly fundType: "general_fund";
}, {
    readonly code: "5004";
    readonly nameBn: "কিতাব, খাতা ও শিক্ষা উপকরণ ব্যয়";
    readonly nameEn: "Books & Educational Materials";
    readonly category: "expense";
    readonly fundType: "general_fund";
}, {
    readonly code: "5005";
    readonly nameBn: "চিকিৎসা ও ওষুধ বাবদ ব্যয় (লিল্লাহ)";
    readonly nameEn: "Student Medical Expenses (Lillah)";
    readonly category: "expense";
    readonly fundType: "lillah_zakat_fund";
}];
