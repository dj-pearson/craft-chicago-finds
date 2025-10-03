import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Clock, 
  MessageSquare, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from "lucide-react";

const DisputeResolutionGuide = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead config={{
        title: "Dispute Resolution Guide - Craft Local",
        description: "Learn how to resolve disputes between buyers and sellers on Craft Local marketplace. Understanding your rights and the resolution process.",
        keywords: ["dispute resolution", "marketplace disputes", "buyer protection", "seller protection", "order issues"]
      }} />

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
              <h1 className="text-4xl font-bold">Dispute Resolution Guide</h1>
              <p className="text-xl text-muted-foreground">
                Understanding the process for resolving issues between buyers and sellers
              </p>
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Craft Local provides a structured dispute resolution process to protect both buyers and sellers. 
                  We encourage communication first, but formal disputes can be filed when needed.
                </AlertDescription>
              </Alert>
            </div>

            {/* When to File a Dispute */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  When to File a Dispute
                </CardTitle>
                <CardDescription>Valid reasons for opening a formal dispute</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Buyers may file disputes for:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Item Not Received:</strong> Order was not delivered or available for pickup by the promised date</li>
                    <li><strong>Significantly Not as Described:</strong> Item differs substantially from the listing description or photos</li>
                    <li><strong>Damaged in Transit:</strong> Item arrived damaged (with photo evidence)</li>
                    <li><strong>Wrong Item:</strong> Received a different item than ordered</li>
                    <li><strong>Quality Issues:</strong> Item has defects not disclosed in the listing</li>
                  </ul>
                </div>

                <div className="space-y-2 pt-4">
                  <h3 className="font-semibold">Sellers may file disputes for:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Buyer No-Show:</strong> Buyer failed to collect local pickup order</li>
                    <li><strong>Return Fraud:</strong> Item returned is not the original item or is damaged by buyer</li>
                    <li><strong>False Claims:</strong> Buyer filed fraudulent chargeback or dispute</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Before Filing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Before Filing a Dispute
                </CardTitle>
                <CardDescription>Try to resolve the issue directly first</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Important:</strong> We strongly encourage buyers and sellers to communicate directly 
                    through our messaging system before filing a formal dispute. Many issues can be resolved quickly 
                    through simple communication.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="font-semibold">Recommended steps:</h3>
                  <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                    <li>Contact the other party through Craft Local's messaging system</li>
                    <li>Clearly explain the issue and what you'd like to happen</li>
                    <li>Give the other party at least 48 hours to respond</li>
                    <li>Be professional and keep all communication on-platform</li>
                    <li>Document the issue with photos if relevant</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Filing Process */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  How to File a Dispute
                </CardTitle>
                <CardDescription>Step-by-step dispute filing process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Filing Requirements:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Disputes must be filed within <strong>30 days</strong> of the order date</li>
                    <li>Provide a clear description of the issue (minimum 20 characters)</li>
                    <li>Upload supporting evidence (photos, screenshots, etc.) when applicable</li>
                    <li>Specify what resolution you're seeking</li>
                  </ul>
                </div>

                <div className="space-y-2 pt-4">
                  <h3 className="font-semibold">Steps to File:</h3>
                  <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                    <li>Go to your Orders page</li>
                    <li>Find the order in question and click "View Details"</li>
                    <li>Click the "Open Dispute" button</li>
                    <li>Select the type of dispute and provide details</li>
                    <li>Upload any supporting evidence</li>
                    <li>Submit the dispute</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Resolution Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Resolution Timeline
                </CardTitle>
                <CardDescription>What to expect during the dispute process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Dispute Filed</h4>
                      <p className="text-sm text-muted-foreground">
                        Both parties are notified immediately. The other party has <strong>5 business days</strong> to respond.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Response Period</h4>
                      <p className="text-sm text-muted-foreground">
                        The responding party submits their evidence and explanation. You'll be notified when they respond.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Review by Craft Local</h4>
                      <p className="text-sm text-muted-foreground">
                        Our team reviews all evidence and communication. This typically takes <strong>3-7 business days</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Resolution Decision</h4>
                      <p className="text-sm text-muted-foreground">
                        Both parties are notified of the decision. Resolutions may include refunds, replacements, or no action.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className="mt-4">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Total Timeline:</strong> Most disputes are resolved within 7-10 business days from filing.
                    Complex cases may take longer.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Possible Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Possible Outcomes
                </CardTitle>
                <CardDescription>How disputes can be resolved</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Full Refund:</strong> Buyer receives complete refund, seller may or may not need to accept return
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Partial Refund:</strong> Buyer receives partial refund if item has diminished value
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Replacement:</strong> Seller provides replacement item at no additional cost
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>No Action:</strong> Dispute is denied if evidence doesn't support the claim
                    </div>
                  </li>
                </ul>

                <Alert className="mt-4" variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> All dispute decisions are final. Repeated fraudulent disputes may result 
                    in account suspension.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Important Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Platform Role:</h3>
                  <p className="text-sm text-muted-foreground">
                    Craft Local acts as a marketplace platform connecting buyers and sellers. We are not a party to 
                    transactions but provide dispute resolution services to maintain marketplace integrity.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Evidence Matters:</h3>
                  <p className="text-sm text-muted-foreground">
                    The quality and completeness of evidence significantly impacts dispute outcomes. Always document 
                    issues with clear photos, save all messages, and keep tracking information.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Communication Stays On-Platform:</h3>
                  <p className="text-sm text-muted-foreground">
                    All dispute-related communication must occur through Craft Local's messaging system. This protects 
                    both parties and creates a record for review.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <div className="text-center py-8 space-y-4">
              <h2 className="text-2xl font-bold">Need Help?</h2>
              <p className="text-muted-foreground">
                If you have questions about the dispute process, contact us at{" "}
                <a href="mailto:disputes@craftlocal.net" className="text-primary hover:underline">
                  disputes@craftlocal.net
                </a>
              </p>
              <div className="pt-4">
                <Button onClick={() => navigate("/orders")}>
                  View My Orders
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DisputeResolutionGuide;
