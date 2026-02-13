import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const body = await request.json();
  const { accountId, maxLoss, objWeekPct, objDayPct } = body;

  const { data: account } = await supabase
    .from('trading_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single();

  if (!account) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('account_id', accountId)
    .eq('user_id', user.id)
    .eq('is_payout', false)
    .order('date', { ascending: true });

  // Build export data and send as JSON - client will format
  return NextResponse.json({
    account,
    trades: trades || [],
    params: { maxLoss, objWeekPct, objDayPct },
  });
}
