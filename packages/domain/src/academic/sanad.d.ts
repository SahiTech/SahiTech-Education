import { sha256 } from './crypto-sha256';
export interface SanadGenerationPayload {
    tenantId: string;
    studentId: string;
    classId?: string;
    academicYearId?: string;
    sanadSerialNo: string;
    issueDate: string;
    resultDharja?: string;
    gpa?: number;
}
/**
 * Enterprise NIST FIPS 180-4 SHA-256 Cryptographic Verification Token Generator.
 * Delivers full 256-bit collision resistance against preimage, second-preimage,
 * and birthday attacks for official academic Sanads and Islamic board credentials.
 * Runs synchronously across all environments (Node.js, Edge Runtime, Browser) with zero dependencies.
 */
export declare function generateSanadVerificationHash(payload: {
    tenantId: string;
    studentId: string;
    sanadSerialNo: string;
    issueDate: string;
    classId?: string;
    resultDharja?: string;
}): string;
export { sha256 };
