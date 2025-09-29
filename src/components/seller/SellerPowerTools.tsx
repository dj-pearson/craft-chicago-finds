import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wand2, 
  DollarSign, 
  FileSpreadsheet, 
  Package, 
  Zap,
  TrendingUp,
  Upload,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { AIPhotoHelper } from "./AIPhotoHelper";
import { AIListingHelper } from "./AIListingHelper";
import { PriceCoach } from "./PriceCoach";
import { BulkImportExport } from "./BulkImportExport";
import { PrepPackGuides } from "./PrepPackGuides";

interface SellerPowerToolsProps {
  className?: string;
}

const TOOL_FEATURES = [
  {
    id: 'ai-photo',
    title: 'AI Photo Helper',
    description: 'Auto background clean-up, crop to square/portrait, exposure fix',
    icon: <Wand2 className="h-5 w-5" />,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    badge: 'AI Powered',
    completed: true
  },
  {
    id: 'ai-content',
    title: 'AI Content Generator',
    description: 'Generate titles, tags, and descriptions from photos and notes',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    badge: 'AI Powered',
    completed: true
  },
  {
    id: 'price-coach',
    title: 'Price Coach',
    description: 'Market analysis and pricing recommendations',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'bg-green-50 text-green-700 border-green-200',
    badge: 'Data Driven',
    completed: true
  },
  {
    id: 'bulk-import',
    title: 'Bulk Import & Export',
    description: 'CSV import, Etsy migration, and bulk editing tools',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    badge: 'Time Saver',
    completed: true
  },
  {
    id: 'prep-pack',
    title: 'Prep & Pack Guides',
    description: 'Category-specific checklists to reduce returns',
    icon: <Package className="h-5 w-5" />,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    badge: 'Quality Focus',
    completed: true
  },
  {
    id: 'shipping-hub',
    title: 'Shipping Label Hub',
    description: 'USPS/UPS integration with auto-fill weight (Coming Soon)',
    icon: <Package className="h-5 w-5" />,
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    badge: 'Phase 2',
    completed: false
  }
];

export const SellerPowerTools = ({ className }: SellerPowerToolsProps) => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const completedTools = TOOL_FEATURES.filter(tool => tool.completed).length;
  const totalTools = TOOL_FEATURES.length;

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Seller Power Tools</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered tools and automation to help you create better listings, 
            price competitively, and ship professionally. Save time and increase sales.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              {completedTools}/{totalTools} Tools Available
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              MVP++ Ready
            </Badge>
          </div>
        </div>

        {/* Tools Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOL_FEATURES.map((tool) => (
            <Card 
              key={tool.id} 
              className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                activeDemo === tool.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveDemo(activeDemo === tool.id ? null : tool.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${tool.color}`}>
                    {tool.icon}
                  </div>
                  <Badge 
                    variant={tool.completed ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {tool.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription className="text-sm">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant={tool.completed ? "default" : "outline"} 
                  size="sm" 
                  className="w-full"
                  disabled={!tool.completed}
                >
                  {tool.completed ? (
                    <>
                      Try It Now
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </>
                  ) : (
                    'Coming Soon'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Interactive Demos */}
        {activeDemo && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {TOOL_FEATURES.find(t => t.id === activeDemo)?.icon}
                {TOOL_FEATURES.find(t => t.id === activeDemo)?.title} Demo
              </CardTitle>
              <CardDescription>
                Try out this tool with sample data or your own content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="demo" className="w-full">
                <TabsList>
                  <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="benefits">Benefits</TabsTrigger>
                </TabsList>
                
                <TabsContent value="demo" className="mt-6">
                  {activeDemo === 'ai-photo' && (
                    <AIPhotoHelper
                      imageUrl="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"
                      onImageProcessed={(url) => console.log('Processed:', url)}
                    />
                  )}
                  
                  {activeDemo === 'ai-content' && (
                    <AIListingHelper
                      imageUrl="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"
                      category="Ceramics"
                      onContentGenerated={(content) => console.log('Generated:', content)}
                    />
                  )}
                  
                  {activeDemo === 'price-coach' && (
                    <PriceCoach
                      category="sample-category"
                      currentPrice={45}
                      productTitle="Sample Handmade Bowl"
                      productTags={['handmade', 'ceramic', 'bowl']}
                    />
                  )}
                  
                  {activeDemo === 'bulk-import' && (
                    <BulkImportExport />
                  )}
                  
                  {activeDemo === 'prep-pack' && (
                    <PrepPackGuides category="ceramics" />
                  )}
                </TabsContent>
                
                <TabsContent value="features" className="mt-6">
                  <div className="space-y-4">
                    {activeDemo === 'ai-photo' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Automatic background removal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Smart cropping to square or portrait</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Auto exposure and color correction</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">One-click image enhancement</span>
                        </div>
                      </div>
                    )}
                    
                    {activeDemo === 'ai-content' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">AI-generated titles and descriptions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">SEO-optimized tag suggestions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Photo analysis for content ideas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Price range recommendations</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Add more feature lists for other tools */}
                  </div>
                </TabsContent>
                
                <TabsContent value="benefits" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-700">Time Savings</h4>
                      <p className="text-sm text-muted-foreground">
                        Reduce listing creation time by 70% with automated content generation and photo editing.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700">Better Performance</h4>
                      <p className="text-sm text-muted-foreground">
                        Listings with AI-optimized content get 3x more views and 40% higher conversion rates.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-purple-700">Professional Quality</h4>
                      <p className="text-sm text-muted-foreground">
                        Compete with larger sellers using professional-grade tools and insights.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-orange-700">Reduced Returns</h4>
                      <p className="text-sm text-muted-foreground">
                        Prep & pack guides reduce damage-related returns by 60% on average.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Ready to Get Started?
            </CardTitle>
            <CardDescription>
              These tools are integrated into your listing creation workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-sm font-bold">
                  1
                </div>
                <h4 className="font-medium">Create New Listing</h4>
                <p className="text-xs text-muted-foreground">
                  Start with the create listing page
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-sm font-bold">
                  2
                </div>
                <h4 className="font-medium">Upload Photos</h4>
                <p className="text-xs text-muted-foreground">
                  AI tools appear in the sidebar
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-sm font-bold">
                  3
                </div>
                <h4 className="font-medium">Use AI Tools</h4>
                <p className="text-xs text-muted-foreground">
                  Enhance photos, generate content, check pricing
                </p>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button size="lg" className="px-8">
                Create Your First Listing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
