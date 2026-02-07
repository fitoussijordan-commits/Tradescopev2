import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

const PLAN_FROM_PRICE = {};
// On construit le mapping au runtime
function getPlanFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_UNLIMITED) return 'unlimited';
  return 'none';
}

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.supabase_user_id;
      const plan = session.metadata.plan;

      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        await supabase.from('profiles').update({
          plan,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status, // 'trialing' ou 'active'
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Trouver le user par customer_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = getPlanFromPriceId(priceId);

        await supabase.from('profiles').update({
          plan,
          subscription_status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        }).eq('id', profile.id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        await supabase.from('profiles').update({
          plan: 'none',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        }).eq('id', profile.id);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
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
}
