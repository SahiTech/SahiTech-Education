import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!/^[0-9A-Fa-f]{64}$/.test(token)) {
    return NextResponse.redirect(new URL('/newsletter/confirmed?status=invalid', request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('confirm_newsletter_subscription', { p_token: token });
  const status = !error && data === true ? 'success' : 'invalid';
  return NextResponse.redirect(new URL(`/newsletter/confirmed?status=${status}`, request.url));
}
