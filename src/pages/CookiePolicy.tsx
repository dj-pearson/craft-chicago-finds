import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Cookie, Settings, Shield, Info, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead config={{
        title: "Cookie Policy - Craft Local",
        description: "Learn about how Craft Local uses cookies and similar technologies to provide and improve our marketplace services.",
        keywords: ["cookie policy", "cookies", "privacy", "data collection", "tracking"]
      }} />

      <Header />
      <div className="min-h-screen bg-background">
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
              <h1 className="text-4xl font-bold">Cookie Policy</h1>
              <p className="text-xl text-muted-foreground">
                How Craft Local uses cookies and similar technologies
              </p>
              <p className="text-sm text-muted-foreground">
                Last Updated: January 2025
              </p>
              <Alert>
                <Cookie className="h-4 w-4" />
                <AlertDescription>
                  This Cookie Policy explains how Craft Local ("we," "us," or "our") uses cookies 
                  and similar technologies when you visit our website and marketplace platform.
                </AlertDescription>
              </Alert>
            </div>

            {/* What Are Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  What Are Cookies?
                </CardTitle>
                <CardDescription>Understanding cookies and similar technologies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Cookies are small text files that are stored on your device (computer, tablet, or mobile) 
                  when you visit a website. They help websites remember information about your visit, making 
                  your next visit easier and the site more useful to you.
                </p>

                <div className="space-y-2">
                  <h3 className="font-semibold">Similar Technologies:</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li><strong>Local Storage:</strong> Allows websites to store data locally in your browser</li>
                    <li><strong>Session Storage:</strong> Temporary storage that's cleared when you close your browser</li>
                    <li><strong>Web Beacons:</strong> Small graphic images used to track user behavior</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Types of Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>Types of Cookies We Use</CardTitle>
                <CardDescription>Different cookies serve different purposes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Essential Cookies */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    1. Essential Cookies (Required)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies are necessary for the website to function properly and cannot be disabled.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm"><strong>Purpose:</strong></p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      <li>Authentication and account access</li>
                      <li>Security and fraud prevention</li>
                      <li>Shopping cart functionality</li>
                      <li>Payment processing</li>
                      <li>Form submission</li>
                    </ul>
                    <p className="text-sm pt-2"><strong>Examples:</strong> Session cookies, authentication tokens, CSRF tokens</p>
                    <p className="text-sm"><strong>Duration:</strong> Session or up to 1 year</p>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    2. Functional Cookies (Preferences)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies enable enhanced functionality and personalization.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm"><strong>Purpose:</strong></p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      <li>Remember your preferences (language, location)</li>
                      <li>Store your recent searches</li>
                      <li>Remember items you've viewed</li>
                      <li>Dark mode/theme preferences</li>
                      <li>Chat and messaging features</li>
                    </ul>
                    <p className="text-sm pt-2"><strong>Examples:</strong> Preference cookies, user settings</p>
                    <p className="text-sm"><strong>Duration:</strong> Up to 1 year</p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">3. Analytics Cookies (Performance)</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies help us understand how visitors use our website.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm"><strong>Purpose:</strong></p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      <li>Track page visits and user flow</li>
                      <li>Measure site performance</li>
                      <li>Understand which features are most popular</li>
                      <li>Identify and fix errors</li>
                      <li>Improve user experience</li>
                    </ul>
                    <p className="text-sm pt-2"><strong>Examples:</strong> Google Analytics (if enabled), performance monitoring</p>
                    <p className="text-sm"><strong>Duration:</strong> Up to 2 years</p>
                  </div>
                </div>

                {/* Advertising Cookies */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">4. Advertising Cookies (Marketing)</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies are used to deliver relevant advertisements.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm"><strong>Purpose:</strong></p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      <li>Show relevant ads based on your interests</li>
                      <li>Limit the number of times you see an ad</li>
                      <li>Measure advertising campaign effectiveness</li>
                      <li>Track conversions</li>
                    </ul>
                    <p className="text-sm pt-2"><strong>Examples:</strong> Retargeting pixels, ad platform cookies</p>
                    <p className="text-sm"><strong>Duration:</strong> Up to 1 year</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Third-Party Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>Third-Party Cookies</CardTitle>
                <CardDescription>Cookies from our service providers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Some cookies are placed by third-party services that appear on our pages:
                </p>
                <ul className="space-y-3">
                  <li>
                    <strong>Stripe:</strong> Payment processing and fraud prevention
                  </li>
                  <li>
                    <strong>Supabase:</strong> Authentication and database services
                  </li>
                  <li>
                    <strong>Analytics Providers:</strong> Website usage and performance tracking (if enabled)
                  </li>
                  <li>
                    <strong>Social Media:</strong> Social sharing and login features
                  </li>
                </ul>
                <Alert>
                  <AlertDescription>
                    These third parties have their own privacy policies. We recommend reviewing them to 
                    understand how they use your information.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Managing Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Managing Your Cookie Preferences
                </CardTitle>
                <CardDescription>You have control over cookies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Browser Settings:</h3>
                  <p className="text-sm text-muted-foreground">
                    Most web browsers allow you to control cookies through their settings. You can:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li>Block all cookies</li>
                    <li>Block only third-party cookies</li>
                    <li>Delete cookies when you close your browser</li>
                    <li>View which cookies are stored and delete individual cookies</li>
                  </ul>
                </div>

                <div className="space-y-2 pt-4">
                  <h3 className="font-semibold">Browser-Specific Instructions:</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data
                    </li>
                    <li>
                      <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
                    </li>
                    <li>
                      <strong>Safari:</strong> Preferences → Privacy → Cookies and website data
                    </li>
                    <li>
                      <strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data
                    </li>
                  </ul>
                </div>

                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    <strong>Important:</strong> Blocking or deleting cookies may impact your ability to use 
                    certain features of our website, including logging in, making purchases, and saving preferences.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Do Not Track */}
            <Card>
              <CardHeader>
                <CardTitle>Do Not Track Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Some browsers include a "Do Not Track" (DNT) feature that signals websites you visit that 
                  you do not want your online activity tracked. Currently, there is no industry standard for 
                  responding to DNT signals. At this time, our website does not respond to DNT signals, but 
                  we honor your cookie preferences as set in your browser.
                </p>
              </CardContent>
            </Card>

            {/* Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Updates to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We may update this Cookie Policy from time to time to reflect changes in technology, 
                  legislation, or our business practices. When we make changes, we will update the "Last Updated" 
                  date at the top of this policy.
                </p>
                <p className="text-sm text-muted-foreground">
                  We encourage you to review this Cookie Policy periodically to stay informed about how we 
                  use cookies.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <div className="text-center py-8 space-y-4">
              <h2 className="text-2xl font-bold">Questions About Cookies?</h2>
              <p className="text-muted-foreground">
                If you have questions about our use of cookies, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  Email:{" "}
                  <a href="mailto:privacy@craftlocal.net" className="text-primary hover:underline">
                    privacy@craftlocal.net
                  </a>
                </p>
                <p>
                  Or view our{" "}
                  <Button variant="link" className="px-1" onClick={() => navigate("/privacy")}>
                    Privacy Policy
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CookiePolicy;
