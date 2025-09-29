import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Package } from 'lucide-react';

// Placeholder component - database tables not implemented yet
export const BundleBuilder: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bundle Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-700">
            Bundle Builder will be available once the product_bundles database table is implemented.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};