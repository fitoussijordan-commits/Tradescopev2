import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const plan = searchParams.get('plan') || 'pro';

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Set le trial à 7 jours
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

      await supabase
        .from('profiles')
        .update({
          trial_expires_at: trialExpiresAt.toISOString(),
          subscription_status: 'trialing',
          plan: plan,
        })
        .eq('id', data.user.id);

      // Email de bienvenue
      await fetch(`${origin}/api/emails/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.user.email,
          name: data.user.user_metadata?.full_name || 'Trader',
          trialExpiresAt: trialExpiresAt.toISOString(),
        }),
      });

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
