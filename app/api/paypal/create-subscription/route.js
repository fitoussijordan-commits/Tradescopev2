import { createClient } from '@/lib/supabase-server';
import { paypalRequest } from '@/lib/paypal';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { planId, discountedPrice } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'Plan manquant' }, { status: 400 });
    }

    const subConfig = { plan_id: planId };

    // Si prix réduit, override côté serveur (supporté par l'API REST PayPal)
    if (discountedPrice) {
      subConfig.plan = {
        billing_cycles: [
          {
            sequence: 2,
            pricing_scheme: {
              fixed_price: { value: discountedPrice, currency_code: 'EUR' }
            }
          }
        ]
      };
    }

    const subscription = await paypalRequest('POST', '/v1/billing/subscriptions', subConfig);

    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
