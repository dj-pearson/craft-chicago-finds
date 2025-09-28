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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface NotificationEmailProps {
  recipientName: string;
  title: string;
  content: string;
  actionUrl?: string;
  senderName: string;
  type: string;
}

export const NotificationEmail = ({
  recipientName,
  title,
  content,
  actionUrl,
  senderName,
  type,
}: NotificationEmailProps) => {
  const getTypeColor = (notificationType: string) => {
    switch (notificationType) {
      case 'order': return '#10b981';
      case 'message': return '#3b82f6';
      case 'review': return '#f59e0b';
      case 'dispute': return '#ef4444';
      case 'system': return '#6b7280';
      default: return '#8b5cf6';
    }
  };

  const typeColor = getTypeColor(type);

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Chicago Makers Marketplace</Heading>
            <div style={{ ...badge, backgroundColor: typeColor }}>
              {type.charAt(0).toUpperCase() + type.slice(1)} Notification
            </div>
          </Section>

          <Section style={content}>
            <Heading style={h2}>{title}</Heading>
            <Text style={text}>{content}</Text>
            
            {actionUrl && (
              <Section style={buttonContainer}>
                <Button style={{ ...button, backgroundColor: typeColor }} href={actionUrl}>
                  View Details
                </Button>
              </Section>
            )}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This notification was sent by {senderName}
            </Text>
            <Text style={footerText}>
              You can manage your notification preferences in your{' '}
              <Link href="https://your-app-url.com/profile" style={link}>
                profile settings
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

export default NotificationEmail;

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const header = {
  backgroundColor: '#ffffff',
  borderRadius: '8px 8px 0 0',
  padding: '32px 40px 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e2e8f0',
};

const h1 = {
  color: '#1a202c',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const badge = {
  display: 'inline-block',
  padding: '6px 16px',
  borderRadius: '20px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '32px 40px',
};

const h2 = {
  color: '#1a202c',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px',
  lineHeight: '1.3',
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
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
  padding: '12px 24px',
  border: 'none',
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