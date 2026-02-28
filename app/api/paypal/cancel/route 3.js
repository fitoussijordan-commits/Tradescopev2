import { createClient } from '@/lib/supabase-server';
import { paypalRequest } from '@/lib/paypal';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('paypal_subscription_id')
      .eq('id', user.id)
      .single();

    if (!profile?.paypal_subscription_id) {
      return NextResponse.json({ error: 'Pas d\'abonnement actif' }, { status: 400 });
    }

    // Cancel on PayPal
    await paypalRequest('POST', `/v1/billing/subscriptions/${profile.paypal_subscription_id}/cancel`, {
      reason: 'User requested cancellation',
    });

    // Update profile
    await supabase.from('profiles').update({
      plan: 'none',
      subscription_status: 'canceled',
      paypal_subscription_id: null,
    }).eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayPal cancel error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
