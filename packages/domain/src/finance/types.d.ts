export type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type FundClassification = 'general_fund' | 'lillah_zakat_fund' | 'waqf_restricted_fund' | 'building_fund';
export interface Account {
    id: string;
    tenantId: string;
    code: string;
    nameBn: string;
    nameEn: string;
    category: AccountCategory;
    fundType: FundClassification;
    isActive: boolean;
}
export interface JournalEntryLine {
    id?: string;
    journalEntryId?: string;
    accountId: string;
    accountCode?: string;
    debit: number;
    credit: number;
    memo?: string;
}
export interface JournalEntry {
    id: string;
    tenantId: string;
    entryNumber: string;
    entryDate: string;
    fundType: FundClassification;
    narration: string;
    isPosted: boolean;
    postedBy?: string;
    createdAt: string;
    lines: JournalEntryLine[];
}
export interface VoucherInput {
    entryDate: string;
    fundType: FundClassification;
    narration: string;
    lines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        memo?: string;
    }>;
}
