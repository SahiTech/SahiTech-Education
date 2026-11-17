import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  hashCredentialNonce,
  manualAdminCredentialCookieName,
  openManualAdminCredential,
} from '@/lib/security/manual-admin-credential';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] as string);
}

function html(message: string, status = 200, clearCookie = false) {
  const response = new NextResponse(
    `<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>MDI One-time Admin Credential</title></head><body style="font-family:system-ui,sans-serif;max-width:720px;margin:48px auto;padding:24px;color:#17211d"><main>${message}</main></body></html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      },
    },
  );
  if (clearCookie) response.cookies.set(manualAdminCredentialCookieName, '', {
    httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(manualAdminCredentialCookieName)?.value;
  if (!cookieValue) {
    return html('<h1>Credential আর পাওয়া যাচ্ছে না</h1><p>নিরাপত্তার জন্য Credential একবারই দেখা যায়। প্রয়োজন হলে Global Owner-এর মাধ্যমে নতুন Recovery/Provisioning অনুরোধ করুন।</p>', 410);
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return html('<h1>অনুমোদন প্রয়োজন</h1><p>Global Owner account দিয়ে আবার Login করুন।</p>', 401, true);
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return html('<h1>MFA verification প্রয়োজন</h1><p>Global Owner account-এ MFA সম্পন্ন করে আবার চেষ্টা করুন।</p>', 403, true);
  const { data: isOwner, error: ownerError } = await (supabase.rpc as any)('is_platform_owner');
  if (ownerError || isOwner !== true) return html('<h1>অনুমতি নেই</h1>', 403, true);

  let payload;
  try {
    payload = openManualAdminCredential(cookieValue);
  } catch {
    return html('<h1>Credential মেয়াদোত্তীর্ণ বা অবৈধ</h1><p>নিরাপত্তার জন্য এই Credential আর দেখানো যাবে না।</p>', 410, true);
  }
  if (payload.ownerUserId !== user.id) {
    return html('<h1>Credential এই Owner session-এর জন্য নয়</h1>', 403, true);
  }

  const { data: consumed, error: consumeError } = await supabase.rpc(
    'owner_consume_manual_admin_credential_handoff',
    { p_nonce_hash: hashCredentialNonce(payload.nonce) },
  );
  if (consumeError || consumed !== true) {
    return html('<h1>Credential ইতিমধ্যে ব্যবহার করা হয়েছে বা মেয়াদ শেষ</h1><p>একটি Credential কেবল একবারই দেখা যায়।</p>', 410, true);
  }

  const institution = escapeHtml(payload.institutionName);
  const login = escapeHtml(payload.loginIdentifier);
  const password = escapeHtml(payload.temporaryPassword);
  const status = payload.activationStatus === 'active'
    ? 'প্রতিষ্ঠান সক্রিয়'
    : payload.activationStatus === 'pending_activation'
      ? 'প্রতিষ্ঠান Pending Activation-এ আছে'
      : 'Account প্রস্তুত';
  return html(`
    <h1>MDI Admin Credential</h1>
    <p><strong>${institution}</strong> — ${status}</p>
    <p>নিরাপত্তার জন্য এই পৃষ্ঠাটি একবারই দেখানো হবে। পৃষ্ঠাটি বন্ধ করার আগে Credential নিরাপদে কপি করে যাচাইকৃত ব্যক্তিকে পাঠান।</p>
    <section style="border:1px solid #cbd5d1;border-radius:12px;padding:18px;margin:20px 0">
      <p><strong>Login URL</strong><br><a href="https://sahitech.dpdns.org/login">https://sahitech.dpdns.org/login</a></p>
      <p><strong>MDI Login ID</strong></p><pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f5f3;padding:12px;border-radius:8px">${login}</pre>
      <p><strong>Temporary Password</strong></p><pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:#fff7df;padding:12px;border-radius:8px">${password}</pre>
    </section>
    <p><strong>জরুরি:</strong> প্রথম Login-এ নতুন Password সেট করা বাধ্যতামূলক। আবেদনকারীর প্রকৃত যোগাযোগের ইমেইল এখনো verified নয়; Login ID হিসেবে উপরের MDI Login ID ব্যবহার করতে হবে।</p>
    <p>WhatsApp/SMS-এ পাঠানোর আগে পরিচয় যাচাই করা ব্যক্তির সঙ্গেই Credential শেয়ার করুন। কাজ শেষে এই পৃষ্ঠা বন্ধ করুন।</p>
  `);
}
