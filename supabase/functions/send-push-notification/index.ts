import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Web Push VAPID auth — simplified implementation using web-push library
// For web push, we use the web-push npm package
import webpush from 'npm:web-push@3.6.7'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

  if (!supabaseUrl || !supabaseServiceKey || !vapidPrivateKey) {
    console.error('Missing required environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const vapidPublicKey = 'BGatX1ncLiIAqB7UNwzF0wuyVxdcZIDCIWEnbFyOJVnSt3Jv82LD7TQc_iAk_7oKqH_A1ljCe7R9Uj-uYNu2d5A'

  webpush.setVapidDetails(
    'mailto:noreply@www.pa-fc.uk',
    vapidPublicKey,
    vapidPrivateKey
  )

  let body: {
    userIds: string[]
    title: string
    message: string
    link?: string
    tag?: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!body.userIds?.length || !body.title) {
    return new Response(
      JSON.stringify({ error: 'userIds and title are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get push subscriptions for target users
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', body.userIds)

  if (subError) {
    console.error('Failed to fetch subscriptions:', subError)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch subscriptions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!subscriptions?.length) {
    return new Response(
      JSON.stringify({ sent: 0, reason: 'no_subscriptions' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const payload = JSON.stringify({
    title: body.title,
    message: body.message,
    link: body.link,
    tag: body.tag || 'pafc-notification',
  })

  let sent = 0
  let failed = 0
  const expiredEndpoints: string[] = []

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
      sent++
    } catch (err: any) {
      failed++
      // Remove expired/invalid subscriptions
      if (err.statusCode === 410 || err.statusCode === 404) {
        expiredEndpoints.push(sub.endpoint)
      }
      console.error('Push send failed:', { endpoint: sub.endpoint.slice(0, 50), statusCode: err.statusCode })
    }
  }

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints)
  }

  return new Response(
    JSON.stringify({ sent, failed, expired: expiredEndpoints.length }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
