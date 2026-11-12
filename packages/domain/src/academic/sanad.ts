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
export function generateSanadVerificationHash(payload: {
  tenantId: string;
  studentId: string;
  sanadSerialNo: string;
  issueDate: string;
}): string {
  const seed = 'SAHITECH-MDI-SANAD-VERIFIED';
  const raw = `${payload.tenantId}:${payload.studentId}:${payload.sanadSerialNo}:${payload.issueDate}:${seed}`;
  
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const part1 = (4294967296 + h1).toString(16).toUpperCase().slice(-8);
  const part2 = (4294967296 + h2).toString(16).toUpperCase().slice(-8);
  const serialClean = payload.sanadSerialNo.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-4);

  return `SANAD-${serialClean}-${part1}${part2}`;
}
