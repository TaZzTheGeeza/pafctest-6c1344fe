import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

type Outcome = 'bounce' | 'complaint' | 'unsubscribe'

const LOG_STATUS: Record<Outcome, 'bounced' | 'complained' | 'suppressed'> = {
  bounce: 'bounced',
  complaint: 'complained',
  unsubscribe: 'suppressed',
}

const LOG_MESSAGE: Record<Outcome, string> = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

// Notification-only bookkeeping: Lovable enforces suppression at send time.
// These rows keep the club's existing email history intact.
async function recordOutcome(
  recipient: string | undefined,
  outcome: Outcome,
  eventId: string,
) {
  if (!recipient) {
    console.warn('Email event without recipient', { event_id: eventId })
    return
  }
  const email = recipient.toLowerCase()

  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason: outcome, metadata: null }, { onConflict: 'email' })

  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      event_id: eventId,
      code: suppressError.code,
      message: suppressError.message,
    })
    throw new Error('Failed to record suppression')
  }

  const { error: logError } = await supabase.from('email_send_log').insert({
    message_id: null,
    template_name: 'system',
    recipient_email: email,
    status: LOG_STATUS[outcome],
    error_message: LOG_MESSAGE[outcome],
    metadata: null,
  })

  if (logError) {
    console.error('Failed to insert email_send_log', {
      event_id: eventId,
      code: logError.code,
      message: logError.message,
    })
    throw new Error('Failed to record email log')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await recordOutcome(
        (event.data as { recipient?: string })?.recipient,
        'bounce',
        event.event_id,
      )
    },
    'email.complaint': async (event) => {
      await recordOutcome(
        (event.data as { recipient?: string })?.recipient,
        'complaint',
        event.event_id,
      )
    },
    'email.unsubscribed': async (event) => {
      await recordOutcome(
        (event.data as { recipient?: string })?.recipient,
        'unsubscribe',
        event.event_id,
      )
    },
  },
})

Deno.serve((req) => handler(req))
