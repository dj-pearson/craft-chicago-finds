import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  CheckCircle, 
  Zap, 
  Lock,
  Activity
} from 'lucide-react';
import { useEnhancedPerformanceMonitor } from '@/hooks/useEnhancedPerformanceMonitor';

interface SecurityIndicatorProps {
  variant?: 'compact' | 'detailed';
  showPerformance?: boolean;
}

export const SecurityIndicator: React.FC<SecurityIndicatorProps> = ({ 
  variant = 'compact',
  showPerformance = true 
}) => {
  const { performanceScore, isHealthy, systemHealth } = useEnhancedPerformanceMonitor();

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">Secure</span>
        </div>
        {showPerformance && (
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-blue-600 font-medium">Fast</span>
          </div>
        )}
        <Badge variant="outline" className="text-xs">
          Protected Checkout
        </Badge>
      </div>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Your Transaction is Protected</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Fraud Detection Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span>Encrypted Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Seller Verified</span>
            </div>
            {showPerformance && (
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span>System Healthy</span>
              </div>
            )}
          </div>

          {showPerformance && (
            <div className="pt-2 border-t border-green-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-700">Platform Performance</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="font-medium">
                    {performanceScore}/100 {isHealthy ? 'Excellent' : 'Good'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
