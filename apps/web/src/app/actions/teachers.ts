'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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



export async function linkTeacherAccount(params: { teacherId: string; email: string }) {
  try {
    const context = await requirePermission('manage_tenant_settings');
    const email = params.email?.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || !/^[0-9a-f-]{36}$/i.test(params.teacherId || '')) {
      return { success: false, error: 'শিক্ষক ও সঠিক ইমেইল নির্বাচন করুন।' };
    }

    const supabase = await createClient();
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id,email,user_id,is_active')
      .eq('id', params.teacherId)
      .eq('tenant_id', context.tenantId)
      .maybeSingle();

    if (teacherError || !teacher || teacher.is_active !== true) {
      return { success: false, error: 'সক্রিয় শিক্ষক রেকর্ড পাওয়া যায়নি।' };
    }
    if (!teacher.email || teacher.email.trim().toLowerCase() !== email) {
      return { success: false, error: 'শিক্ষক রেকর্ডে থাকা ইমেইলের সঙ্গে মিল নেই। আগে শিক্ষক তথ্য আপডেট করুন।' };
    }
    if (teacher.user_id) {
      return { success: false, error: 'এই শিক্ষক রেকর্ডে ইতিমধ্যে একটি Login Account যুক্ত আছে।' };
    }

    const admin = createAdminClient();
    let matchedUser: { id: string; email?: string; email_confirmed_at?: string | null } | null = null;
    for (let page = 1; page <= 10 && !matchedUser; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return { success: false, error: 'Auth Account যাচাই করা যায়নি। সার্ভার কনফিগারেশন পরীক্ষা করুন।' };
      matchedUser = (data.users || []).find((user) => user.email?.trim().toLowerCase() === email) || null;
      if ((data.users || []).length < 1000) break;
    }

    if (!matchedUser) {
      return { success: false, error: 'এই ইমেইলে আগে MDI Login Account তৈরি করতে হবে। Account তৈরি হলে আবার Link করুন।' };
    }
    if (!matchedUser.email_confirmed_at) {
      return { success: false, error: 'নিরাপত্তার জন্য আগে এই Account-এর ইমেইল যাচাই সম্পন্ন করতে হবে।' };
    }

    const { error: linkError } = await (supabase.rpc as any)('admin_link_teacher_account', {
      p_tenant_id: context.tenantId,
      p_teacher_id: teacher.id,
      p_user_id: matchedUser.id,
    });
    if (linkError) {
      const known = linkError.message || '';
      const messages: Record<string, string> = {
        teacher_email_mismatch: 'শিক্ষক ও Login Account-এর ইমেইল এক নয়।',
        teacher_already_linked: 'এই শিক্ষক রেকর্ডে অন্য Account যুক্ত আছে।',
        user_already_linked_to_another_teacher: 'এই Account অন্য শিক্ষক রেকর্ডে যুক্ত আছে।',
        user_has_conflicting_tenant_role: 'এই Account-এর প্রতিষ্ঠানে অন্য Role আছে; নিরাপদে স্বয়ংক্রিয়ভাবে পরিবর্তন করা যাবে না।',
        verified_user_email_required: 'যাচাইকৃত ইমেইল Account প্রয়োজন।',
      };
      const code = Object.keys(messages).find((key) => known.includes(key));
      return { success: false, error: code ? messages[code] : 'শিক্ষক Login Account যুক্ত করা যায়নি।' };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'teacher.account_linked',
      entityName: 'teachers',
      entityId: teacher.id,
      newState: { linkedUserId: matchedUser.id, email },
    });
    revalidatePath('/dashboard/teachers');
    revalidatePath('/portals/faculty');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Teacher account linking failed.' };
  }
}

export async function assignTeacherToSection(params: {
  teacherId: string;
  classId: string;
  sectionId: string;
  subjectId?: string;
}) {
  try {
    const context = await requirePermission('manage_tenant_settings');
    const uuid = /^[0-9a-f-]{36}$/i;
    if (!uuid.test(params.teacherId || '') || !uuid.test(params.classId || '') || !uuid.test(params.sectionId || '') || (params.subjectId && !uuid.test(params.subjectId))) {
      return { success: false, error: 'শিক্ষক, জামাত, সেকশন ও বিষয় সঠিকভাবে নির্বাচন করুন।' };
    }
    const supabase = await createClient();
    const [{ data: year }, { data: teacher }, { data: section }] = await Promise.all([
      supabase.from('academic_years').select('id').eq('tenant_id', context.tenantId).eq('is_current', true).maybeSingle(),
      supabase.from('teachers').select('id,user_id,is_active').eq('id', params.teacherId).eq('tenant_id', context.tenantId).maybeSingle(),
      supabase.from('sections').select('id,class_id').eq('id', params.sectionId).eq('tenant_id', context.tenantId).maybeSingle(),
    ]);
    if (!year) return { success: false, error: 'চলতি শিক্ষাবর্ষ নির্ধারিত নেই।' };
    if (!teacher || !teacher.user_id || teacher.is_active !== true) return { success: false, error: 'শিক্ষকের সক্রিয় Login Account আগে যুক্ত করুন।' };
    if (!section || section.class_id !== params.classId) return { success: false, error: 'নির্বাচিত সেকশনটি এই জামাতের নয়।' };

    if (params.subjectId) {
      const { data: subject } = await supabase.from('subjects').select('id').eq('id', params.subjectId).eq('class_id', params.classId).eq('tenant_id', context.tenantId).maybeSingle();
      if (!subject) return { success: false, error: 'বিষয়টি নির্বাচিত জামাতের অন্তর্ভুক্ত নয়।' };
    }

    const { error } = await supabase.from('teacher_class_assignments').insert({
      tenant_id: context.tenantId,
      teacher_id: params.teacherId,
      academic_year_id: year.id,
      class_id: params.classId,
      section_id: params.sectionId,
      subject_id: params.subjectId || null,
      assigned_by: context.userId,
      is_active: true,
    });
    if (error) {
      if (error.code === '23505') return { success: false, error: 'এই শিক্ষককে একই সেকশন/বিষয়ে আগে থেকেই দায়িত্ব দেওয়া হয়েছে।' };
      return { success: false, error: 'শিক্ষক অ্যাসাইনমেন্ট সংরক্ষণ করা যায়নি।' };
    }
    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'teacher.assignment_created',
      entityName: 'teacher_class_assignments',
      entityId: params.teacherId,
      newState: { classId: params.classId, sectionId: params.sectionId, subjectId: params.subjectId || null, academicYearId: year.id },
    });
    revalidatePath('/dashboard/teachers');
    revalidatePath('/portals/faculty');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Teacher assignment failed.' };
  }
}

export async function removeTeacherAssignment(assignmentId: string) {
  try {
    const context = await requirePermission('manage_tenant_settings');
    if (!/^[0-9a-f-]{36}$/i.test(assignmentId || '')) return { success: false, error: 'অ্যাসাইনমেন্ট আইডি সঠিক নয়।' };
    const supabase = await createClient();
    const { error } = await supabase.from('teacher_class_assignments').delete().eq('id', assignmentId).eq('tenant_id', context.tenantId);
    if (error) return { success: false, error: 'শিক্ষক অ্যাসাইনমেন্ট বাতিল করা যায়নি।' };
    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'teacher.assignment_removed',
      entityName: 'teacher_class_assignments',
      entityId: assignmentId,
    });
    revalidatePath('/dashboard/teachers');
    revalidatePath('/portals/faculty');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Teacher assignment removal failed.' };
  }
}
