import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, TrendingUp, MessageSquare, Package } from "lucide-react";

const SellerStandards = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Seller Performance Standards</h1>
        
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-blue-900">
              <strong>Purpose:</strong> These standards ensure a consistent, high-quality experience for all Craft Local buyers. 
              Sellers who fail to meet these standards may receive warnings, temporary restrictions, or account suspension.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              1. Shipping & Fulfillment Standards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">Meets Standard</h3>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• On-time shipment rate: ≥ 95%</li>
                  <li>• Orders shipped within stated timeframe</li>
                  <li>• Tracking provided within 24 hours of shipment</li>
                  <li>• Cancellation rate: &lt; 2%</li>
                </ul>
              </div>

              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold">Below Standard</h3>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• On-time shipment rate: &lt; 95%</li>
                  <li>• Late shipments without buyer notification</li>
                  <li>• Missing or incorrect tracking information</li>
                  <li>• Cancellation rate: ≥ 2%</li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">FTC Mail Order Rule Compliance</h4>
              <p className="text-sm text-muted-foreground">
                Sellers must ship orders within the timeframe stated in the listing, or within 30 days if no timeframe 
                is specified. If unable to ship on time, you must:
              </p>
              <ul className="text-sm mt-2 space-y-1">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Notify the buyer <strong>before</strong> the original ship date</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Provide a new estimated ship date</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Offer the buyer the option to cancel for a full refund</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              2. Communication Standards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">Meets Standard</h3>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• Response rate: ≥ 90%</li>
                  <li>• Average response time: &lt; 24 hours</li>
                  <li>• Professional, courteous communication</li>
                  <li>• Proactive updates on order status</li>
                </ul>
              </div>

              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold">Below Standard</h3>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• Response rate: &lt; 90%</li>
                  <li>• Average response time: &gt; 48 hours</li>
                  <li>• Unprofessional or rude responses</li>
                  <li>• Failure to respond to buyer inquiries</li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Required Communication</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Sellers must respond to buyer messages within 48 hours for:
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Pre-purchase questions about products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Custom order requests</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Order status inquiries</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Issues with received items</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              3. Quality & Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">Meets Standard</h3>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• Average rating: ≥ 4.5 stars</li>
                  <li>• Dispute rate: &lt; 1%</li>
                  <li>• Chargeback rate: &lt; 0.5%</li>
                  <li>• Accurate product descriptions</li>
                </ul>
              </div>

              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold">Below Standard</h3>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• Average rating: &lt; 4.0 stars</li>
                  <li>• Dispute rate: ≥ 2%</li>
                  <li>• Chargeback rate: ≥ 1%</li>
                  <li>• Frequent complaints about item quality</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Monitoring & Consequences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Monitoring Period</h3>
              <p className="text-sm text-muted-foreground">
                Performance is evaluated on a rolling 90-day basis. Sellers are notified when approaching performance thresholds.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-amber-900 mb-2">Warning (First Violation)</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Email notification of specific performance issues</li>
                  <li>• 14-day improvement period</li>
                  <li>• Access to seller resources and support</li>
                </ul>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Restriction (Second Violation or No Improvement)</h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Temporary listing restrictions (30 days)</li>
                  <li>• Required completion of seller improvement plan</li>
                  <li>• Increased performance monitoring</li>
                </ul>
              </div>

              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <h3 className="font-semibold text-destructive mb-2">Suspension (Third Violation or Severe Issues)</h3>
                <ul className="text-sm space-y-1">
                  <li>• Temporary account suspension (60-90 days)</li>
                  <li>• Review of all past transactions</li>
                  <li>• Probationary period upon reinstatement</li>
                </ul>
              </div>

              <div className="p-4 bg-destructive/20 border border-destructive rounded-lg">
                <h3 className="font-semibold text-destructive mb-2">Permanent Ban</h3>
                <ul className="text-sm space-y-1">
                  <li>• Severe or repeated violations</li>
                  <li>• Fraudulent activity</li>
                  <li>• Food safety violations</li>
                  <li>• Selling prohibited items</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How to Maintain Good Standing</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Badge className="mr-3 mt-1">1</Badge>
                <div>
                  <p className="font-semibold">Set Realistic Processing Times</p>
                  <p className="text-sm text-muted-foreground">
                    Give yourself extra time to account for busy periods and unexpected delays
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <Badge className="mr-3 mt-1">2</Badge>
                <div>
                  <p className="font-semibold">Communicate Proactively</p>
                  <p className="text-sm text-muted-foreground">
                    Send shipping updates and respond to messages within 24 hours
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <Badge className="mr-3 mt-1">3</Badge>
                <div>
                  <p className="font-semibold">Accurate Product Descriptions</p>
                  <p className="text-sm text-muted-foreground">
                    Include detailed photos, measurements, materials, and any imperfections
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <Badge className="mr-3 mt-1">4</Badge>
                <div>
                  <p className="font-semibold">Package Items Securely</p>
                  <p className="text-sm text-muted-foreground">
                    Use appropriate packaging to prevent damage during shipping
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <Badge className="mr-3 mt-1">5</Badge>
                <div>
                  <p className="font-semibold">Monitor Your Performance Dashboard</p>
                  <p className="text-sm text-muted-foreground">
                    Check your seller dashboard regularly to track your performance metrics
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-sm text-blue-900">
              <strong>Questions about performance standards?</strong> Contact seller support at 
              sellers@craftlocal.net or visit your Seller Dashboard for detailed performance metrics.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SellerStandards;
