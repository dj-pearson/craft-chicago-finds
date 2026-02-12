/* @ts-nocheck */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Gift, Calendar, Mail, Eye, EyeOff } from 'lucide-react';

interface GiftModeData {
  enabled: boolean;
  message: string;
  recipientEmail: string;
  scheduledShipDate: string;
  hidePrices: boolean;
}

interface GiftModeToggleProps {
  giftMode: GiftModeData;
  onGiftModeChange: (data: GiftModeData) => void;
}

export const GiftModeToggle = ({ giftMode, onGiftModeChange }: GiftModeToggleProps) => {
  const [isExpanded, setIsExpanded] = useState(giftMode.enabled);

  const handleToggle = (enabled: boolean) => {
    const newData = { ...giftMode, enabled };
    onGiftModeChange(newData);
    setIsExpanded(enabled);
  };

  const handleFieldChange = (field: keyof Omit<GiftModeData, 'enabled'>, value: string | boolean) => {
    onGiftModeChange({ ...giftMode, [field]: value });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className={`transition-all duration-300 ${giftMode.enabled ? 'border-primary bg-primary/5' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gift Mode
            {giftMode.enabled && (
              <Badge variant="default" className="ml-2">
                Active
              </Badge>
            )}
          </CardTitle>
          <Switch
            checked={giftMode.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
        {!isExpanded && (
          <p className="text-sm text-muted-foreground">
            Send this order as a gift with custom message and recipient
          </p>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure gift options for this order. Recipients will receive a beautiful gift card via email.
          </p>

          {/* Gift Message */}
          <div className="space-y-2">
            <Label htmlFor="gift-message">Gift Message</Label>
            <Textarea
              id="gift-message"
              placeholder="Write a personal message for the recipient..."
              value={giftMode.message}
              onChange={(e) => handleFieldChange('message', e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will appear on the gift card sent to the recipient.
            </p>
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email (Optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipient-email"
                type="email"
                placeholder="recipient@example.com"
                value={giftMode.recipientEmail}
                onChange={(e) => handleFieldChange('recipientEmail', e.target.value)}
                className="pl-10"
                autoComplete="email"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              If provided, we'll send a gift notification to this email address.
            </p>
          </div>

          {/* Scheduled Ship Date */}
          <div className="space-y-2">
            <Label htmlFor="ship-date">Scheduled Ship Date (Optional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="ship-date"
                type="date"
                min={today}
                value={giftMode.scheduledShipDate}
                onChange={(e) => handleFieldChange('scheduledShipDate', e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Choose when you want the gift to be shipped. Defaults to immediate processing.
            </p>
          </div>

          {/* Hide Prices */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {giftMode.hidePrices ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="hide-prices" className="cursor-pointer">
                  Hide prices on packing slip
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recipient won't see item prices on packaging materials
                </p>
              </div>
            </div>
            <Switch
              id="hide-prices"
              checked={giftMode.hidePrices}
              onCheckedChange={(checked) => handleFieldChange('hidePrices', checked)}
            />
          </div>

          {/* Gift Summary */}
          {giftMode.message && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Gift Preview:</h4>
              <p className="text-sm italic">"{giftMode.message}"</p>
              {giftMode.recipientEmail && (
                <p className="text-xs text-muted-foreground mt-2">
                  Will be sent to: {giftMode.recipientEmail}
                </p>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};