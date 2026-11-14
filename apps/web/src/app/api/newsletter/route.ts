import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function deriveToken(purpose: 'newsletter-confirm' | 'newsletter-unsubscribe', nonce: string, secret: string) {
  return createHmac('sha256', secret).update(`mdi-${purpose}:${nonce}`).digest('hex').toUpperCase();
}

function hashToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body?.website === 'string' && body.website.trim()) {
      return NextResponse.json({ success: true });
    }

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const locale = body?.locale === 'en' || body?.locale === 'ar' ? body.locale : 'bn';
    if (!body?.consent || !validEmail(email)) {
      return NextResponse.json({ success: false, error: 'invalid_request' }, { status: 400 });
    }

    const secret = process.env.MDI_EMAIL_TOKEN_HMAC_SECRET;
    if (!secret || secret.length < 32) {
      return NextResponse.json({ success: false, error: 'subscription_unavailable' }, { status: 503 });
    }

    const confirmationNonce = randomBytes(32).toString('hex');
    const unsubscribeNonce = randomBytes(32).toString('hex');
    const confirmationToken = deriveToken('newsletter-confirm', confirmationNonce, secret);
    const unsubscribeToken = deriveToken('newsletter-unsubscribe', unsubscribeNonce, secret);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('submit_newsletter_subscription', {
      p_email: email,
      p_locale: locale,
      p_confirmation_token_hash: hashToken(confirmationToken),
      p_confirmation_token_nonce: confirmationNonce,
      p_unsubscribe_token_hash: hashToken(unsubscribeToken),
      p_unsubscribe_token_nonce: unsubscribeNonce,
    });

    if (error) {
      return NextResponse.json({ success: false, error: 'subscription_unavailable' }, { status: 503 });
    }
    if (data !== 'queued' && data !== 'pending' && data !== 'already_subscribed') {
      return NextResponse.json({ success: false, error: 'subscription_unavailable' }, { status: 503 });
    }

    return NextResponse.json({ success: true, status: data }, { status: 202 });
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_request' }, { status: 400 });
  }
}
