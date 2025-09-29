import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Award } from 'lucide-react';

// Placeholder component - database functions not implemented yet
export const SellerBadges: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Seller Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-700">
            Seller badges will be available once the get_seller_badges database function is implemented.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};