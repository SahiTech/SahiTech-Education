'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import {
  validateJournalEntry,
  validateFundSegregation,
  STANDARD_CHART_OF_ACCOUNTS,
  FundClassification,
  Account,
} from '@sahitech/domain';

export async function initializeDefaultChartOfAccounts() {
  try {
    const context = await requirePermission('manage_fees');
    const supabase = await createClient();

    for (const acc of STANDARD_CHART_OF_ACCOUNTS) {
      await supabase.from('accounts').upsert({
        tenant_id: context.tenantId,
        code: acc.code,
        name_bn: acc.nameBn,
        name_en: acc.nameEn,
        category: acc.category,
        fund_type: acc.fundType,
        is_active: true,
      }, { onConflict: 'tenant_id,code' });
    }

    revalidatePath('/dashboard/finance');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export interface JournalVoucherInput {
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

export async function createJournalVoucher(input: JournalVoucherInput) {
  try {
    const context = await requirePermission('collect_payments');
    const supabase = await createClient();

    // 1. Validate Double-Entry Invariants
    const balanceCheck = validateJournalEntry(input.lines);
    if (!balanceCheck.isValid) {
      return { success: false, error: balanceCheck.errors.join(' | ') };
    }

    // 2. Fetch Accounts and Validate Fund Segregation (Doc 26)
    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('tenant_id', context.tenantId);

    const accountMap = new Map<string, Account>((accounts || []).map((a) => [a.id, a as Account]));

    const segregationCheck = validateFundSegregation(input.fundType, input.lines, accountMap);
    if (!segregationCheck.isSegregated) {
      return { success: false, error: segregationCheck.violationErrors.join(' | ') };
    }

    const entryNumber = `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Insert Journal Entry Header
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        tenant_id: context.tenantId,
        entry_number: entryNumber,
        entry_date: input.entryDate || new Date().toISOString().split('T')[0],
        fund_type: input.fundType,
        narration: input.narration.trim(),
        is_posted: true,
        posted_by: context.userId,
      })
      .select('id, entry_number')
      .single();

    if (entryError || !entry) {
      return { success: false, error: `ভাউচার তৈরি ব্যর্থ: ${entryError?.message}` };
    }

    // 4. Insert Journal Entry Lines
    const linesToInsert = input.lines.map((l) => ({
      journal_entry_id: entry.id,
      account_id: l.accountId,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      memo: l.memo?.trim() || null,
    }));

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(linesToInsert);

    if (linesError) {
      return { success: false, error: `ভাউচার লাইন সংরক্ষণ ব্যর্থ: ${linesError.message}` };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'finance.voucher_posted',
      entityName: 'journal_entries',
      entityId: entry.id,
      newState: { entryNumber: entry.entry_number, totalAmount: balanceCheck.totalDebit, fund: input.fundType },
    });

    revalidatePath('/dashboard/finance');
    return { success: true, entryId: entry.id, entryNumber: entry.entry_number };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function collectFeePayment(params: {
  studentId: string;
  feeCategoryId: string;
  amount: number;
  notes?: string;
}) {
  try {
    const context = await requirePermission('collect_payments');
    const supabase = await createClient();

    const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    // 1. Insert Fee Invoice marked paid
    const { data: inv, error: invError } = await supabase
      .from('fee_invoices')
      .insert({
        tenant_id: context.tenantId,
        student_id: params.studentId,
        fee_category_id: params.feeCategoryId,
        invoice_number: invoiceNo,
        amount: params.amount,
        paid_amount: params.amount,
        discount_amount: 0,
        due_date: today,
        status: 'paid',
        notes: params.notes?.trim() || null,
      })
      .select('id, invoice_number')
      .single();

    if (invError || !inv) {
      return { success: false, error: `ফি আদায় ব্যর্থ: ${invError?.message}` };
    }

    // 2. Fetch or seed Cash account (1001) & Fee revenue account (4001) for balancing entry
    const { data: cashAcc } = await supabase
      .from('accounts')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('code', '1001')
      .maybeSingle();

    const { data: revAcc } = await supabase
      .from('accounts')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('code', '4001')
      .maybeSingle();

    // If accounts exist, create balancing journal entry automatically
    if (cashAcc && revAcc) {
      await createJournalVoucher({
        entryDate: today,
        fundType: 'general_fund',
        narration: `শিক্ষার্থী ফি আদায়: রশিদ নং ${inv.invoice_number}`,
        lines: [
          { accountId: cashAcc.id, debit: params.amount, credit: 0, memo: `রশিদ নং ${inv.invoice_number} ক্যাশ গ্রহণ` },
          { accountId: revAcc.id, debit: 0, credit: params.amount, memo: `মাসিক ফি বাবদ আয়` },
        ],
      });
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'finance.fee_collected',
      entityName: 'fee_invoices',
      entityId: inv.id,
      newState: { invoiceNumber: inv.invoice_number, amount: params.amount },
    });

    revalidatePath('/dashboard/finance');
    return { success: true, invoiceNumber: inv.invoice_number };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

