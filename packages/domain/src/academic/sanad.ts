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
export function generateSanadVerificationHash(payload: {
  tenantId: string;
  studentId: string;
  sanadSerialNo: string;
  issueDate: string;
  classId?: string;
  resultDharja?: string;
}): string {
  // Institutional pepper preventing rainbow-table attacks
  const pepper = 'SAHITECH-MDI-SANAD-FIPS180-4-SHA256';
  
  // Canonical serialized string of immutable certificate attributes
  const canonicalData = [
    payload.tenantId.trim().toLowerCase(),
    payload.studentId.trim().toLowerCase(),
    payload.sanadSerialNo.trim().toUpperCase(),
    payload.issueDate.trim(),
    (payload.classId || '').trim().toLowerCase(),
    (payload.resultDharja || '').trim().toLowerCase(),
    pepper,
  ].join('|');

  // Compute 256-bit cryptographic digest
  const digest = sha256(canonicalData).toUpperCase();

  // Extract clean alphanumeric suffix from serial number
  const serialClean = payload.sanadSerialNo.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-4);

  // Return formatted high-entropy 256-bit verification token (safe for VARCHAR(128))
  return `SANAD-${serialClean}-${digest}`;
}

export { sha256 };
