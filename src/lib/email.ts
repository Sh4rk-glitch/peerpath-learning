export async function sendReservationEmail(session: any, toEmail: string) {
  try {
    if (!toEmail) return false;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !key) return false;

    const when = session?.raw?.start_time ? new Date(session.raw.start_time).toLocaleString() : session?.time || '';
    const host = session?.host || '';
    const link = session?.raw?.meet_link || `https://meet.google.com/lookup/${String(session.id).slice(0,8)}`;

    const subject = `You joined: ${session?.title || 'Session'}`;
    const text = `Hi,\n\nYou have joined the session "${session?.title}" hosted by ${host}.\n\nWhen: ${when}\n\nMeeting link: ${link}\n\nSee you there!`;
    const html = `<p>Hi,</p><p>You have joined the session "<strong>${session?.title}</strong>" hosted by <strong>${host}</strong>.</p><p><strong>When:</strong> ${when}</p><p><strong>Meeting link:</strong> <a href="${link}">${link}</a></p><p>See you there!</p>`;

    const res = await fetch(`${supabaseUrl.replace(/\/$/,'')}/functions/v1/send_reservation_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': String(key),
        'Authorization': `Bearer ${String(key)}`,
      },
      body: JSON.stringify({ to: toEmail, subject, text, html }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.warn('sendReservationEmail failed', res.status, txt);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('sendReservationEmail exception', e);
    return false;
  }
}
