import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { messages, context } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 });

  // Build conversation for Gemini
  const systemPrompt = `Tu es un coach de trading expert qui analyse les performances d'un trader. Tu as accès à ses données réelles. Sois direct, précis et actionnable. Réponds en français. Utilise des données chiffrées de ses stats pour appuyer tes analyses. Formate ta réponse avec des sections claires.`;

  const contents = messages.map((m, i) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{
      text: i === 0 && m.role === 'user'
        ? `${systemPrompt}\n\nVoici les données de trading du trader:\n\n${context}\n\nSa question: ${m.content}`
        : m.content
    }]
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
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
