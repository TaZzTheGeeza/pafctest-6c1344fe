import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"

interface Props {
  orderName?: string
  customerName?: string
  totalPrice?: string
  itemCount?: string
}

const ShopOrderNotificationEmail = ({ orderName, customerName, totalPrice, itemCount }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New order {orderName || ''} received</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Section style={badgeWrap}>
          <Text style={badge}>🛒 New Shop Order</Text>
        </Section>
        <Heading style={h2}>Order {orderName || 'Received'}</Heading>
        <Text style={text}>
          <strong>{customerName || 'A customer'}</strong> has placed an order for{' '}
          <strong>{itemCount || '0'} item{itemCount !== '1' ? 's' : ''}</strong>.
        </Text>
        <Text style={totalStyle}>Total: {totalPrice || '£0.00'}</Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ShopOrderNotificationEmail,
  subject: (data: Record<string, any>) => `New Order ${data.orderName || ''} — Club Shop`,
  displayName: 'Shop order notification',
  previewData: { orderName: '#1042', customerName: 'John Smith', totalPrice: 'GBP 24.99', itemCount: '2' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#b8860b', fontFamily: "'Oswald', Arial, sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' }
const h2 = { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '10px 0 10px' }
const divider = { borderColor: '#e5e5e5', margin: '10px 0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const totalStyle = { fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px' }
const badgeWrap = { margin: '10px 0 0' }
const badge = { fontSize: '11px', fontWeight: '600', color: '#b8860b', backgroundColor: '#fdf6e3', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' as const, margin: '0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
