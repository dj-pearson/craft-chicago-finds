import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";
import { AccessibilityFeedbackForm } from "@/components/accessibility/AccessibilityFeedbackForm";
import {
  Eye,
  Keyboard,
  MousePointer,
  Volume2,
  Monitor,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Settings,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";

const Accessibility = () => {
  const seoConfig = {
    title: "Accessibility Statement | Craft Chicago Finds - ADA Compliance",
    description: "Learn about Craft Chicago Finds' commitment to digital accessibility and ADA compliance. Our marketplace is designed to be accessible to all users, including those with disabilities.",
    keywords: [
      "accessibility statement",
      "ADA compliance",
      "WCAG 2.1",
      "accessible marketplace",
      "disability access",
      "screen reader support",
      "keyboard navigation"
    ],
    canonical: `${window.location.origin}/accessibility`,
    openGraph: {
      title: "Accessibility Statement | Craft Chicago Finds",
      description: "Our commitment to digital accessibility and ADA compliance.",
      type: "website",
      url: `${window.location.origin}/accessibility`
    }
  };

  const accessibilityFeatures = [
    {
      icon: Keyboard,
      title: "Full Keyboard Navigation",
      description: "Navigate the entire site using only a keyboard. Tab through interactive elements, use arrow keys in menus, and press Enter or Space to activate buttons."
    },
    {
      icon: Volume2,
      title: "Screen Reader Compatible",
      description: "Optimized for NVDA, JAWS, VoiceOver, and TalkBack. All images have descriptive alt text, and interactive elements are properly labeled."
    },
    {
      icon: Eye,
      title: "Visual Adjustments",
      description: "High contrast mode, large text options, and reduced motion settings. Respects your system preferences for color scheme and animation."
    },
    {
      icon: MousePointer,
      title: "Focus Indicators",
      description: "Clear, visible focus indicators on all interactive elements. Never lose track of where you are on the page."
    },
    {
      icon: Monitor,
      title: "Responsive Design",
      description: "Works on all devices and screen sizes. Zoom up to 200% without loss of functionality. Supports both portrait and landscape orientations."
    },
    {
      icon: Settings,
      title: "Customizable Experience",
      description: "Use our Accessibility Panel to customize your experience. Adjust text size, contrast, motion, and more to suit your needs."
    }
  ];

  // Complete WCAG 2.1 AA Success Criteria
  const wcagCriteria = [
    // Perceivable - Level A
    { criterion: "1.1.1", name: "Non-text Content", level: "A", status: "compliant", description: "All non-text content has text alternatives" },
    { criterion: "1.2.1", name: "Audio-only and Video-only (Prerecorded)", level: "A", status: "compliant", description: "Alternatives provided for time-based media" },
    { criterion: "1.2.2", name: "Captions (Prerecorded)", level: "A", status: "compliant", description: "Captions provided for prerecorded audio content" },
    { criterion: "1.2.3", name: "Audio Description or Media Alternative", level: "A", status: "compliant", description: "Alternative or audio description provided" },
    { criterion: "1.3.1", name: "Info and Relationships", level: "A", status: "compliant", description: "Information and relationships conveyed through presentation are programmatically determined" },
    { criterion: "1.3.2", name: "Meaningful Sequence", level: "A", status: "compliant", description: "Content reading sequence is programmatically determined" },
    { criterion: "1.3.3", name: "Sensory Characteristics", level: "A", status: "compliant", description: "Instructions do not rely solely on sensory characteristics" },
    { criterion: "1.4.1", name: "Use of Color", level: "A", status: "compliant", description: "Color is not used as the only visual means of conveying information" },
    { criterion: "1.4.2", name: "Audio Control", level: "A", status: "compliant", description: "Audio playing automatically can be paused or stopped" },
    // Perceivable - Level AA
    { criterion: "1.2.4", name: "Captions (Live)", level: "AA", status: "compliant", description: "Captions provided for live audio content" },
    { criterion: "1.2.5", name: "Audio Description (Prerecorded)", level: "AA", status: "compliant", description: "Audio description provided for video content" },
    { criterion: "1.3.4", name: "Orientation", level: "AA", status: "compliant", description: "Content does not restrict view to single display orientation" },
    { criterion: "1.3.5", name: "Identify Input Purpose", level: "AA", status: "compliant", description: "Input field purpose can be programmatically determined" },
    { criterion: "1.4.3", name: "Contrast (Minimum)", level: "AA", status: "compliant", description: "Text has contrast ratio of at least 4.5:1" },
    { criterion: "1.4.4", name: "Resize Text", level: "AA", status: "compliant", description: "Text can be resized to 200% without loss of functionality" },
    { criterion: "1.4.5", name: "Images of Text", level: "AA", status: "compliant", description: "Text is used to convey information rather than images of text" },
    { criterion: "1.4.10", name: "Reflow", level: "AA", status: "compliant", description: "Content reflows without horizontal scrolling at 320px width" },
    { criterion: "1.4.11", name: "Non-text Contrast", level: "AA", status: "compliant", description: "UI components and graphics have 3:1 contrast ratio" },
    { criterion: "1.4.12", name: "Text Spacing", level: "AA", status: "compliant", description: "No loss of content when text spacing is adjusted" },
    { criterion: "1.4.13", name: "Content on Hover or Focus", level: "AA", status: "compliant", description: "Additional content on hover/focus is dismissible and persistent" },
    // Operable - Level A
    { criterion: "2.1.1", name: "Keyboard", level: "A", status: "compliant", description: "All functionality is available from keyboard" },
    { criterion: "2.1.2", name: "No Keyboard Trap", level: "A", status: "compliant", description: "Keyboard focus is never trapped" },
    { criterion: "2.1.4", name: "Character Key Shortcuts", level: "A", status: "compliant", description: "Single-key shortcuts can be turned off or remapped" },
    { criterion: "2.2.1", name: "Timing Adjustable", level: "A", status: "compliant", description: "Time limits can be adjusted, extended, or turned off" },
    { criterion: "2.2.2", name: "Pause, Stop, Hide", level: "A", status: "compliant", description: "Moving or auto-updating content can be paused" },
    { criterion: "2.3.1", name: "Three Flashes or Below Threshold", level: "A", status: "compliant", description: "Content does not flash more than three times per second" },
    { criterion: "2.4.1", name: "Bypass Blocks", level: "A", status: "compliant", description: "Skip links allow bypassing repeated content" },
    { criterion: "2.4.2", name: "Page Titled", level: "A", status: "compliant", description: "Pages have descriptive titles" },
    { criterion: "2.4.3", name: "Focus Order", level: "A", status: "compliant", description: "Components receive focus in a logical order" },
    { criterion: "2.4.4", name: "Link Purpose (In Context)", level: "A", status: "compliant", description: "Link purpose can be determined from link text or context" },
    // Operable - Level AA
    { criterion: "2.4.5", name: "Multiple Ways", level: "AA", status: "compliant", description: "Multiple ways to locate pages (search, sitemap, navigation)" },
    { criterion: "2.4.6", name: "Headings and Labels", level: "AA", status: "compliant", description: "Headings and labels describe topic or purpose" },
    { criterion: "2.4.7", name: "Focus Visible", level: "AA", status: "compliant", description: "Keyboard focus indicator is visible" },
    { criterion: "2.5.1", name: "Pointer Gestures", level: "A", status: "compliant", description: "Multi-point gestures have single-pointer alternatives" },
    { criterion: "2.5.2", name: "Pointer Cancellation", level: "A", status: "compliant", description: "Actions use up-event or can be aborted/undone" },
    { criterion: "2.5.3", name: "Label in Name", level: "A", status: "compliant", description: "Visible label is part of accessible name" },
    { criterion: "2.5.4", name: "Motion Actuation", level: "A", status: "compliant", description: "Motion-triggered functions have alternatives" },
    // Understandable - Level A
    { criterion: "3.1.1", name: "Language of Page", level: "A", status: "compliant", description: "Default language is programmatically determined" },
    { criterion: "3.2.1", name: "On Focus", level: "A", status: "compliant", description: "Focus does not trigger unexpected context changes" },
    { criterion: "3.2.2", name: "On Input", level: "A", status: "compliant", description: "Input does not trigger unexpected context changes" },
    { criterion: "3.3.1", name: "Error Identification", level: "A", status: "compliant", description: "Input errors are identified and described" },
    { criterion: "3.3.2", name: "Labels or Instructions", level: "A", status: "compliant", description: "Labels and instructions are provided for user input" },
    // Understandable - Level AA
    { criterion: "3.1.2", name: "Language of Parts", level: "AA", status: "compliant", description: "Language changes within content are identified" },
    { criterion: "3.2.3", name: "Consistent Navigation", level: "AA", status: "compliant", description: "Navigation is consistent across pages" },
    { criterion: "3.2.4", name: "Consistent Identification", level: "AA", status: "compliant", description: "Components with same functionality are identified consistently" },
    { criterion: "3.3.3", name: "Error Suggestion", level: "AA", status: "compliant", description: "Suggestions provided for correcting input errors" },
    { criterion: "3.3.4", name: "Error Prevention (Legal, Financial, Data)", level: "AA", status: "compliant", description: "Submissions are reversible, checked, or confirmed" },
    // Robust - Level A
    { criterion: "4.1.1", name: "Parsing", level: "A", status: "compliant", description: "No duplicate IDs, proper nesting of elements" },
    { criterion: "4.1.2", name: "Name, Role, Value", level: "A", status: "compliant", description: "UI components have accessible names and roles" },
    // Robust - Level AA
    { criterion: "4.1.3", name: "Status Messages", level: "AA", status: "compliant", description: "Status messages are announced by assistive technology" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead config={seoConfig} />
      <Header />

      <main id="main-content" role="main" className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Accessibility Statement</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Craft Chicago Finds is committed to ensuring digital accessibility for people with disabilities.
            We continually improve the user experience for everyone and apply the relevant accessibility standards.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">WCAG 2.1 AA</Badge>
            <Badge variant="secondary">ADA Compliant</Badge>
            <Badge variant="secondary">Section 508</Badge>
          </div>
        </div>

        {/* Quick Access to Accessibility Settings */}
        <Alert className="mb-8 bg-primary/5 border-primary/20">
          <Settings className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Customize your experience:</strong> Open the Accessibility Panel to adjust visual settings,
              enable high contrast mode, increase text size, or reduce motion.
            </span>
            <AccessibilityPanel />
          </AlertDescription>
        </Alert>

        {/* Our Commitment */}
        <section className="mb-12" aria-labelledby="commitment-heading">
          <h2 id="commitment-heading" className="text-2xl font-bold mb-4">Our Commitment</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                At Craft Chicago Finds, we believe that everyone should have equal access to our marketplace,
                regardless of ability or disability. We have invested significant resources to help ensure that
                our website is made easier to use and more accessible for people with disabilities.
              </p>
              <p className="mb-4">
                We strive to conform to level AA of the World Wide Web Consortium (W3C) Web Content
                Accessibility Guidelines 2.1 (WCAG 2.1). These guidelines explain how to make web content
                more accessible for people with disabilities, and user-friendly for everyone.
              </p>
              <p>
                Our accessibility efforts are ongoing. If you experience any difficulty in accessing any part
                of our website, please contact us, and we will work with you to provide the information or
                service you seek through an alternative communication method that is accessible for you.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Accessibility Features */}
        <section className="mb-12" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-2xl font-bold mb-4">Accessibility Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibilityFeatures.map((feature, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <feature.icon className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="mb-12" aria-labelledby="keyboard-heading">
          <h2 id="keyboard-heading" className="text-2xl font-bold mb-4">Keyboard Navigation</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">You can navigate our website using only a keyboard:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table" aria-label="Keyboard shortcuts">
                  <thead>
                    <tr className="border-b">
                      <th scope="col" className="text-left py-2 px-4 font-semibold">Key</th>
                      <th scope="col" className="text-left py-2 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-4"><kbd className="px-2 py-1 bg-muted rounded">Tab</kbd></td>
                      <td className="py-2 px-4">Move to the next interactive element</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4"><kbd className="px-2 py-1 bg-muted rounded">Shift + Tab</kbd></td>
                      <td className="py-2 px-4">Move to the previous interactive element</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4"><kbd className="px-2 py-1 bg-muted rounded">Enter</kbd></td>
                      <td className="py-2 px-4">Activate links, buttons, and form controls</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4"><kbd className="px-2 py-1 bg-muted rounded">Space</kbd></td>
                      <td className="py-2 px-4">Activate buttons, checkboxes, and expand dropdowns</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4"><kbd className="px-2 py-1 bg-muted rounded">Escape</kbd></td>
                      <td className="py-2 px-4">Close dialogs, menus, and popups</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4"><kbd className="px-2 py-1 bg-muted rounded">Arrow Keys</kbd></td>
                      <td className="py-2 px-4">Navigate within menus, tabs, and carousels</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4"><kbd className="px-2 py-1 bg-muted rounded">Home / End</kbd></td>
                      <td className="py-2 px-4">Jump to first or last item in a list</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* WCAG Compliance Status */}
        <section className="mb-12" aria-labelledby="wcag-heading">
          <h2 id="wcag-heading" className="text-2xl font-bold mb-4">WCAG 2.1 Compliance Status</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                The following table outlines our conformance with WCAG 2.1 Level AA success criteria.
                We conduct regular accessibility audits and continuously work to address any issues.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table" aria-label="WCAG 2.1 AA compliance status">
                  <caption className="sr-only">
                    Complete list of WCAG 2.1 Level A and AA success criteria with compliance status
                  </caption>
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th scope="col" className="text-left py-3 px-4 font-semibold">Criterion</th>
                      <th scope="col" className="text-left py-3 px-4 font-semibold">Name</th>
                      <th scope="col" className="text-left py-3 px-4 font-semibold hidden md:table-cell">Description</th>
                      <th scope="col" className="text-left py-3 px-4 font-semibold">Level</th>
                      <th scope="col" className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wcagCriteria.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-4 font-mono text-xs">{item.criterion}</td>
                        <td className="py-2 px-4 font-medium">{item.name}</td>
                        <td className="py-2 px-4 text-muted-foreground hidden md:table-cell">{item.description}</td>
                        <td className="py-2 px-4">
                          <Badge variant={item.level === "AA" ? "default" : "secondary"}>
                            {item.level}
                          </Badge>
                        </td>
                        <td className="py-2 px-4">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden sm:inline">Compliant</span>
                            <span className="sr-only sm:hidden">Compliant</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Conformance Statement */}
        <section className="mb-12" aria-labelledby="conformance-heading">
          <h2 id="conformance-heading" className="text-2xl font-bold mb-4">Conformance Statement</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Standard</h3>
                  <p className="text-muted-foreground">
                    Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Conformance Level</h3>
                  <p className="text-muted-foreground">
                    Full conformance to WCAG 2.1 Level AA criteria
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Evaluation Method</h3>
                  <p className="text-muted-foreground">
                    Automated testing with axe-core, manual testing with assistive technologies, and regular accessibility audits
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Additional Standards</h3>
                  <ul className="text-muted-foreground space-y-1">
                    <li>ADA Title III (Americans with Disabilities Act)</li>
                    <li>Section 508 of the Rehabilitation Act</li>
                    <li>EN 301 549 (European accessibility standard)</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">Accessibility Conformance Report (ACR)</h3>
                <p className="text-sm text-muted-foreground">
                  Our Voluntary Product Accessibility Template (VPAT) documentation is available upon request.
                  Please contact <a href="mailto:accessibility@craftlocal.net" className="text-primary hover:underline">accessibility@craftlocal.net</a> for
                  a copy of our full accessibility conformance report.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Known Limitations */}
        <section className="mb-12" aria-labelledby="limitations-heading">
          <h2 id="limitations-heading" className="text-2xl font-bold mb-4">Known Limitations</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                While we strive for full accessibility, some areas may have limitations:
              </p>
              <ul className="space-y-3" role="list">
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <strong>User-Generated Content:</strong> Product images uploaded by sellers may not always
                    include optimal alt text. We provide guidance to sellers on accessibility best practices.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <strong>Third-Party Content:</strong> Some embedded content from third parties (such as
                    payment processors or maps) may have their own accessibility limitations.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <strong>Legacy Content:</strong> Some older blog posts or pages may not meet all current
                    accessibility standards. We are actively updating these pages.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <strong>PDF Documents:</strong> Some downloadable documents may not be fully accessible.
                    Please contact us for alternative formats.
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Browser and Assistive Technology Support */}
        <section className="mb-12" aria-labelledby="support-heading">
          <h2 id="support-heading" className="text-2xl font-bold mb-4">Supported Browsers and Assistive Technologies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" role="list">
                  <li>Chrome (latest 2 versions)</li>
                  <li>Firefox (latest 2 versions)</li>
                  <li>Safari (latest 2 versions)</li>
                  <li>Edge (latest 2 versions)</li>
                  <li>Safari on iOS (latest 2 versions)</li>
                  <li>Chrome on Android (latest 2 versions)</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assistive Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" role="list">
                  <li>NVDA (Windows)</li>
                  <li>JAWS (Windows)</li>
                  <li>VoiceOver (macOS, iOS)</li>
                  <li>TalkBack (Android)</li>
                  <li>Windows Narrator</li>
                  <li>Dragon NaturallySpeaking</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="text-2xl font-bold mb-4">Contact Us</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-6">
                We welcome your feedback on the accessibility of Craft Chicago Finds. Please let us know
                if you encounter accessibility barriers or have suggestions for improvement.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" aria-hidden="true" />
                  <div>
                    <strong className="block mb-1">Email</strong>
                    <a
                      href="mailto:accessibility@craftlocal.net"
                      className="text-primary hover:underline"
                    >
                      accessibility@craftlocal.net
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-1" aria-hidden="true" />
                  <div>
                    <strong className="block mb-1">Phone</strong>
                    <a
                      href="tel:+15551234567"
                      className="text-primary hover:underline"
                    >
                      (555) 123-4567
                    </a>
                    <p className="text-sm text-muted-foreground">Mon-Fri, 9am-5pm CST</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">When Reporting an Issue, Please Include:</h3>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>The web address (URL) of the page</li>
                  <li>Description of the accessibility issue</li>
                  <li>Browser and version you are using</li>
                  <li>Assistive technology you are using (if any)</li>
                  <li>Your contact information for follow-up</li>
                </ul>
              </div>

              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  We try to respond to accessibility feedback within 2 business days, and to resolve
                  issues within 10 business days. If we cannot resolve the issue immediately, we will
                  provide you with an alternative way to access the content or service.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Formal Complaint Process */}
        <section className="mb-12" aria-labelledby="complaint-heading">
          <h2 id="complaint-heading" className="text-2xl font-bold mb-4">Formal Complaint Process</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                If you are not satisfied with our response to your accessibility concern, you may file
                a formal complaint with the following agencies:
              </p>
              <ul className="space-y-3" role="list">
                <li className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                  <div>
                    <strong>U.S. Department of Justice:</strong>
                    <a
                      href="https://www.ada.gov/file-a-complaint/"
                      className="text-primary hover:underline ml-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      File an ADA Complaint
                      <ExternalLink className="h-3 w-3 inline ml-1" aria-hidden="true" />
                      <span className="sr-only">(opens in new window)</span>
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                  <div>
                    <strong>Illinois Attorney General:</strong>
                    <a
                      href="https://illinoisattorneygeneral.gov/consumers/filecomplaint.html"
                      className="text-primary hover:underline ml-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Consumer Complaint Form
                      <ExternalLink className="h-3 w-3 inline ml-1" aria-hidden="true" />
                      <span className="sr-only">(opens in new window)</span>
                    </a>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Testing and Evaluation */}
        <section className="mb-12" aria-labelledby="testing-heading">
          <h2 id="testing-heading" className="text-2xl font-bold mb-4">Testing and Evaluation</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                We employ a multi-layered approach to accessibility testing:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Automated Testing</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>axe-core integration in CI/CD pipeline</li>
                    <li>Playwright E2E accessibility tests</li>
                    <li>Lighthouse accessibility audits</li>
                    <li>Color contrast verification</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Manual Testing</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Keyboard-only navigation testing</li>
                    <li>Screen reader testing (NVDA, VoiceOver, JAWS)</li>
                    <li>High contrast mode verification</li>
                    <li>Zoom/magnification testing up to 200%</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">User Testing</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Feedback from users with disabilities</li>
                    <li>Accessibility feedback form review</li>
                    <li>Regular user experience studies</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Audit Frequency</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Automated tests: Every code deployment</li>
                    <li>Manual review: Monthly</li>
                    <li>Full audit: Quarterly</li>
                    <li>Third-party audit: Annually</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Technical Specifications */}
        <section className="mb-12" aria-labelledby="technical-heading">
          <h2 id="technical-heading" className="text-2xl font-bold mb-4">Technical Specifications</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                Accessibility of Craft Chicago Finds relies on the following technologies to work
                with the particular combination of web browser and any assistive technologies or
                plugins installed on your computer:
              </p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                <li>HTML5 with semantic markup</li>
                <li>WAI-ARIA 1.2 (Web Accessibility Initiative - Accessible Rich Internet Applications)</li>
                <li>CSS3 with support for prefers-reduced-motion and prefers-contrast</li>
                <li>JavaScript (ECMAScript 2020+) with progressive enhancement</li>
                <li>React 18 with accessibility-first component architecture</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                These technologies are relied upon for conformance with the accessibility standards used.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Report an Issue */}
        <section className="mb-12" aria-labelledby="report-heading">
          <h2 id="report-heading" className="text-2xl font-bold mb-4">Report an Accessibility Issue</h2>
          <AccessibilityFeedbackForm />
        </section>

        {/* Statement Last Updated */}
        <section className="mb-8" aria-labelledby="update-heading">
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 id="update-heading" className="font-semibold mb-1">Statement Last Updated</h2>
                  <p className="text-muted-foreground">
                    This accessibility statement was last updated on <time dateTime="2026-01-21">January 21, 2026</time>.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/terms">
                    View Terms of Service
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Accessibility;
