# Mobile App Development Guide

This guide explains the mobile app setup for Craft Chicago Finds and how it integrates with the existing web application.

## Overview

The mobile app is located in the `/mobile` directory and is built with React Native using plain JavaScript. It's designed to be completely separate from the web application build process, allowing independent development and deployment to app stores without affecting the existing web platform.

## Directory Structure

```
craft-chicago-finds/
├── src/                    # Web app source code
├── public/                 # Web app public assets
├── dist/                   # Web app build output
├── mobile/                 # Mobile app (NEW)
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── contexts/
│   │   ├── navigation/
│   │   ├── screens/
│   │   └── ...
│   ├── android/
│   ├── ios/
│   ├── App.js
│   ├── package.json
│   └── README.md
├── package.json            # Web app dependencies
└── ...
```

## Key Differences: Web vs Mobile

### Technology Stack

| Feature | Web App | Mobile App |
|---------|---------|------------|
| Framework | React (Vite) | React Native |
| Language | TypeScript | JavaScript |
| Styling | Tailwind CSS | StyleSheet API |
| UI Components | shadcn/ui, Radix UI | React Native Components |
| Navigation | React Router | React Navigation |
| Build Tool | Vite | Metro Bundler |
| Deployment | Cloudflare Pages | App Stores (iOS/Android) |

### Shared Services

Both apps share the same backend services:
- **Supabase** - Authentication, Database, Storage
- **Stripe** - Payment processing

### Architecture Comparison

#### Web App Provider Hierarchy
```
QueryClientProvider
  → AccessibilityProvider
    → StripeProvider
      → AuthProvider
        → PlansProvider
          → CartProvider
            → AdminProvider
              → CityProvider
```

#### Mobile App Provider Hierarchy
```
GestureHandlerRootView
  → SafeAreaProvider
    → CityProvider
      → AuthProvider
        → CartProvider
```

## Building Both Apps

### Web App
```bash
# From project root
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Mobile App
```bash
# From mobile directory
cd mobile
npm install          # Install dependencies
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
```

## Development Workflow

### 1. Independent Development

The mobile and web apps can be developed completely independently:

- Web app developers work in `/src`, `/public`, etc.
- Mobile app developers work in `/mobile`
- No conflicts or interference between the two

### 2. Shared Backend

Both apps connect to the same Supabase backend:

```javascript
// Web app: src/integrations/supabase/client.js
import { createClient } from '@supabase/supabase-js';

// Mobile app: mobile/src/config/supabase.js
import { createClient } from '@supabase/supabase-js';
```

### 3. Feature Parity

The mobile app is designed to replicate the core features of the web app:

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Authentication | ✅ | ✅ | Complete |
| Product Browsing | ✅ | 🔄 | In Progress |
| Shopping Cart | ✅ | ✅ | Complete |
| Checkout | ✅ | 🔄 | In Progress |
| User Profile | ✅ | ✅ | Complete |
| Seller Dashboard | ✅ | ⏳ | Planned |
| Admin Panel | ✅ | ⏳ | Planned |
| Messaging | ✅ | ⏳ | Planned |

## Environment Configuration

### Web App Environment
```env
# .env (project root)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=...
```

### Mobile App Environment
```env
# mobile/.env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
STRIPE_PUBLISHABLE_KEY=...
```

## Deployment Strategy

### Web App Deployment
- Deployed to Cloudflare Pages
- Continuous deployment from Git
- No mobile code included in web builds

### Mobile App Deployment
- iOS: Apple App Store via Xcode
- Android: Google Play Store via Android Studio
- Separate release cycles from web app

## API Integration

Both apps use the same Supabase API endpoints:

### Authentication
```javascript
// Both apps use the same methods
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signUp({ email, password });
await supabase.auth.signOut();
```

### Database Queries
```javascript
// Both apps use the same table structures
await supabase.from('products').select('*');
await supabase.from('orders').insert(orderData);
```

## Testing Strategy

### Web App
- Playwright E2E tests in `/e2e`
- Component tests
- Browser compatibility testing

### Mobile App
- Jest unit tests
- React Native Testing Library
- Manual testing on iOS and Android devices

## Best Practices

### 1. Keep Mobile Separate
- Never import web app code into mobile app
- Never import mobile app code into web app
- Share logic via API, not code

### 2. Consistent API Usage
- Use the same Supabase table names
- Use the same data structures
- Maintain API compatibility

### 3. Feature Development
- Design features to work on both platforms
- Consider mobile UX when adding web features
- Plan for offline scenarios on mobile

### 4. Version Control
- Mobile and web can have different version numbers
- Tag releases separately (e.g., `web-v1.0.0`, `mobile-v1.0.0`)
- Maintain separate changelogs if needed

## Common Tasks

### Adding a New Feature

1. **Web Implementation**
   - Implement in `/src`
   - Test in browser
   - Deploy to Cloudflare

2. **Mobile Implementation**
   - Implement in `/mobile/src`
   - Test on iOS and Android
   - Submit to app stores

### Updating Dependencies

```bash
# Web app
npm update

# Mobile app
cd mobile
npm update
cd ios && pod update && cd ..  # iOS only
```

### Debugging

**Web App:**
- Chrome DevTools
- React DevTools
- Vite's error overlay

**Mobile App:**
- React Native Debugger
- Flipper
- Xcode/Android Studio debuggers

## Troubleshooting

### Build Conflicts

If you encounter build conflicts:

```bash
# Clean web build
rm -rf dist node_modules
npm install
npm run build

# Clean mobile build
cd mobile
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### Port Conflicts

- Web dev server: Port 8080
- Mobile Metro bundler: Port 8081
- No conflicts expected

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic app structure
- ✅ Authentication
- ✅ Navigation setup
- 🔄 Core features (browsing, cart, checkout)

### Phase 2
- Product search and filters
- Push notifications
- Image uploads
- Real-time messaging

### Phase 3
- Offline mode
- Location services
- Advanced analytics
- Social features

## Support and Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Supabase Docs](https://supabase.com/docs)

### Mobile-Specific Setup
See `/mobile/README.md` for detailed mobile app setup instructions.

### Questions?
Contact the development team or refer to the project wiki.
