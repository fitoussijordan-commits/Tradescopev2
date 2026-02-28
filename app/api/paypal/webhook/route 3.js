import { paypalRequest } from '@/lib/paypal';
import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Map PayPal plan IDs to our plan names
async function getPlanFromPayPal(planId) {
  try {
    const plan = await paypalRequest('GET', `/v1/billing/plans/${planId}`);
    if (plan.name?.includes('Starter')) return 'starter';
    if (plan.name?.includes('Pro')) return 'pro';
    if (plan.name?.includes('Unlimited')) return 'unlimited';
  } catch (e) {}
  return 'none';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const eventType = body.event_type;
    const resource = body.resource;

    console.log('PayPal webhook:', eventType, resource?.id);

    const supabase = createAdminClient();

    switch (eventType) {
      // Subscription activated (after trial or immediately)
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subId = resource.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paypal_subscription_id', subId)
          .single();

        if (profile) {
          await supabase.from('profiles').update({
            subscription_status: 'active',
          }).eq('id', profile.id);
        }
        break;
      }

      // Payment completed
      case 'PAYMENT.SALE.COMPLETED': {
        const subId = resource.billing_agreement_id;
        if (!subId) break;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paypal_subscription_id', subId)
          .single();

        if (profile) {
          // Extend current_period_end by 1 month
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await supabase.from('profiles').update({
            subscription_status: 'active',
            current_period_end: periodEnd.toISOString(),
          }).eq('id', profile.id);
        }
        break;
      }

      // Subscription suspended (payment failed)
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subId = resource.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paypal_subscription_id', subId)
          .single();

        if (profile) {
          await supabase.from('profiles').update({
            subscription_status: 'past_due',
          }).eq('id', profile.id);
        }
        break;
      }

      // Subscription cancelled
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subId = resource.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paypal_subscription_id', subId)
          .single();

        if (profile) {
          await supabase.from('profiles').update({
            plan: 'none',
            subscription_status: 'canceled',
            paypal_subscription_id: null,
          }).eq('id', profile.id);
        }
        break;
      }

      // Payment failed
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const subId = resource.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paypal_subscription_id', subId)
          .single();

        if (profile) {
          await supabase.from('profiles').update({
            subscription_status: 'past_due',
          }).eq('id', profile.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
