import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, name } = await request.json();

    await resend.emails.send({
      from: 'TradeScope <support@tradescopev2.fr>',
      to: email,
      subject: '🔒 Ton accès TradeScope a expiré',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #08090E; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: #13151F; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 24px 32px;">
            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #1B4FFF, #7C3AED); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">TS</div>
          </div>
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 8px; font-size: 22px;">Ton essai a expiré</h2>
            <p style="color: #9CA3AF; margin: 0 0 24px;">Salut ${name}, ton accès gratuit est terminé.</p>
            <p style="color: #E5E7EB; line-height: 1.6; margin: 0 0 24px;">
              Tes données sont toujours là — trades, stats, playbook.
              Choisis un plan pour retrouver ton accès immédiatement.
            </p>
            <div style="background: #13151F; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 20px; margin: 0 0 24px;">
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                <span style="color: #E5E7EB; font-weight: bold;">Starter</span>
                <span style="color: #1B4FFF; font-weight: bold;">4,99€/mois</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                <span style="color: #E5E7EB; font-weight: bold;">Pro ⭐</span>
                <span style="color: #1B4FFF; font-weight: bold;">9,99€/mois</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                <span style="color: #E5E7EB; font-weight: bold;">Unlimited</span>
                <span style="color: #1B4FFF; font-weight: bold;">19,99€/mois</span>
              </div>
            </div>
            <div style="text-align: center;">
              <a href="https://www.tradescopev2.fr/account" style="display: inline-block; background: #1B4FFF; color: white; font-weight: bold; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px;">
                Choisir mon plan →
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
