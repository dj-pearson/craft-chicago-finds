import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, DollarSign, CreditCard, Clock } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  className?: string;
}

export const PaymentStatusBadge = ({ status, className }: PaymentStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Paid',
          color: 'text-success'
        };
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Pending',
          color: 'text-warning'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          label: 'Failed',
          color: 'text-destructive'
        };
      case 'refunded':
        return {
          variant: 'outline' as const,
          icon: DollarSign,
          label: 'Refunded',
          color: 'text-muted-foreground'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: AlertCircle,
          label: 'Unknown',
          color: 'text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${className}`}>
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
};

interface PaymentSummaryCardProps {
  totalRevenue: number;
  pendingPayouts: number;
  completedOrders: number;
  refundedAmount: number;
}

export const PaymentSummaryCard = ({ 
  totalRevenue, 
  pendingPayouts, 
  completedOrders, 
  refundedAmount 
}: PaymentSummaryCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">All time earnings</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${pendingPayouts.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Awaiting transfer</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedOrders}</div>
          <p className="text-xs text-muted-foreground">Successfully paid</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Refunded</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${refundedAmount.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Total refunds</p>
        </CardContent>
      </Card>
    </div>
  );
};