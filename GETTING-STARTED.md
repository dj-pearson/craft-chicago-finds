# Getting Started with CraftLocal

Welcome to CraftLocal - a marketplace platform for discovering and purchasing unique handmade items from local artisans.

## 🚀 Current Status

### What's Live Now
✅ **User Authentication**
- Create an account with email/password
- Sign in securely
- Session management and persistence
- Profile auto-creation

✅ **Database Schema**
- 8 core tables ready (products, cart, orders, reviews, etc.)
- Row Level Security policies active
- Performance indexes in place
- Category data seeded

✅ **Foundation**
- PWA support (offline capability)
- Accessibility features (WCAG 2.1 AA)
- SEO optimization
- Mobile-first responsive design

### Coming Very Soon
🔄 **Marketplace Features** (Implementing Now)
- Product browsing and search
- Shopping cart functionality
- Favorites/wishlist
- Product detail pages
- Category filtering

⏳ **Next Phase**
- Checkout and payments (Stripe)
- Order management
- Artisan dashboards
- Reviews and ratings

---

## 📱 For Customers

### How to Get Started

#### 1. Create an Account
1. Click "Sign In" in the header
2. Switch to the "Sign Up" tab
3. Enter your email and password (min 6 characters)
4. Optionally add a display name
5. Click "Create Account"
6. Check your email for confirmation (if enabled)

#### 2. Browse Products (Coming Soon)
Once marketplace UI is ready:
- Browse by category
- Search for specific items
- Filter by price range
- View featured artisans

#### 3. Shopping (Coming Soon)
- Add items to your cart
- Save favorites
- Secure checkout
- Track your orders

### Email Confirmation

**Current Setting:** Email confirmation may be enabled.

**If you need faster testing:**
1. Visit [Supabase Auth Settings](https://supabase.com/dashboard/project/craftlocal-self-hosted/auth/providers)
2. Disable "Confirm email"
3. Sign in immediately after signup

---

## 🎨 For Artisans

### Becoming an Artisan

**Requirements:**
- Active CraftLocal account
- Profile with display name
- City location

**Process** (Coming Soon):
1. Complete your profile
2. Apply to become an artisan
3. Set up your shop
4. Start listing products

### Managing Products

Once artisan features are live:
- Create product listings
- Upload multiple images
- Set pricing and inventory
- Track sales and orders
- Manage customer messages

---

## 🛠️ Technical Details

### Tech Stack
**Frontend:**
- React 18 + TypeScript
- TailwindCSS + Shadcn/ui
- React Query for data fetching
- React Router for navigation

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security
- Edge Functions
- Real-time subscriptions

### Database Tables

**User Management:**
- `profiles` - Extended user data

**Marketplace:**
- `categories` - Product categories (8 seeded)
- `products` - Artisan products
- `cart_items` - Shopping cart
- `favorites` - User wishlist
- `orders` - Purchase orders
- `order_items` - Order details
- `reviews` - Product reviews

### Security

**Authentication:**
- Secure email/password auth
- Session persistence
- Auto token refresh
- Protected routes

**Authorization:**
- Row Level Security (RLS) on all tables
- User data isolation
- Artisan-only product management
- Secure checkout flow

---

## 🎯 Roadmap

### Phase 5: Authentication ✅ (Complete)
- User signup/signin
- Session management
- Profile creation
- Protected routes

### Phase 6: Marketplace UI (In Progress)
- Product components
- Browse page
- Product detail page
- Shopping cart UI
- Favorites page

### Phase 7: Checkout
- Shipping address
- Stripe integration
- Order confirmation
- Email receipts

### Phase 8: Artisan Features
- Product management
- Inventory tracking
- Sales dashboard
- Customer messaging

### Phase 9: Reviews & Ratings
- Leave reviews
- Star ratings
- Review moderation
- Helpful votes

### Phase 10: Advanced Features
- Advanced search
- Recommendations
- Analytics
- Multi-image uploads

---

## 💡 Tips & Best Practices

### For Customers

**Creating an Account:**
- Use a valid email address
- Choose a strong password (min 6 characters)
- Add a display name for personalization

**Security:**
- Never share your password
- Sign out on shared devices
- Keep your email updated

### For Artisans (When Available)

**Product Listings:**
- Use high-quality images
- Write detailed descriptions
- Set accurate pricing
- Keep inventory updated
- Respond to messages promptly

**SEO Best Practices:**
- Use descriptive product titles
- Include relevant tags
- Write unique descriptions
- Add multiple product images

---

## 🐛 Troubleshooting

### Common Issues

**Can't Sign In**
- Check email and password are correct
- If email confirmation is enabled, check your email
- Clear browser cache and try again

**Email Not Received**
- Check spam/junk folder
- Wait a few minutes (can take up to 10 min)
- Or disable email confirmation in settings

**Page Not Loading**
- Check internet connection
- Try refreshing the page
- Clear browser cache

**Session Expired**
- Sign in again
- Session lasts 1 week by default
- Auto-refresh should prevent this

---

## 📞 Support

### Development Status
This is currently in active development. Features are being added regularly.

### Current Capabilities
✅ Authentication working
✅ Database ready
🔄 Marketplace UI in progress

### Stay Updated
Watch for new features as they're released. The marketplace UI is coming very soon!

---

## 🔗 Quick Links

**User Actions:**
- [Sign In/Sign Up](/auth)
- [Home](/)

**Documentation:**
- `PHASE5-AUTHENTICATION-COMPLETE.md` - Auth details
- `PHASE4-DATABASE-SETUP.md` - Database schema
- `PROJECT-STATUS.md` - Full status
- `MARKETPLACE-IMPLEMENTATION-GUIDE.md` - Roadmap

**Developer Resources:**
- Database: [Supabase Dashboard](https://supabase.com/dashboard/project/craftlocal-self-hosted)
- Auth Settings: [Auth Providers](https://supabase.com/dashboard/project/craftlocal-self-hosted/auth/providers)

---

## 🎉 Welcome to CraftLocal!

Thank you for being an early user. We're building something special - a platform that connects talented local artisans with customers who appreciate unique, handmade items.

**What makes us different:**
- Focus on local artisans
- Curated handmade items
- Direct artist-customer connection
- Support small businesses
- Sustainable shopping

Stay tuned for marketplace features launching soon!
