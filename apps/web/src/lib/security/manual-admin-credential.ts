import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const COOKIE_NAME = '__Host-mdi-owner-credential';
const MAX_AGE_SECONDS = 90;

export interface ManualAdminCredentialPayload {
  ownerUserId: string;
  nonce: string;
  loginIdentifier: string;
  temporaryPassword: string;
  institutionName: string;
  activationStatus?: string;
  contactEmail?: string;
  contactEmailVerified: false;
  issuedAt: number;
}

function encryptionKey(): Buffer {
  const raw = process.env.MDI_CREDENTIAL_DISPLAY_KEY;
  if (!raw) throw new Error('manual_credential_display_key_missing');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('manual_credential_display_key_invalid');
  return key;
}

export function createCredentialNonce() {
  const nonce = randomBytes(32).toString('hex');
  const nonceHash = createHash('sha256').update(nonce).digest('hex');
  return { nonce, nonceHash };
}

export function sealManualAdminCredential(payload: ManualAdminCredentialPayload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    name: COOKIE_NAME,
    value: [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.'),
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    },
  };
}

export function openManualAdminCredential(value: string): ManualAdminCredentialPayload {
  const [ivPart, tagPart, ciphertextPart, extra] = value.split('.');
  if (!ivPart || !tagPart || !ciphertextPart || extra) throw new Error('credential_cookie_invalid');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(ivPart, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
  const payload = JSON.parse(plaintext) as ManualAdminCredentialPayload;
  if (!payload.ownerUserId || !payload.nonce || !payload.loginIdentifier
      || !payload.temporaryPassword || !Number.isFinite(payload.issuedAt)
      || Date.now() - payload.issuedAt > MAX_AGE_SECONDS * 1000) {
    throw new Error('credential_cookie_expired');
  }
  return payload;
}

export function hashCredentialNonce(nonce: string) {
  return createHash('sha256').update(nonce).digest('hex');
}

export const manualAdminCredentialCookieName = COOKIE_NAME;
