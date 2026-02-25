ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS tradovate_data jsonb DEFAULT NULL;
