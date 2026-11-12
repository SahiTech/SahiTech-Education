'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export interface AddTeacherInput {
  fullNameBn: string;
  fullNameEn: string;
  designation: string;
  qualification: string;
  phone: string;
  email?: string;
  joiningDate?: string;
}

export async function addTeacher(input: AddTeacherInput) {
  try {
    const context = await requirePermission('manage_tenant_settings');
    const supabase = await createClient();

    const empId = `EMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: teacher, error } = await supabase
      .from('teachers')
      .insert({
        tenant_id: context.tenantId,
        employee_id: empId,
        full_name_bn: input.fullNameBn.trim(),
        full_name_en: input.fullNameEn.trim(),
        designation: input.designation.trim(),
        qualification: input.qualification.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        joining_date: input.joiningDate || new Date().toISOString().split('T')[0],
        is_active: true,
      })
      .select('id')
      .single();

    if (error || !teacher) {
      return { success: false, error: `উস্তাদ অন্তর্ভুক্তি ব্যর্থ: ${error?.message}` };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'teacher.created',
      entityName: 'teachers',
      entityId: teacher.id,
    });

    revalidatePath('/dashboard/teachers');
    return { success: true, teacherId: teacher.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function submitStaffLeave(params: {
  teacherId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}) {
  try {
    const context = await requirePermission('manage_tenant_settings');
    const supabase = await createClient();

    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

    const { data: leave, error } = await supabase
      .from('staff_leaves')
      .insert({
        tenant_id: context.tenantId,
        teacher_id: params.teacherId,
        leave_type: params.leaveType,
        start_date: params.startDate,
        end_date: params.endDate,
        days_count: days,
        reason: params.reason.trim(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !leave) {
      return { success: false, error: error?.message };
    }

    revalidatePath('/dashboard/teachers');
    return { success: true, leaveId: leave.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected') {
  try {
    const context = await requirePermission('manage_tenant_settings');
    const supabase = await createClient();

    const { error } = await supabase
      .from('staff_leaves')
      .update({
        status,
        approved_by: context.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .eq('tenant_id', context.tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: `leave.${status}`,
      entityName: 'staff_leaves',
      entityId: leaveId,
    });

    revalidatePath('/dashboard/teachers');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}
