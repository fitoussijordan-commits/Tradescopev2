-- ============================================
-- MIGRATION: Système de codes promo
-- À exécuter dans Supabase > SQL Editor
-- ============================================

-- Table des codes promo
create table if not exists public.promo_codes (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 100),
  applicable_plans text[] not null default '{}',
  is_permanent boolean not null default true,
  duration_months integer, -- null = permanent, sinon nombre de mois
  max_uses integer, -- null = illimité
  current_uses integer not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz, -- null = pas d'expiration
  created_at timestamptz default now()
);

-- Ajouter le champ promo_code sur profiles
alter table public.profiles add column if not exists promo_code text;

-- Index pour recherche rapide par code
create index if not exists idx_promo_codes_code on public.promo_codes(code);

-- RLS sur promo_codes (lecture seule pour les users authentifiés)
alter table public.promo_codes enable row level security;

create policy "Anyone can read active promo codes" on public.promo_codes
  for select using (is_active = true);

-- ============================================
-- INSÉRER LE CODE PROMO WELCOME20
-- ============================================
insert into public.promo_codes (code, discount_percent, applicable_plans, is_permanent, max_uses, is_active)
values ('WELCOME20', 20, ARRAY['pro', 'unlimited'], true, null, true)
on conflict (code) do nothing;
