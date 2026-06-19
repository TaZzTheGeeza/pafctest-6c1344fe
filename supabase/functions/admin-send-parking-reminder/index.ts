// One-shot helper to send the tournament parking reminder.
// Calls send-transactional-email with the service role key.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const body = await req.json().catch(() => ({}))
  const { recipientEmail, managerName, teamName, idempotencyKey } = body

  if (!recipientEmail) {
    return new Response(JSON.stringify({ error: 'recipientEmail required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
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
