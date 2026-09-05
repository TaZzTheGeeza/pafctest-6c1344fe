// One-shot helper to send the tournament parking reminder.
// Requires an authenticated admin caller. Calls send-app-email with the service role key.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // --- Auth gate: valid JWT + admin role ---
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: claims, error: claimsError } = await userClient.auth.getClaims(token)
  if (claimsError || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const admin = createClient(supabaseUrl, serviceKey)
  const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', claims.claims.sub as string)
  if (!roles?.some((r: any) => r.role === 'admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json().catch(() => ({}))
  const { recipientEmail, managerName, teamName, idempotencyKey } = body

  if (!recipientEmail) {
    return new Response(JSON.stringify({ error: 'recipientEmail required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/send-app-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      templateName: 'tournament-parking-reminder',
      recipientEmail,
      idempotencyKey: idempotencyKey || `parking-${recipientEmail}-${Date.now()}`,
      templateData: { managerName: managerName || 'Coach', teamName: teamName || '' },
    }),
  })
  const text = await res.text()
  return new Response(text, { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})

