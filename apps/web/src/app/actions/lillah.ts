'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { evaluateLillahEligibility } from '@sahitech/domain';

export interface SubmitLillahInput {
  studentId: string;
  familyMonthlyIncome: number;
  numberOfSiblings: number;
  isOrphan: boolean;
  fatherOccupation?: string;
  localRecommenderName?: string;
  localRecommenderPhone?: string;
  subsidyPercentage?: number;
  approvedMonthlyStipend?: number;
  notes?: string;
}

export async function submitLillahEvaluation(input: SubmitLillahInput) {
  try {
    const context = await requirePermission('manage_tenant_settings');
    const supabase = await createClient();

    const assessment = evaluateLillahEligibility({
      isOrphan: input.isOrphan,
      familyMonthlyIncome: input.familyMonthlyIncome,
      numberOfSiblings: input.numberOfSiblings,
    });

    const finalSubsidy = input.subsidyPercentage ?? assessment.suggestedSubsidyPercent;
    const finalStipend = input.approvedMonthlyStipend ?? (finalSubsidy === 100 ? 3000 : 1500);

    const { data: evalRecord, error } = await supabase
      .from('lillah_evaluations')
      .insert({
        tenant_id: context.tenantId,
        student_id: input.studentId,
        evaluator_user_id: context.userId,
        family_monthly_income: input.familyMonthlyIncome,
        number_of_siblings: input.numberOfSiblings,
        is_orphan: input.isOrphan,
        father_occupation: input.fatherOccupation?.trim() || null,
        local_recommender_name: input.localRecommenderName?.trim() || null,
        local_recommender_phone: input.localRecommenderPhone?.trim() || null,
        shariah_eligibility_status: assessment.status,
        subsidy_percentage: finalSubsidy,
        approved_monthly_stipend: finalStipend,
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: input.notes?.trim() || null,
      })
      .select('id')
      .single();

    if (error || !evalRecord) {
      return { success: false, error: `লিল্লাহ মূল্যায়ন সংরক্ষণ ব্যর্থ: ${error?.message}` };
    }

    // Update student's lillah boarder status
    if (assessment.eligible) {
      await supabase
        .from('students')
        .update({ is_lillah_boarder: true })
        .eq('id', input.studentId);
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'lillah.evaluation_completed',
      entityName: 'lillah_evaluations',
      entityId: evalRecord.id,
      newState: { status: assessment.status, subsidyPercentage: finalSubsidy },
    });

    revalidatePath('/dashboard/lillah');
    revalidatePath('/dashboard/students');
    return { success: true, evaluationId: evalRecord.id, assessment };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

