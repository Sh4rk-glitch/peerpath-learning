// Supabase Edge Function (Deno) to send reservation confirmation emails via SendGrid
// Deploy with: `supabase functions deploy send_reservation_email`
// Required secrets: SENDGRID_API_KEY, FROM_EMAIL

export default async (req: Request) => {
  try {
    const body = await req.json();
    const to: string = body.to;
    const subject: string = body.subject || 'Session reservation confirmed';
    const text: string = body.text || '';
    const html: string = body.html || '';

    const SENDGRID = Deno.env.get('SENDGRID_API_KEY');
    const FROM = Deno.env.get('FROM_EMAIL') || 'noreply@example.com';

    if (!SENDGRID) {
      return new Response(JSON.stringify({ error: 'Missing SENDGRID_API_KEY' }), { status: 500 });
    }

    const payload = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM, name: 'PeerPath' },
      subject,
      content: [],
    } as any;

    if (text) payload.content.push({ type: 'text/plain', value: text });
    if (html) payload.content.push({ type: 'text/html', value: html });
    if (!payload.content.length) payload.content.push({ type: 'text/plain', value: text || subject });

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('SendGrid error', res.status, txt);
      return new Response(JSON.stringify({ error: 'SendGrid send failed', details: txt }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('send_reservation_email error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
