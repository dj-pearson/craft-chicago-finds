import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" role="main" className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              <strong>Account Information:</strong> Name, email address, phone
              number, and password
            </p>
            <p className="mt-2">
              <strong>Seller Information:</strong> Business name, tax ID (for
              1099-K compliance), bank account details (processed by Stripe)
            </p>
            <p className="mt-2">
              <strong>Transaction Information:</strong> Purchase history, cart
              contents, shipping addresses
            </p>
            <p className="mt-2">
              <strong>Usage Data:</strong> IP address, browser type, pages
              visited, time spent on site
            </p>
            <p className="mt-2">
              <strong>Communications:</strong> Messages between buyers and
              sellers, customer service inquiries
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul>
              <li>Process transactions and fulfill orders</li>
              <li>Facilitate communication between buyers and sellers</li>
              <li>Verify seller identities (INFORM Act compliance)</li>
              <li>Issue tax forms (1099-K) to qualifying sellers</li>
              <li>Improve platform functionality and user experience</li>
              <li>
                Send transactional emails (order confirmations, shipping
                updates)
              </li>
              <li>Prevent fraud and enforce our Terms of Service</li>
              <li>Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. How We Share Your Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              <strong>With Sellers:</strong> When you make a purchase, we share
              your name, shipping address, and order details with the seller
            </p>
            <p className="mt-2">
              <strong>With Stripe:</strong> Payment processing, identity
              verification, tax reporting
            </p>
            <p className="mt-2">
              <strong>With Service Providers:</strong> Email delivery,
              analytics, customer support tools
            </p>
            <p className="mt-2">
              <strong>For Legal Compliance:</strong> Law enforcement, tax
              authorities, regulatory agencies when required by law
            </p>
            <p className="mt-2">
              <strong>Public Disclosure:</strong> High-volume sellers
              ($20,000+/year) must have their name, address, and contact
              information publicly displayed per the INFORM Consumers Act
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4. Seller Privacy Practices</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="font-bold">
              IMPORTANT: Individual sellers are responsible for their own
              privacy practices regarding customer data they receive through
              orders.
            </p>
            <p className="mt-4">
              Craft Local is not responsible for how sellers use, store, or
              protect buyer information. We encourage buyers to review
              individual seller policies and contact sellers directly with
              privacy concerns.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Your Privacy Rights</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>You have the right to:</p>
            <ul className="mt-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and
                associated data
              </li>
              <li>
                <strong>Opt-Out:</strong> Unsubscribe from marketing emails
              </li>
              <li>
                <strong>California Residents:</strong> Do Not Sell or Share My
                Personal Information (CCPA)
              </li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at privacy@craftlocal.net
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              We implement industry-standard security measures including
              encryption, secure servers, and regular security audits. However,
              no method of transmission over the internet is 100% secure, and we
              cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Our platform is not intended for users under 18 years of age. We
              do not knowingly collect personal information from children. If
              you believe we have inadvertently collected information from a
              child, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>We use cookies and similar technologies to:</p>
            <ul className="mt-2">
              <li>Remember your login session</li>
              <li>Keep items in your shopping cart</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Personalize your experience</li>
            </ul>
            <p className="mt-4">
              You can control cookie preferences through your browser settings.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p>For privacy-related questions or to exercise your rights:</p>
            <p className="mt-2">
              <strong>Email:</strong> support@craftlocal.net
              <br />
              <strong>Address:</strong> West Des Moines, IA
            </p>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-8">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
