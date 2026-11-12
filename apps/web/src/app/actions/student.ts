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
        bloodGroup: input.bloodGroup || null,
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

    // 5. If class and section provided, enroll student
    if (input.classId && input.sectionId) {
      // Find active academic year
      const { data: currentYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('tenant_id', context.tenantId)
        .eq('is_current', true)
        .maybeSingle();

      if (currentYear) {
        await supabase.from('student_enrollments').insert({
          tenant_id: context.tenantId,
          student_id: student.id,
          academic_year_id: currentYear.id,
          class_id: input.classId,
          section_id: input.sectionId,
          roll_no: input.rollNo || 1,
          is_active: true,
        });
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

