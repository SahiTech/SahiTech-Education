import { AdmissionStatus } from './types';
export declare const VALID_ADMISSION_TRANSITIONS: Record<AdmissionStatus, AdmissionStatus[]>;
export declare function canTransitionAdmission(current: AdmissionStatus, target: AdmissionStatus): boolean;
export declare function evaluateLillahEligibility(params: {
    isOrphan: boolean;
    familyMonthlyIncome: number;
    numberOfSiblings: number;
    maxIncomeThreshold?: number;
}): {
    eligible: boolean;
    status: 'verified_mustahiq' | 'conditional' | 'ineligible';
    suggestedSubsidyPercent: number;
};
