'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission, getActiveTenantContext } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { QAWMI_MARHALAS, ALIA_CLASSES } from '@sahitech/domain';

export interface Step1ProfileInput {
  name: string;
  code: string;
  subdomain: string;
  curriculumType: 'qawmi' | 'alia' | 'hybrid';
  boardAffiliation: string;
  registrationNo?: string;
  establishedYear?: number;
  contactEmail: string;
  contactPhone: string;
  division: string;
  district: string;
  address: string;
  mottoBn?: string;
  mottoEn?: string;
  programPolicies?: {
    residentialQuota?: number;
    lillahFundEnabled?: boolean;
    termSystem?: 'chala' | 'semester';
    minimumAttendancePercent?: number;
    allowOnlineAdmission?: boolean;
  };
}

export interface Step2BranchInput {
  mainBranchName: string;
  mainBranchCode: string;
  mainBranchAddress?: string;
  mainBranchPhone?: string;
  additionalBranches?: Array<{
    name: string;
    code: string;
    address?: string;
    phone?: string;
  }>;
}

export interface Step3AcademicYearInput {
  nameBn: string;
  nameEn: string;
  hijriYear: string;
  startDate: string;
  endDate: string;
}

export interface Step4DepartmentsInput {
  selectedDepartments: Array<{
    code: string;
    nameBn: string;
    nameEn: string;
    curriculumType: 'qawmi' | 'alia' | 'hybrid';
  }>;
  generateDefaultClasses: boolean;
}

export interface Step5LeadershipInput {
  deanName?: string;
  deanPhone?: string;
  bursarName?: string;
  bursarPhone?: string;
}

export interface OnboardingActionResult {
  success: boolean;
  error?: string;
  currentStep?: number;
}

/**
 * Saves Step 1: Institution Profile, Identity & Program Policies
 */
export async function saveOnboardingStep1(input: Step1ProfileInput): Promise<OnboardingActionResult> {
  try {
    const context = await requirePermission('manage_tenant_settings');
    const supabase = await createClient();

    if (!input.name?.trim() || !input.code?.trim() || !input.contactEmail?.trim() || !input.contactPhone?.trim()) {
      return { success: false, error: 'প্রতিষ্ঠানটির নাম, কোড, ইমেইল এবং মোবাইল নম্বর আবশ্যক।' };
    }

    const { error } = await supabase
      .from('tenants')
      .update({
        name: input.name.trim(),
        code: input.code.toUpperCase().trim(),
        subdomain: input.subdomain.toLowerCase().trim(),
        curriculum_type: input.curriculumType,
        board_affiliation: input.boardAffiliation?.trim() || null,
        registration_no: input.registrationNo?.trim() || null,
        established_year: input.establishedYear || null,
        contact_email: input.contactEmail.trim(),
        contact_phone: input.contactPhone.trim(),
        division: input.division?.trim() || null,
        district: input.district?.trim() || null,
        address: input.address?.trim() || null,
        motto_bn: input.mottoBn?.trim() || null,
        motto_en: input.mottoEn?.trim() || null,
        program_policies: input.programPolicies || {},
        onboarding_step: 2,
        updated_at: new Date().toISOString(),
      })
      .eq('id', context.tenantId);

    if (error) {
      return { success: false, error: `প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে: ${error.message}` };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'onboarding.step1_profile_saved',
      entityName: 'tenants',
      entityId: context.tenantId,
      newState: { name: input.name, curriculumType: input.curriculumType },
    });

    revalidatePath('/onboarding');
    revalidatePath('/dashboard');
    return { success: true, currentStep: 2 };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

/**
 * Saves Step 2: Campuses and Branches Setup
 */
export async function saveOnboardingStep2(input: Step2BranchInput): Promise<OnboardingActionResult> {
  try {
    const context = await requirePermission('manage_branches');
    const supabase = await createClient();

    if (!input.mainBranchName?.trim() || !input.mainBranchCode?.trim()) {
      return { success: false, error: 'প্রধান শাখার নাম ও কোড প্রদান আবশ্যক।' };
    }

    // 1. Update or Insert Main Branch
    const { data: existingMain } = await supabase
      .from('branches')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('is_main_branch', true)
      .maybeSingle();

    if (existingMain) {
      await supabase
        .from('branches')
        .update({
          name: input.mainBranchName.trim(),
          code: input.mainBranchCode.toUpperCase().trim(),
          address: input.mainBranchAddress?.trim() || null,
          phone: input.mainBranchPhone?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMain.id);
    } else {
      await supabase.from('branches').insert({
        tenant_id: context.tenantId,
        name: input.mainBranchName.trim(),
        code: input.mainBranchCode.toUpperCase().trim(),
        is_main_branch: true,
        address: input.mainBranchAddress?.trim() || null,
        phone: input.mainBranchPhone?.trim() || null,
      });
    }

    // 2. Insert any additional branches
    if (input.additionalBranches && input.additionalBranches.length > 0) {
      for (const branch of input.additionalBranches) {
        if (branch.name?.trim() && branch.code?.trim()) {
          await supabase.from('branches').upsert({
            tenant_id: context.tenantId,
            name: branch.name.trim(),
            code: branch.code.toUpperCase().trim(),
            is_main_branch: false,
            address: branch.address?.trim() || null,
            phone: branch.phone?.trim() || null,
          }, { onConflict: 'tenant_id,code' });
        }
      }
    }

    // Update tenant onboarding step
    await supabase
      .from('tenants')
      .update({ onboarding_step: 3, updated_at: new Date().toISOString() })
      .eq('id', context.tenantId);

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'onboarding.step2_branches_saved',
      entityName: 'branches',
      entityId: context.tenantId,
    });

    revalidatePath('/onboarding');
    revalidatePath('/dashboard');
    return { success: true, currentStep: 3 };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

/**
 * Saves Step 3: Academic Year & Calendar Terms
 */
export async function saveOnboardingStep3(input: Step3AcademicYearInput): Promise<OnboardingActionResult> {
  try {
    const context = await requirePermission('manage_academic_calendar');
    const supabase = await createClient();

    if (!input.nameBn?.trim() || !input.startDate || !input.endDate) {
      return { success: false, error: 'শিক্ষাবর্ষের নাম, শুরু ও সমাপ্তি তারিখ আবশ্যক।' };
    }

    // Upsert Current Academic Year
    const { data: existingCurrent } = await supabase
      .from('academic_years')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('is_current', true)
      .maybeSingle();

    if (existingCurrent) {
      await supabase
        .from('academic_years')
        .update({
          name_bn: input.nameBn.trim(),
          name_en: input.nameEn?.trim() || input.nameBn.trim(),
          hijri_year: input.hijriYear?.trim() || null,
          start_date: input.startDate,
          end_date: input.endDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCurrent.id);
    } else {
      await supabase.from('academic_years').insert({
        tenant_id: context.tenantId,
        name_bn: input.nameBn.trim(),
        name_en: input.nameEn?.trim() || input.nameBn.trim(),
        hijri_year: input.hijriYear?.trim() || null,
        start_date: input.startDate,
        end_date: input.endDate,
        is_current: true,
      });
    }

    await supabase
      .from('tenants')
      .update({ onboarding_step: 4, updated_at: new Date().toISOString() })
      .eq('id', context.tenantId);

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'onboarding.step3_academic_year_saved',
      entityName: 'academic_years',
      entityId: context.tenantId,
    });

    revalidatePath('/onboarding');
    revalidatePath('/dashboard');
    return { success: true, currentStep: 4 };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

/**
 * Saves Step 4: Departments & Initial Classes Configuration
 */
export async function saveOnboardingStep4(input: Step4DepartmentsInput): Promise<OnboardingActionResult> {
  try {
    const context = await requirePermission('manage_curriculum');
    const supabase = await createClient();

    if (!input.selectedDepartments || input.selectedDepartments.length === 0) {
      return { success: false, error: 'কমপক্ষে একটি একাডেমিক বিভাগ নির্বাচন আবশ্যক।' };
    }

    // 1. Insert selected departments
    for (const dept of input.selectedDepartments) {
      const { data: deptRecord } = await supabase
        .from('departments')
        .upsert({
          tenant_id: context.tenantId,
          code: dept.code,
          name_bn: dept.nameBn,
          name_en: dept.nameEn,
          curriculum_type: dept.curriculumType,
        }, { onConflict: 'tenant_id,code' })
        .select('id, code')
        .single();

      // 2. Generate canonical classes if requested
      if (input.generateDefaultClasses && deptRecord) {
        if (context.curriculumType === 'qawmi') {
          // Generate classes based on Qawmi Marhalas
          for (const marhala of QAWMI_MARHALAS) {
            await supabase.from('classes').upsert({
              tenant_id: context.tenantId,
              department_id: deptRecord.id,
              code: marhala.code,
              name_bn: marhala.name.bn,
              name_en: marhala.name.en,
              name_ar: marhala.name.ar,
              level_order: marhala.levelOrder,
            }, { onConflict: 'tenant_id,department_id,code' });
          }
        } else if (context.curriculumType === 'alia') {
          // Generate classes based on Alia BMEB classes
          for (let i = 0; i < ALIA_CLASSES.length; i++) {
            const cls = ALIA_CLASSES[i];
            await supabase.from('classes').upsert({
              tenant_id: context.tenantId,
              department_id: deptRecord.id,
              code: cls.code,
              name_bn: cls.name.bn,
              name_en: cls.name.en,
              name_ar: cls.name.ar,
              level_order: cls.numericGradeEquivalent,
            }, { onConflict: 'tenant_id,department_id,code' });
          }
        }
      }
    }

    await supabase
      .from('tenants')
      .update({ onboarding_step: 5, updated_at: new Date().toISOString() })
      .eq('id', context.tenantId);

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'onboarding.step4_departments_saved',
      entityName: 'departments',
      entityId: context.tenantId,
    });

    revalidatePath('/onboarding');
    revalidatePath('/dashboard');
    return { success: true, currentStep: 5 };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

/**
 * Saves Step 5: Leadership Roles & Key Staff Assignments
 */
export async function saveOnboardingStep5(input: Step5LeadershipInput): Promise<OnboardingActionResult> {
  try {
    const context = await requirePermission('manage_tenant_settings');
    const supabase = await createClient();
    const leadership = {
      deanName: input.deanName?.trim() || null,
      deanPhone: input.deanPhone?.trim() || null,
      bursarName: input.bursarName?.trim() || null,
      bursarPhone: input.bursarPhone?.trim() || null,
    };

    const { data, error } = await (supabase.rpc as any)('save_onboarding_leadership', {
      p_tenant_id: context.tenantId,
      p_leadership: leadership,
    });
    if (error || data !== true) {
      return { success:false,error:'Leadership information could not be saved. Complete onboarding steps in order and try again.' };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'onboarding.step5_leadership_saved',
      entityName: 'tenants',
      entityId: context.tenantId,
    });

    revalidatePath('/onboarding');
    revalidatePath('/dashboard');
    return { success:true,currentStep:6 };
  } catch (err:any) {
    return { success:false,error:err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

/**
 * Step 6: Review, Program Eligibility Verification & Onboarding Finalization
 */
export async function finalizeOnboarding(): Promise<OnboardingActionResult> {
  try {
    const context = await requirePermission('manage_tenant_settings');
    const supabase = await createClient();

    // The database re-validates completeness and performs the final transition atomically.
    const { data, error } = await (supabase.rpc as any)('complete_tenant_onboarding', {
      p_tenant_id: context.tenantId,
    });
    if (error || data !== true) {
      const message = error?.message || 'onboarding_completion_failed';
      const friendly: Record<string,string> = {
        main_branch_missing: 'কমপক্ষে একটি সক্রিয় প্রধান শাখা থাকা আবশ্যক।',
        academic_year_missing: 'চলতি শিক্ষাবর্ষ নির্ধারিত নেই।',
        departments_missing: 'কমপক্ষে একটি একাডেমিক বিভাগ কনফিগার করা আবশ্যক।',
        institution_profile_incomplete: 'প্রাতিষ্ঠানিক পরিচিতি অপূর্ণ রয়েছে।',
        madrasa_admin_required: 'শুধুমাত্র মাদরাসা প্রশাসক onboarding সম্পন্ন করতে পারবেন।',
      };
      return { success:false,error:friendly[message] || 'Onboarding সম্পন্ন করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।' };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'institution.onboarding_completed',
      entityName: 'tenants',
      entityId: context.tenantId,
      newState: { onboarding_step: 6, is_verified: false, platform_status: 'pending_activation' },
    });

    revalidatePath('/dashboard');
    revalidatePath('/onboarding');
    revalidatePath('/platform');
    return { success:true,currentStep:6 };
  } catch (err:any) {
    return { success:false,error:err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

/**
 * Fetch current tenant full onboarding state
 */
export async function getOnboardingState() {
  const context = await getActiveTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  const [tenantRes, branchesRes, yearRes, departmentsRes, classesRes] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', context.tenantId).single(),
    supabase.from('branches').select('*').eq('tenant_id', context.tenantId),
    supabase.from('academic_years').select('*').eq('tenant_id', context.tenantId).eq('is_current', true).maybeSingle(),
    supabase.from('departments').select('*').eq('tenant_id', context.tenantId),
    supabase.from('classes').select('*').eq('tenant_id', context.tenantId),
  ]);

  return {
    context,
    tenant: tenantRes.data,
    branches: branchesRes.data || [],
    academicYear: yearRes.data,
    departments: departmentsRes.data || [],
    classes: classesRes.data || [],
  };
}

