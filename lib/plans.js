export const PLANS = {
  starter: {
    name: 'Starter',
    price: 4.99,
    priceId: process.env.STRIPE_PRICE_STARTER,
    maxAccounts: 1,
    features: {
      globalStats: false,
      playbook: false,
      export: false,
    },
    description: 'Parfait pour débuter',
    badge: null,
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_PRO,
    maxAccounts: 3,
    features: {
      globalStats: true,
      playbook: true,
      export: false,
    },
    description: 'Pour les traders sérieux',
    badge: 'Populaire',
  },
  unlimited: {
    name: 'Unlimited',
    price: 19.99,
    priceId: process.env.STRIPE_PRICE_UNLIMITED,
    maxAccounts: Infinity,
    features: {
      globalStats: true,
      playbook: true,
      export: true,
    },
    description: 'Accès complet sans limites',
    badge: 'Best Value',
  },
};

export function getPlan(planName) {
  return PLANS[planName] || null;
}

export function canAccessFeature(plan, feature) {
  const p = PLANS[plan];
  if (!p) return false;
  return p.features[feature] ?? false;
}

export function getMaxAccounts(plan) {
  const p = PLANS[plan];
  if (!p) return 0;
  return p.maxAccounts;
}

export function hasActiveSubscription(profile) {
  return profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';
}
