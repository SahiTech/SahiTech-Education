export interface SanadGenerationPayload {
    tenantId: string;
    studentId: string;
    classId: string;
    academicYearId: string;
    sanadSerialNo: string;
    marhalaNameBn: string;
    marhalaNameAr: string;
    studentNameBn: string;
    fatherNameBn: string;
    resultDharja: string;
    issueDate: string;
}
/**
 * Pure portable cryptographic verification token generator.
 * Runs in any environment (Node.js, Edge, Browser) without native bindings.
 */
export declare function generateSanadVerificationHash(payload: {
    tenantId: string;
    studentId: string;
    sanadSerialNo: string;
    issueDate: string;
}): string;
