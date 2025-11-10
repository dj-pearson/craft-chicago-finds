# CraftLocal.net Quick Action Plan
**Date:** November 10, 2025
**Focus:** Vendor Retention & AOV Increase

---

## 🚨 Critical Issues Found

### 1. NO DISCOUNT CODE SYSTEM
- **Impact:** Vendors can't run promotions, directly limits AOV
- **Status:** Database may exist, but ZERO UI implementation
- **Action:** Build discount code system (1 week effort)
- **Expected ROI:** 15-25% AOV increase

### 2. OPAQUE PAYOUT SYSTEM
- **Impact:** Vendors don't know when/how they'll be paid (#1 marketplace complaint)
- **Status:** Database ready, minimal UI
- **Action:** Build transparent payout dashboard (1 week effort)
- **Expected ROI:** 20-30% reduction in vendor churn

### 3. NO VACATION MODE
- **Impact:** Vendors can't take breaks, burnout risk
- **Status:** Not implemented
- **Action:** Add vacation/away mode toggle (2 days effort)
- **Expected ROI:** High vendor satisfaction, reduced churn

### 4. NO SMS/PUSH NOTIFICATIONS
- **Impact:** Vendors miss time-sensitive orders
- **Status:** Email only, no SMS/push
- **Action:** Add SMS notifications for new orders (3 days effort)
- **Expected ROI:** Faster fulfillment, better metrics

---

## 📊 Platform Health: 80-85% Mature

### ✅ Strong Areas:
- Vendor dashboard and analytics (95%)
- Admin tools and moderation (85%)
- Community features (reviews, messaging) (80%)
- Product discovery and search (85%)
- Order management (vendor & buyer) (90-95%)

### ❌ Critical Gaps:
- Marketing tools (65%) - Missing discount codes, referrals, automation
- Financial transparency (70%) - Payout dashboard minimal
- Inventory automation (60%) - No low-stock alerts, limited tools
- Payment methods (70%) - Stripe only, no PayPal/alternatives

---

## 🎯 Immediate Action Plan (Next 4 Weeks)

### Week 1: Discount Codes & Payouts
**Days 1-3:** Discount code system
- Create/edit codes in vendor dashboard
- Apply codes at checkout
- Track usage analytics

**Days 4-5:** Payout dashboard
- Display payout schedule
- Current balance widget
- Transaction history with fees
- Export to CSV

**Expected Impact:**
- 15-25% AOV increase
- Major vendor trust improvement

---

### Week 2: Vendor Tools
**Days 1-2:** Vacation mode
- Toggle in seller dashboard
- Away message banner
- Auto-hide from search
- Message auto-responder

**Days 3-5:** Low stock alerts
- Email notifications at threshold
- Dashboard low-stock widget
- Bulk inventory update
- Out-of-stock auto-hide

**Expected Impact:**
- Reduced vendor burnout
- Prevent lost sales from stockouts

---

### Week 3: Notifications & Automation
**Days 1-3:** SMS/Push notifications
- SMS for new orders
- Push notifications (PWA)
- Notification preferences panel
- Scheduled digest option

**Days 4-5:** Abandoned cart emails
- 1-hour after abandonment
- Include discount code incentive
- Track recovery rate

**Expected Impact:**
- Faster order fulfillment
- 10-15% cart recovery

---

### Week 4: AOV Optimizations
**Days 1-2:** Checkout improvements
- "X away from free shipping" banner
- "Complete the set" recommendations
- Gift wrapping upsell

**Days 3-5:** Quick wins
- One-click product duplication
- Bulk photo upload
- "Local makers near me" filter
- Shop policy templates

**Expected Impact:**
- 10-15% additional AOV increase
- Vendor efficiency improvements

---

## 💰 Expected ROI Summary

### Vendor Retention:
- **Current:** Unknown (needs tracking)
- **Target:** 20-30% churn reduction
- **Drivers:** Payout transparency, vacation mode, better tools

### Average Order Value:
- **Current:** Baseline TBD
- **Target:** 30-50% increase
- **Drivers:** Discount codes, checkout upsells, bundle promotions

### Platform Revenue:
- **Combined Impact:** 40-60% increase
- **Calculation:** (1.25 retention) × (1.35 AOV) = 1.69 = 69% increase

---

## 🔧 Technical Requirements

### Team:
- 2 full-stack developers
- 1 UI/UX designer
- 1 QA engineer
- 0.5 FTE product manager

### Budget:
- **Phase 1 (Weeks 1-4):** $40,000-$60,000
- **Phase 2 (Weeks 5-8):** $30,000-$40,000
- **Total:** $70,000-$100,000 for complete implementation

### Tech Stack (Already in Place):
- React + TypeScript + Vite
- Supabase (database ready)
- Stripe (payment integration)
- Tailwind + shadcn/ui

---

## 📈 Success Metrics to Track

### Week 1-2 Baseline:
1. Current vendor churn rate
2. Current AOV
3. Discount code usage (will be 0%)
4. Payout-related support tickets
5. Vendor satisfaction score

### Month 1 Targets:
1. 30%+ of vendors create discount codes
2. 50%+ reduction in payout inquiries
3. 10%+ AOV increase
4. 5+ vacation modes activated
5. Vendor NPS increase by 10+ points

### Month 2 Targets:
1. 15-25% AOV increase (full discount adoption)
2. 20%+ churn reduction
3. 10%+ faster order fulfillment (notifications)
4. 50%+ of vendors use low-stock alerts
5. 10-15% abandoned cart recovery rate

---

## 🚀 Quick Wins (Can Do This Week)

### 1-Day Implementations:
1. **One-click product duplication** - Massive time saver
2. **Automated "order shipped" emails** - Professional touch
3. **"Local makers near me" filter** - Unique differentiator

### 2-Day Implementations:
4. **Vacation/away mode** - High vendor satisfaction
5. **Shop policy templates** - Faster onboarding
6. **Bulk photo upload** - Efficiency boost

### Why Start Here:
- Build vendor goodwill immediately
- Show platform is actively improving
- Quick morale boost while working on bigger features

---

## 🎯 North Star Metrics

### Vendor Success:
- **90-day retention rate:** Target 85%+
- **Average revenue per vendor:** Increase 40%+
- **Vendor NPS:** Target 50+
- **Time to first sale:** Reduce 30%

### Buyer Discovery:
- **Search success rate:** Target 70%+
- **Conversion rate:** Increase 15%+
- **Repeat purchase rate:** Increase 25%+
- **AOV:** Increase 30-50%

### Platform Health:
- **GMV (Gross Merchandise Value):** 50%+ increase
- **Take rate:** Maintain 10% while improving value
- **Support ticket volume:** Reduce 40%
- **Vendor satisfaction:** 80%+ "satisfied or very satisfied"

---

## 📋 Pre-Implementation Checklist

### Before Starting Development:
- [ ] Establish baseline metrics (vendor retention, AOV, NPS)
- [ ] Survey top 20 vendors for pain points validation
- [ ] Review competitive discount code implementations (Etsy, Shopify)
- [ ] Design payout dashboard mockups (get vendor feedback)
- [ ] Set up analytics tracking for new features
- [ ] Create test vendor accounts for QA
- [ ] Document current commission/payout process
- [ ] Verify Stripe payout API capabilities
- [ ] Plan discount code abuse prevention
- [ ] Design notification preference UI

### After Implementation:
- [ ] A/B test discount code positioning
- [ ] Monitor payout dashboard usage
- [ ] Track vacation mode adoption
- [ ] Survey vendors on notification preferences
- [ ] Measure AOV week-over-week
- [ ] Track support ticket changes
- [ ] Conduct vendor interviews (5-10)
- [ ] Document learnings for Phase 2

---

## 🎪 Communication Plan

### Internal (Team):
- Daily standups on implementation progress
- Weekly sprint reviews
- Metrics dashboard updates

### External (Vendors):
- **Week 0:** "We heard you" announcement email
- **Week 1:** "Discount codes are here!" launch email
- **Week 2:** "New payout dashboard" tutorial video
- **Week 3:** "Take a vacation guilt-free" feature highlight
- **Week 4:** "We shipped 10+ improvements" recap email
- **Month 2:** Impact report (AOV increases, success stories)

### Marketing Angle:
"We're investing heavily in vendor success. Here's what's new:"
- Create promotions your way (discount codes)
- Know exactly when you'll be paid (transparent payouts)
- Take breaks without stress (vacation mode)
- Never miss an order (SMS notifications)
- Sell more with less effort (smart automation)

---

## 🔍 Risk Assessment

### Technical Risks:
1. **Discount code abuse** - Implement rate limits, unique codes
2. **Payout calculation errors** - Extensive testing, reconciliation
3. **SMS costs** - Set usage limits, optimize triggers
4. **Performance impact** - Monitor query performance

### Business Risks:
1. **Discount code cannibalization** - Track margin impact
2. **Vendor expectations** - Manage feature requests
3. **Support volume increase** - Prepare support docs
4. **Competitive response** - Monitor competitor features

### Mitigation:
- Start with beta group of vendors
- Gradual rollout of each feature
- Extensive documentation and tutorials
- Clear Terms of Service updates
- Admin controls for all new features

---

## 📚 Resources Needed

### Documentation:
- [ ] Discount code user guide (vendors)
- [ ] Payout schedule explainer
- [ ] Vacation mode best practices
- [ ] Notification preferences guide
- [ ] FAQ updates for all new features

### Support Materials:
- [ ] Video tutorials (2-3 minutes each)
- [ ] Email templates for announcements
- [ ] In-app tooltips and guides
- [ ] Support ticket canned responses
- [ ] Admin training materials

### Legal/Compliance:
- [ ] Updated Terms of Service (discount codes)
- [ ] Payout policy documentation
- [ ] SMS opt-in compliance (TCPA)
- [ ] Tax implications of discounts
- [ ] Refund policy with discounts

---

## 🎯 Definition of Success

### After 30 Days:
- ✅ 30%+ vendors create at least 1 discount code
- ✅ Payout-related support tickets down 50%+
- ✅ 10%+ AOV increase detected
- ✅ Vendor NPS increase by 10+ points
- ✅ Zero critical bugs in new features

### After 60 Days:
- ✅ 15-25% sustained AOV increase
- ✅ 20%+ reduction in vendor churn
- ✅ 50%+ vendors use low-stock alerts
- ✅ 10-15% abandoned cart recovery
- ✅ Vendor satisfaction at 80%+

### After 90 Days:
- ✅ 40-60% platform revenue increase
- ✅ 85%+ 90-day vendor retention
- ✅ 70%+ vendors rate platform 4+ stars
- ✅ Case studies from successful vendors
- ✅ Platform ready for Phase 2 features

---

## 🚀 Next Steps

### This Week:
1. **Monday:** Present findings to leadership, get budget approval
2. **Tuesday:** Kick off design sprint for discount codes + payouts
3. **Wednesday:** Begin technical architecture planning
4. **Thursday:** Set up analytics tracking for baseline
5. **Friday:** Recruit vendor beta testers (10-15)

### Next Week:
1. **Monday:** Start development (discount codes)
2. **Mid-week:** Design review and feedback
3. **Friday:** Beta launch to 10 vendors

### Week 3:
1. Fix beta bugs, gather feedback
2. Full launch to all vendors
3. Monitor metrics closely
4. Start Week 2 features (vacation mode, alerts)

---

**KEY TAKEAWAY:** The platform is 80% mature but missing critical vendor empowerment tools. Implementing discount codes, transparent payouts, and vacation mode will unlock massive vendor retention and AOV increases. Expected ROI: 40-60% platform revenue increase within 90 days.

---

**For detailed findings, see: MARKETPLACE_AUDIT_REPORT.md**
