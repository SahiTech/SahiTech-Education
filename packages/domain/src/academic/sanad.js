"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = void 0;
exports.generateSanadVerificationHash = generateSanadVerificationHash;
const crypto_sha256_1 = require("./crypto-sha256");
Object.defineProperty(exports, "sha256", { enumerable: true, get: function () { return crypto_sha256_1.sha256; } });
/**
 * Enterprise NIST FIPS 180-4 SHA-256 Cryptographic Verification Token Generator.
 * Delivers full 256-bit collision resistance against preimage, second-preimage,
 * and birthday attacks for official academic Sanads and Islamic board credentials.
 * Runs synchronously across all environments (Node.js, Edge Runtime, Browser) with zero dependencies.
 */
function generateSanadVerificationHash(payload) {
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
    const digest = (0, crypto_sha256_1.sha256)(canonicalData).toUpperCase();
    // Extract clean alphanumeric suffix from serial number
    const serialClean = payload.sanadSerialNo.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-4);
    // Return formatted high-entropy 256-bit verification token (safe for VARCHAR(128))
    return `SANAD-${serialClean}-${digest}`;
}
