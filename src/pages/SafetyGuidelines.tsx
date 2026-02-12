import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Eye,
  Clock,
  Phone,
  ArrowLeft
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const SafetyGuidelines = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead config={{
        title: "Safety Guidelines for Local Pickup - Craft Local",
        description: "Essential safety tips for meeting sellers and buyers for local pickup on Craft Local marketplace. Stay safe during in-person transactions.",
        keywords: ["local pickup safety", "meeting safety", "marketplace safety", "safe transactions", "buyer safety"]
      }} />

      <Header />
      <main id="main-content" role="main" tabIndex={-1} className="min-h-screen bg-background focus:outline-none">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Safety Guidelines for Local Pickup</h1>
              <p className="text-xl text-muted-foreground">
                Essential safety tips for in-person transactions
              </p>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your safety is our top priority. Follow these guidelines to ensure safe and secure 
                  local pickup transactions on Craft Local.
                </AlertDescription>
              </Alert>
            </div>

            {/* Meeting Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Choose a Safe Meeting Location
                </CardTitle>
                <CardDescription>Where you meet matters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Recommended Safe Locations:
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Police Station Parking Lots:</strong> Many police departments offer designated "safe exchange zones"</li>
                    <li><strong>Bank Lobbies:</strong> During business hours, well-monitored with security cameras</li>
                    <li><strong>Coffee Shops or Restaurants:</strong> Busy, public places with staff and other customers</li>
                    <li><strong>Shopping Center Parking Lots:</strong> Well-lit areas with high foot traffic</li>
                    <li><strong>Public Libraries:</strong> Safe, monitored public spaces</li>
                    <li><strong>Fire Stations:</strong> Often have parking areas suitable for exchanges</li>
                  </ul>
                </div>

                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Avoid These Locations:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Your home or apartment unless you know the person well</li>
                      <li>Remote or isolated areas</li>
                      <li>Dimly lit parking lots at night</li>
                      <li>Private residences of strangers</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Meeting Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pick the Right Time
                </CardTitle>
                <CardDescription>Timing impacts safety</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Best Times to Meet:
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Daylight Hours:</strong> Meet during the day when visibility is good</li>
                    <li><strong>Business Hours:</strong> When shops and businesses are open and active</li>
                    <li><strong>Peak Times:</strong> During busy periods with more people around</li>
                  </ul>
                </div>

                <Alert className="mt-4">
                  <AlertDescription>
                    If you must meet after dark, choose a very well-lit location with active security 
                    or surveillance cameras.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Bring Someone */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Bring a Friend or Family Member
                </CardTitle>
                <CardDescription>Safety in numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Always bring someone with you</strong> if possible, especially for high-value items
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Let someone know where you're going</strong> - share the meeting location, time, and who you're meeting
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Keep your phone charged</strong> and accessible
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Check in after the exchange</strong> to confirm everything went smoothly
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Inspect Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Inspect Items Carefully
                </CardTitle>
                <CardDescription>Verify before you leave</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Before Completing the Exchange:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Inspect the item thoroughly</strong> - check condition, functionality, and authenticity</li>
                    <li><strong>Compare to listing photos</strong> - ensure it matches the description</li>
                    <li><strong>Test electronic items if possible</strong> - bring batteries or ask to test before leaving</li>
                    <li><strong>Take photos</strong> of the item at pickup for your records</li>
                    <li><strong>Don't feel pressured</strong> - take your time to examine the item</li>
                  </ul>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Important:</strong> If the item is not as described or you have concerns, you have the right 
                    to decline the exchange. Contact Craft Local support immediately through the app.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Communication Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Communication Best Practices
                </CardTitle>
                <CardDescription>Keep it professional and on-platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Use Craft Local messaging</strong> for all transaction communication
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Don't share personal information</strong> like your home address or personal phone number unless necessary
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Be clear about meeting details</strong> - confirm exact location, time, and what you'll be wearing
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Trust your instincts</strong> - if something feels off, suggest a different location or cancel
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Red Flags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Warning Signs - Trust Your Instincts
                </CardTitle>
                <CardDescription>When to walk away</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Be cautious if:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>The person insists on meeting at a remote or private location</li>
                      <li>They pressure you to complete the transaction quickly</li>
                      <li>They ask for payment outside of Craft Local platform</li>
                      <li>The person becomes aggressive or makes you uncomfortable</li>
                      <li>The price seems too good to be true</li>
                      <li>They request unusual payment methods (wire transfer, cryptocurrency, gift cards)</li>
                      <li>They avoid answering questions about the item</li>
                      <li>Your gut tells you something isn't right</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold">
                    Remember: It's always okay to cancel or reschedule if you feel uncomfortable. Your safety is more important than any transaction.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Safety */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Safety</CardTitle>
                <CardDescription>Complete all payments through Craft Local</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>All payments must be completed through Craft Local's platform before pickup.</strong> 
                    This protects both buyers and sellers and ensures proper documentation of the transaction.
                  </AlertDescription>
                </Alert>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Never carry large amounts of cash to a pickup</li>
                  <li>• Don't accept requests for additional payment at pickup</li>
                  <li>• Don't provide payment outside the Craft Local system</li>
                  <li>• Report any requests for off-platform payment to Craft Local support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Emergency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-destructive" />
                  In Case of Emergency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>If you feel threatened or unsafe at any point:</strong>
                    <ol className="list-decimal pl-6 mt-2 space-y-1">
                      <li>Leave the area immediately</li>
                      <li>Call 911 if you're in danger</li>
                      <li>Report the incident to Craft Local at <a href="mailto:safety@craftlocal.net" className="underline">safety@craftlocal.net</a></li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <div className="text-center py-8 space-y-4">
              <h2 className="text-2xl font-bold">Questions or Concerns?</h2>
              <p className="text-muted-foreground">
                Contact our safety team at{" "}
                <a href="mailto:safety@craftlocal.net" className="text-primary hover:underline">
                  safety@craftlocal.net
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Report suspicious activity or safety concerns immediately.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SafetyGuidelines;
