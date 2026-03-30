import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"

interface Props {
  meetingTitle?: string
  scheduledDate?: string
  scheduledTime?: string
  duration?: string
  description?: string
}

const MeetingInviteEmail = ({ meetingTitle, scheduledDate, scheduledTime, duration, description }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're invited: {meetingTitle || 'Club Meeting'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Heading style={h2}>Meeting Invitation</Heading>
        <Text style={text}>
          You've been invited to a club meeting:
        </Text>
        <Section style={eventBox}>
          <Text style={titleStyle}>{meetingTitle || 'Club Meeting'}</Text>
          {scheduledDate && <Text style={detail}>📅 {scheduledDate}{scheduledTime ? ` at ${scheduledTime}` : ''}</Text>}
          {duration && <Text style={detail}>⏱ {duration}</Text>}
          {description && <Text style={descStyle}>{description}</Text>}
        </Section>
        <Text style={text}>
          Head to the Meetings page on the PAFC website to join when the meeting starts.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MeetingInviteEmail,
  subject: (data: Record<string, any>) => `Meeting invite: ${data.meetingTitle || 'Club Meeting'}`,
  displayName: 'Meeting invitation',
  previewData: { meetingTitle: 'Committee Meeting', scheduledDate: '15 Apr 2026', scheduledTime: '19:00', duration: '1 hour', description: 'Monthly committee meeting to discuss club finances and upcoming events.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '20px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const eventBox = { backgroundColor: '#fdf6e3', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const titleStyle = { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px' }
const detail = { fontSize: '13px', color: '#555', margin: '0 0 4px' }
const descStyle = { fontSize: '13px', color: '#666', margin: '8px 0 0', fontStyle: 'italic' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
