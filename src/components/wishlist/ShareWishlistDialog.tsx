import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageCircle, 
  Facebook, 
  Twitter,
  Link2,
  Eye,
  EyeOff,
  Calendar,
  Gift
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SharedWishlist {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  share_token: string;
  is_public: boolean;
  occasion: string | null;
  target_date: string | null;
  item_count: number;
  total_value: number;
}

interface ShareWishlistDialogProps {
  wishlist: SharedWishlist;
  trigger?: React.ReactNode;
  onVisibilityChange?: (isPublic: boolean) => void;
}

export const ShareWishlistDialog = ({ 
  wishlist, 
  trigger,
  onVisibilityChange 
}: ShareWishlistDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [isPublic, setIsPublic] = useState(wishlist.is_public);
  const [updating, setUpdating] = useState(false);

  const shareUrl = `${window.location.origin}/wishlists/${wishlist.slug}?token=${wishlist.share_token}`;

  const handleCopyLink = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "The wishlist link has been copied to your clipboard.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy the link. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setCopying(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: wishlist.title,
          text: wishlist.description || `Check out my wishlist: ${wishlist.title}`,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out my wishlist: ${wishlist.title}`);
    const body = encodeURIComponent(
      `Hi!\n\nI've created a wishlist for ${wishlist.occasion || 'an upcoming occasion'} and wanted to share it with you.\n\n${wishlist.title}\n${wishlist.description || ''}\n\nYou can view it here: ${shareUrl}\n\nThanks!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter') => {
    const text = encodeURIComponent(`Check out my wishlist: ${wishlist.title}`);
    const url = encodeURIComponent(shareUrl);
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        break;
    }
  };

  const handleVisibilityToggle = async (newIsPublic: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('shared_wishlists')
        .update({ is_public: newIsPublic })
        .eq('id', wishlist.id);

      if (error) throw error;

      setIsPublic(newIsPublic);
      onVisibilityChange?.(newIsPublic);
      
      toast({
        title: "Visibility updated",
        description: newIsPublic 
          ? "Your wishlist is now public and can be discovered by others."
          : "Your wishlist is now private and only accessible via direct link.",
        duration: 4000,
      });
    } catch (error: any) {
      console.error('Error updating visibility:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update visibility. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Share Wishlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wishlist Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-1">{wishlist.title}</h4>
            {wishlist.description && (
              <p className="text-sm text-muted-foreground mb-2">{wishlist.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{wishlist.item_count} items</span>
              {wishlist.total_value > 0 && <span>${wishlist.total_value} total</span>}
              {wishlist.occasion && (
                <Badge variant="outline" className="text-xs">
                  {wishlist.occasion}
                </Badge>
              )}
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Privacy Settings</Label>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-orange-600" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {isPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublic 
                      ? 'Anyone can discover and view this wishlist'
                      : 'Only people with the link can view this wishlist'
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={handleVisibilityToggle}
                disabled={updating}
              />
            </div>
          </div>

          <Separator />

          {/* Share Link */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Share Link</Label>
            
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="text-xs"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopyLink}
                disabled={copying}
                variant="outline"
                className="flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Share Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Share Via</Label>
            
            <div className="grid grid-cols-2 gap-2">
              {/* Native Share (if available) */}
              {navigator.share && (
                <Button
                  onClick={handleNativeShare}
                  variant="outline"
                  className="gap-2 justify-start"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}
              
              {/* Email */}
              <Button
                onClick={handleEmailShare}
                variant="outline"
                className="gap-2 justify-start"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              
              {/* Social Media */}
              <Button
                onClick={() => handleSocialShare('facebook')}
                variant="outline"
                className="gap-2 justify-start"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              
              <Button
                onClick={() => handleSocialShare('twitter')}
                variant="outline"
                className="gap-2 justify-start"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Sharing Tips</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Friends can contribute to your wishlist by adding items</li>
              <li>• Mark items as purchased to avoid duplicates</li>
              <li>• Set a target date to create urgency</li>
              {!isPublic && (
                <li>• Make it public to help others discover your wishlist</li>
              )}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
