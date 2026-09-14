// One-off broadcast: Match Day Kit launch announcement to parents with registered players.
// Protected by CRON_SECRET or the service role key. Supports { testEmail } for a single-recipient test run.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const TITLE = 'New: Request your match day kit in the Hub'
const MESSAGE = `We have added a Match Day Kit section to the PAFC Hub.

You can now see the kit your child has already been given, and request replacement or missing items in a couple of taps. When you make a request we ask for a short reason so we can keep the kit register accurate and fair for everyone.

Good to know:
- Every registered player's first set of kit is free
- Replacements may carry a small charge depending on the item and reason, and we will always tell you before anything is approved
- Macron kit runs small, so if your child is between sizes it is usually best to size up

You will get a notification when your request is approved, ready to collect, or handed out.`

const LINK = '/kit'
const ACTION_URL = 'https://www.pa-fc.uk/kit'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const cronSecret = Deno.env.get('CRON_SECRET')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const bearer = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  let jwtRole: string | null = null
  try {
    const part = bearer.split('.')[1]
    if (part) {
      const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
      jwtRole = json?.role ?? null
    }
  } catch { /* not a jwt */ }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

  let authorised = bearer === cronSecret || bearer === serviceKey || jwtRole === 'service_role'
  if (!authorised && jwtRole === 'authenticated') {
    const { data: userData } = await supabase.auth.getUser(bearer)
    const uid = userData?.user?.id
    if (uid) {
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: uid, _role: 'admin' })
      authorised = isAdmin === true
    }
  }
  if (!bearer || !authorised) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: { testEmail?: string; dryRun?: boolean } = {}
  try { payload = await req.json() } catch { /* no body */ }

  // Parents with at least one registered player
  const { data: regs, error: rErr } = await supabase
    .from('player_registrations')
    .select('user_id, email, guardian_id')
  if (rErr) {
    return new Response(JSON.stringify({ error: rErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userIds = new Set<string>()
  const emails = new Set<string>()
  const guardianIds = new Set<string>()
  for (const r of regs ?? []) {
    if (r.user_id) userIds.add(r.user_id)
    if (r.email) emails.add(String(r.email).toLowerCase().trim())
    if (r.guardian_id) guardianIds.add(r.guardian_id)
  }

  if (guardianIds.size) {
    const { data: guardians } = await supabase
      .from('guardians')
      .select('id, parent_user_id')
      .in('id', Array.from(guardianIds))
    for (const g of guardians ?? []) if (g.parent_user_id) userIds.add(g.parent_user_id)
  }

  // Map registration emails onto accounts so they get in-app and push too
  if (emails.size) {
    const { data: matched } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', Array.from(emails))
    for (const p of matched ?? []) if (p.id) userIds.add(p.id)
  }

  let targetIds = Array.from(userIds)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', targetIds)
  let recipients = (profiles ?? []).filter((p) => !!p.email) as { id: string; email: string }[]

  const testEmail = payload.testEmail?.toLowerCase().trim()
  if (testEmail) {
    recipients = recipients.filter((p) => p.email.toLowerCase().trim() === testEmail)
    if (recipients.length === 0) {
      const { data: solo } = await supabase.from('profiles').select('id, email').ilike('email', testEmail).limit(1)
      recipients = (solo ?? []).filter((p) => !!p.email) as { id: string; email: string }[]
    }
    targetIds = recipients.map((p) => p.id)
  }

  if (payload.dryRun) {
    return new Response(JSON.stringify({ dryRun: true, recipients: recipients.length, emails: recipients.map((r) => r.email) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const runId = new Date().toISOString().slice(0, 10)
  const result: Record<string, unknown> = { targets: targetIds.length, test: !!testEmail }

  // 1. In-app
  if (targetIds.length) {
    const { error } = await supabase.from('hub_notifications').insert(
      targetIds.map((uid) => ({
        user_id: uid,
        title: TITLE,
        message: MESSAGE,
        type: 'admin_broadcast',
        link: LINK,
      })),
    )
    result.in_app = error ? `failed: ${error.message}` : targetIds.length
  }

  // 2. Push
  if (targetIds.length) {
    const { data: push, error: pushErr } = await supabase.functions.invoke('send-push-notification', {
      body: { userIds: targetIds, title: TITLE, message: 'Request replacement or missing match day kit in the Hub.', link: LINK, tag: `kit-launch-${runId}` },
    })
    result.push = pushErr ? `failed: ${pushErr.message}` : push
  }

  // 3. Email
  let ok = 0
  const failures: string[] = []
  for (const p of recipients) {
    const { error } = await supabase.functions.invoke('send-app-email', {
      body: {
        templateName: 'admin-broadcast',
        recipientEmail: p.email,
        idempotencyKey: `kit-launch-${runId}-${p.id}`,
        templateData: { title: TITLE, message: MESSAGE, actionUrl: ACTION_URL, ctaLabel: 'Open Match Day Kit' },
      },
    })
    if (error) failures.push(p.email); else ok++
    await new Promise((r) => setTimeout(r, 250))
  }
  result.email_sent = ok
  result.email_failed = failures

  return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
