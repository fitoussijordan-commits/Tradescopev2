import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { messages, context } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 });

  const systemPrompt = `Tu es un coach de trading professionnel expert, spécialisé dans le prop firm trading (futures: NQ, ES, MNQ, MES, etc.). Tu analyses les données RÉELLES du trader et tu donnes des conseils ultra-concrets et personnalisés.

RÈGLES:
- Réponds TOUJOURS en français
- Utilise les CHIFFRES RÉELS des données fournies pour appuyer chaque point
- Sois DIRECT et ACTIONNABLE — pas de blabla générique
- Formate ta réponse avec des sections claires (utilise ## pour les titres, **gras** pour les points importants, - pour les listes)
- Quand tu identifies un problème, donne TOUJOURS la solution concrète
- Adapte ton ton: encourageant si les stats sont bonnes, honnête mais constructif si elles sont mauvaises
- Ne fais JAMAIS de recommandation sans la baser sur les données réelles du trader
- Quand tu parles de drawdown, risk management, ou discipline, sois précis avec des chiffres
- Si le trader a un Health Score faible, commence par les 2-3 actions les plus urgentes
- Pense comme un mentor qui veut VRAIMENT voir ce trader réussir

MÉTRIQUES CLÉS À ANALYSER:
- Win Rate + contexte (bon WR avec mauvais RR = problème, et vice-versa)
- Profit Factor (< 1 = perd de l'argent, 1-1.5 = fragile, > 1.5 = solide, > 2 = excellent)
- R:R ratio (relation avec le win rate, expectancy)
- Drawdown et risk management
- Patterns temporels (jours, sessions)
- Discipline (respect de la stratégie)
- Overtrading
- Séries perdantes et gestion émotionnelle

FORMULE D'EXPECTANCY: (WinRate × AvgWin) - (LossRate × AvgLoss)
Si positive = le trader a un edge. Si négative = pas d'edge statistique.`;

  const contents = messages.map((m, i) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{
      text: i === 0 && m.role === 'user'
        ? `${systemPrompt}\n\nVoici les données complètes de trading du trader:\n\n${context}\n\nSa question: ${m.content}`
        : m.content
    }]
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message || 'Erreur Gemini' }, { status: 500 });
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse.';
    return NextResponse.json({ reply });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
