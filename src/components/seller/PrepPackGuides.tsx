import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  Shield, 
  Star,
  Clock,
  DollarSign,
  Camera,
  Scissors,
  Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrepPackGuidesProps {
  category?: string;
  className?: string;
}

interface GuideItem {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
}

interface CategoryGuide {
  category: string;
  icon: React.ReactNode;
  color: string;
  preparation: GuideItem[];
  packaging: GuideItem[];
  shipping_tips: GuideItem[];
  damage_prevention: GuideItem[];
}

const CATEGORY_GUIDES: Record<string, CategoryGuide> = {
  ceramics: {
    category: "Ceramics & Pottery",
    icon: <Palette className="h-4 w-4" />,
    color: "bg-orange-50 text-orange-700 border-orange-200",
    preparation: [
      { id: "ceramic-1", text: "Ensure all pieces are completely dry and cured", priority: "high" },
      { id: "ceramic-2", text: "Check for any hairline cracks or chips", priority: "high" },
      { id: "ceramic-3", text: "Clean with soft, dry cloth to remove dust", priority: "medium" },
      { id: "ceramic-4", text: "Take photos showing texture and glazing details", priority: "medium" },
    ],
    packaging: [
      { id: "ceramic-pack-1", text: "Wrap each piece individually in bubble wrap", priority: "high" },
      { id: "ceramic-pack-2", text: "Use tissue paper for delicate glazed surfaces", priority: "high" },
      { id: "ceramic-pack-3", text: "Fill hollow spaces with packing material", priority: "high" },
      { id: "ceramic-pack-4", text: "Double-box fragile items", priority: "medium" },
      { id: "ceramic-pack-5", text: "Mark 'FRAGILE' clearly on all sides", priority: "high" },
    ],
    shipping_tips: [
      { id: "ceramic-ship-1", text: "Use 'Fragile' and 'This Side Up' stickers", priority: "high" },
      { id: "ceramic-ship-2", text: "Consider insurance for valuable pieces", priority: "medium" },
      { id: "ceramic-ship-3", text: "Choose ground shipping over air when possible", priority: "low" },
    ],
    damage_prevention: [
      { id: "ceramic-damage-1", text: "Never pack multiple ceramic pieces touching", priority: "high" },
      { id: "ceramic-damage-2", text: "Use corner protectors for square/rectangular pieces", priority: "medium" },
      { id: "ceramic-damage-3", text: "Include care instructions card", priority: "low" },
    ]
  },
  textiles: {
    category: "Textiles & Fiber",
    icon: <Scissors className="h-4 w-4" />,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    preparation: [
      { id: "textile-1", text: "Steam or press to remove wrinkles", priority: "medium" },
      { id: "textile-2", text: "Check for loose threads or unfinished edges", priority: "high" },
      { id: "textile-3", text: "Fold neatly or roll to prevent creasing", priority: "medium" },
      { id: "textile-4", text: "Include fabric composition and care labels", priority: "high" },
    ],
    packaging: [
      { id: "textile-pack-1", text: "Use tissue paper to prevent color transfer", priority: "medium" },
      { id: "textile-pack-2", text: "Fold along natural lines to minimize creases", priority: "medium" },
      { id: "textile-pack-3", text: "Use poly mailers for lightweight items", priority: "low" },
      { id: "textile-pack-4", text: "Include lavender sachet for natural freshness", priority: "low" },
    ],
    shipping_tips: [
      { id: "textile-ship-1", text: "Vacuum-seal bulky items to reduce shipping cost", priority: "medium" },
      { id: "textile-ship-2", text: "Use padded envelopes for small accessories", priority: "low" },
      { id: "textile-ship-3", text: "Consider flat-rate boxes for heavy quilts/blankets", priority: "medium" },
    ],
    damage_prevention: [
      { id: "textile-damage-1", text: "Protect from moisture with plastic liner", priority: "high" },
      { id: "textile-damage-2", text: "Avoid folding delicate lace or embroidery", priority: "high" },
      { id: "textile-damage-3", text: "Include washing/care instructions", priority: "medium" },
    ]
  },
  jewelry: {
    category: "Jewelry & Accessories",
    icon: <Star className="h-4 w-4" />,
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    preparation: [
      { id: "jewelry-1", text: "Polish metal components to shine", priority: "medium" },
      { id: "jewelry-2", text: "Check all clasps and connections", priority: "high" },
      { id: "jewelry-3", text: "Organize by type (necklaces, earrings, etc.)", priority: "low" },
      { id: "jewelry-4", text: "Take detailed photos of unique features", priority: "medium" },
    ],
    packaging: [
      { id: "jewelry-pack-1", text: "Use individual jewelry boxes or pouches", priority: "high" },
      { id: "jewelry-pack-2", text: "Prevent tangling with tissue paper separators", priority: "high" },
      { id: "jewelry-pack-3", text: "Include anti-tarnish strips for silver", priority: "medium" },
      { id: "jewelry-pack-4", text: "Use padded jewelry boxes for delicate pieces", priority: "medium" },
    ],
    shipping_tips: [
      { id: "jewelry-ship-1", text: "Use tracking and signature confirmation", priority: "high" },
      { id: "jewelry-ship-2", text: "Consider insurance for valuable pieces ($50+)", priority: "medium" },
      { id: "jewelry-ship-3", text: "Use small, sturdy boxes to prevent rattling", priority: "medium" },
    ],
    damage_prevention: [
      { id: "jewelry-damage-1", text: "Secure earring backs and small components", priority: "high" },
      { id: "jewelry-damage-2", text: "Separate different metals to prevent scratching", priority: "medium" },
      { id: "jewelry-damage-3", text: "Include care and storage instructions", priority: "low" },
    ]
  },
  candles: {
    category: "Candles & Home Fragrance",
    icon: <Package className="h-4 w-4" />,
    color: "bg-green-50 text-green-700 border-green-200",
    preparation: [
      { id: "candle-1", text: "Check wicks are centered and trimmed", priority: "high" },
      { id: "candle-2", text: "Clean any wax drips from container exterior", priority: "medium" },
      { id: "candle-3", text: "Ensure labels are straight and secure", priority: "medium" },
      { id: "candle-4", text: "Test burn quality before shipping", priority: "high" },
    ],
    packaging: [
      { id: "candle-pack-1", text: "Wrap glass containers in bubble wrap", priority: "high" },
      { id: "candle-pack-2", text: "Use dividers for multiple candles", priority: "medium" },
      { id: "candle-pack-3", text: "Pack upright to prevent wick damage", priority: "high" },
      { id: "candle-pack-4", text: "Include burn safety instructions", priority: "high" },
    ],
    shipping_tips: [
      { id: "candle-ship-1", text: "Avoid shipping in extreme temperatures", priority: "high" },
      { id: "candle-ship-2", text: "Use 'This Side Up' labels for container candles", priority: "medium" },
      { id: "candle-ship-3", text: "Consider seasonal shipping delays", priority: "low" },
    ],
    damage_prevention: [
      { id: "candle-damage-1", text: "Protect wicks from bending or breaking", priority: "high" },
      { id: "candle-damage-2", text: "Prevent wax from melting in transit", priority: "high" },
      { id: "candle-damage-3", text: "Include relight instructions if wick tunnels", priority: "low" },
    ]
  }
};

const GENERAL_GUIDE: CategoryGuide = {
  category: "General Handmade Items",
  icon: <Package className="h-4 w-4" />,
  color: "bg-blue-50 text-blue-700 border-blue-200",
  preparation: [
    { id: "general-1", text: "Inspect item for any defects or damage", priority: "high" },
    { id: "general-2", text: "Clean and polish as appropriate", priority: "medium" },
    { id: "general-3", text: "Take high-quality photos from multiple angles", priority: "medium" },
    { id: "general-4", text: "Gather all components and accessories", priority: "high" },
  ],
  packaging: [
    { id: "general-pack-1", text: "Choose box size with minimal empty space", priority: "medium" },
    { id: "general-pack-2", text: "Use appropriate cushioning material", priority: "high" },
    { id: "general-pack-3", text: "Include thank you note or care instructions", priority: "low" },
    { id: "general-pack-4", text: "Seal securely with quality tape", priority: "medium" },
  ],
  shipping_tips: [
    { id: "general-ship-1", text: "Print shipping label clearly", priority: "high" },
    { id: "general-ship-2", text: "Include tracking number in communication", priority: "medium" },
    { id: "general-ship-3", text: "Drop off or schedule pickup promptly", priority: "medium" },
  ],
  damage_prevention: [
    { id: "general-damage-1", text: "Use 'Fragile' stickers when appropriate", priority: "medium" },
    { id: "general-damage-2", text: "Double-check address accuracy", priority: "high" },
    { id: "general-damage-3", text: "Consider insurance for valuable items", priority: "low" },
  ]
};

export const PrepPackGuides = ({ category, className }: PrepPackGuidesProps) => {
  const { toast } = useToast();
  const [selectedGuide, setSelectedGuide] = useState<CategoryGuide | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Find the appropriate guide based on category
    if (category) {
      const categoryKey = category.toLowerCase();
      const guide = Object.values(CATEGORY_GUIDES).find(g => 
        g.category.toLowerCase().includes(categoryKey) ||
        categoryKey.includes(g.category.toLowerCase().split(' ')[0].toLowerCase())
      );
      setSelectedGuide(guide || GENERAL_GUIDE);
    } else {
      setSelectedGuide(GENERAL_GUIDE);
    }
  }, [category]);

  const handleItemCheck = (itemId: string, checked: boolean) => {
    const newCheckedItems = new Set(checkedItems);
    if (checked) {
      newCheckedItems.add(itemId);
    } else {
      newCheckedItems.delete(itemId);
    }
    setCheckedItems(newCheckedItems);
  };

  const getCompletionStats = (items: GuideItem[]) => {
    const completed = items.filter(item => checkedItems.has(item.id)).length;
    const total = items.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const renderGuideSection = (title: string, items: GuideItem[], icon: React.ReactNode) => {
    const stats = getCompletionStats(items);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-medium">{title}</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.completed}/{stats.total} completed
          </Badge>
        </div>
        
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start space-x-3">
              <Checkbox
                id={item.id}
                checked={checkedItems.has(item.id)}
                onCheckedChange={(checked) => handleItemCheck(item.id, checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={item.id}
                  className={`text-sm cursor-pointer ${
                    checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {item.text}
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      item.priority === 'high' ? 'border-red-200 text-red-700' :
                      item.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                      'border-gray-200 text-gray-700'
                    }`}
                  >
                    {item.priority} priority
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const resetProgress = () => {
    setCheckedItems(new Set());
    toast({
      title: "Progress reset",
      description: "All checklist items have been unchecked",
    });
  };

  const markAllComplete = () => {
    if (selectedGuide) {
      const allItems = [
        ...selectedGuide.preparation,
        ...selectedGuide.packaging,
        ...selectedGuide.shipping_tips,
        ...selectedGuide.damage_prevention
      ];
      setCheckedItems(new Set(allItems.map(item => item.id)));
      toast({
        title: "All items completed",
        description: "Great job! Your item is ready to ship.",
      });
    }
  };

  if (!selectedGuide) {
    return null;
  }

  const allItems = [
    ...selectedGuide.preparation,
    ...selectedGuide.packaging,
    ...selectedGuide.shipping_tips,
    ...selectedGuide.damage_prevention
  ];
  const overallStats = getCompletionStats(allItems);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Prep & Pack Guides
        </CardTitle>
        <CardDescription>
          Best-practice checklists to reduce damage and returns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selection */}
        <div className={`p-3 rounded-lg border ${selectedGuide.color}`}>
          <div className="flex items-center gap-2 mb-2">
            {selectedGuide.icon}
            <span className="font-medium">{selectedGuide.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Overall Progress: {overallStats.completed}/{overallStats.total} items
            </span>
            <Badge variant="outline" className="bg-white">
              {overallStats.percentage}%
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllComplete}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark All Done
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetProgress}
            className="flex-1"
          >
            Reset Progress
          </Button>
        </div>

        {/* Guide Sections */}
        <Tabs defaultValue="preparation" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preparation" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Prep
            </TabsTrigger>
            <TabsTrigger value="packaging" className="text-xs">
              <Package className="h-3 w-3 mr-1" />
              Pack
            </TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs">
              <Truck className="h-3 w-3 mr-1" />
              Ship
            </TabsTrigger>
            <TabsTrigger value="prevention" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Protect
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preparation" className="mt-6">
            {renderGuideSection(
              "Preparation Checklist",
              selectedGuide.preparation,
              <Clock className="h-4 w-4 text-blue-500" />
            )}
          </TabsContent>

          <TabsContent value="packaging" className="mt-6">
            {renderGuideSection(
              "Packaging Checklist",
              selectedGuide.packaging,
              <Package className="h-4 w-4 text-green-500" />
            )}
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            {renderGuideSection(
              "Shipping Tips",
              selectedGuide.shipping_tips,
              <Truck className="h-4 w-4 text-purple-500" />
            )}
          </TabsContent>

          <TabsContent value="prevention" className="mt-6">
            {renderGuideSection(
              "Damage Prevention",
              selectedGuide.damage_prevention,
              <Shield className="h-4 w-4 text-orange-500" />
            )}
          </TabsContent>
        </Tabs>

        {/* Category Switcher */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium mb-2 block">
            Switch Category Guide
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CATEGORY_GUIDES).map(([key, guide]) => (
              <Button
                key={key}
                variant={selectedGuide.category === guide.category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGuide(guide)}
                className="justify-start"
              >
                {guide.icon}
                <span className="ml-2 truncate">
                  {guide.category.split(' ')[0]}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>Pro tips:</strong></p>
          <p>• Complete high-priority items first</p>
          <p>• Take photos of your packaging process</p>
          <p>• Keep packaging supplies well-stocked</p>
          <p>• Ask buyers for feedback on packaging quality</p>
        </div>
      </CardContent>
    </Card>
  );
};
