import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"

interface Props {
  senderName?: string
  channelName?: string
  messagePreview?: string
  teamName?: string
}

const NewChatMessageEmail = ({ senderName, channelName, messagePreview, teamName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{senderName || 'Someone'} sent a message in #{channelName || 'chat'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Heading style={h2}>New Chat Message</Heading>
        {teamName && <Text style={teamBadge}>{teamName}</Text>}
        <Text style={text}>
          <strong>{senderName || 'A team member'}</strong> posted in{' '}
          <strong>#{channelName || 'general'}</strong>:
        </Text>
        {messagePreview && (
          <Section style={messageBox}>
            <Text style={messageText}>{messagePreview}</Text>
          </Section>
        )}
        <Text style={text}>
          Open the PAFC Hub to reply and continue the conversation.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewChatMessageEmail,
  subject: (data: Record<string, any>) => `New message from ${data.senderName || 'your team'}`,
  displayName: 'New chat message',
  previewData: { senderName: 'Coach Smith', channelName: 'general', messagePreview: 'Training is moved to 6pm this Thursday', teamName: 'U10 Lions' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '20px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const teamBadge = { fontSize: '11px', fontWeight: '600', color: '#b8860b', backgroundColor: '#fdf6e3', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' as const, margin: '0 0 16px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const messageBox = { backgroundColor: '#f5f5f5', borderLeft: '3px solid #b8860b', borderRadius: '0 6px 6px 0', padding: '12px 16px', margin: '0 0 20px' }
const messageText = { fontSize: '14px', color: '#333', lineHeight: '1.5', margin: '0', fontStyle: 'italic' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
