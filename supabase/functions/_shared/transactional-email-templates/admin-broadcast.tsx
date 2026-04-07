import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"
const LOGO_URL = 'https://scfiodwfvpjqgfmekqwg.supabase.co/storage/v1/object/public/email-assets/club-logo.jpg'

interface Props {
  title?: string
  message?: string
}

const AdminBroadcastEmail = ({ title, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title || 'Club Announcement'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} width="80" height="80" alt={SITE_NAME} style={logo} />
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Section style={badgeWrap}>
          <Text style={badge}>📢 Club Announcement</Text>
        </Section>
        <Heading style={h2}>{title || 'Announcement'}</Heading>
        <Text style={text}>{message || ''}</Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminBroadcastEmail,
  subject: (data: Record<string, any>) => data.title || 'Club Announcement',
  displayName: 'Admin broadcast',
  previewData: { title: 'Training Cancelled', message: 'Due to the weather, all training sessions this Saturday are cancelled. Stay safe!' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const logo = { margin: '0 auto 12px', borderRadius: '12px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '10px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const badgeWrap = { margin: '10px 0 0' }
const badge = { fontSize: '11px', fontWeight: '600', color: '#b8860b', backgroundColor: '#fdf6e3', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' as const, margin: '0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
