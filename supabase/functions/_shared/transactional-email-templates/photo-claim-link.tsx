import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"

interface Props {
  claimUrl?: string
  photoCount?: string
  orderName?: string
}

const PhotoClaimLinkEmail = ({ claimUrl, photoCount, orderName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your tournament photos are ready to download</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Section style={badgeWrap}>
          <Text style={badge}>📸 Photos Ready</Text>
        </Section>
        <Heading style={h2}>Your photos are ready to download</Heading>
        <Text style={text}>
          Thanks for your order{orderName ? ` (${orderName})` : ''}. Your{' '}
          <strong>{photoCount || '1'} tournament photo{photoCount !== '1' ? 's' : ''}</strong>{' '}
          are ready for high-resolution download.
        </Text>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={claimUrl} style={button}>
            Download my photos
          </Button>
        </Section>
        <Text style={smallText}>
          This link is unique to your order. Keep it safe — anyone with the link can download the photos.
          The link is valid for 30 days.
        </Text>
        <Text style={smallText}>
          If the button doesn't work, paste this URL into your browser:<br />
          <span style={{ wordBreak: 'break-all', color: '#b8860b' }}>{claimUrl}</span>
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PhotoClaimLinkEmail,
  subject: (data: Record<string, any>) =>
    `Your tournament photos are ready${data.orderName ? ` — ${data.orderName}` : ''}`,
  displayName: 'Photo claim link',
  previewData: { claimUrl: 'https://www.pa-fc.uk/photos/claim?token=abc123', photoCount: '2', orderName: '#1042' },
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
