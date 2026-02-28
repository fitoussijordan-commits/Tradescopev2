import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { trades, account_id } = await request.json();

  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    return NextResponse.json({ error: 'Aucun trade à importer' }, { status: 400 });
  }

  if (!account_id) {
    return NextResponse.json({ error: 'Compte de trading requis' }, { status: 400 });
  }

  // Verify account belongs to user
  const { data: account } = await supabase
    .from('trading_accounts')
    .select('id')
    .eq('id', account_id)
    .eq('user_id', user.id)
    .single();

  if (!account) {
    return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });
  }

  // Prepare trades for insert
  const toInsert = trades.map(t => ({
    user_id: user.id,
    account_id,
    date: t.date,
    instrument: t.instrument || null,
    type: t.type || null,
    pnl: t.pnl,
    size: t.size || null,
    notes: t.notes || null,
    session: t.session || null,
    is_payout: false,
    followed_strategy: false,
  }));

  const { data, error } = await supabase
    .from('trades')
    .insert(toInsert)
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: data.length });
}
