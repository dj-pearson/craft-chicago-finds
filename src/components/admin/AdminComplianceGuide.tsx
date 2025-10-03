import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, FileText } from "lucide-react";

export function AdminComplianceGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Compliance Management Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              As a platform administrator, you are responsible for ensuring compliance with federal regulations including the INFORM Consumers Act, IRS reporting requirements, and consumer protection laws.
            </AlertDescription>
          </Alert>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="overview">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Overview of Compliance Requirements
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Key Federal Regulations:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>INFORM Consumers Act (2023):</strong> Requires identity verification and public disclosure for high-volume sellers
                    </li>
                    <li>
                      <strong>IRS Form W-9:</strong> Required for sellers earning $600+ annually for tax reporting
                    </li>
                    <li>
                      <strong>Form 1099-K:</strong> Required reporting for sellers with $20,000+ in sales and 200+ transactions
                    </li>
                    <li>
                      <strong>Consumer Protection:</strong> Platform performance standards and dispute resolution
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Revenue Thresholds:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>$600:</strong> W-9 submission required</li>
                    <li><strong>$5,000:</strong> Identity verification required (10-day deadline)</li>
                    <li><strong>$20,000:</strong> Public business disclosure required</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="verification">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Identity Verification Management
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Review Process:</h4>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>
                      <strong>Initial Submission:</strong> Seller submits identity information when they reach $5,000 in annual sales
                    </li>
                    <li>
                      <strong>10-Day Deadline:</strong> Platform has 10 days to verify identity or suspend account
                    </li>
                    <li>
                      <strong>Document Review:</strong> Verify legal name, SSN (last 4 digits), address, and government ID
                    </li>
                    <li>
                      <strong>Approval/Rejection:</strong> Approve if information matches, reject with specific reason if not
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">What to Verify:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Full legal name matches government-issued ID</li>
                    <li>Date of birth is reasonable and complete</li>
                    <li>Last 4 digits of SSN are provided</li>
                    <li>Complete residential address (no P.O. boxes)</li>
                    <li>Valid government ID type and number</li>
                  </ul>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Critical:</strong> If verification is not completed within 10 days, the seller's account must be automatically suspended. Use the ComplianceVerification component to approve/reject submissions.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="w9">
              <AccordionTrigger>W-9 Tax Form Management</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">When W-9 is Required:</h4>
                  <p>Sellers must submit a W-9 form when they reach $600 in annual sales. This is a federal tax requirement.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Admin Responsibilities:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Monitor W-9 submission compliance in the ComplianceReporting dashboard</li>
                    <li>Send reminders to sellers who haven't submitted (automatic system handles this)</li>
                    <li>Verify W-9 information is complete and accurate</li>
                    <li>Maintain secure storage of all tax documents (encrypted in database)</li>
                    <li>Generate 1099-K forms at year-end for qualifying sellers</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">1099-K Reporting:</h4>
                  <p>
                    Sellers who exceed <strong>$20,000 in gross revenue AND 200+ transactions</strong> in a calendar year require 1099-K reporting to the IRS.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The system automatically tracks these thresholds in the tax_form_1099k table.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="disclosure">
              <AccordionTrigger>Public Disclosure Requirements</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">$20,000 Threshold:</h4>
                  <p>
                    Under the INFORM Consumers Act, sellers who exceed $20,000 in annual sales must provide public business contact information.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Required Public Information:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Business name (or seller's name if operating as individual)</li>
                    <li>Business address (can be P.O. Box or commercial address)</li>
                    <li>Business phone number</li>
                    <li>Business email address</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Admin Review:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Verify contact information appears legitimate</li>
                    <li>Ensure information is current and accurate</li>
                    <li>Confirm information is displayed on seller's public profile</li>
                    <li>Monitor for changes and updates</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="performance">
              <AccordionTrigger>Performance Standards Monitoring</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Minimum Standards:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Response Time:</strong> Under 24 hours average</li>
                    <li><strong>Average Rating:</strong> 4.0 stars or higher</li>
                    <li><strong>On-Time Shipment:</strong> 90% or higher</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Warning Process:</h4>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>System automatically flags sellers below standards</li>
                    <li>Seller receives notification and 7-day deadline to submit improvement plan</li>
                    <li>Admin reviews improvement plan (PerformanceMetrics component)</li>
                    <li>Seller has 30 days to improve metrics</li>
                    <li>Continued non-compliance may result in account restrictions</li>
                  </ol>
                </div>

                <Alert>
                  <AlertDescription>
                    Use the PerformanceMetrics and ImprovementPlan components to monitor and manage seller performance.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notifications">
              <AccordionTrigger>Automated Compliance Notifications</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Automatic Notification System:</h4>
                  <p>
                    The platform automatically sends compliance notifications based on seller revenue and activity. The send_compliance_notifications edge function runs daily.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Types of Notifications:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>W-9 Required:</strong> When seller reaches $600 annual revenue</li>
                    <li><strong>Identity Verification Required:</strong> When seller reaches $5,000 (10-day deadline)</li>
                    <li><strong>Verification Deadline Reminder:</strong> 3 days before deadline</li>
                    <li><strong>Public Disclosure Required:</strong> When seller reaches $20,000</li>
                    <li><strong>Performance Warnings:</strong> When standards fall below minimum</li>
                    <li><strong>Verification Approved/Rejected:</strong> After admin review</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Manual Notifications:</h4>
                  <p>
                    Use the BulkNotifications component to send targeted messages to specific seller groups (all sellers, verified only, pending verification).
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="audit">
              <AccordionTrigger>Audit Logging & Reporting</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Automatic Audit Trail:</h4>
                  <p>
                    All compliance actions are automatically logged in the compliance_audit_log table with complete details.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">What is Logged:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Verification approvals/rejections with admin notes</li>
                    <li>W-9 form submissions</li>
                    <li>Public disclosure submissions and status changes</li>
                    <li>All admin actions with actor ID and timestamp</li>
                    <li>System-generated compliance triggers</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Using the Audit Log:</h4>
                  <p>
                    The AuditLogViewer component provides searchable, filterable access to all compliance actions. Use it to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Review admin decisions and verify proper procedures</li>
                    <li>Investigate seller compliance history</li>
                    <li>Generate reports for legal/regulatory review</li>
                    <li>Track system automation and notification delivery</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tools">
              <AccordionTrigger>Admin Compliance Tools</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Available Components:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>ComplianceReporting:</strong> Real-time dashboard with statistics, filterable reports, and CSV export
                    </li>
                    <li>
                      <strong>ComplianceVerification:</strong> Review and approve/reject identity verifications with deadline tracking
                    </li>
                    <li>
                      <strong>BulkNotifications:</strong> Send targeted messages to seller groups
                    </li>
                    <li>
                      <strong>AuditLogViewer:</strong> Search and filter all compliance actions
                    </li>
                    <li>
                      <strong>PerformanceMetrics:</strong> Monitor seller performance standards
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Best Practices:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Review verification submissions daily to meet 10-day deadline</li>
                    <li>Check ComplianceReporting weekly for high-risk accounts</li>
                    <li>Monitor audit log regularly for unusual activity</li>
                    <li>Respond to performance warnings within 7 days</li>
                    <li>Keep detailed admin notes for all decisions</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security">
              <AccordionTrigger>Data Security & Privacy</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Sensitive Data Protection:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>All tax and identity information is encrypted in the database</li>
                    <li>Row-Level Security (RLS) policies restrict access to authorized users only</li>
                    <li>Admin access is logged in the audit trail</li>
                    <li>SSN information stored as last 4 digits only</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Admin Access Control:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Only users with admin role can access compliance tools</li>
                    <li>All admin actions are logged with user ID and timestamp</li>
                    <li>Sellers can only view their own compliance data</li>
                  </ul>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Never share or export sensitive seller information outside of the platform. All compliance data must remain secure and confidential.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
