'use server';

import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface ProvisioningInput {
  name: string;
  code: string;
  subdomain: string;
  curriculumType: 'qawmi' | 'alia' | 'hybrid';
  contactEmail: string;
  contactPhone: string;
  district?: string;
  address?: string;
}

export interface ProvisioningResult {
  success: boolean;
  error?: string;
}

export async function provisionInstitution(prevState: any, formData: FormData): Promise<ProvisioningResult> {
  const name = formData.get('name') as string;
  const code = (formData.get('code') as string || '').toUpperCase().trim();
  const subdomain = (formData.get('subdomain') as string || '').toLowerCase().trim();
  const curriculumType = (formData.get('curriculumType') as any) || 'qawmi';
  const contactEmail = formData.get('contactEmail') as string;
  const contactPhone = formData.get('contactPhone') as string;
  const district = formData.get('district') as string;
  const address = formData.get('address') as string;

  if (!name || !code || !subdomain || !contactEmail || !contactPhone) {
    return {
      success: false,
      error: 'অনুগ্রহ করে সকল আবশ্যকীয় তথ্য পূরণ করুন (Please fill all required fields).',
    };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'মাদরাসা নিবন্ধন করতে প্রথমে সিস্টেমে লগইন করুন (Must be logged in to provision institution).',
    };
  }

  // 1. Insert Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      code,
      subdomain,
      curriculum_type: curriculumType,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      district: district || null,
      address: address || null,
      is_active: true,
    })
    .select('id, name, code')
    .single();

  if (tenantError) {
    console.error('Tenant provisioning error:', tenantError);
    if (tenantError.message.includes('tenants_code_key')) {
      return { success: false, error: 'এই প্রাতিষ্ঠানিক কোডটি ইতিপূর্বে ব্যবহৃত হয়েছে (Code already taken).' };
    }
    if (tenantError.message.includes('tenants_subdomain_key')) {
      return { success: false, error: 'এই সাবডোমেইনটি ইতিপূর্বে ব্যবহৃত হয়েছে (Subdomain already in use).' };
    }
    return { success: false, error: tenantError.message };
  }

  // 2. Insert Main Branch
  const { data: branch } = await supabase
    .from('branches')
    .insert({
      tenant_id: tenant.id,
      name: 'প্রধান ক্যাম্পাস (Main Campus)',
      code: 'MAIN',
      is_main_branch: true,
      phone: contactPhone,
      address: address || null,
    })
    .select('id')
    .single();

  // 3. Assign Current User as Madrasa Admin in tenant_users
  await supabase
    .from('tenant_users')
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      branch_id: branch?.id || null,
      role: 'madrasa_admin',
      is_active: true,
    });

  // 4. Create Default Academic Year
  await supabase
    .from('academic_years')
    .insert({
      tenant_id: tenant.id,
      name_bn: '১৪৪৭-১৪৪৮ হিজরি (২০২৬-২০২৭)',
      name_en: 'Academic Year 2026-2027',
      name_ar: 'العام الدراسي ١٤٤٧-١٤٤٨ هـ',
      hijri_year: '1447-1448',
      start_date: '2026-05-01',
      end_date: '2027-04-30',
      is_current: true,
    });

  // 5. Seed Core Departments based on Curriculum
  if (curriculumType === 'qawmi' || curriculumType === 'hybrid') {
    await supabase.from('departments').insert([
      { tenant_id: tenant.id, name_bn: 'কিতাব বিভাগ', name_en: 'Kitab Department', name_ar: 'قسم الكتب الشرعية', code: 'KTB', curriculum_type: 'qawmi' },
      { tenant_id: tenant.id, name_bn: 'হিফজুল কুরআন বিভাগ', name_en: 'Hifzul Quran', name_ar: 'قسم تحفيظ القرآن', code: 'HFZ', curriculum_type: 'qawmi' },
      { tenant_id: tenant.id, name_bn: 'নূরানী ও মক্তব বিভাগ', name_en: 'Nurani & Maktab', name_ar: 'المكتب النوراني', code: 'NUR', curriculum_type: 'qawmi' }
    ]);
  }

  if (curriculumType === 'alia') {
    await supabase.from('departments').insert([
      { tenant_id: tenant.id, name_bn: 'ইবতেদায়ি বিভাগ', name_en: 'Ebtedayee Primary Wing', name_ar: 'المرحلة الابتدائية', code: 'EBT', curriculum_type: 'alia' },
      { tenant_id: tenant.id, name_bn: 'দাখিল মাধ্যমিক বিভাগ', name_en: 'Dakhil Secondary Wing', name_ar: 'المرحلة الثانوية', code: 'DAK', curriculum_type: 'alia' },
      { tenant_id: tenant.id, name_bn: 'আলিম উচ্চ মাধ্যমিক বিভাগ', name_en: 'Alim Higher Secondary Wing', name_ar: 'المرحلة العالية', code: 'ALM', curriculum_type: 'alia' }
    ]);
  }

  // 6. Record Audit Log
  await logAuditEvent({
    tenantId: tenant.id,
    actorId: user.id,
    actorRole: 'madrasa_admin',
    action: 'institution.provisioned',
    entityName: 'tenants',
    entityId: tenant.id,
    newState: { name: tenant.name, code: tenant.code, curriculumType },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

