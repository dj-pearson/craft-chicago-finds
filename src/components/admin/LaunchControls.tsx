import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Rocket,
  Users,
  UserPlus,
  Mail,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Save,
  RefreshCw,
  TrendingUp,
  Target,
  Globe,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LAUNCH_CONFIG, getLaunchCountdown, formatLaunchDate } from "@/lib/launch-config";

interface LaunchSettings {
  registration_enabled: boolean;
  seller_registration_enabled: boolean;
  buyer_registration_enabled: boolean;
  show_coming_soon: boolean;
  allow_email_signup: boolean;
  allow_seller_interest: boolean;
  launch_message: string;
  pre_launch_message: string;
  maintenance_mode: boolean;
  early_access_enabled: boolean;
  early_access_code: string;
}

interface LaunchMetrics {
  email_signups: number;
  seller_interest: number;
  total_users: number;
  total_sellers: number;
  total_products: number;
  page_views: number;
  updated_at: string;
}

interface LaunchControlsProps {
  className?: string;
}

export const LaunchControls = ({ className }: LaunchControlsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<LaunchSettings>({
    registration_enabled: false,
    seller_registration_enabled: false,
    buyer_registration_enabled: false,
    show_coming_soon: true,
    allow_email_signup: true,
    allow_seller_interest: true,
    launch_message: LAUNCH_CONFIG.LAUNCH_HEADLINE,
    pre_launch_message: LAUNCH_CONFIG.PRE_LAUNCH_MESSAGE,
    maintenance_mode: false,
    early_access_enabled: false,
    early_access_code: ''
  });
  const [metrics, setMetrics] = useState<LaunchMetrics>({
    email_signups: 0,
    seller_interest: 0,
    total_users: 0,
    total_sellers: 0,
    total_products: 0,
    page_views: 0,
    updated_at: new Date().toISOString()
  });
  const [countdown, setCountdown] = useState(getLaunchCountdown());

  useEffect(() => {
    fetchSettings();
    fetchMetrics();
  }, []);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getLaunchCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from Supabase
      // For now, use default settings
      setSettings(prev => prev);
    } catch (error) {
      console.error("Error fetching launch settings:", error);
      toast({
        title: "Error",
        description: "Failed to load launch settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // In production, this would fetch real metrics from Supabase
      const mockMetrics: LaunchMetrics = {
        email_signups: 247,
        seller_interest: 89,
        total_users: 156,
        total_sellers: 23,
        total_products: 67,
        page_views: 3420,
        updated_at: new Date().toISOString()
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Error fetching launch metrics:", error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In production, this would save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Settings Saved!",
        description: "Launch settings have been updated successfully",
      });
    } catch (error) {
      console.error("Error saving launch settings:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save launch settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleRegistration = async (type: 'all' | 'seller' | 'buyer', enabled: boolean) => {
    const updatedSettings = { ...settings };
    
    switch (type) {
      case 'all':
        updatedSettings.registration_enabled = enabled;
        updatedSettings.seller_registration_enabled = enabled;
        updatedSettings.buyer_registration_enabled = enabled;
        break;
      case 'seller':
        updatedSettings.seller_registration_enabled = enabled;
        break;
      case 'buyer':
        updatedSettings.buyer_registration_enabled = enabled;
        break;
    }
    
    setSettings(updatedSettings);
    
    toast({
      title: enabled ? "Registration Enabled" : "Registration Disabled",
      description: `${type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)} registration has been ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading launch controls...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Chicago Launch Controls
        </CardTitle>
        <CardDescription>
          Manage registration, launch settings, and pre-launch messaging for the November 1st Chicago launch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Launch Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Launch Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <h3 className="font-semibold text-blue-900">Chicago Launch Date</h3>
                      <p className="text-blue-700">{formatLaunchDate('full')}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      <MapPin className="h-3 w-3 mr-1" />
                      Chicago, IL
                    </Badge>
                  </div>

                  {!countdown.isLaunched ? (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{countdown.days}</div>
                        <div className="text-sm text-muted-foreground">Days</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{countdown.hours}</div>
                        <div className="text-sm text-muted-foreground">Hours</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{countdown.minutes}</div>
                        <div className="text-sm text-muted-foreground">Minutes</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{countdown.seconds}</div>
                        <div className="text-sm text-muted-foreground">Seconds</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold text-green-900">Chicago is Live!</h3>
                      <p className="text-green-700">The marketplace has successfully launched</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Registration Status</span>
                      </div>
                      <Badge variant="outline" className={getStatusColor(settings.registration_enabled)}>
                        {getStatusIcon(settings.registration_enabled)}
                        {settings.registration_enabled ? 'Open' : 'Closed'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Site Status</span>
                      </div>
                      <Badge variant="outline" className={getStatusColor(!settings.maintenance_mode)}>
                        {getStatusIcon(!settings.maintenance_mode)}
                        {settings.maintenance_mode ? 'Maintenance' : 'Live'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Coming Soon Page</span>
                      </div>
                      <Badge variant="outline" className={getStatusColor(settings.show_coming_soon)}>
                        {getStatusIcon(settings.show_coming_soon)}
                        {settings.show_coming_soon ? 'Visible' : 'Hidden'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Email Signups</span>
                      </div>
                      <Badge variant="outline" className={getStatusColor(settings.allow_email_signup)}>
                        {getStatusIcon(settings.allow_email_signup)}
                        {settings.allow_email_signup ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => toggleRegistration('all', !settings.registration_enabled)}
                    variant={settings.registration_enabled ? "destructive" : "default"}
                    className="w-full"
                  >
                    {settings.registration_enabled ? (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Lock Registration
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Open Registration
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setSettings(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode }))}
                    variant={settings.maintenance_mode ? "default" : "outline"}
                    className="w-full"
                  >
                    {settings.maintenance_mode ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Exit Maintenance
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Maintenance Mode
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={fetchMetrics}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Registration Controls
                </CardTitle>
                <CardDescription>
                  Control who can register and access the platform during pre-launch and launch phases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Master Registration Toggle */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Master Registration Control</h3>
                      <p className="text-sm text-muted-foreground">
                        Override all registration settings. When disabled, no new users can register.
                      </p>
                    </div>
                    <Switch
                      checked={settings.registration_enabled}
                      onCheckedChange={(checked) => toggleRegistration('all', checked)}
                    />
                  </div>
                  {!settings.registration_enabled && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2 rounded text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      All user registration is currently disabled
                    </div>
                  )}
                </div>

                {/* Specific Registration Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Seller Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new sellers to create accounts and list products
                      </p>
                    </div>
                    <Switch
                      checked={settings.seller_registration_enabled && settings.registration_enabled}
                      onCheckedChange={(checked) => toggleRegistration('seller', checked)}
                      disabled={!settings.registration_enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Buyer Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to create accounts for purchasing
                      </p>
                    </div>
                    <Switch
                      checked={settings.buyer_registration_enabled && settings.registration_enabled}
                      onCheckedChange={(checked) => toggleRegistration('buyer', checked)}
                      disabled={!settings.registration_enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Email Signups</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow visitors to sign up for launch notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.allow_email_signup}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allow_email_signup: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Seller Interest Form</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow potential sellers to express interest before launch
                      </p>
                    </div>
                    <Switch
                      checked={settings.allow_seller_interest}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allow_seller_interest: checked }))}
                    />
                  </div>
                </div>

                {/* Early Access */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Early Access</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Early Access</Label>
                      <Switch
                        checked={settings.early_access_enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, early_access_enabled: checked }))}
                      />
                    </div>
                    
                    {settings.early_access_enabled && (
                      <div>
                        <Label htmlFor="early_access_code">Access Code</Label>
                        <Input
                          id="early_access_code"
                          value={settings.early_access_code}
                          onChange={(e) => setSettings(prev => ({ ...prev, early_access_code: e.target.value }))}
                          placeholder="Enter early access code..."
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messaging" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Launch Messaging</CardTitle>
                <CardDescription>
                  Customize the messaging shown to visitors during pre-launch and launch phases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="launch_message">Launch Headline</Label>
                  <Input
                    id="launch_message"
                    value={settings.launch_message}
                    onChange={(e) => setSettings(prev => ({ ...prev, launch_message: e.target.value }))}
                    placeholder="Main headline for the launch..."
                  />
                </div>

                <div>
                  <Label htmlFor="pre_launch_message">Pre-Launch Message</Label>
                  <Textarea
                    id="pre_launch_message"
                    value={settings.pre_launch_message}
                    onChange={(e) => setSettings(prev => ({ ...prev, pre_launch_message: e.target.value }))}
                    placeholder="Message shown during pre-launch phase..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Show Coming Soon Page</Label>
                    <p className="text-sm text-muted-foreground">
                      Display coming soon messaging instead of full site
                    </p>
                  </div>
                  <Switch
                    checked={settings.show_coming_soon}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, show_coming_soon: checked }))}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Messages
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Email Signups</p>
                      <p className="text-2xl font-bold">{metrics.email_signups}</p>
                    </div>
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+12% this week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Seller Interest</p>
                      <p className="text-2xl font-bold">{metrics.seller_interest}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Target className="h-3 w-3 text-blue-600" />
                      <span className="text-blue-600">Goal: {LAUNCH_CONFIG.LAUNCH_GOALS.INITIAL_SELLERS}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Page Views</p>
                      <p className="text-2xl font-bold">{metrics.page_views.toLocaleString()}</p>
                    </div>
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+28% this week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Launch Goals Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Email Signups</span>
                      <span>{metrics.email_signups} / {LAUNCH_CONFIG.LAUNCH_GOALS.EMAIL_SIGNUPS}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((metrics.email_signups / LAUNCH_CONFIG.LAUNCH_GOALS.EMAIL_SIGNUPS) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Seller Interest</span>
                      <span>{metrics.seller_interest} / {LAUNCH_CONFIG.LAUNCH_GOALS.INITIAL_SELLERS}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((metrics.seller_interest / LAUNCH_CONFIG.LAUNCH_GOALS.INITIAL_SELLERS) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Active Sellers</span>
                      <span>{metrics.total_sellers} / {LAUNCH_CONFIG.LAUNCH_GOALS.INITIAL_SELLERS}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((metrics.total_sellers / LAUNCH_CONFIG.LAUNCH_GOALS.INITIAL_SELLERS) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Products Listed</span>
                      <span>{metrics.total_products} / {LAUNCH_CONFIG.LAUNCH_GOALS.INITIAL_PRODUCTS}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((metrics.total_products / LAUNCH_CONFIG.LAUNCH_GOALS.INITIAL_PRODUCTS) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(metrics.updated_at).toLocaleString()}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
