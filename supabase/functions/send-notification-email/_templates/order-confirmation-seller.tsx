import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface OrderConfirmationSellerProps {
  sellerName: string;
  orderId: string;
  orderDate: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  platformFee: number;
  payout: number;
  buyerName: string;
  shippingAddress: string;
}

export const OrderConfirmationSeller = ({
  sellerName,
  orderId,
  orderDate,
  items,
  subtotal,
  platformFee,
  payout,
  buyerName,
  shippingAddress,
}: OrderConfirmationSellerProps) => {
  return (
    <Html>
      <Head />
      <Preview>New order #{orderId} received</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>New Order Received! 📦</Heading>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Hi {sellerName},</Text>
            <Text style={text}>
              Great news! You've received a new order. Please prepare the items for shipment.
            </Text>

            <Section style={orderDetails}>
              <Row>
                <Column>
                  <Text style={label}>Order Number</Text>
                  <Text style={value}>#{orderId}</Text>
                </Column>
                <Column>
                  <Text style={label}>Order Date</Text>
                  <Text style={value}>{orderDate}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={itemsSection}>
              <Heading style={h2}>Order Items</Heading>
              {items.map((item, index) => (
                <Section key={index} style={itemRow}>
                  <Row>
                    <Column style={{ width: '60%' }}>
                      <Text style={itemTitle}>{item.title}</Text>
                      <Text style={itemQuantity}>Qty: {item.quantity}</Text>
                    </Column>
                    <Column style={{ width: '40%', textAlign: 'right' }}>
                      <Text style={itemPrice}>${item.price.toFixed(2)}</Text>
                    </Column>
                  </Row>
                </Section>
              ))}

              <Hr style={divider} />

              <Row>
                <Column style={{ width: '60%' }}>
                  <Text style={totalLabel}>Subtotal</Text>
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text style={totalValue}>${subtotal.toFixed(2)}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={{ width: '60%' }}>
                  <Text style={totalLabel}>Platform Fee (10%)</Text>
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text style={totalValue}>-${platformFee.toFixed(2)}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={{ width: '60%' }}>
                  <Text style={grandTotalLabel}>Your Payout</Text>
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text style={grandTotalValue}>${payout.toFixed(2)}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={buyerInfo}>
              <Heading style={h2}>Buyer Information</Heading>
              <Text style={text}>
                <strong>Name:</strong> {buyerName}
              </Text>
              <Text style={text}>
                <strong>Shipping Address:</strong><br />
                {shippingAddress}
              </Text>
            </Section>

            <Section style={actionSection}>
              <Text style={text}>
                <strong>Next Steps:</strong>
              </Text>
              <Text style={text}>
                1. Prepare the items for shipment<br />
                2. Print the shipping label from your dashboard<br />
                3. Update the order status when shipped
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button 
                style={button} 
                href={`https://craftlocal.love/seller-dashboard?order=${orderId}`}
              >
                Manage Order
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Need help? Visit our{' '}
              <Link href="https://craftlocal.love/seller-standards" style={link}>
                Seller Standards
              </Link>
            </Text>
            <Text style={footerText}>
              Chicago Makers Marketplace - Supporting Local Artisans
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationSeller;

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const header = {
  backgroundColor: '#8b5cf6',
  borderRadius: '8px 8px 0 0',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '32px 40px',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a202c',
  margin: '0 0 16px',
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const orderDetails = {
  backgroundColor: '#f7fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const label = {
  fontSize: '12px',
  color: '#718096',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};

const value = {
  fontSize: '16px',
  color: '#1a202c',
  fontWeight: '600',
  margin: '0',
};

const itemsSection = {
  margin: '24px 0',
};

const h2 = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a202c',
  margin: '0 0 16px',
};

const itemRow = {
  margin: '12px 0',
};

const itemTitle = {
  fontSize: '16px',
  color: '#1a202c',
  fontWeight: '500',
  margin: '0',
};

const itemQuantity = {
  fontSize: '14px',
  color: '#718096',
  margin: '4px 0 0',
};

const itemPrice = {
  fontSize: '16px',
  color: '#1a202c',
  fontWeight: '600',
  margin: '0',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '16px 0',
};

const totalLabel = {
  fontSize: '16px',
  color: '#4a5568',
  margin: '8px 0',
};

const totalValue = {
  fontSize: '16px',
  color: '#1a202c',
  margin: '8px 0',
};

const grandTotalLabel = {
  fontSize: '18px',
  color: '#1a202c',
  fontWeight: '600',
  margin: '8px 0',
};

const grandTotalValue = {
  fontSize: '18px',
  color: '#8b5cf6',
  fontWeight: 'bold',
  margin: '8px 0',
};

const buyerInfo = {
  backgroundColor: '#f7fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const actionSection = {
  borderLeft: '4px solid #8b5cf6',
  paddingLeft: '20px',
  margin: '24px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const footer = {
  backgroundColor: '#f7fafc',
  borderRadius: '0 0 8px 8px',
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const link = {
  color: '#8b5cf6',
  textDecoration: 'underline',
};
