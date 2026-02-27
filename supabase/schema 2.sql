-- ============================================
-- TradeScope SaaS - Schema SQL
-- Exécuter dans Supabase > SQL Editor
-- ============================================

-- Extension pour générer des UUIDs
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLE: profiles (lié à auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  plan text not null default 'none' check (plan in ('none', 'starter', 'pro', 'unlimited')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'inactive' check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'inactive')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLE: trading_accounts (comptes de trading)
-- ============================================
create table public.trading_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  prop_firm text not null default 'Personnel',
  base_capital decimal(12,2) not null default 50000,
  is_burned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLE: trades
-- ============================================
create table public.trades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  account_id uuid references public.trading_accounts(id) on delete cascade not null,
  date date not null,
  instrument text,
  type text check (type in ('LONG', 'SHORT')),
  pnl decimal(12,2) not null,
  risk decimal(12,2),
  rr decimal(8,4),
  pnl_percent decimal(8,4),
  size decimal(10,2),
  trading_view_link text,
  followed_strategy boolean default false,
  notes text,
  is_payout boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- TABLE: playbook_rules
-- ============================================
create table public.playbook_rules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- TABLE: daily_checklist
-- ============================================
create table public.daily_checklist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rule_id uuid references public.playbook_rules(id) on delete cascade not null,
  date date not null default current_date,
  checked boolean default false,
  unique(user_id, rule_id, date)
);

-- ============================================
-- INDEX pour performances
-- ============================================
create index idx_trades_user on public.trades(user_id);
create index idx_trades_account on public.trades(account_id);
create index idx_trades_date on public.trades(date desc);
create index idx_trading_accounts_user on public.trading_accounts(user_id);
create index idx_playbook_rules_user on public.playbook_rules(user_id);
create index idx_daily_checklist_user_date on public.daily_checklist(user_id, date);

-- ============================================
-- ROW LEVEL SECURITY (chaque user voit que ses données)
-- ============================================
alter table public.profiles enable row level security;
alter table public.trading_accounts enable row level security;
alter table public.trades enable row level security;
alter table public.playbook_rules enable row level security;
alter table public.daily_checklist enable row level security;

-- Profiles: un user ne voit que son profil
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trading accounts: un user ne voit que ses comptes
create policy "Users can view own accounts" on public.trading_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on public.trading_accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on public.trading_accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on public.trading_accounts for delete using (auth.uid() = user_id);

-- Trades: un user ne voit que ses trades
create policy "Users can view own trades" on public.trades for select using (auth.uid() = user_id);
create policy "Users can insert own trades" on public.trades for insert with check (auth.uid() = user_id);
create policy "Users can update own trades" on public.trades for update using (auth.uid() = user_id);
create policy "Users can delete own trades" on public.trades for delete using (auth.uid() = user_id);

-- Playbook rules
create policy "Users can view own rules" on public.playbook_rules for select using (auth.uid() = user_id);
create policy "Users can insert own rules" on public.playbook_rules for insert with check (auth.uid() = user_id);
create policy "Users can update own rules" on public.playbook_rules for update using (auth.uid() = user_id);
create policy "Users can delete own rules" on public.playbook_rules for delete using (auth.uid() = user_id);

-- Daily checklist
create policy "Users can view own checklist" on public.daily_checklist for select using (auth.uid() = user_id);
create policy "Users can insert own checklist" on public.daily_checklist for insert with check (auth.uid() = user_id);
create policy "Users can update own checklist" on public.daily_checklist for update using (auth.uid() = user_id);
create policy "Users can delete own checklist" on public.daily_checklist for delete using (auth.uid() = user_id);

-- ============================================
-- FUNCTION: créer profil auto à l'inscription
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- FUNCTION: mettre à jour updated_at
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_trading_accounts_updated_at
  before update on public.trading_accounts
  for each row execute procedure public.update_updated_at();
