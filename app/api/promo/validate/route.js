import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { code, plan } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Chercher le code promo
    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single();

    if (error || !promo) {
      return NextResponse.json({ error: 'Code promo invalide' }, { status: 404 });
    }

    // Vérifier l'expiration
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Ce code promo a expiré' }, { status: 400 });
    }

    // Vérifier le nombre max d'utilisations
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return NextResponse.json({ error: 'Ce code promo n\'est plus disponible' }, { status: 400 });
    }

    // Vérifier que le plan est éligible (si un plan est fourni)
    if (plan && promo.applicable_plans.length > 0 && !promo.applicable_plans.includes(plan)) {
      return NextResponse.json({
        error: `Ce code promo n'est pas applicable au plan ${plan}`,
        applicable_plans: promo.applicable_plans
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discount_percent: promo.discount_percent,
      applicable_plans: promo.applicable_plans,
      is_permanent: promo.is_permanent,
      duration_months: promo.duration_months,
    });
  } catch (error) {
    console.error('Promo validate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
