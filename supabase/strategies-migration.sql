-- Add strategies table
CREATE TABLE strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for strategies
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own strategies" ON strategies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strategies" ON strategies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies" ON strategies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies" ON strategies
  FOR DELETE USING (auth.uid() = user_id);

-- Add new fields to trades table
ALTER TABLE trades ADD COLUMN strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL;
ALTER TABLE trades ADD COLUMN error_tags TEXT[]; -- Array of error tags
ALTER TABLE trades ADD COLUMN confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5);

-- Add some default strategies function
CREATE OR REPLACE FUNCTION create_default_strategies(user_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO strategies (user_id, name, description, color) VALUES
    (user_uuid, 'Breakout', 'Entrée sur cassure de résistance/support', '#10B981'),
    (user_uuid, 'Reversal', 'Retournement sur zones clés', '#EF4444'),
    (user_uuid, 'Scalp', 'Trades courts sous 5 minutes', '#8B5CF6'),
    (user_uuid, 'Swing', 'Trades de plusieurs heures/jours', '#F59E0B');
END;
$$ LANGUAGE plpgsql;
