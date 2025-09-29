import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Copy, Mail, MessageCircle, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ShareWishlistDialogProps {
  wishlistId: string;
  wishlistName: string;
  itemCount: number;
}

export const ShareWishlistDialog = ({ 
  wishlistId, 
  wishlistName, 
  itemCount 
}: ShareWishlistDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generateShareUrl = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // TODO: Implement wishlist sharing when shared_wishlists table is created
      console.log('Wishlist sharing functionality not yet implemented');
      
      // For now, generate a mock share URL
      const mockUrl = `${window.location.origin}/wishlist/${wishlistId}`;
      setShareUrl(mockUrl);
      
      toast({
        title: "Feature coming soon",
        description: "Wishlist sharing will be available soon!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating share URL:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share URL has been copied to your clipboard.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const shareViaEmail = () => {
    const subject = `Check out my wishlist: ${wishlistName}`;
    const body = `Hi! I thought you might like to see my wishlist "${wishlistName}" with ${itemCount} items I'm interested in.\n\n${shareUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaSMS = () => {
    const message = `Check out my wishlist "${wishlistName}" with ${itemCount} items: ${shareUrl}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Share Wishlist
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Wishlist Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium">{wishlistName}</h3>
              <p className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public-toggle">Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone with the link can view this wishlist
                </p>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* Generate Link Button */}
            {!shareUrl && (
              <Button 
                onClick={generateShareUrl}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Share Link'}
              </Button>
            )}

            {/* Share URL */}
            {shareUrl && (
              <div className="space-y-3">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Share Options */}
                <div className="flex gap-2">
                  <Button
                    onClick={shareViaEmail}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    onClick={shareViaSMS}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    SMS
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Sharing Tips:</p>
            <ul className="text-xs space-y-1">
              <li>• Share with friends and family for gift ideas</li>
              <li>• Make public to discover similar interests</li>
              <li>• Update your wishlist to keep it current</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};