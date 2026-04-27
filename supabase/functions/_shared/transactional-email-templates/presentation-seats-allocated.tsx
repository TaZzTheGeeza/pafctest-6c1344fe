import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"
const SITE_URL = "https://www.pa-fc.uk"

interface SeatLine {
  attendee: string
  ticketType: string
  table?: string
  seat?: string | number
}

interface Props {
  playerName?: string
  eventTitle?: string
  allSeated?: boolean
  seats?: SeatLine[]
}

const PresentationSeatsAllocatedEmail = ({ playerName, eventTitle, allSeated, seats }: Props) => {
  const link = `${SITE_URL}/presentation`
  const title = allSeated
    ? `Your ${eventTitle || 'Presentation Evening'} seats are confirmed`
    : `Update on your ${eventTitle || 'Presentation Evening'} tickets`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={h1}>{SITE_NAME}</Heading>
          </Section>
          <Hr style={divider} />
          <Heading style={h2}>{allSeated ? 'Seats Confirmed 🎟️' : 'Ticket Update'}</Heading>
          {playerName && <Text style={teamBadge}>Family of {playerName}</Text>}
          <Text style={text}>
            {allSeated
              ? `Here are your allocated seats for ${eventTitle || 'the Presentation Evening'}:`
              : `Here is the latest on your ${eventTitle || 'Presentation Evening'} tickets:`}
          </Text>
          <Section style={eventBox}>
            {(seats ?? []).map((s, i) => (
              <Text key={i} style={eventDetail}>
                • <strong>{s.attendee}</strong> ({s.ticketType}) —{' '}
                {s.table && s.seat != null ? `${s.table}, seat ${s.seat}` : 'no seat yet'}
              </Text>
            ))}
          </Section>
          {allSeated && (
            <Text style={text}>
              Please arrive 15 minutes before the start time.
            </Text>
          )}
          <Section style={buttonSection}>
            <Button href={link} style={button}>
              View Seating Plan
            </Button>
          </Section>
          <Text style={footer}>— The {SITE_NAME} Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PresentationSeatsAllocatedEmail,
  subject: (data: Record<string, any>) =>
    data.allSeated
      ? `Your ${data.eventTitle || 'Presentation Evening'} seats are confirmed`
      : `Update on your ${data.eventTitle || 'Presentation Evening'} tickets`,
  displayName: 'Presentation seats allocated',
  previewData: {
    playerName: 'Charlie',
    eventTitle: 'Presentation Evening 2026',
    allSeated: true,
    seats: [
      { attendee: 'Sarah Smith', ticketType: 'adult', table: 'Table 3', seat: 4 },
      { attendee: 'John Smith', ticketType: 'adult', table: 'Table 3', seat: 5 },
      { attendee: 'Emily Smith', ticketType: 'child', table: 'Table 3', seat: 6 },
    ],
  },
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
const eventDetail = { fontSize: '13px', color: '#333', margin: '0 0 6px', lineHeight: '1.5' }
const buttonSection = { textAlign: 'center' as const, margin: '0 0 24px' }
const button = { backgroundColor: '#b8860b', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 28px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block' as const, fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
