import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"

interface Props {
  parentName?: string
  childName?: string
  ageGroup?: string
  amountPaid?: string
}

const RegistrationConfirmationEmail = ({ parentName, childName, ageGroup, amountPaid }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{childName ? `${childName}'s` : 'Your'} PAFC registration is confirmed 🦁</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Section style={badgeWrap}>
          <Text style={badge}>✅ Registration Confirmed</Text>
        </Section>
        <Heading style={h2}>You're all signed up{childName ? `, ${childName} is in!` : '!'}</Heading>
        <Text style={text}>
          {parentName ? `Hi ${parentName},` : 'Hi,'}
        </Text>
        <Text style={text}>
          Thanks for registering {childName ? <strong>{childName}</strong> : 'your player'}
          {ageGroup ? <> for <strong>{ageGroup}</strong></> : null} for the 2026/27 season.
          We've received your details and your payment{amountPaid ? <> of <strong>£{amountPaid}</strong></> : ''} has been confirmed.
        </Text>
        <Text style={text}>
          We'll now submit the registration to the FA / league. Your coach will be in touch via the PAFC Hub with details about training, fixtures, and kit.
        </Text>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href="https://www.pa-fc.uk/hub" style={button}>
            Open the PAFC Hub
          </Button>
        </Section>
        <Text style={smallText}>
          Any questions, just reply to this email and we'll come back to you.
        </Text>
        <Text style={footer}>Up the Lions 🦁 — The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RegistrationConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Registration confirmed${data.childName ? ` — ${data.childName}` : ''} | PAFC 2026/27`,
  displayName: 'Registration confirmation',
  previewData: { parentName: 'Ben', childName: 'Alex Masters', ageGroup: 'U9s', amountPaid: '40.00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '10px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const smallText = { fontSize: '12px', color: '#888', lineHeight: '1.5', margin: '12px 0' }
const badgeWrap = { margin: '10px 0 0' }
const badge = { fontSize: '11px', fontWeight: '600', color: '#b8860b', backgroundColor: '#fdf6e3', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' as const, margin: '0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const button = { backgroundColor: '#141414', color: '#ffd700', padding: '14px 28px', borderRadius: '4px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'inline-block' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
