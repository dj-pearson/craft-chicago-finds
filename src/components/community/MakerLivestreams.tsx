import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Play,
  Pause,
  Calendar,
  Clock,
  Users,
  ShoppingCart,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Settings,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  Send,
  Star,
  Gift,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { useCart } from "@/hooks/useCart";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface LiveStream {
  id: string;
  title: string;
  description: string;
  maker: {
    id: string;
    name: string;
    shop_name: string;
    avatar?: string;
    is_verified: boolean;
    follower_count: number;
  };
  scheduled_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'live' | 'ended';
  viewer_count: number;
  peak_viewers: number;
  featured_products: Array<{
    id: string;
    title: string;
    price: number;
    image: string;
    discount_percent?: number;
  }>;
  craft_category: string;
  techniques_shown: string[];
  stream_url?: string;
  chat_enabled: boolean;
  recording_available: boolean;
  created_at: string;
}

interface ChatMessage {
  id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  timestamp: string;
  is_maker: boolean;
  is_moderator: boolean;
}

interface MakerLivestreamsProps {
  className?: string;
}

export const MakerLivestreams = ({ className }: MakerLivestreamsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const cart = useCart();
  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingStream, setIsCreatingStream] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    scheduled_time: '',
    duration_minutes: 20,
    craft_category: '',
    featured_products: [] as string[],
    techniques_shown: [] as string[]
  });

  useEffect(() => {
    if (user && currentCity) {
      fetchStreams();
    }
  }, [user, currentCity]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchStreams = async () => {
    if (!user || !currentCity) return;

    setLoading(true);
    try {
      // Generate mock livestreams for demonstration
      const mockStreams = generateMockStreams();
      setStreams(mockStreams);
      
      // If there's a live stream, select it
      const liveStream = mockStreams.find(s => s.status === 'live');
      if (liveStream) {
        setSelectedStream(liveStream);
        generateMockChatMessages(liveStream.id);
      }
    } catch (error) {
      console.error("Error fetching streams:", error);
      toast({
        title: "Error",
        description: "Failed to load livestreams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockStreams = (): LiveStream[] => {
    const craftCategories = ['Pottery', 'Jewelry Making', 'Candle Making', 'Woodworking', 'Knitting'];
    const makers = [
      {
        id: 'maker-1',
        name: 'Sarah Chen',
        shop_name: 'Chicago Clay Studio',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100',
        is_verified: true,
        follower_count: 1247
      },
      {
        id: 'maker-2',
        name: 'Marcus Johnson',
        shop_name: 'Windy City Woodworks',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        is_verified: true,
        follower_count: 892
      },
      {
        id: 'maker-3',
        name: 'Elena Rodriguez',
        shop_name: 'Prairie Candle Co.',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        is_verified: false,
        follower_count: 456
      }
    ];

    return makers.map((maker, index) => {
      const now = new Date();
      const streamTime = new Date(now.getTime() + (index - 1) * 2 * 60 * 60 * 1000); // Spread across time
      const status = index === 0 ? 'live' : index === 1 ? 'scheduled' : 'ended';
      
      return {
        id: `stream-${index + 1}`,
        title: `${craftCategories[index]} Masterclass: Creating Beautiful ${craftCategories[index].toLowerCase()}`,
        description: `Join me for an intimate 20-minute session where I'll show you my favorite techniques for ${craftCategories[index].toLowerCase()}. Ask questions, see the process up close, and shop the featured pieces!`,
        maker,
        scheduled_time: streamTime.toISOString(),
        duration_minutes: 20,
        status,
        viewer_count: status === 'live' ? Math.floor(Math.random() * 150) + 50 : 0,
        peak_viewers: Math.floor(Math.random() * 300) + 100,
        featured_products: [
          {
            id: `product-${index + 1}-1`,
            title: `Handcrafted ${craftCategories[index]} Set`,
            price: Math.floor(Math.random() * 100) + 30,
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200',
            discount_percent: index === 0 ? 15 : undefined
          },
          {
            id: `product-${index + 1}-2`,
            title: `Custom ${craftCategories[index]} Workshop`,
            price: Math.floor(Math.random() * 200) + 80,
            image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200'
          }
        ],
        craft_category: craftCategories[index],
        techniques_shown: [
          'Basic techniques',
          'Advanced finishing',
          'Tool selection',
          'Quality tips'
        ],
        stream_url: status === 'live' ? 'https://example.com/stream' : undefined,
        chat_enabled: true,
        recording_available: status === 'ended',
        created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
      };
    });
  };

  const generateMockChatMessages = (streamId: string) => {
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        user_name: 'CraftLover23',
        message: 'This is amazing! Love watching the process 😍',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        is_maker: false,
        is_moderator: false
      },
      {
        id: 'msg-2',
        user_name: 'Sarah Chen',
        message: 'Thanks everyone for joining! What would you like to see next?',
        timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        is_maker: true,
        is_moderator: false
      },
      {
        id: 'msg-3',
        user_name: 'PotteryFan',
        message: 'Can you show the glazing technique again?',
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        is_maker: false,
        is_moderator: false
      },
      {
        id: 'msg-4',
        user_name: 'ChicagoCrafter',
        message: 'Just ordered the pottery set! 🎉',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        is_maker: false,
        is_moderator: false
      }
    ];
    setChatMessages(mockMessages);
  };

  const scheduleStream = async () => {
    if (!user || !newStream.title || !newStream.scheduled_time) {
      toast({
        title: "Missing information",
        description: "Please fill in title and schedule time",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingStream(true);
    try {
      const stream: LiveStream = {
        id: `stream-${Date.now()}`,
        title: newStream.title,
        description: newStream.description,
        maker: {
          id: user.id,
          name: user.user_metadata?.full_name || 'You',
          shop_name: 'Your Shop',
          is_verified: false,
          follower_count: 0
        },
        scheduled_time: newStream.scheduled_time,
        duration_minutes: newStream.duration_minutes,
        status: 'scheduled',
        viewer_count: 0,
        peak_viewers: 0,
        featured_products: [],
        craft_category: newStream.craft_category,
        techniques_shown: newStream.techniques_shown,
        chat_enabled: true,
        recording_available: false,
        created_at: new Date().toISOString()
      };

      setStreams(prev => [stream, ...prev]);
      setSelectedStream(stream);

      // Reset form
      setNewStream({
        title: '',
        description: '',
        scheduled_time: '',
        duration_minutes: 20,
        craft_category: '',
        featured_products: [],
        techniques_shown: []
      });

      toast({
        title: "Stream scheduled!",
        description: "Your livestream has been scheduled successfully",
      });
    } catch (error) {
      console.error("Error scheduling stream:", error);
      toast({
        title: "Error",
        description: "Failed to schedule stream",
        variant: "destructive",
      });
    } finally {
      setIsCreatingStream(false);
    }
  };

  const joinStream = (stream: LiveStream) => {
    setSelectedStream(stream);
    if (stream.status === 'live') {
      generateMockChatMessages(stream.id);
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !selectedStream) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      user_name: user?.user_metadata?.full_name || 'Anonymous',
      user_avatar: user?.user_metadata?.avatar_url,
      message: newMessage,
      timestamp: new Date().toISOString(),
      is_maker: selectedStream.maker.id === user?.id,
      is_moderator: false
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const addToCartFromStream = async (productId: string, price: number, title: string) => {
    try {
      await cart.addItem({
        id: productId,
        listing_id: productId,
        title: title,
        price: price,
        max_quantity: 10,
        seller_id: 'stream-seller',
        seller_name: 'Stream Seller',
        shipping_available: true,
        local_pickup_available: true
      }, 1);
      toast({
        title: "Added to cart!",
        description: `${title} added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: LiveStream['status']) => {
    switch (status) {
      case 'live':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ended':
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading livestreams...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Maker Livestreams
        </CardTitle>
        <CardDescription>
          Watch craft demos, learn techniques, and shop featured products during live sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="watch" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="watch">Watch Streams</TabsTrigger>
            <TabsTrigger value="schedule">Schedule Stream</TabsTrigger>
          </TabsList>
          
          <TabsContent value="watch" className="space-y-6">
            {!selectedStream ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Live & Upcoming Streams</h3>
                  <Badge variant="outline" className="px-3 py-1">
                    {streams.filter(s => s.status !== 'ended').length} active
                  </Badge>
                </div>

                {streams.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No streams available</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Be the first to schedule a craft demo livestream
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {streams.map((stream) => (
                      <Card 
                        key={stream.id}
                        className="transition-all duration-200 hover:shadow-md cursor-pointer"
                        onClick={() => joinStream(stream)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium line-clamp-1">{stream.title}</h4>
                                {stream.status === 'live' && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-red-600 font-medium">LIVE</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {stream.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  {stream.maker.avatar && (
                                    <img 
                                      src={stream.maker.avatar} 
                                      alt={stream.maker.name}
                                      className="w-4 h-4 rounded-full"
                                    />
                                  )}
                                  {stream.maker.name}
                                  {stream.maker.is_verified && (
                                    <Star className="h-3 w-3 text-yellow-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(stream.scheduled_time)}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className={getStatusColor(stream.status)}>
                              {stream.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {stream.status === 'live' ? stream.viewer_count : stream.peak_viewers} viewers
                              </div>
                              <div className="flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                {stream.featured_products.length} products
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              {stream.status === 'live' ? 'Join Live' : 
                               stream.status === 'scheduled' ? 'Set Reminder' : 'Watch Recording'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Stream Viewer
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStream(null)}
                  >
                    ← Back to Streams
                  </Button>
                  <Badge variant="outline" className={getStatusColor(selectedStream.status)}>
                    {selectedStream.status}
                  </Badge>
                  {selectedStream.status === 'live' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="h-4 w-4" />
                      {selectedStream.viewer_count} watching
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Video Player */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
                      {selectedStream.status === 'live' ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <div className="text-center space-y-2">
                            <Video className="h-12 w-12 mx-auto opacity-50" />
                            <p>Live Stream Player</p>
                            <p className="text-sm opacity-75">
                              {selectedStream.craft_category} Demo in Progress
                            </p>
                          </div>
                        </div>
                      ) : selectedStream.status === 'ended' && selectedStream.recording_available ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <Button size="lg" className="bg-white/20 hover:bg-white/30">
                            <Play className="h-6 w-6 mr-2" />
                            Watch Recording
                          </Button>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <div className="text-center space-y-2">
                            <Calendar className="h-12 w-12 mx-auto opacity-50" />
                            <p>Stream Scheduled</p>
                            <p className="text-sm opacity-75">
                              Starts {formatTime(selectedStream.scheduled_time)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stream Info */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">{selectedStream.title}</h2>
                        <p className="text-muted-foreground">{selectedStream.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedStream.maker.avatar && (
                            <img 
                              src={selectedStream.maker.avatar} 
                              alt={selectedStream.maker.name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{selectedStream.maker.shop_name}</span>
                              {selectedStream.maker.is_verified && (
                                <Star className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {selectedStream.maker.follower_count.toLocaleString()} followers
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Heart className="h-4 w-4 mr-2" />
                            Follow
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Techniques Shown */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Techniques Shown</Label>
                        <div className="flex flex-wrap gap-1">
                          {selectedStream.techniques_shown.map((technique) => (
                            <Badge key={technique} variant="outline" className="text-xs">
                              {technique}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Featured Products */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Featured Products</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedStream.featured_products.map((product) => (
                          <div key={product.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted">
                            <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                              <OptimizedImage
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm line-clamp-2">{product.title}</h5>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">${product.price}</span>
                                {product.discount_percent && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    {product.discount_percent}% off
                                  </Badge>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => addToCartFromStream(product.id, product.price, product.title)}
                              >
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Live Chat */}
                    {selectedStream.chat_enabled && selectedStream.status === 'live' && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Live Chat
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="h-64 overflow-y-auto space-y-2 border rounded p-2">
                            {chatMessages.map((message) => (
                              <div key={message.id} className="text-sm">
                                <span className={`font-medium ${
                                  message.is_maker ? 'text-primary' : 
                                  message.is_moderator ? 'text-green-600' : 'text-foreground'
                                }`}>
                                  {message.user_name}
                                  {message.is_maker && <Badge variant="outline" className="ml-1 text-xs">Maker</Badge>}
                                </span>
                                <p className="text-muted-foreground">{message.message}</p>
                              </div>
                            ))}
                            <div ref={chatEndRef} />
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Say something..."
                              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                              className="text-sm"
                            />
                            <Button size="sm" onClick={sendChatMessage}>
                              <Send className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schedule a Craft Demo</CardTitle>
                <CardDescription>
                  Share your craft process with the community and showcase your products
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stream-title">Stream Title *</Label>
                    <Input
                      id="stream-title"
                      value={newStream.title}
                      onChange={(e) => setNewStream(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Pottery Wheel Throwing Basics"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="craft-category">Craft Category</Label>
                    <Select 
                      value={newStream.craft_category} 
                      onValueChange={(value) => 
                        setNewStream(prev => ({ ...prev, craft_category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pottery">Pottery</SelectItem>
                        <SelectItem value="jewelry">Jewelry Making</SelectItem>
                        <SelectItem value="candles">Candle Making</SelectItem>
                        <SelectItem value="woodworking">Woodworking</SelectItem>
                        <SelectItem value="textiles">Textiles</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stream-description">Description</Label>
                  <Textarea
                    id="stream-description"
                    value={newStream.description}
                    onChange={(e) => setNewStream(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what you'll be demonstrating and what viewers can expect to learn..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-time">Schedule Time *</Label>
                    <Input
                      id="scheduled-time"
                      type="datetime-local"
                      value={newStream.scheduled_time}
                      onChange={(e) => setNewStream(prev => ({ ...prev, scheduled_time: e.target.value }))}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Select 
                      value={newStream.duration_minutes.toString()} 
                      onValueChange={(value) => 
                        setNewStream(prev => ({ ...prev, duration_minutes: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="20">20 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={scheduleStream} 
                  disabled={isCreatingStream || !newStream.title || !newStream.scheduled_time}
                  className="w-full"
                >
                  {isCreatingStream ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Stream
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
              <p><strong>Streaming tips:</strong></p>
              <p>• Test your camera and microphone beforehand</p>
              <p>• Prepare your workspace with good lighting</p>
              <p>• Have your featured products ready to showcase</p>
              <p>• Engage with viewers through chat</p>
              <p>• Keep sessions focused and interactive</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
