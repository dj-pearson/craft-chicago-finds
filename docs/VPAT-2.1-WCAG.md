# Voluntary Product Accessibility Template (VPAT)

## WCAG 2.1 Edition

**Product Name:** Craft Chicago Finds
**Product Version:** 2.0
**Report Date:** January 21, 2026
**Contact:** accessibility@craftlocal.net
**Evaluation Method:** Testing with assistive technologies, automated testing tools, and manual review

---

## Applicable Standards/Guidelines

This report covers the degree of conformance for the following accessibility standard/guidelines:

| Standard/Guideline | Included In Report |
|---|---|
| Web Content Accessibility Guidelines 2.1 | Level A: Yes, Level AA: Yes, Level AAA: Partial |
| Revised Section 508 standards | Yes |
| EN 301 549 Accessibility requirements | Yes |

---

## Terms

The terms used in the Conformance Level information are defined as follows:

- **Supports**: The functionality of the product has at least one method that meets the criterion without known defects or meets with equivalent facilitation.
- **Partially Supports**: Some functionality of the product does not meet the criterion.
- **Does Not Support**: The majority of product functionality does not meet the criterion.
- **Not Applicable**: The criterion is not relevant to the product.
- **Not Evaluated**: The product has not been evaluated against the criterion.

---

## WCAG 2.1 Report

### Table 1: Success Criteria, Level A

| Criteria | Conformance Level | Remarks and Explanations |
|----------|-------------------|--------------------------|
| **1.1.1 Non-text Content** | Supports | All images have appropriate alt text. Decorative images use empty alt or aria-hidden. Product images uploaded by sellers include alt text guidance. |
| **1.2.1 Audio-only and Video-only (Prerecorded)** | Supports | Text alternatives provided for any prerecorded audio-only or video-only content. Platform does not currently host audio/video content directly. |
| **1.2.2 Captions (Prerecorded)** | Supports | Any prerecorded video content includes captions. |
| **1.2.3 Audio Description or Media Alternative (Prerecorded)** | Supports | Alternative descriptions available for video content. |
| **1.3.1 Info and Relationships** | Supports | Semantic HTML is used throughout. Form fields have proper labels. Tables have headers. ARIA landmarks define page structure. |
| **1.3.2 Meaningful Sequence** | Supports | Content reading sequence is logical and matches visual order. DOM order follows visual presentation. |
| **1.3.3 Sensory Characteristics** | Supports | Instructions do not rely solely on shape, size, visual location, or sound. Color is never the only indicator of meaning. |
| **1.4.1 Use of Color** | Supports | Color is never used as the only means of conveying information. Error states include icons and text in addition to color. |
| **1.4.2 Audio Control** | Supports | No auto-playing audio. Any audio that plays can be paused or stopped. |
| **2.1.1 Keyboard** | Supports | All functionality available via keyboard. Custom components support standard keyboard interactions. |
| **2.1.2 No Keyboard Trap** | Supports | Focus can always be moved away from components using standard keyboard navigation. Modal dialogs trap focus appropriately and release on close. |
| **2.1.4 Character Key Shortcuts** | Supports | No single-character keyboard shortcuts are used. All shortcuts require modifier keys. |
| **2.2.1 Timing Adjustable** | Supports | Session timeouts can be extended. Users are warned before timeout with option to extend. |
| **2.2.2 Pause, Stop, Hide** | Supports | Animated content respects prefers-reduced-motion. Loading indicators are static in reduced motion mode. |
| **2.3.1 Three Flashes or Below Threshold** | Supports | No content flashes more than three times per second. |
| **2.4.1 Bypass Blocks** | Supports | Skip links provided: "Skip to main content", "Skip to navigation", "Skip to footer". |
| **2.4.2 Page Titled** | Supports | All pages have unique, descriptive titles that describe their purpose. |
| **2.4.3 Focus Order** | Supports | Tab order follows logical reading sequence. Focus order matches visual layout. |
| **2.4.4 Link Purpose (In Context)** | Supports | Link text describes destination. Where needed, additional context provided via aria-label or surrounding text. |
| **2.5.1 Pointer Gestures** | Supports | No complex gestures required. All multi-touch actions have single-point alternatives. |
| **2.5.2 Pointer Cancellation** | Supports | Actions trigger on up-event. Click-and-drag can be cancelled by moving pointer away. |
| **2.5.3 Label in Name** | Supports | Accessible names include visible text labels. |
| **2.5.4 Motion Actuation** | Supports | No motion-triggered functionality. Device motion not used for any features. |
| **3.1.1 Language of Page** | Supports | HTML lang attribute set to "en" on all pages. |
| **3.2.1 On Focus** | Supports | Focus does not trigger context changes. No auto-submission or navigation on focus. |
| **3.2.2 On Input** | Supports | Input changes do not automatically trigger context changes. Form submission requires explicit action. |
| **3.3.1 Error Identification** | Supports | Form errors are clearly identified with descriptive messages. Errors announced to screen readers via ARIA live regions. |
| **3.3.2 Labels or Instructions** | Supports | All form fields have visible labels. Required fields marked with asterisk and "(required)" for screen readers. |
| **4.1.1 Parsing** | Supports | Valid HTML with no duplicate IDs. Elements properly nested. |
| **4.1.2 Name, Role, Value** | Supports | Custom components have appropriate ARIA roles, names, and values. State changes communicated to assistive technology. |

### Table 2: Success Criteria, Level AA

| Criteria | Conformance Level | Remarks and Explanations |
|----------|-------------------|--------------------------|
| **1.2.4 Captions (Live)** | Not Applicable | Platform does not include live audio content. |
| **1.2.5 Audio Description (Prerecorded)** | Supports | Audio descriptions provided for video content where applicable. |
| **1.3.4 Orientation** | Supports | Content displays in both portrait and landscape orientations. No orientation restriction. |
| **1.3.5 Identify Input Purpose** | Supports | Form inputs use appropriate autocomplete attributes. Input purposes programmatically determined. |
| **1.4.3 Contrast (Minimum)** | Supports | Text contrast ratio meets 4.5:1 minimum. High contrast mode available for enhanced visibility. |
| **1.4.4 Resize Text** | Supports | Text resizable to 200% without loss of functionality. Large text mode available in accessibility settings. |
| **1.4.5 Images of Text** | Supports | Real text used instead of images of text. Logo is the only exception. |
| **1.4.10 Reflow** | Supports | Content reflows without horizontal scrolling at 320px width. Responsive design ensures usability at all sizes. |
| **1.4.11 Non-text Contrast** | Supports | UI components and graphics have 3:1 contrast ratio. Focus indicators clearly visible. |
| **1.4.12 Text Spacing** | Supports | Content adapts to user-defined text spacing without loss of functionality. |
| **1.4.13 Content on Hover or Focus** | Supports | Hover/focus content is dismissible, hoverable, and persistent. Tooltips can be dismissed with Escape key. |
| **2.4.5 Multiple Ways** | Supports | Multiple navigation methods: main navigation, footer links, search, sitemap, breadcrumbs. |
| **2.4.6 Headings and Labels** | Supports | Headings describe content. Form labels describe input purpose. Heading hierarchy is logical. |
| **2.4.7 Focus Visible** | Supports | 3px visible focus indicator on all interactive elements. Enhanced focus mode available. |
| **3.1.2 Language of Parts** | Supports | Content is primarily in English. Any foreign language terms are marked appropriately. |
| **3.2.3 Consistent Navigation** | Supports | Navigation components appear in same location across pages. Consistent menu structure throughout. |
| **3.2.4 Consistent Identification** | Supports | Components with same functionality use consistent labels and icons throughout the site. |
| **3.3.3 Error Suggestion** | Supports | Error messages include suggestions for correction. Validation provides specific guidance. |
| **3.3.4 Error Prevention (Legal, Financial, Data)** | Supports | Checkout process includes review step. Order confirmation required. Data can be reviewed before submission. |
| **4.1.3 Status Messages** | Supports | Status messages announced via ARIA live regions. Loading states, errors, and success messages communicated to assistive technology. |

---

## Revised Section 508 Report

### Chapter 3: Functional Performance Criteria

| Criteria | Conformance Level | Remarks |
|----------|-------------------|---------|
| 302.1 Without Vision | Supports | All content accessible via screen reader. Images have alt text. |
| 302.2 With Limited Vision | Supports | High contrast mode, large text mode, supports 200% zoom. |
| 302.3 Without Perception of Color | Supports | Color never sole indicator of information. |
| 302.4 Without Hearing | Supports | No audio-only content. Captions provided for video. |
| 302.5 With Limited Hearing | Supports | Visual alternatives for all audio content. |
| 302.6 Without Speech | Supports | No voice-only inputs required. All actions performable via keyboard/mouse. |
| 302.7 With Limited Manipulation | Supports | Large click targets, keyboard accessible, no time-sensitive interactions. |
| 302.8 With Limited Reach and Strength | Supports | No simultaneous actions required. All controls accessible. |
| 302.9 With Limited Language, Cognitive, and Learning Abilities | Partially Supports | Clear language used. Complex features include help text. Some advanced features may require familiarity. |

### Chapter 5: Software

| Criteria | Conformance Level | Remarks |
|----------|-------------------|---------|
| 501.1 Scope | Supports | Web application follows WCAG 2.1 AA guidelines. |
| 502 Interoperability with Assistive Technology | Supports | Compatible with major screen readers (NVDA, JAWS, VoiceOver, TalkBack). |
| 503 Applications | Supports | User preferences respected. Accessibility settings persist. |
| 504 Authoring Tools | Not Applicable | Product is not an authoring tool. |

---

## EN 301 549 Report

### Chapter 9: Web

Craft Chicago Finds conforms to EN 301 549 Chapter 9 (Web) requirements, which align with WCAG 2.1 Level AA criteria as documented above.

### Chapter 10: Non-web Documents

Not Applicable - Product is a web application.

### Chapter 11: Software

See Section 508 Chapter 5 above for software-related accessibility criteria.

---

## Legal Disclaimer

This Voluntary Product Accessibility Template (VPAT) is provided for informational purposes and represents our assessment of product accessibility at the time of evaluation. Accessibility features may vary based on user configuration, assistive technology, and browser combination.

For questions about this accessibility conformance report or to request accommodations, please contact:

**Email:** accessibility@craftlocal.net
**Phone:** (555) 123-4567
**Response Time:** Within 2 business days

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | January 21, 2026 | Complete WCAG 2.1 AA audit and conformance update |
| 1.0 | January 12, 2026 | Initial VPAT documentation |
