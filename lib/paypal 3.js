const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'PayPal auth failed');
  return data.access_token;
}

export async function paypalRequest(method, path, body = null) {
  const token = await getAccessToken();
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${PAYPAL_BASE}${path}`, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// Create product + 3 plans if they don't exist
export async function ensurePlans() {
  const token = await getAccessToken();

  // Check if product exists
  const products = await paypalRequest('GET', '/v1/catalogs/products?page_size=20');
  let productId = products.products?.find(p => p.name === 'TradeScope')?.id;

  if (!productId) {
    const product = await paypalRequest('POST', '/v1/catalogs/products', {
      name: 'TradeScope',
      description: 'Journal de trading SaaS',
      type: 'SERVICE',
      category: 'SOFTWARE',
    });
    productId = product.id;
  }

  // Check existing plans
  const plans = await paypalRequest('GET', `/v1/billing/plans?product_id=${productId}&page_size=20`);
  const existingPlans = plans.plans || [];

  const planConfigs = [
    { name: 'TradeScope Starter', key: 'starter', price: '4.99' },
    { name: 'TradeScope Pro', key: 'pro', price: '9.99' },
    { name: 'TradeScope Unlimited', key: 'unlimited', price: '19.99' },
  ];

  const result = {};

  for (const cfg of planConfigs) {
    let plan = existingPlans.find(p => p.name === cfg.name && p.status === 'ACTIVE');

    if (!plan) {
      plan = await paypalRequest('POST', '/v1/billing/plans', {
        product_id: productId,
        name: cfg.name,
        description: `Abonnement ${cfg.key}`,
        billing_cycles: [
          {
            frequency: { interval_unit: 'DAY', interval_count: 7 },
            tenure_type: 'TRIAL',
            sequence: 1,
            total_cycles: 1,
            pricing_scheme: { fixed_price: { value: '0', currency_code: 'EUR' } },
          },
          {
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 2,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: cfg.price, currency_code: 'EUR' } },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      });
    }

    result[cfg.key] = plan.id;
  }

  return result;
}
