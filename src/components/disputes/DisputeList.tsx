import { useDisputes } from '@/hooks/useDisputes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DisputeListProps {
  onSelectDispute: (disputeId: string) => void;
}

export function DisputeList({ onSelectDispute }: DisputeListProps) {
  const { disputes, loading } = useDisputes();

  if (loading) {
    return <div className="text-center py-8">Loading disputes...</div>;
  }

  if (disputes.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No disputes found</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-4 w-4" />;
      case 'in_review':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_review':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    switch (type) {
      case 'quality':
        return 'Product Quality';
      case 'shipping':
        return 'Shipping Issues';
      case 'payment':
        return 'Payment Problems';
      case 'description':
        return 'Incorrect Description';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {disputes.map((dispute) => (
        <Card key={dispute.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{dispute.title}</CardTitle>
              <Badge variant={getStatusColor(dispute.status) as any} className="flex items-center gap-1">
                {getStatusIcon(dispute.status)}
                {dispute.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Type: {getDisputeTypeLabel(dispute.dispute_type)}</span>
                <span>Created: {format(new Date(dispute.created_at), 'MMM d, yyyy')}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {dispute.description}
              </p>
              <div className="flex justify-end pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onSelectDispute(dispute.id)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}