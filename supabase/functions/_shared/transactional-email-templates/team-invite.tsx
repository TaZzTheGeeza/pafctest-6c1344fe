import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"

interface Props {
  teamName?: string
  signupUrl?: string
  inviterName?: string
}

const TeamInviteEmail = ({ teamName, signupUrl, inviterName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {teamName || 'a team'} on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Heading style={h2}>You're Invited!</Heading>
        <Text style={text}>
          {inviterName ? `${inviterName} has` : 'A coach has'} invited you to join <strong>{teamName || 'the team'}</strong> as a Parent / Guardian on the PAFC platform.
        </Text>
        <Text style={text}>
          Create your account using the link below. Once registered, you'll automatically have access to your child's team — including fixtures, availability, chat, and more.
        </Text>
        {signupUrl && (
          <Section style={btnSection}>
            <Button style={button} href={signupUrl}>
              Create Your Account
            </Button>
          </Section>
        )}
        <Text style={smallText}>
          Make sure to sign up using <strong>this email address</strong> so your account is linked automatically.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TeamInviteEmail,
  subject: (data: Record<string, any>) => `You're invited to join ${data.teamName || 'a team'} on PAFC`,
  displayName: 'Team invite',
  previewData: { teamName: 'U7s', signupUrl: 'https://www.pa-fc.uk/auth', inviterName: 'Gary Robinson' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '20px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const btnSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#b8860b', color: '#ffffff', padding: '12px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }
const smallText = { fontSize: '12px', color: '#888', lineHeight: '1.5', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
