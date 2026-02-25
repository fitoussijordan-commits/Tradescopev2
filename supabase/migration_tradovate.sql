-- ============================================
-- MIGRATION: Ajouter tradovate_data à trades
-- Exécuter dans Supabase > SQL Editor
-- ============================================
-- Cette colonne stocke les données enrichies depuis Tradovate
-- (durée, fills, prix d'entrée/sortie, heures, etc.)
-- C'est 100% additif, aucune donnée existante n'est modifiée.

ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS tradovate_data jsonb DEFAULT NULL;

-- Index pour requêter les trades enrichis si besoin
CREATE INDEX IF NOT EXISTS idx_trades_tradovate 
ON public.trades ((tradovate_data IS NOT NULL)) 
WHERE tradovate_data IS NOT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN public.trades.tradovate_data IS 
'Données enrichies depuis CSV Tradovate: fills, durées, prix entrée/sortie, heures session';
