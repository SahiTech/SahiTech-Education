'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { calculateQawmiDharja, calculateAliaGpa } from '@sahitech/domain';

export interface CreateExamInput {
  nameBn: string;
  nameEn: string;
  termCode: string; // chala_1, chala_2, chala_3, annual, semester_1, semester_2
  startDate: string;
  endDate: string;
}

export async function createExam(input: CreateExamInput) {
  try {
    const context = await requirePermission('manage_curriculum');
    const supabase = await createClient();

    // Get current academic year
    const { data: curYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('is_current', true)
      .maybeSingle();

    if (!curYear) {
      return { success: false, error: 'চলতি শিক্ষাবর্ষ নির্ধারিত নেই।' };
    }

    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        tenant_id: context.tenantId,
        academic_year_id: curYear.id,
        name_bn: input.nameBn.trim(),
        name_en: input.nameEn.trim(),
        term_code: input.termCode.trim(),
        start_date: input.startDate,
        end_date: input.endDate,
        is_published: false,
      })
      .select('id')
      .single();

    if (error || !exam) {
      return { success: false, error: `পরীক্ষা তৈরি ব্যর্থ: ${error?.message}` };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'exam.created',
      entityName: 'exams',
      entityId: exam.id,
    });

    revalidatePath('/dashboard/academic');
    return { success: true, examId: exam.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function submitStudentMark(params: {
  examId: string;
  studentId: string;
  subjectId: string;
  marksObtained: number;
  totalMarks?: number;
  isAbsent?: boolean;
}) {
  try {
    const context = await requirePermission('input_marks');
    const supabase = await createClient();

    const total = params.totalMarks || 100;
    const obtained = params.isAbsent ? 0 : Number(params.marksObtained) || 0;

    // Calculate Dharja for Qawmi and GPA for Alia
    const dharjaObj = calculateQawmiDharja(obtained, total);
    const aliaGpaObj = calculateAliaGpa(obtained);

    const { error } = await supabase
      .from('exam_marks')
      .upsert({
        tenant_id: context.tenantId,
        exam_id: params.examId,
        student_id: params.studentId,
        subject_id: params.subjectId,
        marks_obtained: obtained,
        total_marks: total,
        dharja: dharjaObj.dharja as any,
        gpa: aliaGpaObj.gradePoint,
        is_absent: params.isAbsent || false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,exam_id,student_id,subject_id' });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/academic');
    return { success: true, dharja: dharjaObj.dharja, gpa: aliaGpaObj.gradePoint };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function publishExamResults(examId: string) {
  try {
    const context = await requirePermission('manage_curriculum');
    const supabase = await createClient();

    const { error } = await supabase
      .from('exams')
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq('id', examId)
      .eq('tenant_id', context.tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'exam.published',
      entityName: 'exams',
      entityId: examId,
    });

    revalidatePath('/dashboard/academic');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}
