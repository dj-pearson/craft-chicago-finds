import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface CustomOrderChatProps {
  listingId: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  productTitle: string;
  className?: string;
}

export const CustomOrderChat = ({ className = '' }: CustomOrderChatProps) => {
  return (
    <Card className={className}>
      <CardContent className="p-6 text-center">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Custom Orders Coming Soon</h3>
        <p className="text-sm text-muted-foreground">
          Direct messaging with sellers for custom orders will be available soon.
        </p>
      </CardContent>
    </Card>
  );
};