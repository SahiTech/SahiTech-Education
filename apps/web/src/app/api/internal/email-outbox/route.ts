import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;

type OutboxItem = {
  id: string;
  event_type: string;
  recipient_email: string;
  payload: Record<string, unknown>;
  attempts: number;
};

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] as string);
}

function renderEmail(item: OutboxItem) {
  const institution = escapeHtml(item.payload.institution_name || 'your institution');
  if (item.event_type === 'madrasa_application_received') {
    const contact = escapeHtml(item.payload.contact_person_name || 'Applicant');
    return {
      subject: 'MDI application received — SahiTech Education',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033;line-height:1.7"><h2>Application received</h2><p>Dear ${contact},</p><p>We have received the Madrasa application for <strong>${institution}</strong>.</p><p>The application will be reviewed by the SahiTech Education Global Platform Owner. No tenant workspace or active account is created until verification and approval are complete.</p><p>Thank you,<br/>SahiTech Education · MDI</p></div>`,
    };
  }
  if (item.event_type === 'madrasa_invitation') {
    const url = String(item.payload.invitation_url || '');
    if (!url.startsWith('https://')) throw new Error('Invitation URL is missing or invalid.');
    const expires = escapeHtml(item.payload.expires_at || '');
    return {
      subject: 'Your MDI invitation — SahiTech Education',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033;line-height:1.7"><h2>You are invited to MDI</h2><p>Your institution <strong>${institution}</strong> has passed the document verification and approval stage.</p><p><a href="${escapeHtml(url)}" style="display:inline-block;background:#047857;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Accept invitation</a></p><p>This single-use invitation expires at ${expires}. It must be accepted using the invited email address.</p><p>After acceptance, complete the institutional onboarding. Final tenant activation requires a separate platform review.</p><p>SahiTech Education · MDI</p></div>`,
    };
  }
  throw new Error(`Unsupported email event: ${item.event_type}`);
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.MDI_OUTBOX_CRON_SECRET;
  const suppliedSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!expectedSecret || !suppliedSecret || !safeEqual(expectedSecret, suppliedSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !from) {
    return NextResponse.json({ error: 'Email worker configuration is incomplete.' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: batch, error: claimError } = await supabase.rpc('claim_email_outbox_batch', { p_limit: 20 });
  if (claimError) return NextResponse.json({ error: 'Could not claim email outbox items.' }, { status: 500 });

  let sent = 0;
  let failed = 0;
  for (const item of (batch || []) as OutboxItem[]) {
    try {
      const message = renderEmail(item);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [item.recipient_email], subject: message.subject, html: message.html }),
      });
      if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
      const { error: finishError } = await supabase.rpc('finish_email_outbox', { p_id: item.id, p_success: true, p_error: null });
      if (finishError) throw new Error('Email sent, but outbox status could not be finalized.');
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown delivery error';
      await supabase.rpc('finish_email_outbox', { p_id: item.id, p_success: false, p_error: message });
      failed += 1;
    }
  }

  return NextResponse.json({ claimed: (batch || []).length, sent, failed });
}
