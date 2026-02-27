# TradeScope SaaS - Journal de Trading

## 🚀 Déploiement en 30 minutes

### Étape 1 : Créer les comptes (gratuits)

1. **GitHub** → https://github.com (si pas déjà fait)
2. **Vercel** → https://vercel.com (connexion avec GitHub)
3. **Supabase** → https://supabase.com (créer un projet, noter l'URL + clé anon + clé service)
4. **Stripe** → https://stripe.com (créer un compte, activer le mode test d'abord)

### Étape 2 : Configurer Supabase

1. Dans Supabase > SQL Editor, exécuter le contenu de `supabase/schema.sql`
2. Dans Authentication > URL Configuration :
   - Site URL : `https://ton-domaine.vercel.app`
   - Redirect URLs : `https://ton-domaine.vercel.app/auth/callback`

### Étape 3 : Configurer Stripe

1. Créer 3 produits dans Stripe Dashboard > Products :
   - **Starter** : 4.99€/mois
   - **Pro** : 9.99€/mois  
   - **Unlimited** : 19.99€/mois
2. Pour chaque produit, cocher "Free trial" > 7 jours
3. Copier les Price IDs (commencent par `price_...`)
4. Créer un webhook : Developers > Webhooks > Add endpoint
   - URL : `https://ton-domaine.vercel.app/api/stripe/webhook`
   - Events : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

### Étape 4 : Variables d'environnement

Dans Vercel > Settings > Environment Variables, ajouter :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_UNLIMITED=price_...
NEXT_PUBLIC_APP_URL=https://ton-domaine.vercel.app
```

### Étape 5 : Déployer

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ton-user/tradescope.git
git push -u origin main
```

Vercel détecte automatiquement le push et déploie.

### Étape 6 : Domaine (optionnel)

1. Acheter un domaine sur Namecheap (~12€/an)
2. Dans Vercel > Settings > Domains > ajouter ton domaine
3. Mettre à jour les DNS comme indiqué par Vercel

---

## 📁 Structure du projet

```
tradescope/
├── app/
│   ├── layout.js              # Layout global
│   ├── page.js                # Landing page (pricing)
│   ├── auth/
│   │   ├── login/page.js      # Page de connexion
│   │   ├── register/page.js   # Page d'inscription
│   │   └── callback/route.js  # Callback OAuth Supabase
│   ├── (dashboard)/
│   │   ├── layout.js          # Layout dashboard (sidebar, auth check)
│   │   ├── dashboard/page.js  # Dashboard principal
│   │   ├── trades/page.js     # Liste des trades
│   │   ├── payouts/page.js    # Payouts
│   │   ├── statistics/page.js # Stats compte
│   │   ├── global-stats/page.js # Stats globales
│   │   ├── playbook/page.js   # Playbook
│   │   └── account/page.js    # Gestion compte + abonnement
│   └── api/
│       ├── stripe/
│       │   ├── checkout/route.js   # Créer une session Stripe
│       │   ├── webhook/route.js    # Webhook Stripe
│       │   └── portal/route.js     # Portail client Stripe
│       ├── trades/route.js         # CRUD trades
│       ├── accounts/route.js       # CRUD comptes trading
│       ├── payouts/route.js        # CRUD payouts
│       └── playbook/route.js       # CRUD playbook rules
├── components/
│   ├── DashboardShell.js      # Sidebar + top bar
│   ├── TradeModal.js          # Modal ajout trade
│   └── PricingCards.js        # Cards de pricing
├── lib/
│   ├── supabase-server.js     # Client Supabase (serveur)
│   ├── supabase-browser.js    # Client Supabase (navigateur)
│   ├── stripe.js              # Config Stripe
│   └── plans.js               # Définition des plans
├── supabase/
│   └── schema.sql             # Schéma base de données
├── package.json
├── next.config.js
├── tailwind.config.js
├── .env.local.example
└── middleware.js               # Protection des routes
```

## 💰 Plans

| | Starter | Pro | Unlimited |
|---|---|---|---|
| Prix | 4.99€/mois | 9.99€/mois | 19.99€/mois |
| Comptes | 1 | 3 | Illimité |
| Stats globales | ✗ | ✓ | ✓ |
| Playbook | ✗ | ✓ | ✓ |
| Export | ✗ | ✗ | ✓ |
| Trial | 7j | 7j | 7j |

## 🔧 Développement local

```bash
npm install
cp .env.local.example .env.local
# Remplir les variables dans .env.local
npm run dev
```

Ouvrir http://localhost:3000
