import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { data: strategies } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');

    return NextResponse.json(strategies || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { name, description, color } = await request.json();
    if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

    const { data, error } = await supabase
      .from('strategies')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        color: color || '#3B82F6',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { id, name, description, color } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const { data, error } = await supabase
      .from('strategies')
      .update({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        color: color || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
