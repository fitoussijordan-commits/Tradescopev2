import { createClient } from '@/lib/supabase-server';
import { getMaxAccounts } from '@/lib/plans';
import { NextResponse } from 'next/server';

// GET: récupérer les comptes trading
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data, error } = await supabase
    .from('trading_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: créer un compte trading
export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Vérifier la limite du plan
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
  const maxAccounts = getMaxAccounts(profile?.plan);

  const { count } = await supabase
    .from('trading_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_burned', false);

  if (count >= maxAccounts) {
    return NextResponse.json({ 
      error: `Limite de ${maxAccounts} compte(s) atteinte. Passe au plan supérieur pour en ajouter.` 
    }, { status: 403 });
  }

  const body = await request.json();
  const { data, error } = await supabase.from('trading_accounts').insert({
    user_id: user.id,
    name: body.name,
    prop_firm: body.prop_firm,
    base_capital: body.base_capital,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: modifier un compte
export async function PATCH(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('trading_accounts')
    .update({
      name: body.name,
      prop_firm: body.prop_firm,
      is_burned: body.is_burned,
    })
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: supprimer un compte
export async function DELETE(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Supprimer aussi les trades liés
  await supabase.from('trades').delete().eq('account_id', id).eq('user_id', user.id);
  const { error } = await supabase.from('trading_accounts').delete().eq('id', id).eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
