"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_ADMISSION_TRANSITIONS = void 0;
exports.canTransitionAdmission = canTransitionAdmission;
exports.evaluateLillahEligibility = evaluateLillahEligibility;
exports.VALID_ADMISSION_TRANSITIONS = {
    inquiry: ['applied', 'cancelled'],
    applied: ['exam_scheduled', 'cancelled', 'rejected'],
    exam_scheduled: ['passed', 'rejected', 'cancelled'],
    passed: ['enrolled', 'cancelled'],
    rejected: ['applied'], // re-apply allowed in next term
    enrolled: [],
    cancelled: ['applied'],
};
function canTransitionAdmission(current, target) {
    if (current === target)
        return true;
    const allowed = exports.VALID_ADMISSION_TRANSITIONS[current] || [];
    return allowed.includes(target);
}
function evaluateLillahEligibility(params) {
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
    }
    else if (params.familyMonthlyIncome <= threshold * 1.5) {
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
