import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"
const LOGO_URL = 'https://scfiodwfvpjqgfmekqwg.supabase.co/storage/v1/object/public/email-assets/club-logo.jpg'
const VENUE_ADDRESS = 'Itter Park, Itter Crescent, Peterborough, PE4 6SW'
const PARKING_DIRECTIONS = 'https://www.google.com/maps/dir/?api=1&destination=52.606436,-0.258116'
const VENUE_DIRECTIONS = 'https://www.google.com/maps/dir//Itter+Cres,+Park,+Peterborough+PE4'

interface Props {
  managerName?: string
  teamName?: string
}

const TournamentParkingReminderEmail = ({ managerName, teamName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Important parking info for the PAFC Tournament this weekend</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} width="72" height="72" alt={SITE_NAME} style={logo} />
          <Heading style={h1}>{SITE_NAME}</Heading>
          <Text style={subheader}>Tournament 2026 — Coach Reminder</Text>
        </Section>
        <Hr style={divider} />

        <Heading style={h2}>Hi {managerName || 'Coach'} 👋</Heading>
        <Text style={text}>
          Thanks again for entering {teamName ? <strong>{teamName}</strong> : 'your team'} into the PAFC Tournament this weekend — we're really looking forward to hosting you.
        </Text>

        <Section style={alertBox}>
          <Text style={alertTitle}>⚠️ Parking — please read carefully</Text>
          <Text style={alertText}>
            <strong>Peterborough City Council are actively patrolling and issuing tickets</strong> in the area around the venue. To avoid a fine, you and your parents <strong>must</strong> use the designated parking spot only.
          </Text>
          <Text style={alertText}>
            Please share this with all parents and supporters travelling with your team.
          </Text>
        </Section>

        <Section style={infoBox}>
          <Text style={infoLabel}>📍 Tournament Venue</Text>
          <Text style={infoValue}>{VENUE_ADDRESS}</Text>
          <Button href={VENUE_DIRECTIONS} style={btn}>Directions to Venue</Button>
        </Section>

        <Section style={infoBoxGold}>
          <Text style={infoLabel}>🅿️ Designated Parking</Text>
          <Text style={infoValue}>Please use the official parking area shown on the map below. A parking steward will be on location to direct you.</Text>
          <Button href={PARKING_DIRECTIONS} style={btnGold}>Directions to Parking</Button>
        </Section>

        <Section style={warnBox}>
          <Text style={warnText}>
            🚫 <strong>Do NOT park</strong> in front of or block the Main Gate on Itter Crescent — this must be kept clear for emergency vehicle access.
          </Text>
        </Section>

        <Text style={text}>
          If you have any questions, just reply to this email and we'll get back to you.
        </Text>
        <Text style={text}>See you this weekend!</Text>
        <Text style={footer}>— The {SITE_NAME} Tournament Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TournamentParkingReminderEmail,
  subject: '🅿️ Important: Parking info for the PAFC Tournament this weekend',
  displayName: 'Tournament parking reminder',
  previewData: { managerName: 'Coach', teamName: 'Sample FC' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const logo = { margin: '0 auto 12px', borderRadius: '12px' }
const h1 = { fontSize: '22px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const subheader = { fontSize: '12px', color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '4px 0 0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '20px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const alertBox = { backgroundColor: '#fff4e5', border: '1px solid #ffb74d', borderRadius: '8px', padding: '14px 18px', margin: '16px 0' }
const alertTitle = { fontSize: '15px', fontWeight: '700', color: '#b8860b', margin: '0 0 8px' }
const alertText = { fontSize: '14px', color: '#5a4a1a', lineHeight: '1.6', margin: '0 0 8px' }
const infoBox = { backgroundColor: '#f8f8f8', borderRadius: '8px', padding: '16px 20px', margin: '12px 0', textAlign: 'center' as const }
const infoBoxGold = { backgroundColor: '#fdf6e3', borderRadius: '8px', padding: '16px 20px', margin: '12px 0', textAlign: 'center' as const }
const infoLabel = { fontSize: '13px', fontWeight: '700', color: '#1a1a1a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 6px' }
const infoValue = { fontSize: '14px', color: '#333', margin: '0 0 12px' }
const btn = { backgroundColor: '#1a1a1a', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' as const }
const btnGold = { backgroundColor: '#b8860b', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' as const }
const warnBox = { backgroundColor: '#fdecea', border: '1px solid #f5a5a0', borderRadius: '8px', padding: '12px 16px', margin: '12px 0' }
const warnText = { fontSize: '13px', color: '#8a1f1f', lineHeight: '1.5', margin: '0' }
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
