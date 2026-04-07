/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://scfiodwfvpjqgfmekqwg.supabase.co/storage/v1/object/public/email-assets/club-logo.jpg'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Peterborough Athletic FC — confirm your email</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoWrap}>
          <Img src={LOGO_URL} alt="Athletic FC Crest" width="64" height="64" style={logo} />
        </div>
        <Heading style={h1}>Welcome to Peterborough Athletic FC</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          ! We're excited to have you on board.
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking below:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: '#B8860B', textDecoration: 'underline' }
const button = {
  backgroundColor: '#B8860B',
  color: '#ffffff',
  fontSize: '14px',
  fontFamily: "'Oswald', 'Arial Black', sans-serif",
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'block' as const,
  textAlign: 'center' as const,
}
const hr = { borderColor: '#e5e5e5', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
