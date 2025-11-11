import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Package, Truck, MapPin, X } from 'lucide-react';

interface ReadyTodayFilters {
  readyToday?: boolean;
  shipsToday?: boolean;
  pickupToday?: boolean;
}

interface ReadyTodayFiltersProps {
  filters: ReadyTodayFilters;
  onFiltersChange: (filters: ReadyTodayFilters) => void;
}

export const ReadyTodayFilters = ({ filters, onFiltersChange }: ReadyTodayFiltersProps) => {
  const handleFilterToggle = (key: keyof ReadyTodayFilters) => {
    const newFilters = { ...filters };
    if (newFilters[key]) {
      delete newFilters[key];
    } else {
      newFilters[key] = true;
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-warning-foreground">
            <Clock className="h-5 w-5" />
            Available Today
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground h-8"
            >
              Clear
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Same-day pickup infrastructure: Get handmade gifts urgently. Zero shipping wait.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {filters.readyToday && (
                <Badge variant="secondary" className="gap-1">
                  <Package className="h-3 w-3" />
                  Ready Today
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterToggle('readyToday')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.shipsToday && (
                <Badge variant="secondary" className="gap-1">
                  <Truck className="h-3 w-3" />
                  Ships Today
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterToggle('shipsToday')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.pickupToday && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  Pickup Today
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterToggle('pickupToday')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
            <Separator />
          </div>
        )}

        {/* Filter Options */}
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant={filters.readyToday ? "default" : "outline"}
            onClick={() => handleFilterToggle('readyToday')}
            className="justify-start gap-2 h-12"
          >
            <Package className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Ready Today</div>
              <div className="text-xs opacity-80">In stock and ready to go</div>
            </div>
          </Button>

          <Button
            variant={filters.shipsToday ? "default" : "outline"}
            onClick={() => handleFilterToggle('shipsToday')}
            className="justify-start gap-2 h-12"
          >
            <Truck className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Ships Today</div>
              <div className="text-xs opacity-80">Will ship out today</div>
            </div>
          </Button>

          <Button
            variant={filters.pickupToday ? "default" : "outline"}
            onClick={() => handleFilterToggle('pickupToday')}
            className="justify-start gap-2 h-12"
          >
            <MapPin className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Pickup Today</div>
              <div className="text-xs opacity-80">Available for pickup today</div>
            </div>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
          <strong className="text-primary">Infrastructure Advantage:</strong> Same-day pickup from 500+ Chicago makers.
          No other platform offers real-time local availability filtering.
        </div>
      </CardContent>
    </Card>
  );
};