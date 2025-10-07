import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  children,
}: EmptyStateProps) => {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Icon className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl md:text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            {action.label}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
};