import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText, 
  Shield, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Scale
} from "lucide-react";
import { Link } from "react-router-dom";

export function SellerComplianceGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Seller Compliance Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              As a seller on Craft Local, you must comply with federal and state regulations. 
              This guide explains your compliance obligations based on your sales volume.
            </AlertDescription>
          </Alert>

          {/* Revenue Thresholds Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold">$600 Annual Sales</h3>
                </div>
                <Badge variant="secondary" className="mb-2">W-9 Required</Badge>
                <p className="text-sm text-muted-foreground">
                  Submit tax information form for IRS reporting
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">$5,000 Annual Sales</h3>
                </div>
                <Badge variant="secondary" className="mb-2">Identity Verification</Badge>
                <p className="text-sm text-muted-foreground">
                  Verify identity within 10 days of reaching threshold
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">$20,000 Annual Sales</h3>
                </div>
                <Badge variant="secondary" className="mb-2">Public Disclosure</Badge>
                <p className="text-sm text-muted-foreground">
                  Provide public business contact information
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Compliance Requirements */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="w9">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  W-9 Tax Information (Required at $600)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm">
                  The IRS requires us to collect tax information from sellers who earn $600 or more annually.
                </p>
                
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">What You Need to Provide:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>Legal name (as shown on tax return)</li>
                    <li>Business entity type (Individual, LLC, Corporation, etc.)</li>
                    <li>Taxpayer Identification Number (SSN or EIN)</li>
                    <li>Business address</li>
                  </ul>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Failure to submit W-9 information may result in 
                    backup withholding (24% of your earnings) or account suspension.
                  </AlertDescription>
                </Alert>

                <Link to="/w9-submission">
                  <span className="text-sm text-primary hover:underline flex items-center gap-1">
                    Submit W-9 Form <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="identity">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Identity Verification (Required at $5,000)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm">
                  The INFORM Consumers Act requires identity verification for high-volume sellers 
                  (200+ transactions or $5,000+ in sales within any 12-month period).
                </p>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Verification Process:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>Submit full legal name matching government ID</li>
                    <li>Provide date of birth</li>
                    <li>Last 4 digits of Social Security Number</li>
                    <li>Residential address</li>
                    <li>Government-issued ID information</li>
                  </ul>
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>10-Day Deadline:</strong> You have 10 days from receiving notification 
                    to complete verification. Non-compliance results in account suspension.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Annual Recertification:</h4>
                  <p className="text-sm text-muted-foreground">
                    Once verified, you must recertify your information annually. We'll send 
                    reminders before your recertification date.
                  </p>
                </div>

                <Link to="/seller-dashboard?tab=verification">
                  <span className="text-sm text-primary hover:underline flex items-center gap-1">
                    Start Verification <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="disclosure">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Public Business Disclosure (Required at $20,000)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm">
                  The INFORM Consumers Act requires public disclosure of business information 
                  for sellers exceeding $20,000 in annual sales.
                </p>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Public Information Required:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>Business name or seller name</li>
                    <li>Business address or physical location</li>
                    <li>Business email address</li>
                    <li>Business phone number</li>
                  </ul>
                </div>

                <Alert>
                  <AlertDescription>
                    This information will be displayed publicly on your seller profile to comply 
                    with consumer protection laws. You can use a business address instead of 
                    your home address.
                  </AlertDescription>
                </Alert>

                <Link to="/seller-dashboard?tab=verification">
                  <span className="text-sm text-primary hover:underline flex items-center gap-1">
                    Submit Disclosure Information <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="1099k">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  1099-K Tax Reporting
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm">
                  We are required to report your earnings to the IRS if you meet certain thresholds.
                </p>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">2024 Reporting Thresholds:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>$20,000 in gross sales <strong>AND</strong></li>
                    <li>200 or more transactions</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Both conditions must be met in the same calendar year.
                  </p>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    If you meet these thresholds, we'll automatically send you a 1099-K form 
                    by January 31st of the following year. We'll also file it with the IRS.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Important Notes:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>Ensure your W-9 information is accurate and up-to-date</li>
                    <li>Report all income on your tax return, even if you don't receive a 1099-K</li>
                    <li>Consult a tax professional for guidance on business deductions</li>
                  </ul>
                </div>

                <Link to="/seller-dashboard?tab=taxes">
                  <span className="text-sm text-primary hover:underline flex items-center gap-1">
                    View Tax Documents <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="performance">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Performance Standards
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm">
                  All sellers must maintain minimum performance standards to ensure a quality 
                  marketplace experience.
                </p>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Required Standards:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li><strong>Response Time:</strong> Reply to messages within 24 hours</li>
                    <li><strong>Minimum Rating:</strong> Maintain 4.0+ star average</li>
                    <li><strong>On-Time Shipment:</strong> 90%+ orders shipped on time</li>
                  </ul>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Sellers falling below standards will receive warnings and must submit an 
                    improvement plan. Continued non-compliance may result in account restrictions.
                  </AlertDescription>
                </Alert>

                <Link to="/seller-standards">
                  <span className="text-sm text-primary hover:underline flex items-center gap-1">
                    View Full Standards <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Quick Links */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link to="/seller-dashboard?tab=verification" className="text-sm text-primary hover:underline flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Check Compliance Status
              </Link>
              <Link to="/w9-submission" className="text-sm text-primary hover:underline flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Submit W-9 Form
              </Link>
              <Link to="/seller-standards" className="text-sm text-primary hover:underline flex items-center gap-1">
                <Scale className="h-3 w-3" />
                Seller Performance Standards
              </Link>
              <Link to="/fee-schedule" className="text-sm text-primary hover:underline flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Fee Schedule
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
