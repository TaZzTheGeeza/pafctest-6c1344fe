import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"
const SITE_URL = "https://pafc.lovable.app"

interface Props {
  eventTitle?: string
  eventDate?: string
  eventTime?: string
  venue?: string
  teamName?: string
}

const AvailabilityEventAddedEmail = ({ eventTitle, eventDate, eventTime, venue, teamName }: Props) => {
  const hubLink = `${SITE_URL}/hub?tab=availability${teamName ? `&team=${encodeURIComponent(teamName)}` : ''}`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New event: {eventTitle || 'Availability check'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={h1}>{SITE_NAME}</Heading>
          </Section>
          <Hr style={divider} />
          <Heading style={h2}>New Availability Event</Heading>
          {teamName && <Text style={teamBadge}>{teamName}</Text>}
          <Text style={text}>
            A new event has been added and your availability is needed:
          </Text>
          <Section style={eventBox}>
            <Text style={eventTitle_style}>{eventTitle || 'Upcoming Event'}</Text>
            {eventDate && <Text style={eventDetail}>📅 {eventDate}{eventTime ? ` at ${eventTime}` : ''}</Text>}
            {venue && <Text style={eventDetail}>📍 {venue}</Text>}
          </Section>
          <Section style={buttonSection}>
            <Button href={hubLink} style={button}>
              Respond Now
            </Button>
          </Section>
          <Text style={footer}>— The {SITE_NAME} Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AvailabilityEventAddedEmail,
  subject: (data: Record<string, any>) => `New event: ${data.eventTitle || 'Availability check'}`,
  displayName: 'Availability event added',
  previewData: { eventTitle: 'Friendly vs Manor FC', eventDate: '20 Apr 2026', eventTime: '10:00', venue: 'Yaxley FC', teamName: 'u10s-lions' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '20px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const teamBadge = { fontSize: '11px', fontWeight: '600', color: '#b8860b', backgroundColor: '#fdf6e3', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' as const, margin: '0 0 16px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const eventBox = { backgroundColor: '#fdf6e3', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const eventTitle_style = { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px' }
const eventDetail = { fontSize: '13px', color: '#555', margin: '0 0 4px' }
const buttonSection = { textAlign: 'center' as const, margin: '0 0 24px' }
const button = { backgroundColor: '#b8860b', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 28px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block' as const, fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
