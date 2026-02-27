import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // Sécuriser le cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tradescopev2.fr';
  const results = { reminders: 0, expired: 0, errors: [] };

  // 1. Users dont le trial expire demain → email reminder J-1
  const { data: usersToRemind } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan')
    .eq('trial_reminder_sent', false)
    .eq('subscription_status', 'trialing')
    .gte('trial_expires_at', now.toISOString())
    .lte('trial_expires_at', tomorrowEnd.toISOString());

  for (const user of (usersToRemind || [])) {
    try {
      await fetch(`${appUrl}/api/emails/trial-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.full_name || 'Trader',
          plan: user.plan,
        }),
      });

      await supabase
        .from('profiles')
        .update({ trial_reminder_sent: true })
        .eq('id', user.id);

      results.reminders++;
    } catch (e) {
      results.errors.push(`reminder:${user.id}`);
    }
  }

  // 2. Users dont le trial a expiré → bloquer + email
  const { data: expiredUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('subscription_status', 'trialing')
    .lt('trial_expires_at', now.toISOString());

  for (const user of (expiredUsers || [])) {
    try {
      await fetch(`${appUrl}/api/emails/trial-expired`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.full_name || 'Trader',
        }),
      });

      await supabase
        .from('profiles')
        .update({ subscription_status: 'inactive' })
        .eq('id', user.id);

      results.expired++;
    } catch (e) {
      results.errors.push(`expired:${user.id}`);
    }
  }

  return NextResponse.json({ success: true, ...results });
}
