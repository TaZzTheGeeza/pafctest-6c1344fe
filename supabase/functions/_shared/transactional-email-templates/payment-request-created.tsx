import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"

interface Props {
  title?: string
  amount?: string
  dueDate?: string
  teamName?: string
}

const PaymentRequestCreatedEmail = ({ title, amount, dueDate, teamName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New payment request: {title || 'Payment due'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Heading style={h2}>New Payment Request</Heading>
        {teamName && <Text style={teamBadge}>{teamName}</Text>}
        <Text style={text}>
          A new payment request has been created{title ? `: <strong>${title}</strong>` : ''}.
        </Text>
        {amount && (
          <Section style={amountBox}>
            <Text style={amountText}>£{amount}</Text>
            {dueDate && <Text style={dueDateText}>Due by {dueDate}</Text>}
          </Section>
        )}
        <Text style={text}>
          Log in to the PAFC Hub to view details and mark as paid.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentRequestCreatedEmail,
  subject: (data: Record<string, any>) => `New payment request: ${data.title || 'Payment due'}`,
  displayName: 'Payment request created',
  previewData: { title: 'Kit Fee', amount: '25.00', dueDate: '15 Apr 2026', teamName: 'U10 Lions' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '20px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const teamBadge = { fontSize: '11px', fontWeight: '600', color: '#b8860b', backgroundColor: '#fdf6e3', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' as const, margin: '0 0 16px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const amountBox = { backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px', textAlign: 'center' as const }
const amountText = { fontSize: '28px', fontWeight: '700', color: '#b8860b', margin: '0' }
const dueDateText = { fontSize: '12px', color: '#888', margin: '4px 0 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
