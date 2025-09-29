import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  QrCode, 
  Download,
  Share2,
  MapPin,
  Calendar,
  Users,
  Eye,
  ShoppingBag,
  Coffee,
  Briefcase,
  Store,
  Printer,
  Copy,
  ExternalLink,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";

interface QRCode {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  qr_url: string;
  shop_url: string;
  event_type: 'craft_fair' | 'coffee_shop' | 'popup' | 'market' | 'other';
  location: string;
  event_date?: string;
  is_active: boolean;
  scan_count: number;
  conversion_count: number;
  created_at: string;
  updated_at: string;
}

interface QRShopCodesProps {
  className?: string;
}

export const QRShopCodes = ({ className }: QRShopCodesProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [creatingQR, setCreatingQR] = useState(false);
  
  const [newQR, setNewQR] = useState({
    title: '',
    description: '',
    event_type: 'craft_fair' as QRCode['event_type'],
    location: '',
    event_date: ''
  });

  useEffect(() => {
    if (user && currentCity) {
      fetchQRCodes();
    }
  }, [user, currentCity]);

  const fetchQRCodes = async () => {
    if (!user || !currentCity) return;

    setLoading(true);
    try {
      // In production, this would fetch from database
      // For now, generate mock data
      const mockQRCodes = generateMockQRCodes(user.id);
      setQrCodes(mockQRCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      toast({
        title: "Error",
        description: "Failed to load QR codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockQRCodes = (sellerId: string): QRCode[] => {
    const baseUrl = window.location.origin;
    const shopUrl = `${baseUrl}/shop/${sellerId}?utm_source=qr&utm_medium=offline`;
    
    return [
      {
        id: 'qr-1',
        seller_id: sellerId,
        title: 'Logan Square Farmers Market',
        description: 'Weekly farmers market booth - Sundays 9am-2pm',
        qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl + '&utm_campaign=logan_market')}`,
        shop_url: shopUrl + '&utm_campaign=logan_market',
        event_type: 'market',
        location: 'Logan Square, Chicago',
        event_date: '2024-01-07',
        is_active: true,
        scan_count: 127,
        conversion_count: 23,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'qr-2',
        seller_id: sellerId,
        title: 'Intelligentsia Coffee - Wicker Park',
        description: 'Pop-up display at coffee shop',
        qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl + '&utm_campaign=intelligentsia')}`,
        shop_url: shopUrl + '&utm_campaign=intelligentsia',
        event_type: 'coffee_shop',
        location: '1331 N Milwaukee Ave, Chicago',
        is_active: true,
        scan_count: 89,
        conversion_count: 12,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const createQRCode = async () => {
    if (!user || !currentCity || !newQR.title || !newQR.location) {
      toast({
        title: "Missing information",
        description: "Please fill in title and location",
        variant: "destructive",
      });
      return;
    }

    setCreatingQR(true);
    try {
      const baseUrl = window.location.origin;
      const campaignName = newQR.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const shopUrl = `${baseUrl}/shop/${user.id}?utm_source=qr&utm_medium=offline&utm_campaign=${campaignName}`;
      
      // Generate QR code URL using free QR code API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl)}`;

      const qrCode: QRCode = {
        id: `qr-${Date.now()}`,
        seller_id: user.id,
        title: newQR.title,
        description: newQR.description,
        qr_url: qrUrl,
        shop_url: shopUrl,
        event_type: newQR.event_type,
        location: newQR.location,
        event_date: newQR.event_date || undefined,
        is_active: true,
        scan_count: 0,
        conversion_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In production, save to database
      setQrCodes(prev => [qrCode, ...prev]);
      setSelectedQR(qrCode);

      // Reset form
      setNewQR({
        title: '',
        description: '',
        event_type: 'craft_fair',
        location: '',
        event_date: ''
      });

      toast({
        title: "QR code created!",
        description: "Your QR code is ready to use",
      });
    } catch (error) {
      console.error("Error creating QR code:", error);
      toast({
        title: "Error",
        description: "Failed to create QR code",
        variant: "destructive",
      });
    } finally {
      setCreatingQR(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = async (qrCode: QRCode) => {
    try {
      const response = await fetch(qrCode.qr_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${qrCode.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded!",
        description: "QR code image saved to your device",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const getEventIcon = (eventType: QRCode['event_type']) => {
    switch (eventType) {
      case 'craft_fair':
        return <Store className="h-4 w-4" />;
      case 'coffee_shop':
        return <Coffee className="h-4 w-4" />;
      case 'popup':
        return <MapPin className="h-4 w-4" />;
      case 'market':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: QRCode['event_type']) => {
    switch (eventType) {
      case 'craft_fair':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'coffee_shop':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'popup':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'market':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading QR codes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          In-Person QR Shop Codes
        </CardTitle>
        <CardDescription>
          Display QR codes at craft fairs, coffee shops, and events to drive traffic to your online shop
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="codes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="codes">My QR Codes</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>
          
          <TabsContent value="codes" className="space-y-6">
            {qrCodes.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No QR codes yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create QR codes to connect your offline presence with your online shop
                </p>
                <Button onClick={() => setSelectedQR(null)}>
                  Create Your First QR Code
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {qrCodes.map((qrCode) => (
                  <Card 
                    key={qrCode.id}
                    className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                      selectedQR?.id === qrCode.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedQR(selectedQR?.id === qrCode.id ? null : qrCode)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getEventIcon(qrCode.event_type)}
                            <h4 className="font-medium">{qrCode.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {qrCode.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {qrCode.location}
                            {qrCode.event_date && (
                              <>
                                <Calendar className="h-3 w-3 ml-2" />
                                {new Date(qrCode.event_date).toLocaleDateString()}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={getEventColor(qrCode.event_type)}
                          >
                            {qrCode.event_type.replace('_', ' ')}
                          </Badge>
                          <Badge 
                            variant={qrCode.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {qrCode.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span>{qrCode.scan_count} scans</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <ShoppingBag className="h-4 w-4 text-green-500" />
                          <span>{qrCode.conversion_count} sales</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadQRCode(qrCode);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(qrCode.shop_url, 'Shop URL');
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy URL
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Detailed QR View */}
            {selectedQR && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedQR.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getEventColor(selectedQR.event_type)}>
                        {selectedQR.event_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {selectedQR.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* QR Code Image */}
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border flex items-center justify-center">
                        <img 
                          src={selectedQR.qr_url} 
                          alt="QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => downloadQRCode(selectedQR)}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PNG
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => window.print()}
                          className="flex-1"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </Button>
                      </div>
                    </div>

                    {/* Details & Stats */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Location</Label>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {selectedQR.location}
                        </div>
                      </div>

                      {selectedQR.event_date && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Event Date</Label>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(selectedQR.event_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Shop URL</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={selectedQR.shop_url} 
                            readOnly 
                            className="text-xs"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(selectedQR.shop_url, 'Shop URL')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(selectedQR.shop_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Performance</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {selectedQR.scan_count}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Scans</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {selectedQR.conversion_count}
                            </div>
                            <div className="text-xs text-muted-foreground">Sales</div>
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold">
                            {selectedQR.scan_count > 0 
                              ? Math.round((selectedQR.conversion_count / selectedQR.scan_count) * 100)
                              : 0}%
                          </div>
                          <div className="text-xs text-muted-foreground">Conversion Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New QR Code</CardTitle>
                <CardDescription>
                  Generate a QR code for your next event or location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event/Location Title *</Label>
                    <Input
                      id="title"
                      value={newQR.title}
                      onChange={(e) => setNewQR(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Logan Square Farmers Market"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select 
                      value={newQR.event_type} 
                      onValueChange={(value: QRCode['event_type']) => 
                        setNewQR(prev => ({ ...prev, event_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="craft_fair">Craft Fair</SelectItem>
                        <SelectItem value="market">Farmers Market</SelectItem>
                        <SelectItem value="coffee_shop">Coffee Shop</SelectItem>
                        <SelectItem value="popup">Pop-up Event</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newQR.description}
                    onChange={(e) => setNewQR(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the event or location"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={newQR.location}
                      onChange={(e) => setNewQR(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., 1331 N Milwaukee Ave, Chicago"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Event Date (Optional)</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={newQR.event_date}
                      onChange={(e) => setNewQR(prev => ({ ...prev, event_date: e.target.value }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={createQRCode} 
                  disabled={creatingQR || !newQR.title || !newQR.location}
                  className="w-full"
                >
                  {creatingQR ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Creating QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Create QR Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
              <p><strong>QR Code best practices:</strong></p>
              <p>• Print QR codes at least 2x2 inches for easy scanning</p>
              <p>• Include a brief call-to-action like "Scan to shop online"</p>
              <p>• Test your QR codes before printing</p>
              <p>• Place codes at eye level and in well-lit areas</p>
              <p>• Track performance to optimize placement</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
