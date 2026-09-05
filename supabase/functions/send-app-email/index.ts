import { createClient } from 'npm:@supabase/supabase-js@2'
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.1.0'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Auth: verify_jwt is false so we validate the caller in code.
// Accept requests that carry either a valid user JWT or the service-role key.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const token = authHeader.replace('Bearer ', '')
  const callerIsServiceRole = token === supabaseServiceKey
  let callerId: string | undefined

  if (!callerIsServiceRole) {
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: claimsData, error: claimsError } =
      await authClient.auth.getClaims(token)

    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    callerId = claimsData.claims.sub as string | undefined
  }

  // Role gate: only admins, coaches, news_editor, welfare_officer, treasurer,
  // or service-role calls may send club-branded mail.
  if (!callerIsServiceRole) {
    if (!callerId) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: roles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
    const allowed = new Set([
      'admin',
      'coach',
      'news_editor',
      'welfare_officer',
      'treasurer',
    ])
    if (!roles?.some((r: any) => allowed.has(r.role))) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }
  }

  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    idempotencyKey =
      body.idempotencyKey || body.idempotency_key || crypto.randomUUID()
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON in request body' }, 400)
  }

  if (!templateName) {
    return jsonResponse({ error: 'templateName is required' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const logSend = async (
    status: 'sent' | 'suppressed' | 'failed',
    errorMessage?: string,
  ) => {
    const { error } = await supabase.from('email_send_log').insert({
      message_id: null,
      template_name: templateName,
      recipient_email: recipientEmail ?? null,
      status,
      error_message: errorMessage ?? null,
    })
    if (error) {
      console.error('Failed to write email_send_log', { status, error })
    }
  }

  try {
    const result = await sendTemplateEmail(templateName, recipientEmail, {
      templateData,
      idempotencyKey,
    })

    if (!result.sent) {
      await logSend('suppressed')
      console.log('Email suppressed by managed delivery', { templateName })
      return jsonResponse({ success: false, reason: 'email_suppressed' })
    }

    await logSend('sent')
    return jsonResponse({ success: true, sent: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logSend('failed', message)

    if (error instanceof EmailAPIError) {
      console.error('Email API error', { code: error.code, status: error.status })
      return jsonResponse(
        { error: 'Failed to send email', code: error.code },
        error.status === 429 ? 429 : 500,
      )
    }

    console.error('Failed to send email', { message })
    return jsonResponse({ error: 'Failed to send email' }, 500)
  }
})
