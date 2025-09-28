import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Star, Shield, MessageCircle, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SellerInfoProps {
  seller?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio?: string | null;
    seller_verified?: boolean;
  } | null;
}

export const SellerInfo = ({ seller }: SellerInfoProps) => {
  const { toast } = useToast();

  const handleContact = () => {
    toast({
      title: "Feature coming soon",
      description: "Direct messaging will be available soon.",
    });
  };

  const handleViewProfile = () => {
    toast({
      title: "Feature coming soon", 
      description: "Seller profiles will be available soon.",
    });
  };

  if (!seller) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seller Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Seller information not available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Seller Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seller Profile */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={seller.avatar_url || ""} alt={seller.display_name || "Seller"} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
              {seller.display_name?.charAt(0) || "S"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">
                {seller.display_name || "Anonymous Seller"}
              </h3>
              {seller.seller_verified && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            
            {/* Mock seller stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                <span>4.8 (42 reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Store className="h-3 w-3" />
                <span>18 items sold</span>
              </div>
            </div>

            {seller.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {seller.bio}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleContact}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Seller
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleViewProfile}
          >
            <Store className="mr-2 h-4 w-4" />
            View Shop
          </Button>
        </div>

        {/* Seller Policies */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Seller Policies</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span>Ships from Chicago, IL</span>
            </div>
            <div>• Processing time: 1-3 business days</div>
            <div>• Returns accepted within 14 days</div>
            <div>• Custom orders welcome</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};