import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"

interface Props {
  opponent?: string
  fixtureDate?: string
  formation?: string
  teamName?: string
  playerCount?: number
}

const TeamSelectionPublishedEmail = ({ opponent, fixtureDate, formation, teamName, playerCount }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Squad announced for {opponent || 'upcoming match'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Heading style={h2}>Team Selection Published</Heading>
        {teamName && <Text style={teamBadge}>{teamName}</Text>}
        <Text style={text}>
          The squad has been announced for the match against <strong>{opponent || 'TBC'}</strong>.
        </Text>
        <Section style={matchBox}>
          {fixtureDate && <Text style={matchDetail}>📅 {fixtureDate}</Text>}
          {formation && <Text style={matchDetail}>📋 Formation: {formation}</Text>}
          {playerCount && <Text style={matchDetail}>👥 {playerCount} players selected</Text>}
        </Section>
        <Text style={text}>
          Check the PAFC Hub for the full squad list and notes.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TeamSelectionPublishedEmail,
  subject: (data: Record<string, any>) => `Squad announced: vs ${data.opponent || 'upcoming match'}`,
  displayName: 'Team selection published',
  previewData: { opponent: 'Yaxley FC', fixtureDate: '20/04/26', formation: '4-3-3', teamName: 'U10 Lions', playerCount: 11 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '20px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const teamBadge = { fontSize: '11px', fontWeight: '600', color: '#b8860b', backgroundColor: '#fdf6e3', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' as const, margin: '0 0 16px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const matchBox = { backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const matchDetail = { fontSize: '13px', color: '#555', margin: '0 0 6px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
