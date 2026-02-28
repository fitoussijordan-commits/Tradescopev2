import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET: récupérer les trades
export async function GET(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('account_id');
  const isPayout = searchParams.get('is_payout');

  let query = supabase.from('trades').select('*, strategies(id, name, color)').eq('user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false });

  if (accountId) query = query.eq('account_id', accountId);
  if (isPayout !== null) query = query.eq('is_payout', isPayout === 'true');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: créer un trade
export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  
  // Calculer R:R si risk est fourni
  let rr = null;
  if (body.risk && body.risk > 0) {
    rr = body.pnl / body.risk;
  }

  const { data, error } = await supabase.from('trades').insert({
    user_id: user.id,
    account_id: body.account_id,
    date: body.date,
    instrument: body.instrument,
    type: body.type,
    pnl: body.pnl,
    risk: body.risk || null,
    rr,
    pnl_percent: body.pnl_percent,
    size: body.size || null,
    trading_view_link: body.trading_view_link || null,
    followed_strategy: body.followed_strategy || false,
    notes: body.notes || null,
    is_payout: body.is_payout || false,
    session: body.session || null,
    strategy_id: body.strategy_id || null,
  }).select('*, strategies(id, name, color)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: supprimer un trade
export async function DELETE(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { error } = await supabase.from('trades').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH: modifier un trade
export async function PATCH(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  let rr = fields.rr;
  if (fields.risk && fields.risk > 0 && fields.pnl !== undefined) {
    rr = fields.pnl / fields.risk;
  }

  const { data, error } = await supabase.from('trades')
    .update({
      date: fields.date,
      instrument: fields.instrument,
      type: fields.type,
      pnl: fields.pnl,
      risk: fields.risk || null,
      rr,
      size: fields.size || null,
      trading_view_link: fields.trading_view_link || null,
      followed_strategy: fields.followed_strategy ?? false,
      notes: fields.notes || null,
      session: fields.session || null,
      strategy_id: fields.strategy_id || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, strategies(id, name, color)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
