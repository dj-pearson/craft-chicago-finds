# Accessibility Guide for Developers

This guide outlines accessibility patterns and best practices for the Craft Chicago Finds codebase. Following these patterns ensures WCAG 2.1 AA compliance.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Component Patterns](#component-patterns)
3. [Form Accessibility](#form-accessibility)
4. [Table Accessibility](#table-accessibility)
5. [Keyboard Navigation](#keyboard-navigation)
6. [Screen Reader Support](#screen-reader-support)
7. [Testing](#testing)
8. [Common Issues and Fixes](#common-issues-and-fixes)

---

## Core Principles

### 1. Semantic HTML First
Always use semantic HTML elements before reaching for ARIA attributes.

```tsx
// Good - semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

// Avoid - div with ARIA
<div role="navigation">
  <div role="list">
    <div role="listitem">...</div>
  </div>
</div>
```

### 2. Visible Focus States
All interactive elements must have visible focus indicators.

```tsx
// Focus styles are defined in src/styles/accessibility.css
// Use focus-visible for keyboard-only focus indicators
className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
```

### 3. Color Contrast
- Text: Minimum 4.5:1 ratio (AA)
- Large text (18pt+): Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio

Use the contrast utilities in `src/lib/accessibility.ts`:
```ts
import { getContrastRatio, meetsContrastRequirement } from '@/lib/accessibility';

const ratio = getContrastRatio('#000000', '#ffffff');
const passes = meetsContrastRequirement('#000000', '#ffffff', 'AA');
```

---

## Component Patterns

### Page Layout
Every page must include proper landmarks:

```tsx
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

function MyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" role="main" className="container mx-auto px-4">
        {/* Page content */}
      </main>
      <Footer />
    </div>
  );
}
```

### Interactive Cards
Cards that are clickable must be keyboard accessible:

```tsx
<Card
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  tabIndex={0}
  role="article"
  aria-label="Product name, $29.99"
  className="cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
>
  {/* Card content */}
</Card>
```

### Buttons with Icons
Always provide accessible labels for icon-only buttons:

```tsx
// Good - with aria-label
<Button
  variant="ghost"
  size="icon"
  onClick={toggleFavorite}
  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
>
  <Heart className={isFavorite ? 'fill-current' : ''} />
</Button>

// Good - with sr-only text
<Button onClick={search}>
  <Search className="h-4 w-4" />
  <span className="sr-only">Search</span>
</Button>
```

### Images
All images must have appropriate alt text:

```tsx
// Meaningful image - descriptive alt
<img
  src="/product.jpg"
  alt="Handmade ceramic vase with blue glaze, 8 inches tall"
/>

// Decorative image - empty alt
<img
  src="/decorative-border.png"
  alt=""
  aria-hidden="true"
/>

// Image with text content - full text in alt
<img
  src="/banner.jpg"
  alt="Summer Sale - 20% off all pottery"
/>
```

---

## Form Accessibility

### Using AccessibleField Component

```tsx
import { AccessibleForm, AccessibleField } from '@/components/accessibility';

function ContactForm() {
  return (
    <AccessibleForm onSubmit={handleSubmit} aria-label="Contact form">
      <AccessibleField
        name="email"
        label="Email Address"
        type="email"
        required
        description="We'll never share your email"
        error={errors.email}
      />

      <AccessibleField
        name="message"
        label="Your Message"
        type="textarea"
        required
        rows={5}
      />

      <Button type="submit">Send Message</Button>
    </AccessibleForm>
  );
}
```

### Form Validation
Use `FormErrorSummary` for multiple errors:

```tsx
import { FormErrorSummary } from '@/components/accessibility';

function CheckoutForm() {
  const { errors } = useForm();

  return (
    <form>
      {Object.keys(errors).length > 0 && (
        <FormErrorSummary errors={errors} className="mb-6" />
      )}
      {/* Form fields */}
    </form>
  );
}
```

### Required Fields
Mark required fields clearly:

```tsx
<Label htmlFor="name">
  Name
  <span className="text-destructive ml-1" aria-hidden="true">*</span>
  <span className="sr-only">(required)</span>
</Label>
<Input
  id="name"
  required
  aria-required="true"
/>
```

---

## Table Accessibility

### Using AccessibleTable Component

```tsx
import {
  AccessibleTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/accessibility';

function OrdersTable({ orders }) {
  return (
    <AccessibleTable
      caption="Your recent orders"
      summary="Table showing order date, items, status, and total"
    >
      <TableHeader>
        <TableRow>
          <TableHead scope="col" sortable>Order Date</TableHead>
          <TableHead scope="col">Items</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell isHeader>{formatDate(order.date)}</TableCell>
            <TableCell>{order.items.length} items</TableCell>
            <TableCell>{order.status}</TableCell>
            <TableCell>${order.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AccessibleTable>
  );
}
```

### Table Patterns
- Always include a caption (can be visually hidden)
- Use `scope="col"` for column headers
- Use `scope="row"` for row headers
- Mark sortable columns with aria-sort

---

## Keyboard Navigation

### Using Keyboard Navigation Hooks

```tsx
import { useKeyboardNavigation, useFocusTrap } from '@/hooks/useKeyboardNavigation';

function Modal({ onClose, children }) {
  const containerRef = useRef(null);

  // Trap focus in modal
  useFocusTrap({
    enabled: true,
    containerRef,
    onEscape: onClose,
    returnFocus: true,
  });

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

### Arrow Key Navigation in Lists

```tsx
import { useRovingTabIndex } from '@/hooks/useKeyboardNavigation';

function TabList() {
  const containerRef = useRef(null);

  useRovingTabIndex({
    containerRef,
    itemSelector: '[role="tab"]',
    orientation: 'horizontal',
  });

  return (
    <div ref={containerRef} role="tablist">
      <button role="tab">Tab 1</button>
      <button role="tab">Tab 2</button>
      <button role="tab">Tab 3</button>
    </div>
  );
}
```

### Common Keyboard Patterns

| Element | Keys | Action |
|---------|------|--------|
| Buttons | Enter, Space | Activate |
| Links | Enter | Navigate |
| Menus | Arrow keys | Navigate items |
| Dialogs | Escape | Close |
| Tabs | Arrow keys | Switch tabs |

---

## Screen Reader Support

### Live Regions for Dynamic Content

```tsx
import { LiveRegion, LoadingAnnouncer } from '@/components/accessibility';

function SearchResults({ results, isLoading }) {
  return (
    <>
      <LoadingAnnouncer
        isLoading={isLoading}
        loadingMessage="Searching products..."
        loadedMessage={`Found ${results.length} products`}
      />

      {/* Results list */}
    </>
  );
}
```

### Announcing Status Changes

```tsx
// For polite announcements (non-urgent)
<div role="status" aria-live="polite">
  {itemCount} items in cart
</div>

// For urgent announcements (errors)
<div role="alert" aria-live="assertive">
  Payment failed. Please try again.
</div>
```

### Visually Hidden Content

```tsx
import { VisuallyHidden } from '@/components/accessibility';

// For screen reader only content
<Button>
  <Trash2 />
  <VisuallyHidden>Delete item</VisuallyHidden>
</Button>

// Using sr-only class
<span className="sr-only">Opens in new window</span>
```

---

## Testing

### Running Accessibility Tests

```bash
# Run E2E accessibility tests
npm run test:e2e -- e2e/accessibility.spec.ts

# Run with UI
npm run test:e2e:ui
```

### Manual Testing Checklist

1. **Keyboard Navigation**
   - [ ] Tab through all interactive elements
   - [ ] Verify focus indicators are visible
   - [ ] Check for keyboard traps
   - [ ] Test arrow key navigation in menus

2. **Screen Reader**
   - [ ] Test with NVDA (Windows) or VoiceOver (Mac)
   - [ ] Verify all images have alt text
   - [ ] Check form labels are announced
   - [ ] Verify live region announcements

3. **Visual**
   - [ ] Test with 200% zoom
   - [ ] Check color contrast
   - [ ] Verify high contrast mode works
   - [ ] Test with reduced motion

### Using the WCAG Audit Tool

```ts
import { runWCAGAudit } from '@/lib/wcag-audit';

// Run automated audit
const results = await runWCAGAudit();
console.log(`Compliance Score: ${results.score}%`);
```

---

## Common Issues and Fixes

### Issue: Missing Focus Indicator
```tsx
// Fix: Add focus-visible styles
className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
```

### Issue: Click Handler Without Keyboard Support
```tsx
// Bad
<div onClick={handleClick}>Clickable</div>

// Good
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
  role="button"
>
  Clickable
</div>

// Better - use a button
<button onClick={handleClick}>Clickable</button>
```

### Issue: Form Without Labels
```tsx
// Bad
<input type="email" placeholder="Email" />

// Good
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Also Good
<input type="email" aria-label="Email address" />
```

### Issue: Image Without Alt Text
```tsx
// Bad
<img src="/product.jpg" />

// Good - meaningful image
<img src="/product.jpg" alt="Blue ceramic bowl with white interior" />

// Good - decorative image
<img src="/border.png" alt="" aria-hidden="true" />
```

### Issue: Dynamic Content Not Announced
```tsx
// Bad - content changes silently
{isLoading && <Spinner />}

// Good - announced to screen readers
<div aria-live="polite">
  {isLoading ? 'Loading...' : 'Content loaded'}
</div>
```

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Axe-core Rules](https://dequeuniversity.com/rules/axe/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Questions?

For accessibility questions or to report issues:
- Email: accessibility@craftlocal.net
- File a GitHub issue with the `accessibility` label
