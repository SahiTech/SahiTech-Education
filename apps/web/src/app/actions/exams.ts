'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { calculateQawmiDharja, calculateAliaGpa } from '@sahitech/domain';

export interface CreateExamInput {
  nameBn: string;
  nameEn: string;
  termCode: string;
  startDate: string;
  endDate: string;
}

const ALLOWED_TERM_CODES = new Set(['chala_1', 'chala_2', 'chala_3', 'annual', 'semester_1', 'semester_2']);

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function createExam(input: CreateExamInput) {
  try {
    const context = await requirePermission('manage_curriculum');
    const supabase = await createClient();

    if (!input.nameBn?.trim() || !input.nameEn?.trim()) {
      return { success: false, error: 'পরীক্ষার নাম বাংলা ও ইংরেজিতে দিন।' };
    }
    if (!ALLOWED_TERM_CODES.has(input.termCode) || !isValidDate(input.startDate) || !isValidDate(input.endDate) || input.endDate < input.startDate) {
      return { success: false, error: 'পরীক্ষার পর্যায় ও তারিখ যাচাই করুন।' };
    }

    const { data: curYear, error: yearError } = await supabase
      .from('academic_years')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('is_current', true)
      .maybeSingle();

    if (yearError || !curYear) {
      return { success: false, error: 'চলতি শিক্ষাবর্ষ নির্ধারিত নেই।' };
    }

    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        tenant_id: context.tenantId,
        academic_year_id: curYear.id,
        name_bn: input.nameBn.trim(),
        name_en: input.nameEn.trim(),
        term_code: input.termCode,
        start_date: input.startDate,
        end_date: input.endDate,
        is_published: false,
      })
      .select('id')
      .single();

    if (error || !exam) {
      return { success: false, error: 'পরীক্ষা তৈরি করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।' };
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
    revalidatePath('/dashboard/academic/exams');
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

    if (!params.examId || !params.studentId || !params.subjectId) {
      return { success: false, error: 'পরীক্ষা, শিক্ষার্থী ও বিষয় নির্বাচন করুন।' };
    }

    const [{ data: exam, error: examError }, { data: student, error: studentError }, { data: subject, error: subjectError }] = await Promise.all([
      supabase.from('exams')
        .select('id, academic_year_id, is_published')
        .eq('id', params.examId)
        .eq('tenant_id', context.tenantId)
        .maybeSingle(),
      supabase.from('students')
        .select('id')
        .eq('id', params.studentId)
        .eq('tenant_id', context.tenantId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase.from('subjects')
        .select('id, class_id, total_marks, passing_marks')
        .eq('id', params.subjectId)
        .eq('tenant_id', context.tenantId)
        .maybeSingle(),
    ]);

    if (examError || !exam) return { success: false, error: 'নির্বাচিত পরীক্ষা পাওয়া যায়নি।' };
    if (exam.is_published) return { success: false, error: 'প্রকাশিত পরীক্ষার নম্বর আর পরিবর্তন করা যাবে না।' };
    if (studentError || !student) return { success: false, error: 'নির্বাচিত সক্রিয় শিক্ষার্থী পাওয়া যায়নি।' };
    if (subjectError || !subject) return { success: false, error: 'নির্বাচিত বিষয় পাওয়া যায়নি।' };

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('student_enrollments')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('student_id', params.studentId)
      .eq('academic_year_id', exam.academic_year_id)
      .eq('class_id', subject.class_id)
      .eq('is_active', true)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      return { success: false, error: 'এই শিক্ষার্থী নির্বাচিত বিষয়ের জামাতে ভর্তি নেই।' };
    }

    const total = Number(subject.total_marks);
    const passingMarks = Number(subject.passing_marks);
    const obtained = params.isAbsent ? 0 : Number(params.marksObtained);

    if (!Number.isFinite(total) || total <= 0 || !Number.isInteger(passingMarks) || passingMarks < 0 || passingMarks > total) {
      return { success: false, error: 'বিষয়ের পূর্ণমান ও পাস নম্বর সঠিক নয়।' };
    }
    if (!params.isAbsent && (!Number.isFinite(obtained) || obtained < 0 || obtained > total)) {
      return { success: false, error: 'প্রাপ্ত নম্বর ০ থেকে পূর্ণমানের মধ্যে হতে হবে।' };
    }

    const percentage = params.isAbsent ? 0 : (obtained / total) * 100;
    const dharjaObj = calculateQawmiDharja(obtained, total);
    const aliaGpaObj = calculateAliaGpa(percentage);

    const { error } = await supabase
      .from('exam_marks')
      .upsert({
        tenant_id: context.tenantId,
        exam_id: params.examId,
        student_id: params.studentId,
        subject_id: params.subjectId,
        marks_obtained: obtained,
        total_marks: total,
        passing_marks: passingMarks,
        dharja: dharjaObj.dharja as any,
        gpa: aliaGpaObj.gradePoint,
        is_absent: params.isAbsent || false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,exam_id,student_id,subject_id' });

    if (error) {
      return { success: false, error: 'নম্বর সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' };
    }

    revalidatePath('/dashboard/academic');
    revalidatePath('/dashboard/academic/exams');
    return { success: true, dharja: dharjaObj.dharja, gpa: aliaGpaObj.gradePoint };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function publishExamResults(examId: string) {
  try {
    const context = await requirePermission('manage_curriculum');
    const supabase = await createClient();

    if (!examId) return { success: false, error: 'পরীক্ষা নির্বাচন করুন।' };

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, is_published')
      .eq('id', examId)
      .eq('tenant_id', context.tenantId)
      .maybeSingle();

    if (examError || !exam) return { success: false, error: 'পরীক্ষাটি পাওয়া যায়নি।' };
    if (exam.is_published) return { success: false, error: 'এই পরীক্ষার ফলাফল ইতিমধ্যে প্রকাশিত হয়েছে।' };

    const { count, error: marksError } = await supabase
      .from('exam_marks')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', context.tenantId)
      .eq('exam_id', examId);

    if (marksError) return { success: false, error: 'পরীক্ষার নম্বর যাচাই করা যায়নি।' };
    if (!count) return { success: false, error: 'নম্বর এন্ট্রি ছাড়া ফলাফল প্রকাশ করা যাবে না।' };

    const { data: publishedExam, error } = await supabase
      .from('exams')
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq('id', examId)
      .eq('tenant_id', context.tenantId)
      .eq('is_published', false)
      .select('id')
      .maybeSingle();

    if (error || !publishedExam) {
      return { success: false, error: 'ফলাফল প্রকাশ করা যায়নি। পৃষ্ঠাটি রিফ্রেশ করে আবার চেষ্টা করুন।' };
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
    revalidatePath('/dashboard/academic/exams');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}
