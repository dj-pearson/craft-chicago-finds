import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Sparkles,
  Package,
  Heart,
  Lightbulb,
  Calendar,
  Users,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface BlogTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  meta_description: string;
}

const BLOG_TEMPLATES: BlogTemplate[] = [
  {
    id: "new-product-spotlight",
    name: "New Product Spotlight",
    description: "Showcase a new product with storytelling and details",
    icon: Package,
    category: "Product",
    title: "[Product Name]: Our Latest Handcrafted Creation",
    content: `# Introducing [Product Name]

We're thrilled to unveil our latest creation: **[Product Name]**. This [product type] represents [timeframe] of craftsmanship, experimentation, and passion.

## The Inspiration

[Describe what inspired this product - was it a customer request, a personal passion, seasonal inspiration, etc.]

## The Making Process

Creating each [product] is a labor of love:

1. **Material Selection**: We carefully source [materials] from [suppliers/locations]
2. **Crafting**: Each piece is [handmade/wheel-thrown/sewn/etc.] with attention to every detail
3. **Finishing**: [Describe finishing process - glazing, polishing, etc.]

The entire process takes approximately [time], ensuring exceptional quality.

## What Makes It Special

- **[Feature 1]**: [Explanation]
- **[Feature 2]**: [Explanation]
- **[Feature 3]**: [Explanation]

## Perfect For

This piece is ideal for:
- [Use case 1]
- [Use case 2]
- [Use case 3]

## Get Yours Today

[Product Name] is now available in our shop. [Price/availability information]. Each piece is unique, so order soon!

*[Call to action - link to product]*`,
    keywords: ["handmade", "artisan", "new product", "chicago", "craft"],
    meta_description: "Discover our latest handcrafted creation. Learn about the inspiration and process behind this unique artisan product."
  },
  {
    id: "behind-the-scenes",
    name: "Behind the Scenes",
    description: "Share your creative process and studio story",
    icon: Users,
    category: "Maker Story",
    title: "Behind the Scenes: A Day in [Your Studio Name]",
    content: `# A Day in the Life at [Studio Name]

Ever wondered what goes into creating the handmade items you love? Let me take you behind the scenes of my Chicago studio.

## Morning: Setting Up

My day starts at [time] with [morning routine]. I prepare my workspace by [setup activities].

The studio is located in [neighborhood], and the morning light that streams through [description] is perfect for [activities].

## The Creative Process

### Planning
Each day, I review orders and plan which pieces to create. Today's lineup includes:
- [Item 1]
- [Item 2]
- [Item 3]

### Making
The actual creation process is where the magic happens. For [product type], I:

1. [Step 1]
2. [Step 2]
3. [Step 3]

There's something meditative about [describe the repetitive or satisfying aspects of your craft].

## Afternoon: Quality Control

After [making process], each piece undergoes careful inspection. I check for:
- [Quality factor 1]
- [Quality factor 2]
- [Quality factor 3]

Only pieces that meet my standards make it to the shop.

## Evening: Packing & Shipping

The end of the day is dedicated to preparing orders. Each item is:
- Carefully wrapped in [packaging]
- Packed with [materials]
- Shipped with a personal thank-you note

## What I Love Most

The best part of my day is [describe your favorite aspect - maybe it's the creative flow, customer messages, seeing a piece come together, etc.].

Being part of Chicago's maker community means [describe community aspect].

## Visit My Shop

Want to see more? Browse my current collection at [shop link]. Each piece carries a bit of this daily dedication and love.`,
    keywords: ["handmade", "maker", "artisan", "studio", "chicago", "behind the scenes"],
    meta_description: "Take a peek behind the scenes of our Chicago studio and see how we create handmade products with care and craftsmanship."
  },
  {
    id: "how-to-guide",
    name: "How-To Guide",
    description: "Educational content teaching customers something useful",
    icon: Lightbulb,
    category: "Educational",
    title: "How to [Action]: A Beginner's Guide",
    content: `# How to [Action]: Everything You Need to Know

Whether you're new to [topic] or looking to improve your skills, this guide will help you [achieve goal].

## What You'll Need

**Materials:**
- [Material 1]
- [Material 2]
- [Material 3]

**Tools:**
- [Tool 1]
- [Tool 2]
- [Tool 3]

## Step-by-Step Instructions

### Step 1: [First Step]
[Detailed instructions for step 1]

**Pro Tip:** [Helpful tip for beginners]

### Step 2: [Second Step]
[Detailed instructions for step 2]

**Common Mistake to Avoid:** [Describe common mistake and how to avoid it]

### Step 3: [Third Step]
[Detailed instructions for step 3]

### Step 4: [Fourth Step]
[Detailed instructions for step 4]

## Troubleshooting

**Problem: [Common issue]**
*Solution:* [How to fix it]

**Problem: [Common issue]**
*Solution:* [How to fix it]

## Taking It Further

Once you've mastered the basics, try:
- [Advanced technique 1]
- [Advanced technique 2]
- [Advanced technique 3]

## Recommended Products

Looking for quality materials? Check out:
- [Your product 1] - [Why it's great]
- [Your product 2] - [Why it's great]

## Final Thoughts

[Topic] is a rewarding skill that [benefits]. Don't be discouraged if your first attempts aren't perfect - practice makes progress!

**Have questions?** Drop a comment below or reach out through my shop.`,
    keywords: ["how to", "tutorial", "guide", "beginner", "tips"],
    meta_description: "Learn how to [action] with this comprehensive beginner's guide. Step-by-step instructions and expert tips included."
  },
  {
    id: "seasonal-guide",
    name: "Seasonal Gift Guide",
    description: "Curate products for holidays or seasons",
    icon: Calendar,
    category: "Seasonal",
    title: "[Season/Holiday] Gift Guide: Handmade Gifts They'll Love",
    content: `# The Ultimate [Season/Holiday] Gift Guide

Finding the perfect gift can be challenging. Skip the mass-produced items and give something truly special this year - handmade with love.

## For the Home Chef

**[Product Name]** - $[Price]
[Description of product and why it's perfect for this person]

**[Product Name]** - $[Price]
[Description of product and why it's perfect for this person]

## For the Design Enthusiast

**[Product Name]** - $[Price]
[Description of product and why it's perfect for this person]

**[Product Name]** - $[Price]
[Description of product and why it's perfect for this person]

## For the Self-Care Lover

**[Product Name]** - $[Price]
[Description of product and why it's perfect for this person]

**[Product Name]** - $[Price]
[Description of product and why it's perfect for this person]

## For the Plant Parent

**[Product Name]** - $[Price]
[Description of product and why it's perfect for this person]

## Gift Sets & Bundles

Can't decide? Our curated gift sets combine complementary items:

- **[Bundle Name]**: [Items included] - $[Price]
- **[Bundle Name]**: [Items included] - $[Price]

## Personalization Options

Make it extra special! Most items can be personalized with:
- Custom colors
- Monogramming
- Gift messages

## Shipping & Deadlines

**Order by [date]** for guaranteed [holiday] delivery
- Standard shipping: [timeframe]
- Express shipping: [timeframe]
- Local pickup: Available in [Chicago neighborhoods]

## Why Handmade?

When you give handmade gifts, you're:
- Supporting local artisans
- Giving one-of-a-kind items
- Choosing quality over quantity
- Sharing something made with love

## Start Shopping

Browse the full collection at [shop link]. Need help choosing? Reach out - I'm happy to help you find the perfect gift!

*Happy [season/holiday] from our studio to your home!*`,
    keywords: ["gift guide", "holiday", "handmade gifts", "artisan gifts", "unique presents"],
    meta_description: "Find the perfect handmade gifts this [season/holiday]. Curated selection of unique artisan items from local Chicago makers."
  },
  {
    id: "customer-story",
    name: "Customer Spotlight",
    description: "Feature a customer and their experience",
    icon: Heart,
    category: "Maker Story",
    title: "Customer Spotlight: [Customer Name]'s Story",
    content: `# Customer Spotlight: Meet [Customer Name]

One of the best parts of being a maker is connecting with the wonderful people who appreciate handmade items. Today, I'm excited to share [Customer Name]'s story.

## The Discovery

[Customer Name] first found my shop [how they found you - browsing online, craft fair, recommendation, etc.].

*"[Quote from customer about first impression]"* - [Customer Name]

## The Perfect Find

[He/She/They] was looking for [what they were searching for] and discovered [product name].

### Why It Resonated

According to [Customer Name]:

> [Longer quote about why the product appealed to them, what made it special, how it fit their needs]

## The Experience

[Customer Name] shared that [their experience with the purchase process, packaging, quality, etc.].

### In Their Own Words

**Q: What made you choose handmade over mass-produced?**
*A: [Answer]*

**Q: How do you use/display [product]?**
*A: [Answer]*

**Q: Would you recommend our shop to others?**
*A: [Answer]*

## The Impact

Hearing from customers like [Customer Name] reminds me why I love what I do. [Personal reflection on what this feedback means to you].

## See What They Purchased

Interested in [product]? [Link to product with brief description]

Similar items that other customers love:
- [Product 1]
- [Product 2]
- [Product 3]

## Share Your Story

Are you a customer with a story to share? I'd love to hear from you! Reach out through the shop or comment below.

*Thank you, [Customer Name], for being part of our community!*`,
    keywords: ["customer story", "testimonial", "handmade", "artisan", "review"],
    meta_description: "Meet [Customer Name] and discover why they love handmade artisan products. Real customer stories and experiences."
  },
  {
    id: "market-trends",
    name: "Market Trends & Insights",
    description: "Share industry insights and trends",
    icon: TrendingUp,
    category: "Educational",
    title: "[Year] Trends in [Your Craft Category]",
    content: `# [Year] Trends in [Craft Category]: What's Hot in Handmade

As we progress through [year], exciting trends are shaping the [craft category] world. Here's what I'm seeing and creating in my Chicago studio.

## Trend #1: [Trend Name]

[Description of trend and why it's popular]

### How It Shows Up in Our Work
We're incorporating this trend through:
- [Example 1]
- [Example 2]
- [Example 3]

**Shop the trend**: [Product links]

## Trend #2: [Trend Name]

[Description of trend and why it matters]

### Why Customers Love It
[Explain the appeal - is it sustainable, aesthetic, functional, etc.?]

### Our Take
[How you're interpreting this trend in your products]

**Available now**: [Product links]

## Trend #3: [Trend Name]

[Description of trend]

### The Chicago Angle
In our local market, this trend is especially popular because [local relevance].

## Timeless vs. Trendy

While it's fun to incorporate trends, we believe in:
- Quality craftsmanship that lasts
- Classic designs with staying power
- Sustainable practices over fast fashion

## Looking Ahead

What's next for [craft category]? I predict:
- [Prediction 1]
- [Prediction 2]
- [Prediction 3]

## Your Input Matters

What trends are you loving? What would you like to see more of? Drop a comment or send a message - customer feedback shapes what I create next!

## Explore the Collection

See how these trends come to life in our current collection: [Shop link]

*Stay creative,*
*[Your Name]*`,
    keywords: ["trends", "handmade trends", "artisan", "craft", "market insights"],
    meta_description: "Discover the latest trends in [craft category]. Expert insights from a Chicago artisan on what's hot in handmade."
  },
];

interface BlogQuickTemplatesProps {
  onTemplateSelect: (template: BlogTemplate) => void;
  className?: string;
}

export const BlogQuickTemplates = ({ onTemplateSelect, className }: BlogQuickTemplatesProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = Array.from(new Set(BLOG_TEMPLATES.map(t => t.category)));

  const filteredTemplates = BLOG_TEMPLATES.filter(template => {
    return selectedCategory === "all" || template.category === selectedCategory;
  });

  const handleUseTemplate = (template: BlogTemplate) => {
    onTemplateSelect(template);
    setDialogOpen(false);
    toast.success(`Template "${template.name}" applied! Customize it to make it your own.`);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
          <Sparkles className="h-4 w-4" />
          Quick Start Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Blog Quick Start Templates
          </DialogTitle>
          <DialogDescription>
            Choose a pre-written template to speed up your blog post creation
          </DialogDescription>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap pb-3 border-b">
          <Button
            size="sm"
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
          >
            All Templates
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>

                    <div className="text-xs">
                      <p className="font-medium text-muted-foreground mb-1">Title Preview:</p>
                      <p className="italic line-clamp-1">"{template.title}"</p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {template.keywords.slice(0, 4).map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full mt-2"
                      size="sm"
                    >
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Helper Text */}
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground">
            <strong>💡 Tip:</strong> Templates provide a starting structure. Replace [bracketed placeholders] with your specific content, add your voice, and customize to match your brand!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
