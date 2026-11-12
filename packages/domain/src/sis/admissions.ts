import { AdmissionStatus } from './types';

export const VALID_ADMISSION_TRANSITIONS: Record<AdmissionStatus, AdmissionStatus[]> = {
  inquiry: ['applied', 'cancelled'],
  applied: ['exam_scheduled', 'cancelled', 'rejected'],
  exam_scheduled: ['passed', 'rejected', 'cancelled'],
  passed: ['enrolled', 'cancelled'],
  rejected: ['applied'], // re-apply allowed in next term
  enrolled: [],
  cancelled: ['applied'],
};

export function canTransitionAdmission(current: AdmissionStatus, target: AdmissionStatus): boolean {
  if (current === target) return true;
  const allowed = VALID_ADMISSION_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export function evaluateLillahEligibility(params: {
  isOrphan: boolean;
  familyMonthlyIncome: number;
  numberOfSiblings: number;
  maxIncomeThreshold?: number;
}): {
  eligible: boolean;
  status: 'verified_mustahiq' | 'conditional' | 'ineligible';
  suggestedSubsidyPercent: number;
} {
  const threshold = params.maxIncomeThreshold ?? 12000; // standard BDT threshold for mustahiq zakat

  if (params.isOrphan) {
    return {
      eligible: true,
      status: 'verified_mustahiq',
      suggestedSubsidyPercent: 100,
    };
  }

  // Per capita family income calculation
  const totalFamilyMembers = params.numberOfSiblings + 2;
  const perCapitaIncome = params.familyMonthlyIncome / Math.max(1, totalFamilyMembers);

  if (params.familyMonthlyIncome <= threshold || perCapitaIncome <= 2500) {
    return {
      eligible: true,
      status: 'verified_mustahiq',
      suggestedSubsidyPercent: 100,
    };
  } else if (params.familyMonthlyIncome <= threshold * 1.5) {
    return {
      eligible: true,
      status: 'conditional',
      suggestedSubsidyPercent: 50,
    };
  }

  return {
    eligible: false,
    status: 'ineligible',
    suggestedSubsidyPercent: 0,
  };
}
