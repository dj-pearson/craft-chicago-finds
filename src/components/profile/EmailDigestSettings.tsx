import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Bell, 
  Users, 
  Package, 
  Calendar,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useEmailDigest } from '@/hooks/useEmailDigest';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';

export const EmailDigestSettings = () => {
  const {
    preferences,
    loading,
    digestContent,
    updatePreference,
    sendTestDigest,
    unsubscribeFromAll,
    getPreference
  } = useEmailDigest();

  const [testingDigest, setTestingDigest] = useState<string | null>(null);

  const digestTypes = [
    {
      type: 'shop_follows' as const,
      title: 'Shop Updates',
      description: 'Get notified when shops you follow add new items',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      type: 'collections' as const,
      title: 'Collection Updates',
      description: 'Get notified when collections you follow are updated',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      type: 'weekly_digest' as const,
      title: 'Weekly Digest',
      description: 'A summary of new items and updates from your follows',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      type: 'monthly_summary' as const,
      title: 'Monthly Summary',
      description: 'Monthly highlights and trends from the marketplace',
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const frequencyOptions = [
    { value: 'never', label: 'Never', description: 'Disabled' },
    { value: 'daily', label: 'Daily', description: 'Every day' },
    { value: 'weekly', label: 'Weekly', description: 'Once a week' },
    { value: 'monthly', label: 'Monthly', description: 'Once a month' },
  ];

  const handleTestDigest = async (digestType: string) => {
    setTestingDigest(digestType);
    try {
      await sendTestDigest(digestType as any);
    } finally {
      setTestingDigest(null);
    }
  };

  if (loading && preferences.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Email Digest Preferences
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control what email updates you receive and how often
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview Alert */}
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Stay updated with personalized email digests based on your follows and interests.
            You can adjust frequency or disable any digest type at any time.
          </AlertDescription>
        </Alert>

        {/* Digest Type Settings */}
        <div className="space-y-4">
          {digestTypes.map((digest) => {
            const preference = getPreference(digest.type);
            const IconComponent = digest.icon;
            
            return (
              <div key={digest.type} className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${digest.bgColor}`}>
                      <IconComponent className={`h-5 w-5 ${digest.color}`} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{digest.title}</h4>
                        {preference?.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {digest.description}
                      </p>
                      {preference?.last_sent_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last sent {formatDistanceToNow(new Date(preference.last_sent_at))} ago
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Frequency Selector */}
                    <Select
                      value={preference?.frequency || 'weekly'}
                      onValueChange={(frequency) => 
                        updatePreference(digest.type, { 
                          frequency: frequency as any,
                          is_active: frequency !== 'never'
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Test Button */}
                    <Button
                      onClick={() => handleTestDigest(digest.type)}
                      disabled={!preference?.is_active || testingDigest === digest.type}
                      variant="outline"
                      size="sm"
                    >
                      {testingDigest === digest.type ? 'Testing...' : 'Test'}
                    </Button>

                    {/* Active Toggle */}
                    <Switch
                      checked={preference?.is_active || false}
                      onCheckedChange={(checked) => 
                        updatePreference(digest.type, { 
                          is_active: checked,
                          frequency: checked ? (preference?.frequency || 'weekly') : 'never'
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Global Actions */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h4 className="font-medium mb-1">Global Settings</h4>
            <p className="text-sm text-muted-foreground">
              Manage all your email preferences at once
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={unsubscribeFromAll}
              variant="outline"
              className="text-destructive hover:text-destructive"
            >
              Unsubscribe All
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        {digestContent && (
          <div className="space-y-3">
            <h4 className="font-medium">Preview Content</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">New Items</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {digestContent.new_items.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  from followed shops
                </p>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Collections</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {digestContent.collection_updates.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  updated collections
                </p>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Active Shops</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {digestContent.followed_shops.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  shops with updates
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Email Tips */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Email Tips:</strong> Digests are sent based on activity from your follows. 
            If there are no updates, you won't receive an email. You can always test a digest 
            to see what content would be included.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
