import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPPORT_EMAIL = 'support@tradescopev2.fr';

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Champs requis' }, { status: 400 });
    }

    // Store in Supabase
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase.from('contact_messages').insert({
      name,
      email,
      message,
    });

    // Send email via Resend or fallback
    // For now we use a simple fetch to a free email API
    // You can replace this with Resend, SendGrid, etc.
    try {
      // Try sending via Supabase Edge Function or external service
      // Fallback: just store in DB, you check the table
      
      // If RESEND_API_KEY is set, send via Resend
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'TradeScope <onboarding@resend.dev>',
            to: SUPPORT_EMAIL,
            subject: `[TradeScope] Message de ${name}`,
            html: `
              <h2>Nouveau message de contact</h2>
              <p><strong>Nom:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
            `,
            reply_to: email,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Email send failed (message saved in DB):', emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
