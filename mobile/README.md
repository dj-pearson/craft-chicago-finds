# Craft Chicago Finds - Mobile App

React Native mobile application for the Craft Chicago Finds marketplace platform.

## Overview

This is the mobile version of Craft Chicago Finds, built with React Native and plain JavaScript. The app provides a native mobile experience for browsing local artisan products, managing shopping cart, and placing orders.

## Technology Stack

- **React Native 0.74.3** - Mobile framework
- **React Navigation** - Navigation library
- **Supabase** - Backend services (Auth, Database, Storage)
- **Stripe React Native** - Payment processing
- **AsyncStorage** - Local data persistence
- **React Native Vector Icons** - Icon library

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- For iOS development:
  - macOS
  - Xcode (latest version)
  - CocoaPods
- For Android development:
  - Android Studio
  - Android SDK
  - Java Development Kit (JDK)

## Installation

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the `mobile` directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

Update the Supabase configuration in `src/config/supabase.js` with your credentials.

## Running the App

### Development

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Start Metro Bundler (if not started automatically)
```bash
npm start
```

### Production Build

#### iOS
1. Open `ios/CraftChicagoFinds.xcworkspace` in Xcode
2. Select your target device/simulator
3. Product → Archive
4. Follow Xcode's distribution wizard

#### Android
```bash
cd android
./gradlew assembleRelease
```

The APK will be available at `android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
mobile/
├── android/              # Android native code
├── ios/                  # iOS native code
├── src/
│   ├── components/       # Reusable UI components
│   ├── config/           # Configuration files (Supabase, etc.)
│   ├── contexts/         # React context providers
│   │   ├── AuthContext.js
│   │   ├── CartContext.js
│   │   └── CityContext.js
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # Navigation configuration
│   │   ├── RootNavigator.js
│   │   ├── MainTabNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── stacks/       # Stack navigators
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── HomeScreen.js
│   │   ├── BrowseScreen.js
│   │   ├── CartScreen.js
│   │   └── ProfileScreen.js
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   └── assets/           # Images, fonts, etc.
├── App.js                # Root component
├── index.js              # Entry point
└── package.json          # Dependencies
```

## Architecture

### Context Providers

The app uses React Context for state management:

1. **AuthContext** - User authentication state
2. **CartContext** - Shopping cart state with AsyncStorage persistence
3. **CityContext** - Selected city state

### Navigation

The app uses React Navigation with the following structure:

- **RootNavigator** - Handles auth state and switches between auth and main app
- **AuthNavigator** - Stack navigator for login/signup flows
- **MainTabNavigator** - Bottom tab navigator with 4 tabs:
  - Home
  - Browse
  - Cart
  - Profile
- **Stack Navigators** - Each tab has its own stack for nested navigation

### Screens

#### Authentication
- **LoginScreen** - User login
- **SignupScreen** - New user registration
- **ForgotPasswordScreen** - Password reset

#### Main App
- **HomeScreen** - Featured products and categories
- **BrowseScreen** - Search and browse all products
- **CartScreen** - Shopping cart management
- **ProfileScreen** - User profile and settings
- **ProductDetailScreen** - Product details
- **CheckoutScreen** - Order checkout with Stripe
- **OrdersScreen** - Order history
- **SettingsScreen** - App settings

## Features Roadmap

### Phase 1 - Core Features (Current)
- [x] Project setup and structure
- [x] Navigation implementation
- [x] Authentication (Login, Signup, Password Reset)
- [x] Context providers for state management
- [ ] Product listing and browsing
- [ ] Product detail views
- [ ] Shopping cart functionality
- [ ] Stripe payment integration

### Phase 2 - Enhanced Features
- [ ] Product search and filters
- [ ] Category browsing
- [ ] Seller profiles
- [ ] Order management
- [ ] Push notifications
- [ ] Image upload for products
- [ ] Real-time messaging

### Phase 3 - Advanced Features
- [ ] Location-based features
- [ ] Favorites/Wishlist
- [ ] Product reviews and ratings
- [ ] Social sharing
- [ ] Analytics integration
- [ ] Offline mode support

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React Native best practices
- Keep components small and focused
- Use meaningful variable and function names
- Add comments for complex logic

### File Naming
- Components: PascalCase (e.g., `HomeScreen.js`)
- Utilities: camelCase (e.g., `formatPrice.js`)
- Constants: UPPER_SNAKE_CASE

### State Management
- Use Context API for global state
- Keep local state when possible
- Use AsyncStorage for persistence

## Testing

### Run Tests
```bash
npm test
```

### Run Linter
```bash
npm run lint
```

## Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

#### iOS Build Issues
```bash
cd ios
pod deintegrate
pod install
cd ..
```

#### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
```

### Clear All Caches
```bash
npm run clean
```

## App Store Submission

### iOS App Store

1. Configure app information in Xcode
2. Set up App Store Connect
3. Create app icons and screenshots
4. Build and archive the app
5. Submit for review

### Google Play Store

1. Create a keystore for signing
2. Configure app information in `android/app/build.gradle`
3. Generate signed APK/Bundle
4. Create store listing in Play Console
5. Submit for review

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly on both iOS and Android
4. Submit a pull request

## Support

For issues or questions, please contact the development team or create an issue in the repository.

## License

This project is private and proprietary.
