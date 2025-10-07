# CraftLocal ChatGPT Widgets

Production-ready embeddable widgets for ChatGPT integration.

## Overview

These widgets allow ChatGPT to render interactive CraftLocal UI components directly in conversations. Built with vanilla JavaScript and Web Components for maximum compatibility.

## Available Widgets

### 1. Product Grid Widget (`product-grid.js`)
Displays a grid of product listings with filtering and sorting.

```html
<craftlocal-product-grid 
  listings='[...]'
  columns="3"
  show-filters="true">
</craftlocal-product-grid>
```

### 2. Product Detail Widget (`product-detail.js`)
Shows detailed product information with image gallery and purchase options.

```html
<craftlocal-product-detail 
  listing-id="uuid"
  show-similar="true">
</craftlocal-product-detail>
```

### 3. Checkout Widget (`checkout.js`)
Complete checkout flow with cart summary and payment.

```html
<craftlocal-checkout 
  session-id="stripe_session_id"
  compact="false">
</craftlocal-checkout>
```

### 4. Order List Widget (`order-list.js`)
User's order history with status tracking.

```html
<craftlocal-order-list 
  user-id="uuid"
  limit="10">
</craftlocal-order-list>
```

### 5. Seller Dashboard Widget (`seller-dashboard.js`)
Seller analytics and listing management.

```html
<craftlocal-seller-dashboard 
  seller-id="uuid"
  view="analytics">
</craftlocal-seller-dashboard>
```

## Usage

### CDN Method (Recommended)
```html
<script src="https://cdn.craftlocal.net/widgets/v1/craftlocal-widgets.js"></script>
<craftlocal-product-grid listings='[...]'></craftlocal-product-grid>
```

### NPM Method
```bash
npm install @craftlocal/widgets
```

```javascript
import '@craftlocal/widgets';
```

## Widget Communication

Widgets communicate with the MCP server via OAuth-authenticated API calls:

```javascript
// Automatic authentication using ChatGPT OAuth token
const widget = document.querySelector('craftlocal-product-grid');
widget.addEventListener('add-to-cart', (e) => {
  console.log('Item added:', e.detail);
});
```

## Styling

Widgets use CSS custom properties for theming:

```css
:root {
  --craftlocal-primary: #0066cc;
  --craftlocal-background: #ffffff;
  --craftlocal-text: #333333;
  --craftlocal-border-radius: 8px;
}
```

## Development

```bash
cd chatgpt-integration/widgets
npm install
npm run dev    # Start dev server
npm run build  # Build for production
```

## Security

- All API calls are OAuth-authenticated
- No sensitive data in widget attributes
- CORS properly configured
- XSS protection via Content Security Policy

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## License

MIT
