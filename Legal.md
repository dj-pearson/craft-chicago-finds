Craft Local Legal Implementation Timeline & Checklist
PHASE 1: CRITICAL COMPLIANCE (Weeks 1-2)
Week 1: Immediate Priorities
INFORM Consumers Act Setup

Create database schema to track seller transactions and revenue
Set up automatic alerts at 180 transactions OR $4,500 revenue (30-day warning)
Set up triggers at 200 transactions OR $5,000 revenue (verification required)
Choose identity verification provider (Recommended: Stripe Identity - $1.50/verification)
Integrate Stripe Identity API for government ID verification
Set up phone verification system (Twilio Verify - $0.05/verification)
Set up email verification system
Create 10-day countdown system for non-compliant sellers
Build automatic suspension mechanism for non-responders
Create annual recertification reminder system (11 months after initial verification)
Build public disclosure page for $20k+ sellers (name, address, contact)
Add "Report Suspicious Activity" button to all listings

Payment Processing

Complete Stripe Connect Express integration
Configure payment hold/release timing
Set up platform fee deduction system
Configure chargeback handling workflow
Test payment flow end-to-end
Confirm PCI DSS SAQ A eligibility (tokenized payments only)

DMCA Protection

Register DMCA agent at copyright.gov ($6 fee)
Create /dmca page with agent contact information
Add DMCA link to website footer
Build DMCA takedown notice workflow
Create database table for tracking takedown notices
Set up 48-hour response deadline system

PHASE 2: LEGAL DOCUMENTS (Weeks 2-4)
Week 2: Terms of Service
Draft Complete Terms of Service

Section 1: Platform Role & Intermediary Status
Section 2: Independent Contractor Relationship
Section 3: Disclaimer of Warranties (ALL CAPS)
Section 4: Limitation of Liability (damage caps)
Section 5: Seller Obligations (performance standards, food safety)
Section 6: Buyer Obligations
Section 7: Prohibited Items & Conduct
Section 8: Payment Terms (fees, taxes, chargebacks)
Section 9: Shipping & Delivery (FTC Mail Order Rule compliance)
Section 10: Returns & Refunds
Section 11: User-to-User Dispute Resolution
Section 12: Disputes with Craft Local (arbitration, class action waiver)
Section 13: Account Termination
Section 14: Intellectual Property
Section 15: User Verification & Privacy
Section 16: User Indemnification
Section 17: Third-Party Services
Section 18: Modifications to Terms
Section 19: General Provisions (governing law, jurisdiction)
Section 20: Contact Information

Publish Terms

Add Terms to website at /terms
Link in footer (prominently)
Add to account creation flow (checkbox required)
Add to seller onboarding flow

Week 3: Privacy Policy
Draft Complete Privacy Policy

Section 1: Information We Collect
Section 2: How We Use Your Information
Section 3: How We Share Your Information
Section 4: Seller Privacy Practices (disclaimer)
Section 5: Your Privacy Rights (CCPA/state privacy laws)
Section 6: Data Security
Section 7: Data Retention
Section 8: Children's Privacy (under 18 prohibited)
Section 9: International Data Transfers
Section 10: Cookies and Tracking
Section 11: Third-Party Links
Section 12: Changes to Privacy Policy
Section 13: Contact Information

Publish Privacy Policy

Add Privacy Policy to website at /privacy
Link in footer (prominently)
Add "Do Not Sell or Share My Personal Information" link (California)
Add to account creation flow (checkbox required)
Set up privacy@craftlocal.net email

Week 4: Additional Policies
Supporting Documents

Create Prohibited Items Policy page
Create Food Safety Guidelines for sellers
Create Seller Performance Standards page
Create Dispute Resolution Guide
Create Safety Guidelines (meeting for pickup)
Create Fee Schedule page
Create Cookie Policy
Review all documents with attorney (CRITICAL - budget $1,500-3,000)

PHASE 3: SALES TAX & TAX REPORTING (Weeks 3-5)
Week 3: Tax Tracking Foundation
Sales Tax Database

Create state nexus tracking table
Create transaction tax details table
Build daily nexus monitoring script (checks $100k or 200 transactions)
Set up alerts when approaching nexus (80% of threshold)
Choose tax calculation API (Avalara $75/mo or TaxJar $19/mo)
Integrate tax calculation at checkout

State Registration Preparation

Identify current sales by state
Determine which states already have nexus
Gather business documents (EIN, LLC docs, address, owner ID)
Create state-by-state registration checklist

Week 4: Priority State Registration
Register in Priority States (in order)

Your home state (where LLC registered)
California (if nexus exists or imminent)
Texas (if nexus exists or imminent)
Florida (if nexus exists or imminent)
New York (if nexus exists or imminent)

For Each State:

Complete online registration
Pay registration fee ($0-50 typically)
Record seller's permit number
Note filing frequency (monthly/quarterly/annual)
Set up online filing account
Add to state_nexus_tracking database
Configure tax API for this state
Set calendar reminders for filing deadlines

Week 5: 1099-K System Setup
W-9 Collection System

Create W-9 data database table (encrypt TINs)
Create seller annual totals tracking table
Build secure W-9 form page
Integrate TIN verification (Stripe handles this automatically)
Set up backup withholding system (24% if no TIN)
Create W-9 reminder emails
Set up 7-day countdown for W-9 submission

1099-K Generation System

Choose 1099-K service (Tax1099.com $2.99/form or TaxBandits $2.50/form)
Build annual tracking query ($20k AND 200 transactions)
Create 1099-K generation script (runs in January)
Set up seller notification email template
Configure IRS electronic filing
Create Form 1096 generation (transmittal form)
Set calendar reminders:

January 15: Generate 1099-K forms
January 31: Deadline to send to sellers
March 31: Deadline for IRS electronic filing

PHASE 4: WEBSITE IMPLEMENTATION (Weeks 4-6)
Week 4: Footer & Global Elements
Website Footer

Add "Terms of Service" link
Add "Privacy Policy" link
Add "DMCA Policy" link
Add "Prohibited Items" link
Add "Do Not Sell or Share My Personal Information" link
Add copyright notice
Add intermediary disclaimer ("We are a marketplace, not the seller")

Account Creation Flow

Add age verification checkbox (18+)
Add Terms & Privacy acceptance checkbox (required)
Link to full documents (open in new tab)
Add optional marketing opt-in
Display intermediary notice

Week 5: Seller Onboarding
Multi-Step Seller Setup

Step 1: Shop Information (name, description, logo)
Step 2: Stripe Connect onboarding (link to Stripe)
Step 3: W-9 Form (collect tax info)
Step 4: Shop Policies (processing time, returns, shipping)
Step 5: Seller Agreement Review

Display seller responsibilities
Display performance standards
Display fee schedule
Display independent contractor notice
Display tax responsibility notice
Require 3 checkboxes to confirm understanding

Seller Dashboard

Transaction history with running totals
Performance metrics display
Verification status indicator
Annual recertification reminders
Fee breakdown per transaction
Payout schedule and history

Week 6: Product Listings & Checkout
Product Listing Pages

Display seller name prominently
Display seller location (city, state)
For $20k+ sellers: Display full verified information
Add "Report Suspicious Activity" button
Display seller's return/refund policy
Display seller's shop policies link
Add platform disclaimer at bottom

Checkout Flow

Show seller name in order summary
Display price breakdown (item, shipping, tax, total)
Integrate Stripe Elements for payment
Add "Payment processed by Stripe" notice
Add intermediary disclaimer before "Place Order"
Display seller's shop policies link

Order Confirmation Email

Order details
Seller contact information (prominently)
Shipping/pickup information
Estimated delivery timeframe
Link to seller's shop policies
Contact seller instructions
Dispute process link
Platform disclaimer (this is from seller, not Craft Local)

PHASE 5: OPERATIONAL PROCEDURES (Weeks 6-8)
Week 6: Content Moderation
Automated Moderation

Create prohibited keywords list
Build automatic flagging system
Create food item special requirements check
Build allergen info requirement for food
Set up auto-reject for high-severity violations
Create manual review queue

Manual Review Process

Build admin review interface
Create review queue dashboard
Build listing approval/rejection workflow
Create seller notification templates
Set up 24-hour response time goal

DMCA Takedown Procedure

Create takedown request form
Build 48-hour response workflow
Create seller notification template
Build counter-notice process
Set up 10-14 day restoration timeline
Create documentation system (keep 3+ years)

Week 7: Dispute Resolution
Dispute Submission

Create dispute form for buyers
Build evidence upload system (photos, messages)
Validate 30-day timeframe requirement
Build case tracking system
Create automatic notifications to both parties
Set 5-business-day deadline for seller response

Admin Resolution Interface

Build dispute review dashboard
Create evidence review system
Build resolution decision workflow
Integrate refund processing (Stripe)
Build seller debit/chargeback system
Create resolution notification templates

Performance Monitoring

Build automated performance tracking
Set up weekly metrics calculations
Create warning notification system (approaching thresholds)
Build account restriction workflow
Create improvement plan requirement system

Week 8: Testing & Documentation
End-to-End Testing

Test buyer account creation
Test seller onboarding (full flow)
Test product listing creation
Test purchase flow (ship and pickup)
Test verification trigger (simulate threshold)
Test dispute submission and resolution
Test DMCA takedown process
Test 1099-K generation (with test data)

Documentation

Document all operational procedures
Create customer support playbook
Create seller resource center
Document all automated systems
Create emergency procedures guide
Document all third-party integrations

Training & Launch Prep

Train customer support on procedures
Create internal FAQ for support team
Set up support ticketing system
Create escalation procedures
Plan soft launch with test users
Prepare for full launch

PHASE 6: ONGOING COMPLIANCE (Continuous)
Monthly Tasks
First Week of Month

Review prior month's sales by state
Check for new nexus establishment
File due sales tax returns (for monthly filing states)
Review seller verification status
Follow up on pending verifications (10-day deadline enforcement)
Review dispute resolution metrics
Check chargeback rates

Mid-Month

Review flagged listings queue
Process any DMCA takedown notices
Review seller performance metrics
Send warnings to sellers approaching performance thresholds

End of Month

Generate monthly performance reports
Review and update prohibited keywords
Check for any new legal/regulatory requirements

Quarterly Tasks (Due within 15 days of quarter end)
Sales Tax Compliance

File all quarterly sales tax returns
Reconcile collected vs. remitted tax
Review sales in all states for new nexus
Register in new states if thresholds met
Update tax rates in calculation system
Review and resolve any state notices

Seller Verification (INFORM Act)

Identify sellers approaching thresholds
Send verification requests to newly qualifying sellers
Suspend non-compliant sellers (10-day deadline passed)
Update public disclosures for new $20k+ sellers
Review verification data security measures

Performance & Content Review

Review platform-wide seller metrics
Send improvement notices to poor performers
Restrict or suspend consistently poor performers
Review dispute resolution times and outcomes
Analyze chargeback patterns
Update prohibited items policy if needed

Legal Document Review

Review Terms of Service for needed updates
Review Privacy Policy for new data practices
Check for changes in applicable laws
Update fee schedules if changed
Review all disclaimer language

Annual Tasks
January (Tax Season)

Generate 1099-K forms for qualifying sellers ($20k AND 200 transactions)
Send 1099-K to sellers (by January 31)
File 1099-K with IRS electronically (by March 31)
Generate Form 1096 (transmittal)
Document all tax filings

February

Complete PCI DSS Self-Assessment Questionnaire (SAQ A)
Review payment processor compliance
File prior year's backup withholding (Form 945) if applicable

March

File any paper 1099-K forms with IRS (by February 28)
File electronic 1099-K with IRS (by March 31)

Mid-Year (June/July)

Comprehensive website accessibility audit (WCAG 2.1 Level AA)
Legal document review by attorney
Insurance policy evaluation (E&O, cyber liability)
Review seller classification (independent contractor status)
DMCA agent registration renewal check (every 3 years)

Q4 (October-December)

Prepare for upcoming tax season
Review and update all tax forms and processes
Send year-end reminder to sellers about tax obligations
Review all vendor contracts
Plan for any fee or policy changes (30-day notice required)

ESTIMATED COSTS
One-Time Setup Costs

Legal document review: $1,500-3,000
DMCA agent registration: $6
Developer time: (Internal resource)

Monthly Recurring Costs

Stripe Connect: Free (payment processing 2.9% + $0.30 per transaction)
Stripe Identity: $1.50 per verification (only high-volume sellers)
Phone verification (Twilio): $0.05 per verification
Tax calculation API: $19-75/month (TaxJar or Avalara)
1099-K service: $2.50-2.99 per form (annual, typically January only)
Attorney on retainer (optional): $500-1,000/month

Variable Costs by Volume

State sales tax registrations: $0-50 per state (one-time)
Sales tax filing: Free (DIY) or $50-200/state/year (service)
1099-K generation: $2.50-2.99 × number of qualifying sellers

CRITICAL DEADLINES TO REMEMBER
INFORM Act:

10 days after seller qualifies → Verification must be completed or account suspended

Sales Tax:

Varies by state (monthly/quarterly/annual) → Set up in calendar when you register

1099-K:

January 31 → Send to sellers
February 28 → Paper filing with IRS
March 31 → Electronic filing with IRS (recommended)

DMCA:

48 hours → Respond to takedown notice
10-14 business days → Wait period before restoring after counter-notice

FTC Mail Order Rule:

30 days → Sellers must ship within stated time or 30 days if not stated
Before ship date → Must notify buyer of delays

SUCCESS METRICS
Track these to ensure compliance:

Verification completion rate (should be 100% for qualifying sellers)
Sales tax filing on-time rate (should be 100%)
DMCA response time (should average < 24 hours)
Dispute resolution time (goal: < 7 days for most cases)
Seller performance standards (% meeting thresholds)
Chargeback rate (goal: < 1%)
1099-K issuance rate (should be 100% for qualifying sellers)
