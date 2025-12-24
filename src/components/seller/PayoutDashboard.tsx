import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformFee } from '@/hooks/usePlatformFee';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommissionPayout {
  id: string;
  period_start: string;
  period_end: string;
  gross_sales: number;
  commission_amount: number;
  seller_payout: number;
  order_count: number;
  payout_status: string;
  payout_method: string;
  processed_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  adjustment_amount: number | null;
  notes: string | null;
}

export function PayoutDashboard() {
  const { user } = useAuth();
  const { feeRate, flatFee } = usePlatformFee();
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [pendingPayout, setPendingPayout] = useState<CommissionPayout | null>(null);

  useEffect(() => {
    if (user) {
      fetchPayouts();
      calculateCurrentBalance();
    }
  }, [user]);

  const fetchPayouts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commission_payouts')
        .select('*')
        .eq('seller_id', user.id)
        .order('period_start', { ascending: false });

      if (error) throw error;

      setPayouts(data || []);

      // Find the next pending payout
      const pending = data?.find((p) => p.payout_status === 'pending');
      setPendingPayout(pending || null);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to load payout information');
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentBalance = async () => {
    if (!user) return;

    try {
      // Get all completed orders that haven't been paid out yet
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, discount_amount, platform_fee')
        .eq('seller_id', user.id)
        .eq('status', 'delivered')
        .is('commission_payout_id', null);

      if (error) throw error;

      // Calculate seller's share
      const balance = orders?.reduce((acc, order) => {
        const subtotal = order.total_amount - (order.discount_amount || 0);
        const platformFee = order.platform_fee || ((subtotal * feeRate) + flatFee);
        const sellerAmount = subtotal - platformFee;
        return acc + sellerAmount;
      }, 0) || 0;

      setCurrentBalance(balance);
    } catch (error) {
      console.error('Error calculating balance:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: Clock,
        };
      case 'processing':
        return {
          label: 'Processing',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Loader2,
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: CheckCircle,
        };
      case 'failed':
        return {
          label: 'Failed',
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: XCircle,
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: AlertCircle,
        };
    }
  };

  const exportPayouts = () => {
    if (payouts.length === 0) {
      toast.error('No payouts to export');
      return;
    }

    const csvContent = [
      ['Period Start', 'Period End', 'Gross Sales', 'Commission', 'Your Payout', 'Orders', 'Status', 'Completed Date'].join(','),
      ...payouts.map((p) =>
        [
          format(new Date(p.period_start), 'yyyy-MM-dd'),
          format(new Date(p.period_end), 'yyyy-MM-dd'),
          p.gross_sales.toFixed(2),
          p.commission_amount.toFixed(2),
          p.seller_payout.toFixed(2),
          p.order_count,
          p.payout_status,
          p.completed_at ? format(new Date(p.completed_at), 'yyyy-MM-dd HH:mm') : 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Payouts exported successfully');
  };

  const totalLifetimePayouts = payouts
    .filter((p) => p.payout_status === 'completed')
    .reduce((acc, p) => acc + p.seller_payout, 0);

  const totalLifetimeSales = payouts
    .filter((p) => p.payout_status === 'completed')
    .reduce((acc, p) => acc + p.gross_sales, 0);

  const totalCommissionPaid = payouts
    .filter((p) => p.payout_status === 'completed')
    .reduce((acc, p) => acc + p.commission_amount, 0);

  const averageCommissionRate = totalLifetimeSales > 0
    ? (totalCommissionPaid / totalLifetimeSales) * 100
    : feeRate * 100;

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Payout Schedule:</strong> Payouts are processed weekly on Mondays for all
          delivered orders from the previous week. Funds typically arrive in your account within
          2-3 business days via Stripe.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From delivered orders awaiting payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {pendingPayout ? (
              <>
                <div className="text-2xl font-bold">
                  ${pendingPayout.seller_payout.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(pendingPayout.period_end), 'MMM d, yyyy')} -{' '}
                  {format(new Date(pendingPayout.period_end).setDate(new Date(pendingPayout.period_end).getDate() + 3), 'MMM d, yyyy')}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">$0.00</div>
                <p className="text-xs text-muted-foreground">No pending payout</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalLifetimePayouts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From ${totalLifetimeSales.toFixed(2)} in sales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Breakdown</CardTitle>
          <CardDescription>Understanding your payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
              <div>
                <div className="font-medium">Platform Fee</div>
                <div className="text-sm text-muted-foreground">
                  Charged on each sale for marketplace services
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{averageCommissionRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">
                  ${totalCommissionPaid.toFixed(2)} total
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
              <div>
                <div className="font-medium text-green-700">Your Earnings</div>
                <div className="text-sm text-green-600">
                  After platform fee deduction
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-green-700">
                  {(100 - averageCommissionRate).toFixed(1)}%
                </div>
                <div className="text-xs text-green-600">
                  ${totalLifetimePayouts.toFixed(2)} total
                </div>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>
                      Platform fee covers: hosting, payment processing, customer support, marketing, and fraud prevention
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    The platform fee includes Stripe processing fees (2.9% + 30¢),
                    infrastructure costs, and marketplace services to help you succeed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                All your past and pending payouts
              </CardDescription>
            </div>
            <Button onClick={exportPayouts} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payouts yet</h3>
              <p className="text-muted-foreground mb-4">
                Your first payout will appear here once you complete your first sale
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Your Payout</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => {
                    const statusConfig = getStatusConfig(payout.payout_status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(payout.period_start), 'MMM d')}</div>
                            <div className="text-muted-foreground">
                              to {format(new Date(payout.period_end), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${payout.gross_sales.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -${payout.commission_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          ${payout.seller_payout.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{payout.order_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {payout.failure_reason && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-red-500 ml-2 inline-block" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{payout.failure_reason}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {payout.completed_at
                              ? format(new Date(payout.completed_at), 'MMM d, yyyy')
                              : payout.processed_at
                              ? format(new Date(payout.processed_at), 'MMM d, yyyy')
                              : 'Pending'}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
