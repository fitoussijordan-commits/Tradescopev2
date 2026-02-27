import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, name, trialExpiresAt } = await request.json();

    const expiryDate = new Date(trialExpiresAt).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    await resend.emails.send({
      from: 'TradeScope <support@tradescopev2.fr>',
      to: email,
      subject: '🎯 Ton essai TradeScope commence maintenant',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #08090E; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1B4FFF, #7C3AED); padding: 32px; text-align: center;">
            <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-bottom: 16px;">TS</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Bienvenue sur TradeScope !</h1>
            <p style="margin: 8px 0 0; opacity: 0.85; font-size: 15px;">Ton essai gratuit de 7 jours commence maintenant.</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #9CA3AF; margin: 0 0 24px;">Salut ${name},</p>
            <p style="color: #E5E7EB; line-height: 1.6; margin: 0 0 24px;">
              Ton accès complet à TradeScope est activé jusqu'au <strong style="color: #ffffff;">${expiryDate}</strong>.
              Profites-en pour logger tes premiers trades et voir ce que le Playbook peut faire pour ta discipline.
            </p>
            <div style="background: #13151F; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 20px; margin: 0 0 24px;">
              <p style="margin: 0 0 12px; font-weight: bold; color: #ffffff;">Pour bien démarrer :</p>
              <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 14px;">✓ Crée ton premier compte de trading</p>
              <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 14px;">✓ Configure ton Playbook avec tes règles</p>
              <p style="margin: 0; color: #9CA3AF; font-size: 14px;">✓ Ajoute ton premier trade</p>
            </div>
            <div style="text-align: center;">
              <a href="https://www.tradescopev2.fr/dashboard" style="display: inline-block; background: #1B4FFF; color: white; font-weight: bold; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px;">
                Accéder à mon dashboard →
              </a>
            </div>
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
