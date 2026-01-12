import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard } from "lucide-react";

const FeeSchedule = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" role="main" className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Fee Schedule</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Platform Transaction Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Platform Fee</h3>
                <p className="text-3xl font-bold text-primary">10%</p>
                <p className="text-sm text-muted-foreground mt-2">
                  of each transaction value
                </p>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Processing
                </h3>
                <p className="text-2xl font-bold text-primary">2.9% + $0.30</p>
                <p className="text-sm text-muted-foreground mt-2">
                  per transaction (via Stripe)
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-2">How Fees Work</h4>
              <p className="text-sm text-muted-foreground mb-3">
                When a customer purchases an item for $100, here's the breakdown:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Item Price:</span>
                  <span className="font-medium">$100.00</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Platform Fee (10%):</span>
                  <span className="font-medium">- $10.00</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Payment Processing (2.9% + $0.30):</span>
                  <span className="font-medium">- $3.20</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>You Receive:</span>
                  <span className="text-primary">$86.80</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>No Hidden Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Listing Fees</span>
              <span className="text-success font-bold">$0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Monthly Subscription</span>
              <span className="text-success font-bold">$0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Setup Fees</span>
              <span className="text-success font-bold">$0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Withdrawal Fees</span>
              <span className="text-success font-bold">$0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payout Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3">Funds are automatically transferred to your bank account:</p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Standard:</strong> 2 business days after order is marked as shipped/completed</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Instant Payouts:</strong> Available through Stripe for an additional 1% fee</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tax Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> Sellers are responsible for all applicable taxes including:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Income Tax:</strong> Report all sales as income on your tax return</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Sales Tax:</strong> Collect and remit sales tax as required by your state</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>1099-K Form:</strong> Issued annually to sellers with $20,000+ in sales AND 200+ transactions</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Business Licenses:</strong> Obtain any required local business permits</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-sm text-blue-900">
              <strong>Questions about fees?</strong> Contact us at fees@craftlocal.net or 
              visit our seller FAQ section for more details about how our fee structure works.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FeeSchedule;
