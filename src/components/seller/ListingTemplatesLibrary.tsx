import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Search,
  Package,
  Palette,
  Shirt,
  Watch,
  BookOpen,
  Coffee,
  Camera,
  Heart,
  Home,
  Gift,
  Wand2
} from "lucide-react";
import { toast } from "sonner";

interface ListingTemplate {
  id: string;
  name: string;
  category: string;
  icon: any;
  title: string;
  description: string;
  price_range: { min: number; max: number };
  tags: string[];
  suggested_inventory: number;
  pickup_location_hint: string;
  pro_tips: string[];
}

interface ListingTemplatesLibraryProps {
  onTemplateSelect: (template: ListingTemplate) => void;
  className?: string;
}

const LISTING_TEMPLATES: ListingTemplate[] = [
  {
    id: "handmade-jewelry-earrings",
    name: "Handmade Earrings",
    category: "Jewelry",
    icon: Watch,
    title: "Handcrafted [Material] Earrings",
    description: `These stunning handcrafted earrings are meticulously made with premium [materials]. Each piece is unique and showcases exceptional artisan quality.

**Details:**
• Material: [Specify material - sterling silver, brass, polymer clay, etc.]
• Dimensions: Approximately [length] x [width]
• Weight: Lightweight and comfortable for all-day wear
• Findings: Hypoallergenic [ear wire/post/clip-on]
• Finish: [Polished/matte/oxidized/textured]

**Why You'll Love Them:**
These earrings are perfect for everyday wear or special occasions. The [unique feature] makes them stand out while remaining versatile enough to complement any outfit. Each pair is carefully crafted by hand in my Chicago studio.

**Care Instructions:**
Store in a dry place. Clean gently with a soft cloth. Avoid contact with water, perfumes, and lotions to maintain their beauty.

*Handmade with love in Chicago*`,
    price_range: { min: 25, max: 65 },
    tags: ["handmade", "jewelry", "earrings", "chicago", "artisan", "gift", "unique"],
    suggested_inventory: 1,
    pickup_location_hint: "Chicago neighborhood or studio location",
    pro_tips: [
      "Replace [Material] with your actual material (silver, brass, polymer clay, etc.)",
      "Add dimensions to help buyers visualize the size",
      "Mention if earrings are nickel-free or hypoallergenic",
      "Include photos showing them worn and at different angles"
    ]
  },
  {
    id: "handmade-jewelry-necklace",
    name: "Handmade Necklace",
    category: "Jewelry",
    icon: Watch,
    title: "[Style] Handcrafted Necklace",
    description: `A beautiful handcrafted necklace that combines artisan craftsmanship with timeless design. This piece is perfect for adding a touch of elegance to any look.

**Specifications:**
• Chain Length: [Specify length - 16", 18", 20", adjustable]
• Pendant Size: [dimensions if applicable]
• Materials: [Chain material, pendant material, stones if any]
• Clasp: [Lobster claw/toggle/magnetic]
• Style: [Minimalist/statement/vintage/modern]

**Design Story:**
Inspired by [your inspiration], each necklace is handcrafted with attention to every detail. The [unique element] makes this piece truly one-of-a-kind.

**Perfect For:**
• Daily wear with any outfit
• Special occasions and events
• Thoughtful gift for someone special
• Layering with other necklaces

**Care & Maintenance:**
Keep dry and store separately to prevent tangling. Gentle polishing brings back the original shine.

*Lovingly handmade in Chicago*`,
    price_range: { min: 35, max: 95 },
    tags: ["handmade", "necklace", "jewelry", "chicago", "artisan", "unique", "gift"],
    suggested_inventory: 1,
    pickup_location_hint: "Chicago studio or neighborhood",
    pro_tips: [
      "Specify if it's adjustable or comes in different lengths",
      "Mention gemstones or special materials used",
      "Show photos on a model or bust form for scale",
      "Include a photo with a ruler for size reference"
    ]
  },
  {
    id: "ceramic-bowl",
    name: "Ceramic Bowl",
    category: "Ceramics",
    icon: Coffee,
    title: "Handmade [Style] Ceramic Bowl",
    description: `This beautiful handmade ceramic bowl is wheel-thrown and carefully crafted in my Chicago pottery studio. Perfect for serving, display, or everyday use.

**Product Details:**
• Dimensions: Approximately [diameter] diameter x [height] tall
• Capacity: Holds approximately [volume]
• Glaze: [Color/finish] food-safe glaze
• Clay Body: [Stoneware/porcelain/earthenware]
• Fired to: Cone [number]
• Microwave & Dishwasher: [Yes/No]

**Handcrafted Process:**
Each bowl is individually wheel-thrown, trimmed, and glazed by hand. Slight variations in size, shape, and glaze are natural and make each piece unique.

**Versatile Uses:**
• Soup, salad, or pasta bowls
• Serving fruit or snacks
• Decorative centerpiece
• Mixing or prep bowl in the kitchen

**Care:**
[Dishwasher safe / hand wash recommended]. Avoid thermal shock by not moving from extreme temperatures.

*Wheel-thrown with care in Chicago*`,
    price_range: { min: 40, max: 85 },
    tags: ["ceramic", "pottery", "bowl", "handmade", "chicago", "kitchen", "tableware"],
    suggested_inventory: 1,
    pickup_location_hint: "Chicago studio - fragile item, pickup recommended",
    pro_tips: [
      "Include exact measurements with a ruler in photos",
      "Show the bowl in use with food for scale",
      "Mention if it's part of a set or collection",
      "Highlight unique glaze patterns or textures"
    ]
  },
  {
    id: "ceramic-mug",
    name: "Ceramic Mug",
    category: "Ceramics",
    icon: Coffee,
    title: "Handmade [Design] Ceramic Mug",
    description: `Start your morning right with this handcrafted ceramic mug, wheel-thrown and glazed in my Chicago pottery studio. Each mug is unique and made with love.

**Features:**
• Capacity: Approximately [12-16 oz]
• Dimensions: [height] tall x [diameter] diameter
• Handle: Comfortable, ergonomic design
• Glaze: [Color/pattern] food-safe glaze
• Base: Unglazed foot for stability
• Care: Dishwasher & microwave safe

**Artisan Quality:**
This mug is hand-thrown on the pottery wheel using quality [stoneware/porcelain]. The [glaze description] creates a beautiful, durable finish that gets better with age.

**Perfect For:**
• Your morning coffee or evening tea
• Hot chocolate and warm beverages
• A thoughtful, handmade gift
• Adding artisan charm to your kitchen

**About the Glaze:**
[Describe the glaze - color, finish, special effects]. Each firing creates subtle variations, making your mug one-of-a-kind.

*Crafted with intention in Chicago*`,
    price_range: { min: 28, max: 55 },
    tags: ["ceramic", "mug", "coffee", "tea", "handmade", "chicago", "pottery"],
    suggested_inventory: 1,
    pickup_location_hint: "Chicago pottery studio",
    pro_tips: [
      "Photo tip: Show the mug with steam/hot beverage",
      "Mention weight if it's particularly lightweight or sturdy",
      "Include capacity measurement (12oz, 16oz, etc.)",
      "Show the handle detail and how it's attached"
    ]
  },
  {
    id: "tote-bag",
    name: "Handmade Tote Bag",
    category: "Textiles",
    icon: Shirt,
    title: "[Style] Handmade Tote Bag",
    description: `A versatile, handcrafted tote bag perfect for everyday adventures. Made with quality materials and thoughtful design in Chicago.

**Bag Specifications:**
• Dimensions: [Width] W x [Height] H x [Depth] D
• Strap Drop: [Length from shoulder to top of bag]
• Material: [Canvas/cotton/linen/leather]
• Lining: [Lined/unlined, material if lined]
• Closure: [Open top/zipper/magnetic snap]
• Pockets: [Interior/exterior pocket details]

**Construction:**
Expertly sewn with reinforced stitching at stress points for durability. [Describe any special techniques or details like French seams, grommets, etc.]

**What Fits:**
Spacious enough for a laptop, books, groceries, or daily essentials. Perfect size for:
• 13-15" laptop or tablet
• Books and notebooks
• Groceries and market finds
• Gym clothes and water bottle

**Sustainable Choice:**
Made from [eco-friendly/natural/upcycled] materials. Reusable and built to last, reducing single-use bag waste.

**Care:** [Spot clean / machine wash cold, hang dry]

*Sewn with care in Chicago*`,
    price_range: { min: 35, max: 75 },
    tags: ["tote bag", "bag", "handmade", "chicago", "sustainable", "eco-friendly", "reusable"],
    suggested_inventory: 1,
    pickup_location_hint: "Chicago - flexible pickup locations",
    pro_tips: [
      "Show the bag with items inside to demonstrate capacity",
      "Include a photo of someone carrying it for scale",
      "Mention weight capacity if it's reinforced",
      "Highlight unique patterns, prints, or customizations"
    ]
  },
  {
    id: "art-print",
    name: "Art Print",
    category: "Art",
    icon: Palette,
    title: "[Subject/Title] Art Print",
    description: `A beautiful [medium] print of my original artwork, professionally reproduced to museum-quality standards.

**Print Details:**
• Size: [Width x Height inches]
• Medium: [Giclee/Fine art/Digital/Lithograph]
• Paper: [Type of paper - archival, cotton rag, etc.]
• Finish: [Matte/glossy/semi-gloss]
• Edition: [Limited edition of X / Open edition]
• Signed: [Yes, on front/back / No]

**About the Artwork:**
[Describe the piece - what inspired it, techniques used, mood/feeling it evokes]. This print beautifully captures [key elements of the artwork].

**Quality Guarantee:**
Printed using archival inks on museum-quality paper for longevity and color accuracy. This print will last for generations when properly cared for and framed.

**Display:**
• Fits standard [size] frames
• Ready to frame (frame not included)
• Looks stunning in [suggest rooms/styles]

**Shipping:**
Carefully packaged in protective sleeve with rigid backing to ensure it arrives in perfect condition.

*Original art created in Chicago*`,
    price_range: { min: 20, max: 150 },
    tags: ["art print", "wall art", "artwork", "chicago", "decor", "gift", "original"],
    suggested_inventory: 5,
    pickup_location_hint: "Chicago studio - ships well also",
    pro_tips: [
      "Show the print in a frame or on a wall for context",
      "Include a close-up to show print quality and detail",
      "Mention if you offer different sizes",
      "Consider offering framing as an add-on service"
    ]
  },
  {
    id: "scented-candle",
    name: "Handpoured Candle",
    category: "Home",
    icon: Home,
    title: "[Scent Name] Handpoured Soy Candle",
    description: `Fill your home with the warm, inviting scent of this handpoured soy candle. Each candle is carefully crafted in small batches in Chicago.

**Candle Details:**
• Size: [oz] candle in [container description]
• Burn Time: Approximately [hours]
• Wax: 100% natural soy wax
• Wick: Cotton, lead-free
• Container: [Glass jar/tin/ceramic] - [reusable/recyclable]
• Scent: [Detailed scent description]

**Scent Profile:**
Top Notes: [Scents you smell first]
Middle Notes: [Heart of the fragrance]
Base Notes: [Lasting scent]

**Clean & Natural:**
Made with premium fragrance oils and natural soy wax. Free from parabens, phthalates, and petroleum. Eco-friendly and clean-burning.

**Perfect For:**
• Creating ambiance in any room
• Self-care rituals and relaxation
• Thoughtful housewarming gift
• Adding natural fragrance to your space

**Burn Instructions:**
Trim wick to 1/4" before each use. Burn for 2-3 hours minimum to prevent tunneling. Never leave unattended.

*Handpoured with intention in Chicago*`,
    price_range: { min: 18, max: 40 },
    tags: ["candle", "soy candle", "handmade", "chicago", "home", "gift", "scented"],
    suggested_inventory: 3,
    pickup_location_hint: "Chicago - pickup or local delivery available",
    pro_tips: [
      "Clearly describe the scent - what does it smell like?",
      "Include burn time to justify the price",
      "Show the candle lit and unlit",
      "Mention if the container is reusable after the candle"
    ]
  },
  {
    id: "handmade-soap",
    name: "Handmade Soap",
    category: "Bath & Body",
    icon: Heart,
    title: "[Scent/Type] Handmade Soap Bar",
    description: `Luxurious handmade soap crafted with natural ingredients and essential oils. Gentle, nourishing, and perfect for daily use.

**Soap Details:**
• Weight: Approximately [oz] bar
• Size: [Length x Width x Height]
• Type: [Cold process/hot process/melt & pour]
• Scent: [Natural/essential oils used]
• Ingredients: [List main oils and butters]
• Skin Type: [All skin types/sensitive/dry/oily]

**Natural Ingredients:**
Made with a nourishing blend of [coconut oil, olive oil, shea butter, etc.]. Free from harsh chemicals, sulfates, and synthetic fragrances.

**Benefits:**
• [Moisturizing/clarifying/exfoliating]
• Rich, creamy lather
• Long-lasting bar
• Gentle on sensitive skin
• Palm-free and cruelty-free

**Scent Description:**
[Describe the fragrance - is it floral, earthy, citrus? What mood does it create?]

**Usage:**
Create lather with water and use for hands, body, or face. Store in a dry soap dish between uses to extend the life of your bar.

**Cure Time:** Cured for [weeks] for optimal hardness and mildness.

*Handcrafted in small batches in Chicago*`,
    price_range: { min: 8, max: 15 },
    tags: ["soap", "handmade", "natural", "bath", "body", "chicago", "skincare"],
    suggested_inventory: 5,
    pickup_location_hint: "Chicago - can ship easily",
    pro_tips: [
      "List all ingredients for transparency",
      "Mention if vegan or if made with goat milk/tallow",
      "Show the soap's lather in use",
      "Include weight - heavier bars last longer"
    ]
  },
  {
    id: "knit-scarf",
    name: "Hand-Knit Scarf",
    category: "Textiles",
    icon: Shirt,
    title: "Hand-Knit [Style/Pattern] Scarf",
    description: `Stay cozy with this beautifully hand-knit scarf. Each piece is knitted with care using premium yarn in Chicago.

**Scarf Specifications:**
• Dimensions: Approximately [length] long x [width] wide
• Yarn: [Fiber content - merino wool, alpaca, cotton, blend]
• Weight: [Lace/fingering/sport/worsted/bulky]
• Pattern: [Stockinette/cable/lace/ribbed]
• Color: [Describe the color(s)]
• Care: [Hand wash/machine washable]

**Knitting Details:**
Expertly hand-knitted using [technique]. The [pattern/stitch] creates a [texture description] that's both beautiful and functional.

**Warmth & Comfort:**
[Fiber type] provides [warmth level] without being bulky. Perfect for [season/weather conditions]. The soft texture feels luxurious against your skin.

**Styling Ideas:**
• Wear loosely draped for a casual look
• Wrap twice for extra warmth
• Perfect for layering with coats and jackets
• Unisex design works for everyone

**Care Instructions:**
[Hand wash in cool water with gentle soap / Machine wash gentle cycle]. Lay flat to dry. Do not wring or twist.

*Knitted stitch by stitch in Chicago*`,
    price_range: { min: 45, max: 95 },
    tags: ["scarf", "knit", "handmade", "winter", "chicago", "warm", "cozy"],
    suggested_inventory: 1,
    pickup_location_hint: "Chicago neighborhood",
    pro_tips: [
      "Show the scarf being worn to demonstrate drape",
      "Mention fiber content - important for allergies",
      "Include close-up of stitch pattern",
      "State if it's machine washable - big selling point"
    ]
  },
  {
    id: "cutting-board",
    name: "Wooden Cutting Board",
    category: "Kitchen",
    icon: Package,
    title: "Handcrafted [Wood Type] Cutting Board",
    description: `A beautiful, functional cutting board handcrafted from premium [wood type]. Built to last and perfect for any kitchen.

**Board Details:**
• Dimensions: [Length x Width x Thickness]
• Wood: [Type - maple, walnut, cherry, etc.]
• Construction: [Edge grain/end grain/face grain]
• Finish: Food-safe [mineral oil/board butter/wax]
• Features: [Juice groove/handles/feet if applicable]
• Weight: [Approximate weight]

**Craftsmanship:**
Each board is carefully handcrafted in my Chicago woodshop. [Describe joinery, sanding process, attention to detail]. The natural grain patterns make each board unique.

**Why [Wood Type]?**
[Wood type] is ideal for cutting boards because it's [hard-wearing/naturally antimicrobial/beautiful grain/etc.]. It won't dull your knives and will develop a beautiful patina over time.

**Perfect For:**
• Meal prep and chopping
• Serving cheese and charcuterie
• Beautiful kitchen display piece
• Thoughtful wedding or housewarming gift

**Care & Maintenance:**
Hand wash with mild soap and dry immediately. Condition monthly with food-safe mineral oil or board butter to maintain beauty and prevent cracking.

*Handcrafted in Chicago with traditional woodworking techniques*`,
    price_range: { min: 55, max: 150 },
    tags: ["cutting board", "wood", "kitchen", "handmade", "chicago", "cooking", "gift"],
    suggested_inventory: 1,
    pickup_location_hint: "Chicago woodshop",
    pro_tips: [
      "Show the board with food on it for styling",
      "Include dimensions - buyers need to know if it fits their space",
      "Mention wood type - each has different properties",
      "Offer care products like board butter as an add-on"
    ]
  },
];

export const ListingTemplatesLibrary = ({ onTemplateSelect, className }: ListingTemplatesLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories = Array.from(new Set(LISTING_TEMPLATES.map(t => t.category)));

  const filteredTemplates = LISTING_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: ListingTemplate) => {
    onTemplateSelect(template);
    setDialogOpen(false);
    toast.success(`Template "${template.name}" applied! Customize it to make it your own.`);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className}`}>
          <Sparkles className="h-4 w-4" />
          Use a Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Listing Templates
          </DialogTitle>
          <DialogDescription>
            Choose a pre-built template to quickly create your listing. All templates are customizable!
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="space-y-4 pb-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No templates found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium text-muted-foreground mb-1">Title Template:</p>
                        <p className="text-xs italic">"{template.title}"</p>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium text-muted-foreground mb-1">Price Range:</p>
                        <p className="text-xs">${template.price_range.min} - ${template.price_range.max}</p>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium text-muted-foreground mb-1">Includes:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 4).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.tags.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleUseTemplate(template)}
                        className="w-full mt-2"
                        size="sm"
                      >
                        Use This Template
                      </Button>

                      {template.pro_tips.length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            💡 Pro Tips ({template.pro_tips.length})
                          </summary>
                          <ul className="mt-2 space-y-1 pl-4 list-disc text-muted-foreground">
                            {template.pro_tips.slice(0, 2).map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Helper Text */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>💡 Tip:</strong> Templates provide a great starting point. Customize the title, description, and details to match your specific product!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
