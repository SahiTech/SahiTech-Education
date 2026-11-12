'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';

export async function getExecutiveOverviewReport() {
  const context = await requirePermission('view_financial_reports');
  const supabase = await createClient();

  const [
    studentsRes,
    teachersRes,
    residentialRes,
    lillahRes,
    invoicesRes,
    accountsRes,
  ] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('tenant_id', context.tenantId),
    supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('tenant_id', context.tenantId),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('tenant_id', context.tenantId).eq('is_residential', true),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('tenant_id', context.tenantId).eq('is_lillah_boarder', true),
    supabase.from('fee_invoices').select('amount, paid_amount, status').eq('tenant_id', context.tenantId),
    supabase.from('accounts').select('id, code, name_bn, category, fund_type').eq('tenant_id', context.tenantId),
  ]);

  const totalInvoiced = (invoicesRes.data || []).reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  const totalCollected = (invoicesRes.data || []).reduce((acc, inv) => acc + (Number(inv.paid_amount) || 0), 0);
  const totalReceivable = Math.max(0, totalInvoiced - totalCollected);

  return {
    totalStudents: studentsRes.count ?? 0,
    totalTeachers: teachersRes.count ?? 0,
    residentialStudents: residentialRes.count ?? 0,
    lillahBoarders: lillahRes.count ?? 0,
    totalInvoiced,
    totalCollected,
    totalReceivable,
    accountsCount: accountsRes.data?.length ?? 0,
  };
}

export async function getBefaqBoardReturn() {
  const context = await requirePermission('manage_curriculum');
  const supabase = await createClient();

  const [tenantRes, classesRes, studentsRes] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', context.tenantId).single(),
    supabase.from('classes').select('*').eq('tenant_id', context.tenantId).order('level_order'),
    supabase.from('students').select('id, admission_no, full_name_bn, full_name_en, father_name_bn, date_of_birth, is_residential, is_lillah_boarder').eq('tenant_id', context.tenantId),
  ]);

  return {
    tenant: tenantRes.data,
    classes: classesRes.data || [],
    students: studentsRes.data || [],
    generatedAt: new Date().toISOString(),
  };
}

