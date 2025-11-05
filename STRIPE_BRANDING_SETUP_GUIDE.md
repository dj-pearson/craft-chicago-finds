# Stripe Account Professional Setup Guide
## Craft Local - Complete Branding Configuration

**Date:** October 30, 2025  
**Current Account:** Eat Pal sandbox (acct_1SFmtuCaWdkEYkkC)  
**Target Brand:** Craft Local - Handmade Marketplace

---

## 🎨 Step 1: Update Branding Settings

### Go to: [Stripe Dashboard → Branding](https://dashboard.stripe.com/account/branding)

#### **Icon** (Square logo)
- **File to upload:** `Logo.png` or `Icon.png`
- **Location:** `c:\Users\dpearson\Documents\Craft-Local\craft-chicago-finds\public\Logo.png`
- **Requirements:** JPG or PNG, < 512KB, ≥ 128x128px
- **Used on:** Emails, Checkout, Payment Links, Customer Portal, Invoices, PDFs

#### **Logo** (Non-square, full logo)
- **File to upload:** `Logo.png` or horizontal brand logo
- **Location:** `c:\Users\dpearson\Documents\Craft-Local\craft-chicago-finds\public\Logo.png`
- **Used on:** Checkout, Payment Links, Invoice PDFs (overrides icon in some places)

#### **Brand Color** (Primary color)
- **Color:** `#6366f1` (Indigo - from manifest.json)
- **Used on:** Receipts, Invoices, Customer Portal
- **Where it appears:** Primary text, links, buttons

#### **Accent Color** (Background/secondary)
- **Color:** `#ffffff` (White background) or `#f3f4f6` (Light gray)
- **Used on:** Email backgrounds, page backgrounds
- **Recommendation:** Use white (#ffffff) for clean, professional look

---

## 🏢 Step 2: Update Business Information

### Go to: [Stripe Dashboard → Public Details](https://dashboard.stripe.com/settings/public)

#### **Business Name**
```
Craft Local
```
or
```
CraftLocal - Handmade Marketplace
```

#### **Business Description**
```
Discover and shop unique handmade items from local artisans in Chicago. 
Supporting local makers and connecting customers with authentic, handcrafted goods.
```

#### **Support Email**
```
support@craftlocal.com
```
*(or your actual support email)*

#### **Support Phone** (Optional)
```
Your business phone number
```

#### **Website**
```
https://craftlocal.com
```
*(Currently deployed at craft-chicago-finds.pages.dev, update when custom domain is live)*

---

## 📝 Step 3: Configure Checkout Settings

### Go to: [Stripe Dashboard → Checkout Settings](https://dashboard.stripe.com/settings/checkout)

#### **Contact Information** (Enable)
✅ **Display contact information to customers**
- This increases buyer confidence
- Shows support email/phone on checkout page

#### **Legal Policies** (Enable)
✅ **Display links to legal policies**

**Terms of Service URL:**
```
https://craftlocal.com/terms
```
*(You'll need to create this page)*

**Privacy Policy URL:**
```
https://craftlocal.com/privacy
```
*(You'll need to create this page)*

✅ **Display agreement to legal terms** (Optional)
- Checkbox: "I agree to the Terms of Service and Privacy Policy"

#### **Return and Refund Policies** (Configure)

**Return Policy:**
- ✅ Accept returns
- 🔄 Free returns
- 📅 Accept returns for: **30 days**
- 📦 Customers can return by: **Shipping items back**
- 🏪 Accept in-store returns: **Yes** (if applicable)

**Return Policy URL:**
```
https://craftlocal.com/returns
```

**Custom Message:**
```
We want you to love your handmade purchase! If you're not satisfied, 
you can return items within 30 days for a full refund or exchange. 
Each artisan's specific policies may vary - check the listing for details.
```

---

## 📧 Step 4: Email Domain Configuration (Optional but Recommended)

### Go to: [Stripe Dashboard → Email Domain](https://dashboard.stripe.com/settings/email-domain)

Instead of emails coming from `@stripe.com`, they'll come from your domain.

#### **Steps:**
1. Add domain: `craftlocal.com`
2. Verify DNS records (Stripe will provide TXT records)
3. Test email delivery

#### **Email Benefits:**
- More professional appearance
- Better email deliverability
- Stronger brand recognition
- Example: `receipts@craftlocal.com` instead of `receipts@stripe.com`

---

## 🌐 Step 5: Custom Domain for Checkout (Optional but Recommended)

### Go to: [Stripe Dashboard → Custom Domains](https://dashboard.stripe.com/settings/domains)

Make checkout pages appear on your domain instead of `checkout.stripe.com`

#### **Steps:**
1. Add domain: `checkout.craftlocal.com` or `pay.craftlocal.com`
2. Configure DNS CNAME record (Stripe provides target)
3. Applies to:
   - Checkout sessions
   - Payment Links
   - Customer Portal

#### **Example:**
- Before: `https://checkout.stripe.com/c/pay/cs_live_abc123`
- After: `https://checkout.craftlocal.com/c/pay/cs_live_abc123`

---

## 💳 Step 6: Connect Account Settings

### Go to: [Stripe Dashboard → Connect Settings](https://dashboard.stripe.com/settings/connect)

Configure how your platform (sellers) connect their Stripe accounts.

#### **Platform Details**

**Platform Name:**
```
Craft Local
```

**Platform Icon:**
- Upload: `Logo.png` from public folder
- Used when sellers connect accounts

**Platform Description:**
```
Craft Local is a marketplace for handmade goods from local Chicago artisans. 
Connect your Stripe account to receive payouts for your sales.
```

**Support Information:**
- Same as main account (email, phone, website)

---

## 📄 Step 7: Statement Descriptor

### Go to: [Stripe Dashboard → Public Details](https://dashboard.stripe.com/settings/public)

This appears on customer credit card statements.

#### **Statement Descriptor**
```
CRAFT LOCAL
```
or
```
CRAFTLOCAL
```

**Rules:**
- Max 22 characters
- Latin characters only
- Special characters: `-`, `.`, `*`, `'`
- Will appear as: `CRAFT LOCAL*` on statements

**Example customer sees:**
```
CRAFT LOCAL* $45.00
Description: Handmade ceramic vase
```

---

## 🔐 Step 8: Security & Compliance

### Go to: [Stripe Dashboard → Radar](https://dashboard.stripe.com/radar)

Enable fraud protection (should already be on).

#### **Recommended Rules:**
✅ Block if CVC fails  
✅ Block if postal code fails  
✅ Block high-risk charges  
✅ 3D Secure for high-value transactions (>$100)

---

## 📊 Step 9: Customer Communications

### Go to: [Stripe Dashboard → Email Settings](https://dashboard.stripe.com/settings/emails)

Configure which emails customers receive.

#### **Recommended Settings:**
✅ Successful payments  
✅ Failed payments  
✅ Refunds  
✅ Upcoming invoice reminders (for subscriptions if you add them later)  
✅ Customer receipts

#### **Email Language:**
- Default: English (United States)
- Can add more languages if needed

---

## 🎯 Quick Setup Checklist

Use this to track your progress:

### Branding
- [ ] Upload square icon/logo
- [ ] Upload horizontal logo (if different)
- [ ] Set brand color to #6366f1
- [ ] Set accent color to #ffffff

### Business Information
- [ ] Update business name to "Craft Local"
- [ ] Add business description
- [ ] Add support email
- [ ] Add support phone (optional)
- [ ] Add website URL

### Checkout Configuration
- [ ] Enable contact information display
- [ ] Add Terms of Service URL
- [ ] Add Privacy Policy URL
- [ ] Configure return policy
- [ ] Add return policy URL
- [ ] Set statement descriptor

### Advanced (Optional)
- [ ] Set up custom email domain
- [ ] Configure custom checkout domain
- [ ] Update Connect platform settings
- [ ] Review Radar fraud rules
- [ ] Configure email preferences

---

## 📸 Assets You Need to Upload

All located in: `c:\Users\dpearson\Documents\Craft-Local\craft-chicago-finds\public\`

### Primary Logo/Icon:
- **Logo.png** - Main logo
- **Icon.png** - Square icon version
- **android-chrome-512x512.png** - High-res icon (512x512)
- **android-chrome-192x192.png** - Medium-res icon (192x192)

### Favicon (for website, not Stripe):
- **favicon.png**
- **favicon-32x32.png**
- **favicon-16x16.png**
- **apple-touch-icon.png**

**Recommendation:** Use `Logo.png` or `Icon.png` for Stripe uploads. Make sure they're:
- High resolution (at least 512x512 for icon)
- Clear and readable at small sizes
- PNG format with transparent background (if possible)

---

## 🎨 Your Brand Colors

From `manifest.json`:
- **Primary:** `#6366f1` (Indigo Blue)
- **Background:** `#ffffff` (White)
- **Theme:** Modern, clean, professional

**Color Psychology:**
- Indigo conveys creativity, craftsmanship, trustworthiness
- Perfect for a handmade/artisan marketplace
- Professional yet approachable

---

## 📝 Legal Pages You Need to Create

Before finalizing Stripe settings, you should have these pages on your website:

### 1. Terms of Service (`/terms`)
**Key sections:**
- Platform rules
- Buyer responsibilities
- Seller responsibilities
- Payment terms (include 10% platform fee)
- Shipping and returns
- Dispute resolution

### 2. Privacy Policy (`/privacy`)
**Key sections:**
- Data collection (what you collect)
- Data usage (how you use it)
- Third-party services (Stripe, Supabase)
- Cookies and tracking
- User rights
- GDPR compliance (if applicable)

### 3. Return/Refund Policy (`/returns`)
**Key sections:**
- Return window (30 days recommended)
- Return conditions
- Refund process
- Shipping costs for returns
- Exchange options
- Damaged/defective items

**Template Resources:**
- [Shopify's Policy Generator](https://www.shopify.com/tools/policy-generator)
- [Termly Policy Generator](https://termly.io/products/terms-and-conditions-generator/)
- [Privacy Policy Template](https://www.privacypolicies.com/privacy-policy-generator/)

---

## 🔄 After You Update Everything

### Test Your Branding:

1. **Create a test payment link:**
   ```
   Go to: Stripe Dashboard → Payment Links
   Create new link with test product
   View the checkout page
   ```

2. **Check email branding:**
   ```
   Make a test purchase
   Check receipt email for your logo/colors
   ```

3. **Verify customer portal:**
   ```
   Go to a test customer
   View customer portal link
   Check branding appears correctly
   ```

4. **Review statement descriptor:**
   ```
   Make test charge with your test credit card
   Check how it appears in Stripe dashboard
   ```

---

## 🆘 Need Help?

### Common Issues:

**Logo won't upload:**
- Check file size (< 512KB)
- Verify dimensions (≥ 128x128px)
- Use PNG or JPG format only

**Colors not showing:**
- Clear browser cache
- Wait a few minutes for changes to propagate
- Test in incognito window

**Custom domain not working:**
- Verify DNS records are correct
- Wait up to 24 hours for DNS propagation
- Check SSL certificate is active

---

## 🎉 Final Result

After completing all steps, your customers will see:

✨ **Checkout Page:**
- Your logo at the top
- Brand colors throughout
- Professional appearance
- Your contact information
- Links to your policies

📧 **Emails:**
- Branded with your logo
- Your colors in the design
- From your domain (if configured)
- Professional and trustworthy

💳 **Credit Card Statements:**
- "CRAFT LOCAL" descriptor
- Clear merchant name
- Professional appearance

🏪 **Customer Portal:**
- Fully branded experience
- Your logo and colors
- Consistent with your site

---

**Current Status:** Setup Required  
**Time to Complete:** 30-45 minutes  
**Difficulty:** Easy - just follow the checklist!

**Ready to make Craft Local look professional on Stripe? Start with Step 1! 🎨**

