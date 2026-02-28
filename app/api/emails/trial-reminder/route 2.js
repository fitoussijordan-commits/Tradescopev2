import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, name, plan } = await request.json();

    const planNames = {
      starter: 'Starter — 4,99€/mois',
      pro: 'Pro — 9,99€/mois',
      unlimited: 'Unlimited — 19,99€/mois'
    };
    const planName = planNames[plan] || 'Pro — 9,99€/mois';

    await resend.emails.send({
      from: 'TradeScope <support@tradescopev2.fr>',
      to: email,
      subject: '⏰ Ton essai TradeScope expire demain',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #08090E; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: #13151F; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 24px 32px;">
            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #1B4FFF, #7C3AED); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">TS</div>
          </div>
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 8px; font-size: 22px;">Ton essai expire demain 👋</h2>
            <p style="color: #9CA3AF; margin: 0 0 24px;">Salut ${name}, ton accès gratuit se termine dans moins de 24h.</p>
            <div style="background: #13151F; border: 1px solid rgba(27,79,255,0.3); border-radius: 10px; padding: 20px; margin: 0 0 24px;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Ton plan</p>
              <p style="margin: 0; font-weight: bold; font-size: 18px; color: #1B4FFF;">${planName}</p>
            </div>
            <p style="color: #E5E7EB; line-height: 1.6; margin: 0 0 24px;">
              Pour continuer à utiliser TradeScope sans interruption, active ton abonnement maintenant.
              Tes trades et ton historique sont sauvegardés — tu ne perds rien.
            </p>
            <div style="text-align: center; margin: 0 0 16px;">
              <a href="https://www.tradescopev2.fr/account" style="display: inline-block; background: #1B4FFF; color: white; font-weight: bold; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px;">
                Activer mon abonnement →
              </a>
            </div>
            <p style="text-align: center; color: #6B7280; font-size: 13px; margin: 0;">
              Des questions ? Réponds directement à cet email.
            </p>
          </div>
          <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <p style="color: #4B5563; font-size: 12px; margin: 0;">TradeScope · support@tradescopev2.fr</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
