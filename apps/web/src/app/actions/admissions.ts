'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { canTransitionAdmission, AdmissionStatus } from '@sahitech/domain';

export interface CreateAdmissionInput {
  targetAcademicYearId?: string;
  targetClassId?: string;
  fullNameBn: string;
  fullNameEn: string;
  dateOfBirth?: string;
  gender: 'male' | 'female';
  bloodGroup?: string;
  fatherNameBn?: string;
  motherNameBn?: string;
  guardianPhone: string;
  guardianEmail?: string;
  presentAddress?: string;
  permanentAddress?: string;
  previousMadrasa?: string;
  isResidentialApplicant: boolean;
  isLillahApplicant: boolean;
}

export async function createAdmissionApplication(input: CreateAdmissionInput) {
  try {
    const context = await requirePermission('manage_admissions');
    const supabase = await createClient();

    if (!input.fullNameBn?.trim() || !input.fullNameEn?.trim() || !input.guardianPhone?.trim()) {
      return { success: false, error: 'শিক্ষার্থীর নাম ও অভিভাবকের মোবাইল নম্বর আবশ্যক।' };
    }

    const applicationNo = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: app, error } = await supabase
      .from('student_admissions')
      .insert({
        tenant_id: context.tenantId,
        application_no: applicationNo,
        target_academic_year_id: input.targetAcademicYearId || null,
        target_class_id: input.targetClassId || null,
        full_name_bn: input.fullNameBn.trim(),
        full_name_en: input.fullNameEn.trim(),
        date_of_birth: input.dateOfBirth || null,
        gender: input.gender || 'male',
        blood_group: input.bloodGroup || null,
        father_name_bn: input.fatherNameBn?.trim() || null,
        mother_name_bn: input.motherNameBn?.trim() || null,
        guardian_phone: input.guardianPhone.trim(),
        guardian_email: input.guardianEmail?.trim() || null,
        present_address: input.presentAddress?.trim() || null,
        permanent_address: input.permanentAddress?.trim() || null,
        previous_madrasa: input.previousMadrasa?.trim() || null,
        is_residential_applicant: input.isResidentialApplicant,
        is_lillah_applicant: input.isLillahApplicant,
        status: 'applied',
      })
      .select('id, application_no')
      .single();

    if (error || !app) {
      return { success: false, error: `আবেদন সংরক্ষণ ব্যর্থ হয়েছে: ${error?.message}` };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'admission.application_created',
      entityName: 'student_admissions',
      entityId: app.id,
      newState: { applicationNo: app.application_no, fullNameBn: input.fullNameBn },
    });

    revalidatePath('/dashboard/admissions');
    return { success: true, applicationId: app.id, applicationNo: app.application_no };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function updateAdmissionEvaluation(params: {
  applicationId: string;
  writtenExamMarks?: number;
  oralExamMarks?: number;
  interviewRemarks?: string;
  newStatus: AdmissionStatus;
}) {
  try {
    const context = await requirePermission('manage_admissions');
    const supabase = await createClient();

    // Fetch existing
    const { data: existing } = await supabase
      .from('student_admissions')
      .select('status')
      .eq('id', params.applicationId)
      .eq('tenant_id', context.tenantId)
      .single();

    if (!existing) {
      return { success: false, error: 'ভর্তি আবেদনটি পাওয়া যায়নি।' };
    }

    if (!canTransitionAdmission(existing.status as AdmissionStatus, params.newStatus)) {
      return {
        success: false,
        error: `অবস্থা '${existing.status}' হতে '${params.newStatus}'-এ পরিবর্তন অনুমোদিত নয়।`,
      };
    }

    const { error } = await supabase
      .from('student_admissions')
      .update({
        written_exam_marks: params.writtenExamMarks ?? null,
        oral_exam_marks: params.oralExamMarks ?? null,
        interview_remarks: params.interviewRemarks?.trim() || null,
        status: params.newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.applicationId)
      .eq('tenant_id', context.tenantId);

    if (error) {
      return { success: false, error: `মূল্যায়ন সংরক্ষণ ব্যর্থ হয়েছে: ${error.message}` };
    }

    revalidatePath('/dashboard/admissions');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function enrollApplicantToStudent(params: {
  applicationId: string;
  sectionId?: string;
  rollNo: number;
}) {
  try {
    const context = await requirePermission('manage_admissions');
    const supabase = await createClient();

    // Fetch application details
    const { data: app } = await supabase
      .from('student_admissions')
      .select('*')
      .eq('id', params.applicationId)
      .eq('tenant_id', context.tenantId)
      .single();

    if (!app) {
      return { success: false, error: 'আবেদন পাওয়া যায়নি।' };
    }

    if (app.status === 'enrolled') {
      return { success: false, error: 'এই শিক্ষার্থী ইতিমধ্যে ভর্তি সম্পন্ন হয়েছে।' };
    }

    const admissionNo = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Insert into students
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        tenant_id: context.tenantId,
        admission_no: admissionNo,
        full_name_bn: app.full_name_bn,
        full_name_en: app.full_name_en,
        date_of_birth: app.date_of_birth,
        gender: app.gender,
        blood_group: app.blood_group,
        father_name_bn: app.father_name_bn,
        mother_name_bn: app.mother_name_bn,
        guardian_phone: app.guardian_phone,
        present_address: app.present_address,
        permanent_address: app.permanent_address,
        is_residential: app.is_residential_applicant,
        is_lillah_boarder: app.is_lillah_applicant,
        is_active: true,
      })
      .select('id')
      .single();

    if (studentError || !student) {
      return { success: false, error: `ভর্তি নিশ্চিতকরণ ব্যর্থ: ${studentError?.message}` };
    }

    // 2. Insert primary guardian
    await supabase.from('student_guardians').insert({
      tenant_id: context.tenantId,
      student_id: student.id,
      name_bn: app.father_name_bn || 'অভিভাবক',
      name_en: app.full_name_en + ' Guardian',
      relation_type: 'Father / Guardian',
      phone: app.guardian_phone,
      is_primary_contact: true,
      is_financial_sponsor: true,
    });

    // 3. Mark application as enrolled
    await supabase
      .from('student_admissions')
      .update({
        status: 'enrolled',
        enrolled_student_id: student.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', app.id);

    // 4. Enroll in current academic year and class if available
    if (app.target_academic_year_id && app.target_class_id) {
      await supabase.from('student_enrollments').insert({
        tenant_id: context.tenantId,
        student_id: student.id,
        academic_year_id: app.target_academic_year_id,
        class_id: app.target_class_id,
        section_id: params.sectionId || null,
        roll_no: params.rollNo || 1,
        is_active: true,
      });
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'admission.applicant_enrolled',
      entityName: 'students',
      entityId: student.id,
      newState: { admissionNo, applicationId: app.id },
    });

    revalidatePath('/dashboard/admissions');
    revalidatePath('/dashboard/students');
    return { success: true, studentId: student.id, admissionNo };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function submitPublicAdmissionApplication(params: {
  tenantId: string;
  fullNameBn: string;
  fullNameEn: string;
  guardianPhone: string;
  fatherNameBn?: string;
  isResidentialApplicant: boolean;
  isLillahApplicant: boolean;
}) {
  try {
    const supabase = await createClient();

    if (!params.tenantId || !params.fullNameBn?.trim() || !params.guardianPhone?.trim()) {
      return { success: false, error: 'মাদরাসা, শিক্ষার্থীর নাম ও অভিভাবকের ফোন নম্বর আবশ্যক।' };
    }

    const applicationNo = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: app, error } = await supabase
      .from('student_admissions')
      .insert({
        tenant_id: params.tenantId,
        application_no: applicationNo,
        full_name_bn: params.fullNameBn.trim(),
        full_name_en: params.fullNameEn?.trim() || params.fullNameBn.trim(),
        guardian_phone: params.guardianPhone.trim(),
        father_name_bn: params.fatherNameBn?.trim() || null,
        is_residential_applicant: params.isResidentialApplicant || false,
        is_lillah_applicant: params.isLillahApplicant || false,
        status: 'applied',
      })
      .select('id, application_no')
      .single();

    if (error || !app) {
      return { success: false, error: `ভর্তি আবেদন দাখিল ব্যর্থ হয়েছে: ${error?.message}` };
    }

    return { success: true, applicationNo: app.application_no };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

