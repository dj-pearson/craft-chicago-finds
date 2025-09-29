import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TestTube, 
  TrendingUp,
  Eye,
  ShoppingCart,
  Play,
  Pause,
  RotateCcw,
  Crown,
  Image as ImageIcon,
  FileText,
  BarChart3,
  Calendar,
  Users,
  Percent,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ABTest {
  id: string;
  listing_id: string;
  test_type: 'photo' | 'title' | 'description' | 'price';
  status: 'draft' | 'running' | 'completed' | 'paused';
  variant_a: {
    name: string;
    content: string;
    image_url?: string;
  };
  variant_b: {
    name: string;
    content: string;
    image_url?: string;
  };
  metrics: {
    variant_a: TestMetrics;
    variant_b: TestMetrics;
  };
  winner?: 'a' | 'b' | 'inconclusive';
  confidence_level: number;
  start_date: string;
  end_date?: string;
  duration_days: number;
  min_sample_size: number;
  listing_title: string;
}

interface TestMetrics {
  views: number;
  clicks: number;
  conversions: number;
  conversion_rate: number;
  click_through_rate: number;
}

interface ABTestSlotsProps {
  listingId?: string;
  className?: string;
}

export const ABTestSlots = ({ listingId, className }: ABTestSlotsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [creatingTest, setCreatingTest] = useState(false);
  const [newTest, setNewTest] = useState({
    listing_id: listingId || '',
    test_type: 'photo' as 'photo' | 'title' | 'description' | 'price',
    variant_a: { name: 'Original', content: '', image_url: '' },
    variant_b: { name: 'Variant B', content: '', image_url: '' },
    duration_days: 14
  });

  useEffect(() => {
    if (user && currentCity) {
      fetchABTests();
    }
  }, [user, currentCity, listingId]);

  const fetchABTests = async () => {
    if (!user || !currentCity) return;

    setLoading(true);
    try {
      // Get user's listings first
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id, title")
        .eq("seller_id", user.id)
        .eq("city_id", currentCity.id);

      if (listingsError) throw listingsError;

      // Generate mock A/B tests (in production, this would come from a database)
      const mockTests = generateMockTests(listings || [], listingId);
      setTests(mockTests);
    } catch (error) {
      console.error("Error fetching A/B tests:", error);
      toast({
        title: "Error",
        description: "Failed to load A/B tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockTests = (listings: any[], focusListingId?: string): ABTest[] => {
    const tests: ABTest[] = [];
    
    // Generate some sample tests
    const sampleTests = [
      {
        listing_id: listings[0]?.id || 'sample-1',
        listing_title: listings[0]?.title || 'Handmade Ceramic Bowl',
        test_type: 'photo' as const,
        status: 'running' as const,
        variant_a: {
          name: 'Original Photo',
          content: 'original-photo.jpg',
          image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
        },
        variant_b: {
          name: 'Lifestyle Photo',
          content: 'lifestyle-photo.jpg',
          image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'
        },
        metrics: {
          variant_a: { views: 1250, clicks: 89, conversions: 12, conversion_rate: 13.5, click_through_rate: 7.1 },
          variant_b: { views: 1180, clicks: 126, conversions: 18, conversions_rate: 14.3, click_through_rate: 10.7 }
        },
        confidence_level: 87,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_days: 14
      },
      {
        listing_id: listings[1]?.id || 'sample-2',
        listing_title: listings[1]?.title || 'Knitted Winter Scarf',
        test_type: 'title' as const,
        status: 'completed' as const,
        variant_a: {
          name: 'Original Title',
          content: 'Handmade Knitted Scarf'
        },
        variant_b: {
          name: 'SEO Title',
          content: 'Cozy Hand-Knitted Winter Scarf - Soft Wool Blend'
        },
        metrics: {
          variant_a: { views: 2100, clicks: 147, conversions: 19, conversion_rate: 12.9, click_through_rate: 7.0 },
          variant_b: { views: 2050, clicks: 189, conversions: 28, conversion_rate: 14.8, click_through_rate: 9.2 }
        },
        winner: 'b' as const,
        confidence_level: 94,
        start_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_days: 14
      }
    ];

    return sampleTests.map((test, index) => ({
      ...test,
      id: `test-${index}`,
      min_sample_size: 100
    })) as ABTest[];
  };

  const createABTest = async () => {
    if (!user || !newTest.listing_id) {
      toast({
        title: "Missing information",
        description: "Please select a listing and configure both variants",
        variant: "destructive",
      });
      return;
    }

    setCreatingTest(true);
    try {
      // In production, this would save to database
      const testId = `test-${Date.now()}`;
      
      const test: ABTest = {
        id: testId,
        listing_id: newTest.listing_id,
        listing_title: "New Test Listing",
        test_type: newTest.test_type,
        status: 'draft',
        variant_a: newTest.variant_a,
        variant_b: newTest.variant_b,
        metrics: {
          variant_a: { views: 0, clicks: 0, conversions: 0, conversion_rate: 0, click_through_rate: 0 },
          variant_b: { views: 0, clicks: 0, conversions: 0, conversion_rate: 0, click_through_rate: 0 }
        },
        confidence_level: 0,
        start_date: new Date().toISOString(),
        duration_days: newTest.duration_days,
        min_sample_size: 100
      };

      setTests(prev => [test, ...prev]);
      setSelectedTest(test);
      
      // Reset form
      setNewTest({
        listing_id: listingId || '',
        test_type: 'photo',
        variant_a: { name: 'Original', content: '', image_url: '' },
        variant_b: { name: 'Variant B', content: '', image_url: '' },
        duration_days: 14
      });

      toast({
        title: "A/B test created",
        description: "Your test is ready to start",
      });
    } catch (error) {
      console.error("Error creating A/B test:", error);
      toast({
        title: "Error",
        description: "Failed to create A/B test",
        variant: "destructive",
      });
    } finally {
      setCreatingTest(false);
    }
  };

  const startTest = async (testId: string) => {
    try {
      setTests(prev => prev.map(test => 
        test.id === testId ? { ...test, status: 'running' as const } : test
      ));
      
      toast({
        title: "Test started",
        description: "Your A/B test is now running",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start test",
        variant: "destructive",
      });
    }
  };

  const pauseTest = async (testId: string) => {
    try {
      setTests(prev => prev.map(test => 
        test.id === testId ? { ...test, status: 'paused' as const } : test
      ));
      
      toast({
        title: "Test paused",
        description: "Your A/B test has been paused",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause test",
        variant: "destructive",
      });
    }
  };

  const applyWinner = async (testId: string, winner: 'a' | 'b') => {
    try {
      // In production, this would update the actual listing
      setTests(prev => prev.map(test => 
        test.id === testId ? { 
          ...test, 
          status: 'completed' as const,
          winner,
          end_date: new Date().toISOString()
        } : test
      ));
      
      toast({
        title: "Winner applied",
        description: `Variant ${winner.toUpperCase()} has been applied to your listing`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply winner",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'paused':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getWinnerBadge = (test: ABTest, variant: 'a' | 'b') => {
    if (test.winner === variant) {
      return <Crown className="h-3 w-3 text-yellow-500 ml-1" />;
    }
    return null;
  };

  const calculateSignificance = (metricsA: TestMetrics, metricsB: TestMetrics): number => {
    // Simplified statistical significance calculation
    const totalA = metricsA.views || 1;
    const totalB = metricsB.views || 1;
    const convA = metricsA.conversions || 0;
    const convB = metricsB.conversions || 0;
    
    if (totalA < 30 || totalB < 30) return 0; // Not enough data
    
    const rateA = convA / totalA;
    const rateB = convB / totalB;
    const diff = Math.abs(rateA - rateB);
    
    // Mock confidence calculation (in production, use proper statistical tests)
    const confidence = Math.min(95, Math.max(0, (diff * 1000) + Math.min(totalA, totalB) / 10));
    return Math.round(confidence);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading A/B tests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-primary" />
          A/B Test Slots
        </CardTitle>
        <CardDescription>
          Test different photos, titles, or descriptions to see what sells more
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tests">Active Tests</TabsTrigger>
            <TabsTrigger value="create">Create Test</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tests" className="space-y-6">
            {tests.length === 0 ? (
              <div className="text-center py-8">
                <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No A/B tests yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first A/B test to optimize your listings
                </p>
                <Button onClick={() => setSelectedTest(null)}>
                  Create Your First Test
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tests.map((test) => (
                  <Card 
                    key={test.id}
                    className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                      selectedTest?.id === test.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedTest(selectedTest?.id === test.id ? null : test)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{test.listing_title}</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {test.test_type} test
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(test.status)}>
                            {test.status}
                          </Badge>
                          {test.status === 'running' && (
                            <Badge variant="outline" className="text-xs">
                              {test.confidence_level}% confidence
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Variant A</span>
                            {getWinnerBadge(test, 'a')}
                          </div>
                          <div className="text-sm">
                            {test.metrics.variant_a.conversions} conversions 
                            ({test.metrics.variant_a.conversion_rate}%)
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Variant B</span>
                            {getWinnerBadge(test, 'b')}
                          </div>
                          <div className="text-sm">
                            {test.metrics.variant_b.conversions} conversions 
                            ({test.metrics.variant_b.conversion_rate}%)
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {test.status === 'draft' && (
                          <Button size="sm" onClick={(e) => {
                            e.stopPropagation();
                            startTest(test.id);
                          }}>
                            <Play className="h-3 w-3 mr-1" />
                            Start Test
                          </Button>
                        )}
                        {test.status === 'running' && (
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            pauseTest(test.id);
                          }}>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                        )}
                        {test.status === 'completed' && test.winner && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Winner: Variant {test.winner.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Detailed Test View */}
            {selectedTest && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedTest.listing_title} - {selectedTest.test_type} Test</span>
                    <Badge variant="outline" className={getStatusColor(selectedTest.status)}>
                      {selectedTest.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Test Variants */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Variant A */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Variant A - {selectedTest.variant_a.name}</h4>
                        {getWinnerBadge(selectedTest, 'a')}
                      </div>
                      
                      {selectedTest.test_type === 'photo' && selectedTest.variant_a.image_url && (
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={selectedTest.variant_a.image_url}
                            alt="Variant A"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {selectedTest.test_type !== 'photo' && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{selectedTest.variant_a.content}</p>
                        </div>
                      )}
                      
                      {/* Metrics */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Views: {selectedTest.metrics.variant_a.views.toLocaleString()}</div>
                          <div>Clicks: {selectedTest.metrics.variant_a.clicks}</div>
                          <div>Conversions: {selectedTest.metrics.variant_a.conversions}</div>
                          <div>CVR: {selectedTest.metrics.variant_a.conversion_rate}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Variant B - {selectedTest.variant_b.name}</h4>
                        {getWinnerBadge(selectedTest, 'b')}
                      </div>
                      
                      {selectedTest.test_type === 'photo' && selectedTest.variant_b.image_url && (
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={selectedTest.variant_b.image_url}
                            alt="Variant B"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {selectedTest.test_type !== 'photo' && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{selectedTest.variant_b.content}</p>
                        </div>
                      )}
                      
                      {/* Metrics */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Views: {selectedTest.metrics.variant_b.views.toLocaleString()}</div>
                          <div>Clicks: {selectedTest.metrics.variant_b.clicks}</div>
                          <div>Conversions: {selectedTest.metrics.variant_b.conversions}</div>
                          <div>CVR: {selectedTest.metrics.variant_b.conversion_rate}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistical Significance */}
                  {selectedTest.status === 'running' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Statistical Confidence</Label>
                        <span className="text-sm font-medium">{selectedTest.confidence_level}%</span>
                      </div>
                      <Progress value={selectedTest.confidence_level} className="w-full" />
                      <p className="text-xs text-muted-foreground">
                        {selectedTest.confidence_level >= 95 
                          ? "Results are statistically significant" 
                          : "Need more data for statistical significance"}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedTest.status === 'running' && selectedTest.confidence_level >= 95 && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => applyWinner(selectedTest.id, 'a')}
                        disabled={selectedTest.metrics.variant_a.conversion_rate <= selectedTest.metrics.variant_b.conversion_rate}
                      >
                        Apply Variant A
                      </Button>
                      <Button 
                        onClick={() => applyWinner(selectedTest.id, 'b')}
                        disabled={selectedTest.metrics.variant_b.conversion_rate <= selectedTest.metrics.variant_a.conversion_rate}
                      >
                        Apply Variant B
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New A/B Test</CardTitle>
                <CardDescription>
                  Test different versions of your listing to see what performs better
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Type</Label>
                    <Select 
                      value={newTest.test_type} 
                      onValueChange={(value: 'photo' | 'title' | 'description' | 'price') => 
                        setNewTest(prev => ({ ...prev, test_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">Cover Photo</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="description">Description</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Test Duration (Days)</Label>
                    <Input
                      type="number"
                      min="7"
                      max="30"
                      value={newTest.duration_days}
                      onChange={(e) => setNewTest(prev => ({ 
                        ...prev, 
                        duration_days: parseInt(e.target.value) || 14 
                      }))}
                    />
                  </div>
                </div>

                {/* Variant Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Variant A */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Variant A (Original)</h4>
                    
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newTest.variant_a.name}
                        onChange={(e) => setNewTest(prev => ({
                          ...prev,
                          variant_a: { ...prev.variant_a, name: e.target.value }
                        }))}
                        placeholder="e.g., Original Photo"
                      />
                    </div>

                    {newTest.test_type === 'photo' ? (
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input
                          value={newTest.variant_a.image_url}
                          onChange={(e) => setNewTest(prev => ({
                            ...prev,
                            variant_a: { ...prev.variant_a, image_url: e.target.value }
                          }))}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea
                          value={newTest.variant_a.content}
                          onChange={(e) => setNewTest(prev => ({
                            ...prev,
                            variant_a: { ...prev.variant_a, content: e.target.value }
                          }))}
                          placeholder={`Enter your ${newTest.test_type}...`}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  {/* Variant B */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Variant B (Test)</h4>
                    
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newTest.variant_b.name}
                        onChange={(e) => setNewTest(prev => ({
                          ...prev,
                          variant_b: { ...prev.variant_b, name: e.target.value }
                        }))}
                        placeholder="e.g., Lifestyle Photo"
                      />
                    </div>

                    {newTest.test_type === 'photo' ? (
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input
                          value={newTest.variant_b.image_url}
                          onChange={(e) => setNewTest(prev => ({
                            ...prev,
                            variant_b: { ...prev.variant_b, image_url: e.target.value }
                          }))}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea
                          value={newTest.variant_b.content}
                          onChange={(e) => setNewTest(prev => ({
                            ...prev,
                            variant_b: { ...prev.variant_b, content: e.target.value }
                          }))}
                          placeholder={`Enter your alternative ${newTest.test_type}...`}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={createABTest} disabled={creatingTest} className="w-full">
                  {creatingTest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Creating Test...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Create A/B Test
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
              <p><strong>A/B testing tips:</strong></p>
              <p>• Test one element at a time for clear results</p>
              <p>• Run tests for at least 7 days to account for weekly patterns</p>
              <p>• Wait for statistical significance before making decisions</p>
              <p>• Test during normal traffic periods, avoid holidays</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
