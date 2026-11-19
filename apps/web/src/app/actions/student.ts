'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export interface CreateStudentInput {
  fullNameBn: string;
  fullNameEn: string;
  admissionNo: string;
  guardianPhone: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  bloodGroup?: string;
  fatherNameBn?: string;
  fatherNameEn?: string;
  motherNameBn?: string;
  presentAddress?: string;
  permanentAddress?: string;
  isResidential: boolean;
  isLillahBoarder: boolean;
  classId?: string;
  sectionId?: string;
  rollNo?: number;
}

export interface StudentActionResult {
  success: boolean;
  error?: string;
  studentId?: string;
}

export async function createStudent(input: CreateStudentInput): Promise<StudentActionResult> {
  try {
    // 1. Authorize user against tenant context and required permission
    const context = await requirePermission('manage_admissions');
    const supabase = await createClient();

    // 2. Validate input
    if (!input.fullNameBn?.trim() || !input.fullNameEn?.trim()) {
      return { success: false, error: 'শিক্ষার্থীর পূর্ণ নাম (বাংলা ও ইংরেজি) আবশ্যক।' };
    }

    if (!input.admissionNo?.trim()) {
      return { success: false, error: 'ভর্তি / দাখেলা নম্বর আবশ্যক।' };
    }

    if (!input.guardianPhone?.trim()) {
      return { success: false, error: 'অভিভাবকের মোবাইল নম্বর আবশ্যক।' };
    }

    // Validate a requested class enrollment before creating the student.
    // Both class and section are required by student_enrollments; section and
    // roll number are checked against the current tenant/year before INSERT.
    let enrollment: { academicYearId: string; classId: string; sectionId: string; rollNo: number } | null = null;
    if (input.classId || input.sectionId) {
      if (!input.classId || !input.sectionId || !Number.isSafeInteger(input.rollNo) || (input.rollNo ?? 0) < 1) {
        return { success: false, error: 'ক্লাসে ভর্তি করতে জামাত, সেকশন ও সঠিক রোল নম্বর নির্বাচন করুন।' };
      }

      const [{ data: section, error: sectionError }, { data: currentYear, error: yearError }] = await Promise.all([
        supabase.from('sections').select('id, class_id').eq('id', input.sectionId).eq('class_id', input.classId).eq('tenant_id', context.tenantId).maybeSingle(),
        supabase.from('academic_years').select('id').eq('tenant_id', context.tenantId).eq('is_current', true).maybeSingle(),
      ]);

      if (sectionError || !section) {
        return { success: false, error: 'নির্বাচিত সেকশনটি এই জামাতের নয় অথবা আর উপলব্ধ নেই।' };
      }
      if (yearError || !currentYear) {
        return { success: false, error: 'শিক্ষার্থীকে ক্লাসে ভর্তি করার আগে একটি চলতি শিক্ষাবর্ষ নির্ধারণ করুন।' };
      }

      const { data: existingRoll, error: rollError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('tenant_id', context.tenantId)
        .eq('academic_year_id', currentYear.id)
        .eq('section_id', input.sectionId)
        .eq('roll_no', input.rollNo!)
        .maybeSingle();

      if (rollError) {
        return { success: false, error: 'রোল নম্বর যাচাই করা যায়নি। আবার চেষ্টা করুন।' };
      }
      if (existingRoll) {
        return { success: false, error: 'এই সেকশনে রোল নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য রোল নম্বর দিন।' };
      }

      enrollment = {
        academicYearId: currentYear.id,
        classId: input.classId,
        sectionId: input.sectionId,
        rollNo: input.rollNo!,
      };
    }

    // 3. Check for unique admission_no within this tenant
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('admission_no', input.admissionNo.trim())
      .maybeSingle();

    if (existingStudent) {
      return {
        success: false,
        error: `ভর্তি নম্বর '${input.admissionNo}' এই প্রতিষ্ঠানে ইতিমধ্যে নিবন্ধিত হয়েছে। অন্য একটি নম্বর ব্যবহার করুন।`,
      };
    }

    // 4. Insert into students table
    const { data: student, error: insertError } = await supabase
      .from('students')
      .insert({
        tenant_id: context.tenantId,
        admission_no: input.admissionNo.trim(),
        full_name_bn: input.fullNameBn.trim(),
        full_name_en: input.fullNameEn.trim(),
        date_of_birth: input.dateOfBirth || null,
        gender: input.gender || 'male',
        blood_group: input.bloodGroup || null,
        father_name_bn: input.fatherNameBn?.trim() || null,
        father_name_en: input.fatherNameEn?.trim() || null,
        mother_name_bn: input.motherNameBn?.trim() || null,
        guardian_phone: input.guardianPhone.trim(),
        present_address: input.presentAddress?.trim() || null,
        permanent_address: input.permanentAddress?.trim() || null,
        is_residential: input.isResidential,
        is_lillah_boarder: input.isLillahBoarder,
        is_active: true,
      })
      .select('id')
      .single();

    if (insertError || !student) {
      return {
        success: false,
        error: `শিক্ষার্থী সংরক্ষণ ব্যর্থ হয়েছে: ${insertError?.message || 'অজানা ত্রুটি'}`,
      };
    }

    // Create the primary guardian relationship as part of student onboarding.
    const guardianNameBn = input.fatherNameBn?.trim() || 'অভিভাবক';
    const guardianNameEn = input.fatherNameEn?.trim() || 'Guardian';
    const { error: guardianError } = await supabase.from('student_guardians').insert({
      tenant_id: context.tenantId,
      student_id: student.id,
      name_bn: guardianNameBn,
      name_en: guardianNameEn,
      relation_type: input.fatherNameBn?.trim() ? 'Father' : 'Guardian',
      phone: input.guardianPhone.trim(),
      address: input.presentAddress?.trim() || null,
      is_primary_contact: true,
      is_financial_sponsor: true,
    });

    if (guardianError) {
      const { error: cleanupError } = await supabase.from('students').delete()
        .eq('id', student.id).eq('tenant_id', context.tenantId);
      return {
        success: false,
        error: cleanupError
          ? 'শিক্ষার্থীর অভিভাবক তথ্য সংরক্ষণ ব্যর্থ হয়েছে এবং অসম্পূর্ণ রেকর্ড পরিষ্কার করা যায়নি। Support-এর সঙ্গে যোগাযোগ করুন।'
          : `অভিভাবকের তথ্য সংরক্ষণ ব্যর্থ হয়েছে: ${guardianError.message}`,
      };
    }

    // 5. Enroll only after tenant, year, section and roll number passed validation.
    if (enrollment) {
      const { error: enrollmentError } = await supabase.from('student_enrollments').insert({
        tenant_id: context.tenantId,
        student_id: student.id,
        academic_year_id: enrollment.academicYearId,
        class_id: enrollment.classId,
        section_id: enrollment.sectionId,
        roll_no: enrollment.rollNo,
        is_active: true,
      });

      if (enrollmentError) {
        // Best-effort compensating cleanup: never report a successful enrollment
        // when the unique roll constraint or another database invariant rejected it.
        const { error: guardianCleanupError } = await supabase.from('student_guardians')
          .delete().eq('student_id', student.id).eq('tenant_id', context.tenantId);
        const { error: cleanupError } = await supabase
          .from('students')
          .delete()
          .eq('id', student.id)
          .eq('tenant_id', context.tenantId);
        if (cleanupError || guardianCleanupError) {
          return { success: false, error: 'শিক্ষার্থী ও অভিভাবক রেকর্ড তৈরি হয়েছে, কিন্তু ক্লাস ভর্তি ব্যর্থ হয়েছে এবং রোলব্যাক সম্পন্ন হয়নি। Support-এর সঙ্গে যোগাযোগ করুন।' };
        }
        return { success: false, error: 'ক্লাসে ভর্তি সম্পন্ন হয়নি; শিক্ষার্থী রেকর্ডটি রোলব্যাক করা হয়েছে। সেকশন ও রোল নম্বর যাচাই করে আবার চেষ্টা করুন।' };
      }
    }

    // 6. Append audit log entry
    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'student.create',
      entityName: 'students',
      entityId: student.id,
      newState: {
        admission_no: input.admissionNo,
        full_name_bn: input.fullNameBn,
        is_residential: input.isResidential,
        is_lillah_boarder: input.isLillahBoarder,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/students');

    return {
      success: true,
      studentId: student.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।',
    };
  }
}

