import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Peterborough Athletic FC"

interface Props {
  customerName?: string
  orderId?: string
  items?: string
  total?: string
}

const ShopOrderConfirmationEmail = ({ customerName, orderId, items, total }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for your club shop order</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Section style={badgeWrap}>
          <Text style={badge}>🛍️ Order Confirmed</Text>
        </Section>
        <Heading style={h2}>Thanks for your order{customerName ? `, ${customerName}` : ''}!</Heading>
        <Text style={text}>
          Your club shop order{orderId ? ` (#${orderId})` : ''} has been received and paid.
          We'll get it printed and ready as soon as possible - you'll hear from us when it's on its way.
        </Text>
        {items ? (
          <Section style={orderBox}>
            <Text style={orderText}>
              {items.split('\n').map((line, i) => (
                <React.Fragment key={i}>{line}<br /></React.Fragment>
              ))}
            </Text>
            {total ? <Text style={totalText}>Total: £{total}</Text> : null}
          </Section>
        ) : null}
        <Text style={smallText}>
          Any questions about your order? Just reply to this email or contact the club through the website.
        </Text>
        <Text style={footer}> - The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ShopOrderConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Your PAFC shop order${data.orderId ? ` #${data.orderId}` : ''} is confirmed`,
  displayName: 'Shop order confirmation',
  previewData: { customerName: 'Ben', orderId: 'A1B2C3D4', items: '1x PAFC Hoodie (M) - initials: BM', total: '30.00' },
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
const orderBox = { backgroundColor: '#fafafa', border: '1px solid #eee', borderRadius: '6px', padding: '12px 16px', margin: '0 0 16px' }
const orderText = { fontSize: '14px', color: '#333', lineHeight: '1.7', margin: '0' }
const totalText = { fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '10px 0 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
