import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Platform Role & Intermediary Status</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Craft Local ("we," "us," "our") operates as a marketplace platform connecting independent sellers with buyers. 
              <strong> We are not the seller of any products listed on our platform.</strong> Each seller is an independent 
              business operator responsible for their own products, services, pricing, and fulfillment.
            </p>
            <p className="mt-4">
              We do not manufacture, store, ship, or otherwise handle products sold through our platform. All transactions 
              are between buyers and individual sellers. We merely provide the technology infrastructure to facilitate these connections.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Independent Contractor Relationship</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Sellers on Craft Local are independent contractors, not employees, partners, or agents of Craft Local. 
              Sellers maintain complete control over their business operations, including:
            </p>
            <ul className="mt-2">
              <li>Product creation and sourcing</li>
              <li>Pricing and discounts</li>
              <li>Production timeline and fulfillment</li>
              <li>Customer service and communications</li>
              <li>Returns and refund policies</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. DISCLAIMER OF WARRANTIES</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="uppercase font-bold">
              THE PLATFORM AND ALL SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. 
              WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, 
              FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-4 uppercase font-bold">
              WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE DO NOT WARRANT 
              THE QUALITY, SAFETY, LEGALITY, OR AUTHENTICITY OF ANY PRODUCTS SOLD BY SELLERS.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="uppercase font-bold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRAFT LOCAL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="mt-4">
              Our total liability for any claim arising out of or relating to these Terms or the Platform shall not 
              exceed the greater of $100 or the amount of fees paid by you to us in the 12 months prior to the event 
              giving rise to the liability.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Seller Obligations</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>Sellers agree to:</p>
            <ul className="mt-2">
              <li>Provide accurate product descriptions and images</li>
              <li>Honor stated processing and shipping times (FTC Mail Order Rule compliance)</li>
              <li>Comply with all applicable food safety regulations if selling food items</li>
              <li>Maintain required business licenses and permits</li>
              <li>Respond to customer inquiries within 48 hours</li>
              <li>Process refunds and returns according to stated policies</li>
              <li>Pay all applicable taxes and fees</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. User Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              You agree to indemnify, defend, and hold harmless Craft Local and its officers, directors, employees, 
              and agents from any claims, liabilities, damages, losses, and expenses, including reasonable attorney's 
              fees, arising out of or in any way connected with:
            </p>
            <ul className="mt-2">
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Products you sell or purchase through the Platform</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. Dispute Resolution & Arbitration</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Any dispute arising from these Terms or your use of the Platform shall be resolved through binding 
              arbitration, except that either party may seek injunctive relief in court for intellectual property 
              infringement or other equitable relief.
            </p>
            <p className="mt-4 font-bold">
              YOU AGREE TO WAIVE YOUR RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN A CLASS ACTION LAWSUIT.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Payment Terms & Fees</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>Platform fees: 10% of transaction value</p>
            <p className="mt-2">Payment processing: Handled by Stripe (2.9% + $0.30 per transaction)</p>
            <p className="mt-2">
              Sellers are responsible for all taxes, including income tax, sales tax, and any applicable business taxes. 
              Craft Local will issue 1099-K forms to sellers meeting IRS thresholds ($20,000 in sales AND 200 transactions).
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>For questions about these Terms, please contact us at:</p>
            <p className="mt-2">
              <strong>Email:</strong> legal@craftlocal.net<br />
              <strong>Address:</strong> [Your Business Address]
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

export default Terms;
