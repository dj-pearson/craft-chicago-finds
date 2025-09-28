# 🤖 AI & Social Media Management Setup Guide

## 📋 Overview

Your Craft Local marketplace now includes a comprehensive AI-powered Social Media Management system integrated into the Admin Dashboard. This system leverages Claude Sonnet 4 for content generation and provides centralized AI model management.

## 🔧 **SETUP REQUIREMENTS**

### 1. **Supabase Environment Variables**

Add these environment variables to your Supabase project:

```bash
# In Supabase Dashboard > Settings > API > Environment Variables
CLAUDE_API_KEY=your_claude_api_key_here
```

**Important**: The system uses `x-api-key` header (not `Bearer`) as specifically requested.

### 2. **Database Migration**

Run the database migration to create the required tables:

```bash
# This creates:
# - ai_settings (centralized AI configuration)
# - social_media_campaigns (campaign management)
# - social_media_posts (post management)
# - social_media_templates (reusable templates)
# - ai_generation_logs (usage tracking)

supabase db push
```

### 3. **Deploy Supabase Functions**

Deploy the new Edge Functions:

```bash
supabase functions deploy ai-generate-content
supabase functions deploy generate-social-campaign
```

## 🎯 **FEATURES IMPLEMENTED**

### **✅ Centralized AI Management**

- **Single Configuration Point**: All AI settings managed in one place
- **Model Flexibility**: Easy switching between Claude models
- **Test Function**: Built-in AI model testing
- **Usage Tracking**: Complete logs of all AI generations
- **Error Handling**: Comprehensive error logging and recovery

### **✅ Social Media Management**

- **Campaign Management**: Create and manage marketing campaigns
- **AI Content Generation**: Generate posts using Claude
- **Multi-Platform Support**: Facebook, Instagram, Twitter, LinkedIn
- **Template System**: Reusable content templates
- **Scheduling**: Schedule posts for optimal timing
- **30-Day Plan Integration**: Based on your Social.md strategy

### **✅ Admin Dashboard Integration**

- **AI Settings Tab**: Configure models, test connections
- **Social Tab**: Manage campaigns and posts
- **Real-time Status**: Live model status and testing
- **Usage Analytics**: Track AI usage and costs

## 🚀 **HOW TO USE**

### **Step 1: Configure AI Settings**

1. Go to **Admin Dashboard > AI Settings**
2. Configure your preferred Claude model:
   - **Model**: `claude-3-5-sonnet-20241022` (recommended)
   - **Max Tokens**: `4000` (default)
   - **Temperature**: `0.7` (creative but focused)
   - **System Prompt**: Customize AI behavior
3. **Test the connection** using the built-in test function
4. **Save settings** to activate

### **Step 2: Create Social Media Campaigns**

1. Go to **Admin Dashboard > Social**
2. Select your city from the dropdown
3. Click **"Create Campaign"**
4. Fill in campaign details:
   - **Name**: e.g., "Chicago Launch Countdown"
   - **Type**: Launch, Seasonal, Promotional, etc.
   - **Dates**: Start and end dates
   - **Audience**: Target demographics
   - **Goals**: Campaign objectives
   - **Hashtags**: Relevant tags

### **Step 3: Generate AI Content**

1. In the **Posts** tab, click **"Create Post"**
2. Select platform and post type
3. Enter an **AI Prompt** describing the content you want
4. Click the **✨ Sparkles button** to generate content
5. Review and edit the generated content
6. Schedule or save as draft

### **Step 4: Monitor Performance**

- **AI Settings**: View recent generations and token usage
- **Social Dashboard**: Track campaign performance
- **Generation Logs**: Monitor AI usage and costs

## 🎨 **CONTENT GENERATION EXAMPLES**

### **Launch Countdown Posts**

```
Prompt: "Create an exciting countdown post for Chicago marketplace launching in 5 days. Focus on local artisans and unique gifts."

Generated: "🎉 Only 5 days until Chicago Makers Marketplace launches! Get ready to discover incredible handmade treasures from your local neighbors. From custom jewelry to artisan soaps, our city's creativity is about to shine! ✨ #ChicagoMakers #CraftLocal #ShopLocal #SupportSmallBusiness"
```

### **Vendor Spotlight**

```
Prompt: "Write a vendor spotlight post featuring a local jewelry maker named Sarah who creates eco-friendly pieces."

Generated: "✨ Vendor Spotlight: Meet Sarah from EcoGems Chicago! 💎 Sarah transforms recycled metals into stunning, sustainable jewelry that tells a story. Each piece is handcrafted with love and environmental consciousness. Find her beautiful creations on Chicago Makers Marketplace starting Nov 1st! 🌱 #VendorSpotlight #EcoFriendly #ChicagoMakers #SustainableJewelry"
```

## 📊 **AI MODEL CONFIGURATION**

### **Recommended Settings**

- **Model**: `claude-sonnet-4-20250514` (Claude Sonnet 4 - latest, most capable)
- **Max Tokens**: `4000` (good balance of length and cost)
- **Temperature**: `0.7` (creative but consistent)
- **System Prompt**:

```
You are a social media expert helping create engaging content for local craft marketplaces. Focus on community building, supporting local artisans, and encouraging authentic engagement. Keep content friendly, creative, and supportive. Always include relevant hashtags and calls-to-action.
```

### **Alternative Models**

- **Claude 3.5 Sonnet**: `claude-3-5-sonnet-20241022` (previous generation)
- **Claude 3 Sonnet**: `claude-3-sonnet-20240229` (balanced)
- **Claude 3 Haiku**: `claude-3-haiku-20240307` (faster, cheaper)

## 🔒 **SECURITY & PERMISSIONS**

### **Access Control**

- **AI Settings**: Admin only
- **Social Management**: Admin and City Moderators
- **Content Generation**: Admin and City Moderators
- **Logs**: Users see their own, Admins see all

### **API Security**

- Uses `x-api-key` header (as specifically requested, NOT Bearer)
- Supabase Secrets for API key storage
- Row Level Security (RLS) on all tables
- Comprehensive error logging

## 📈 **USAGE MONITORING**

### **AI Generation Logs**

Track every AI interaction:

- **User**: Who generated content
- **Model**: Which AI model was used
- **Tokens**: Cost tracking
- **Success/Failure**: Error monitoring
- **Type**: Content type generated

### **Performance Metrics**

- Token usage per user/campaign
- Success rates by model
- Content generation frequency
- Campaign effectiveness

## 🎯 **30-DAY LAUNCH STRATEGY**

The system implements your Social.md strategy:

### **Week 1: Teasers & Brand Introduction**

- Mystery teasers
- Problem/solution posts
- Brand announcement
- Vendor benefits
- Community highlights

### **Week 2: Education & Engagement**

- Holiday motivation
- Team introductions
- FAQ posts
- Product showcases
- Partnership announcements

### **Week 3: Countdown & Promotions**

- Formal countdown begins
- Giveaway/contest
- Feature highlights
- Testimonials
- Launch event invites

### **Week 4: Final Push & Launch**

- Daily countdown
- Vendor spotlights
- Community engagement
- Launch day celebration
- Thank you posts

## 🔧 **TROUBLESHOOTING**

### **AI Test Fails**

1. Check `CLAUDE_API_KEY` in Supabase secrets
2. Verify API endpoint is correct
3. Check model name spelling
4. Review system prompt for issues

### **Content Not Generating**

1. Ensure user has proper permissions
2. Check AI settings are active
3. Verify prompt is clear and specific
4. Review error logs in AI Settings

### **Database Errors**

1. Ensure migrations are applied
2. Check RLS policies
3. Verify user roles are set correctly

## 🚀 **NEXT STEPS**

1. **Configure Claude API Key** in Supabase
2. **Run database migrations**
3. **Deploy Supabase functions**
4. **Test AI integration** in Admin Dashboard
5. **Create your first campaign**
6. **Generate sample content**
7. **Launch your social media strategy**

## 📞 **SUPPORT**

The system is fully integrated and ready for production use. All components follow your existing codebase patterns and include comprehensive error handling and logging.

**Your Chicago Makers Marketplace now has professional-grade AI-powered social media management! 🎉**
