// One-off broadcast: registration reminder to unregistered parents.
// Protected by a shared secret. Iterates guardians without registrations and
// invokes send-transactional-email for each unique email.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SHARED_SECRET = 'pafc-reg-reminder-2026-06-16'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  if (url.searchParams.get('secret') !== SHARED_SECRET) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const TITLE = 'Action Required: Player Registration – Deadline Tue 30 June 2026'
  const MESSAGE = `Hi,

This is a quick reminder that every PAFC player must be registered for the 2026/27 season by Tuesday 30 June 2026.

The league won't accept late registrations and any child not signed off won't be eligible to play in the opening fixtures, so please get this done as soon as you can — it only takes 5 minutes.

How to register:
1. Go to https://www.pa-fc.uk/register
2. Sign in or create your free PAFC account
3. Fill in your child's details (DOB, medical info, emergency contact, FA Fan Number if you have one)
4. Upload a clear head-and-shoulders photo of your child
5. Submit — you'll get a confirmation email

If you have more than one child at the club, please complete a separate registration for each player.

Any issues, just reply to this email or message Ben and we'll help you through it.

Thanks for getting this sorted early — it makes a huge difference to getting the season started smoothly.

Up the Lions! 🦁`

  // Fetch recipients via raw SQL through PostgREST RPC? We don't have one, so
  // query in two steps using the JS client.
  const { data: guardians, error: gErr } = await supabase
    .from('guardians')
    .select('id, player_name, parent_user_id')
    .eq('status', 'active')
  if (gErr) return new Response(JSON.stringify({ error: gErr.message }), { status: 500 })

  const parentIds = Array.from(new Set((guardians ?? []).map(g => g.parent_user_id).filter(Boolean)))
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', parentIds)
  if (pErr) return new Response(JSON.stringify({ error: pErr.message }), { status: 500 })
  const emailById = new Map((profiles ?? []).map(p => [p.id, p.email]))

  const { data: regs, error: rErr } = await supabase
    .from('player_registrations')
    .select('guardian_id, child_name, email')
  if (rErr) return new Response(JSON.stringify({ error: rErr.message }), { status: 500 })

  const regGuardians = new Set(regs?.filter(r => r.guardian_id).map(r => r.guardian_id))
  const regChildKey = new Set(
    regs?.filter(r => r.child_name && r.email).map(r => `${r.child_name.toLowerCase()}::${r.email}`)
  )

  const emails = new Set<string>()
  for (const g of guardians ?? []) {
    const email = emailById.get(g.parent_user_id)
    if (!email) continue
    if (regGuardians.has(g.id)) continue
    if (regChildKey.has(`${(g.player_name || '').toLowerCase()}::${email}`)) continue
    emails.add(email)
  }

  // Skip emails that already have a send attempt in the last hour (this campaign only)
  const { data: priorSent } = await supabase
    .from('email_send_log')
    .select('recipient_email, status')
    .eq('template_name', 'admin-broadcast')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  const alreadyAttempted = new Set((priorSent ?? []).map(r => r.recipient_email))

  let ok = 0, fail = 0, skipped = 0
  const failures: { email: string; error: string }[] = []
  for (const email of emails) {
    if (alreadyAttempted.has(email)) { skipped++; continue }
    let attempt = 0
    let sent = false
    while (attempt < 3 && !sent) {
      attempt++
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'admin-broadcast',
          recipientEmail: email,
          idempotencyKey: `reg-reminder-2026-${email}`,
          templateData: { title: TITLE, message: MESSAGE },
        },
      })
      if (!error) { sent = true; break }
      await new Promise(r => setTimeout(r, 500 * attempt))
    }
    if (sent) ok++; else { fail++; failures.push({ email, error: 'all retries failed' }) }
    await new Promise(r => setTimeout(r, 400))
  }


  return new Response(JSON.stringify({ unique_recipients: emails.size, sent: ok, failed: fail, skipped, failures }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
