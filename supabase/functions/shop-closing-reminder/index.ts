// Shop closing reminder: sends in-app, push and email alerts telling members
// how many days are left to place their club shop order.
// Auth: CRON_SECRET, service-role key, or an admin/treasurer user JWT.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const cronSecret = Deno.env.get('CRON_SECRET')

  const url = new URL(req.url)
  const bearer = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  const provided = url.searchParams.get('secret') || req.headers.get('x-cron-secret') || bearer

  let authorized = false
  if (cronSecret && provided && provided === cronSecret) authorized = true
  if (bearer && bearer === serviceKey) authorized = true

  const admin = createClient(supabaseUrl, serviceKey)

  if (!authorized && bearer) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
    })
    const { data: claims } = await userClient.auth.getClaims(bearer)
    const uid = claims?.claims?.sub as string | undefined
    if (uid) {
      const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', uid)
      if (roles?.some((r: any) => ['admin', 'treasurer'].includes(r.role))) authorized = true
    }
  }
  if (!authorized) return json({ error: 'Unauthorized' }, 401)

  let body: any = {}
  try { body = await req.json() } catch { /* no body */ }
  const dryRun = body?.dryRun === true

  // Work out how long is left
  const { data: settings } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', ['shop_open', 'shop_closes_at'])
  const map = new Map((settings ?? []).map((s: any) => [s.key, s.value]))
  if (map.get('shop_open') !== 'true') return json({ skipped: 'shop closed' })
  const closesAtRaw = map.get('shop_closes_at')
  if (!closesAtRaw) return json({ skipped: 'no closing date set' })

  const closesAt = new Date(closesAtRaw)
  const msLeft = closesAt.getTime() - Date.now()
  if (msLeft <= 0) return json({ skipped: 'deadline passed' })
  const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))

  const dateLabel = closesAt.toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/London',
  })

  const title = `${daysLeft} days left to order from the club shop`
  const message = `The PAFC club shop closes on ${dateLabel}.

Orders must be placed before then so everything can be printed and delivered in one batch. Anything ordered after the shop closes will have to wait for the next opening.

Place your order here: https://www.pa-fc.uk/shop

Up the Lions! 🦁`

  // Everyone linked to a team
  const { data: members } = await admin.from('team_members').select('user_id')
  const userIds = [...new Set((members ?? []).map((m: any) => m.user_id).filter(Boolean))]
  if (userIds.length === 0) return json({ error: 'no recipients' }, 200)

  if (dryRun) return json({ dryRun: true, daysLeft, title, recipients: userIds.length })

  const results: Record<string, unknown> = { daysLeft, recipients: userIds.length }

  // 1. In-app
  const { error: inAppErr } = await admin.from('hub_notifications').insert(
    userIds.map((uid) => ({
      user_id: uid,
      title,
      message,
      type: 'admin_broadcast',
      link: '/shop',
    }))
  )
  results.in_app = inAppErr ? `failed: ${inAppErr.message}` : userIds.length

  // 2. Push
  try {
    const { data: pushRes, error: pushErr } = await admin.functions.invoke('send-push-notification', {
      body: { userIds, title, message: `Closes ${dateLabel}. Tap to order.`, link: '/shop', tag: `shop-closing-${daysLeft}` },
    })
    results.push = pushErr ? `failed: ${pushErr.message}` : pushRes
  } catch (e) {
    results.push = `failed: ${e instanceof Error ? e.message : String(e)}`
  }

  // 3. Email
  const { data: profiles } = await admin.from('profiles').select('id, email').in('id', userIds)
  const recipients = (profiles ?? []).filter((p: any) => !!p.email)
  let ok = 0
  let failed = 0
  for (const p of recipients) {
    const { error } = await admin.functions.invoke('send-app-email', {
      body: {
        templateName: 'admin-broadcast',
        recipientEmail: p.email,
        idempotencyKey: `shop-closing-${closesAt.toISOString().slice(0, 10)}-${daysLeft}-${p.id}`,
        templateData: { title, message },
      },
    })
    if (error) failed++
    else ok++
    await new Promise((r) => setTimeout(r, 250))
  }
  results.email = { sent: ok, failed }

  return json(results)
})
