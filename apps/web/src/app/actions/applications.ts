'use server';

import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export type ApplicationResult = { success: boolean; error?: string; applicationId?: string; uploadToken?: string };

const clean = (value: FormDataEntryValue | null, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export async function submitMadrasaApplication(
  _previous: ApplicationResult,
  formData: FormData
): Promise<ApplicationResult> {
  const institutionName = clean(formData.get('institutionName'), 200);
  const institutionNameBn = clean(formData.get('institutionNameBn'), 200);
  const institutionType = clean(formData.get('institutionType'), 20);
  const requestedCode = clean(formData.get('requestedCode'), 20).toUpperCase();
  const requestedSubdomain = clean(formData.get('requestedSubdomain'), 50).toLowerCase();
  const contactPersonName = clean(formData.get('contactPersonName'), 160);
  const contactEmail = clean(formData.get('contactEmail'), 254).toLowerCase();
  const contactPhone = clean(formData.get('contactPhone'), 32);
  const boardAffiliation = clean(formData.get('boardAffiliation'), 160);
  const registrationNumber = clean(formData.get('registrationNumber'), 100);
  const establishedYearText = clean(formData.get('establishedYear'), 4);
  const division = clean(formData.get('division'), 100);
  const district = clean(formData.get('district'), 100);
  const address = clean(formData.get('address'), 500);
  const websiteUrl = clean(formData.get('websiteUrl'), 300);
  const applicationNote = clean(formData.get('applicationNote'), 1500);
  const honeypot = clean(formData.get('companyWebsite'), 200);

  if (honeypot) return { success: true };
  if (!institutionName || !contactPersonName || !contactEmail || !contactPhone) return { success:false,error:'প্রতিষ্ঠান, যোগাযোগ ব্যক্তির নাম, ইমেইল ও ফোন নম্বর আবশ্যক।' };
  if (!['qawmi','alia','hybrid'].includes(institutionType)) return { success:false,error:'সঠিক মাদরাসার ধরন নির্বাচন করুন।' };
  if (!/^[A-Z0-9][A-Z0-9_-]{1,19}$/.test(requestedCode)) return { success:false,error:'প্রাতিষ্ঠানিক কোড ২–২০ অক্ষরের ইংরেজি বর্ণ/সংখ্যা হতে হবে।' };
  if (!/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(requestedSubdomain)) return { success:false,error:'সাবডোমেইনটি ইংরেজি ছোট হাতের অক্ষর, সংখ্যা বা hyphen দিয়ে লিখুন।' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { success:false,error:'সঠিক ইমেইল ঠিকানা প্রদান করুন।' };
  const establishedYear = establishedYearText ? Number(establishedYearText) : null;
  if (establishedYear !== null && (!Number.isInteger(establishedYear)||establishedYear<1800||establishedYear>new Date().getFullYear())) return { success:false,error:'প্রতিষ্ঠার সাল সঠিক নয়।' };
  if (websiteUrl) {
    try { const url=new URL(websiteUrl); if(!['http:','https:'].includes(url.protocol)) throw new Error('invalid'); }
    catch { return {success:false,error:'ওয়েবসাইটের URL সঠিক নয়।'}; }
  }

  const uploadToken=randomBytes(32).toString('hex').toUpperCase();
  const tokenHash=createHash('sha256').update(uploadToken).digest('hex');
  const supabase=await createClient();
  const {data:applicationId,error}=await (supabase.rpc as any)('submit_madrasa_application',{
    p_upload_token_hash:tokenHash,
    p_application:{
      institution_name:institutionName,
      institution_name_bn:institutionNameBn||null,
      institution_type:institutionType,
      requested_code:requestedCode,
      requested_subdomain:requestedSubdomain,
      board_affiliation:boardAffiliation||null,
      registration_number:registrationNumber||null,
      established_year:establishedYear,
      contact_person_name:contactPersonName,
      contact_email:contactEmail,
      contact_phone:contactPhone,
      division:division||null,
      district:district||null,
      address:address||null,
      website_url:websiteUrl||null,
      application_note:applicationNote||null,
    }
  });
  if(error||!applicationId){
    if(error?.message?.includes('application_rate_limit')) return {success:false,error:'এই ইমেইল থেকে ২৪ ঘণ্টায় সর্বোচ্চ ৩টি আবেদন জমা দেওয়া যাবে।'};
    if(error?.code==='23505') return {success:false,error:'প্রস্তাবিত প্রতিষ্ঠান কোড বা সাবডোমেইনটি আগে থেকেই ব্যবহৃত হয়েছে।'};
    return {success:false,error:'আবেদন জমা দেওয়া যায়নি। তথ্য যাচাই করে কিছুক্ষণ পর আবার চেষ্টা করুন।'};
  }
  return {success:true,applicationId,uploadToken};
}
