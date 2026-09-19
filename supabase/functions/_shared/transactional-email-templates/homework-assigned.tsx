import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"
const LOGO_URL = 'https://scfiodwfvpjqgfmekqwg.supabase.co/storage/v1/object/public/email-assets/club-logo.jpg'

interface Props {
  title?: string
  teamName?: string
  dueDate?: string
  message?: string
  actionUrl?: string
  ctaLabel?: string
}

const HomeworkAssignedEmail = ({ title, teamName, dueDate, message, actionUrl, ctaLabel }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title || 'New homework set'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} width="80" height="80" alt={SITE_NAME} style={logo} />
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Section style={badgeWrap}>
          <Text style={badge}>📚 Homework</Text>
        </Section>
        <Heading style={h2}>{title || 'New homework set'}</Heading>
        {(teamName || dueDate) && (
          <Text style={meta}>
            {teamName ? `${teamName}` : ''}{teamName && dueDate ? ' · ' : ''}{dueDate ? `Due ${dueDate}` : ''}
          </Text>
        )}
        <Text style={text}>{message || ''}</Text>
        {actionUrl && <Section style={buttonSection}><Button href={actionUrl} style={button}>{ctaLabel || 'View Homework'}</Button></Section>}
        <Text style={footer}> - The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: HomeworkAssignedEmail,
  subject: (data: Record<string, any>) => data.title || 'New homework set',
  displayName: 'Homework assigned',
  previewData: {
    title: 'Ball Mastery: The Cruyff Turn',
    teamName: 'U9 Gold',
    dueDate: 'Friday 24th October',
    message: 'Practice 20 repetitions with each foot. Upload a photo or video of your child doing the drill.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const logo = { margin: '0 auto 12px', borderRadius: '12px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '10px 0 6px' }
const meta = { fontSize: '12px', fontWeight: '700', color: '#b8860b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 12px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const badgeWrap = { margin: '10px 0 0' }
const badge = { fontSize: '11px', fontWeight: '600', color: '#b8860b', backgroundColor: '#fdf6e3', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' as const, margin: '0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const buttonSection = { textAlign: 'center' as const, margin: '22px 0' }
const button = { backgroundColor: '#141414', color: '#ffd700', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', fontWeight: '700' }
