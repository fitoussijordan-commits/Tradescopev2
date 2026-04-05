import { createClient } from '@/lib/supabase-server';
import { paypalRequest } from '@/lib/paypal';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { subscriptionId, plan, promoCode } = await request.json();
    if (!subscriptionId || !plan) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Verify subscription with PayPal
    const sub = await paypalRequest('GET', `/v1/billing/subscriptions/${subscriptionId}`);

    if (sub.status !== 'ACTIVE' && sub.status !== 'APPROVAL_PENDING') {
      return NextResponse.json({ error: 'Abonnement non actif' }, { status: 400 });
    }

    // Si un code promo est fourni, incrémenter son utilisation
    if (promoCode) {
      const normalizedCode = promoCode.trim().toUpperCase();
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('id, current_uses')
        .eq('code', normalizedCode)
        .eq('is_active', true)
        .single();

      if (promo) {
        await supabase
          .from('promo_codes')
          .update({ current_uses: promo.current_uses + 1 })
          .eq('id', promo.id);
      }
    }

    // Calculate trial end (7 days from now)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    // Calculate current period end (1 month after trial)
    const periodEnd = new Date(trialEnd);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Update profile
    await supabase.from('profiles').update({
      plan,
      paypal_subscription_id: subscriptionId,
      subscription_status: 'trialing',
      trial_ends_at: trialEnd.toISOString(),
      current_period_end: periodEnd.toISOString(),
      promo_code: promoCode ? promoCode.trim().toUpperCase() : null,
    }).eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayPal subscribe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
