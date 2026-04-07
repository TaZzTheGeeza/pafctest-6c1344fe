/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://scfiodwfvpjqgfmekqwg.supabase.co/storage/v1/object/public/email-assets/club-logo.jpg'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for Peterborough Athletic FC</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoWrap}>
          <Img src={LOGO_URL} alt="Athletic FC Crest" width="64" height="64" style={logo} />
        </div>
        <Heading style={h1}>Verification Code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logoWrap = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { borderRadius: '50%', display: 'inline-block' as const }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  fontFamily: "'Oswald', 'Arial Black', sans-serif",
  textTransform: 'uppercase' as const,
  letterSpacing: '0.02em',
  color: '#1a1a1a',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}
const text = { fontSize: '14px', color: '#555555', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#B8860B',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  letterSpacing: '0.15em',
}
const hr = { borderColor: '#e5e5e5', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
