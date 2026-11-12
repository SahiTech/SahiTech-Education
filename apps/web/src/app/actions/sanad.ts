'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { generateSanadVerificationHash } from '@sahitech/domain';

export interface IssueSanadInput {
  studentId: string;
  classId: string;
  academicYearId: string;
  titleBn: string;
  titleEn: string;
  titleAr?: string;
  marhalaNameAr?: string;
  resultDharja?: string;
  gpa?: number;
  signatoryMuhtamim?: string;
  signatoryDean?: string;
}

export async function issueDigitalSanad(input: IssueSanadInput) {
  try {
    const context = await requirePermission('issue_sanad');
    const supabase = await createClient();

    const serialClean = `SND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const issueDate = new Date().toISOString().split('T')[0];

    const verificationHash = generateSanadVerificationHash({
      tenantId: context.tenantId,
      studentId: input.studentId,
      sanadSerialNo: serialClean,
      issueDate,
    });

    const { data: sanad, error } = await supabase
      .from('sanads')
      .insert({
        tenant_id: context.tenantId,
        student_id: input.studentId,
        class_id: input.classId,
        academic_year_id: input.academicYearId,
        sanad_serial_no: serialClean,
        title_bn: input.titleBn.trim(),
        title_en: input.titleEn.trim(),
        title_ar: input.titleAr?.trim() || null,
        marhala_name_ar: input.marhalaNameAr?.trim() || null,
        result_dharja: (input.resultDharja as any) || null,
        gpa: input.gpa || null,
        issue_date: issueDate,
        verification_hash: verificationHash,
        status: 'issued',
        signatory_muhtamim: input.signatoryMuhtamim?.trim() || null,
        signatory_dean: input.signatoryDean?.trim() || null,
      })
      .select('id, sanad_serial_no, verification_hash')
      .single();

    if (error || !sanad) {
      return { success: false, error: `সনদ প্রদান ব্যর্থ হয়েছে: ${error?.message}` };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'sanad.issued',
      entityName: 'sanads',
      entityId: sanad.id,
      newState: { serial: sanad.sanad_serial_no, hash: sanad.verification_hash },
    });

    revalidatePath('/dashboard/academic');
    return {
      success: true,
      sanadId: sanad.id,
      serialNo: sanad.sanad_serial_no,
      verificationHash: sanad.verification_hash,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function verifySanadPublic(verificationToken: string) {
  try {
    const supabase = await createClient();

    // Primary: use security definer RPC for public verification without exposing sensitive student data
    const { data: rpcRows, error: rpcError } = await (supabase.rpc as any)('verify_sanad_public', {
      p_token: verificationToken.trim().toUpperCase(),
    });

    if (!rpcError && rpcRows && rpcRows.length > 0) {
      const row = rpcRows[0];
      return {
        verified: true,
        sanad: {
          id: row.id,
          sanad_serial_no: row.sanad_serial_no,
          title_bn: row.title_bn,
          title_en: row.title_en,
          title_ar: row.title_ar,
          marhala_name_ar: row.marhala_name_ar,
          result_dharja: row.result_dharja,
          gpa: row.gpa,
          issue_date: row.issue_date,
          verification_hash: row.verification_hash,
          status: row.status,
          signatory_muhtamim: row.signatory_muhtamim,
          signatory_dean: row.signatory_dean,
          tenants: {
            name: row.madrasa_name,
            code: row.madrasa_code,
          },
          students: {
            full_name_bn: row.student_name_bn,
            full_name_en: row.student_name_en,
            admission_no: row.student_admission_no,
          },
        },
      };
    }

    // Secondary fallback
    const { data: sanad, error } = await supabase
      .from('sanads')
      .select(`
        id,
        sanad_serial_no,
        title_bn,
        title_en,
        title_ar,
        marhala_name_ar,
        result_dharja,
        gpa,
        issue_date,
        verification_hash,
        status,
        signatory_muhtamim,
        signatory_dean,
        tenants:tenant_id (name, code),
        students:student_id (full_name_bn, full_name_en, admission_no)
      `)
      .eq('verification_hash', verificationToken.trim().toUpperCase())
      .eq('status', 'issued')
      .maybeSingle();

    if (error || !sanad) {
      return { verified: false, error: 'প্রদত্ত টোকেনে কোনো বৈধ বা সক্রিয় সনদ পাওয়া যায়নি।' };
    }

    return {
      verified: true,
      sanad,
    };
  } catch (err: any) {
    return { verified: false, error: 'যাচাই প্রক্রিয়া ব্যর্থ হয়েছে।' };
  }
}
