import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface AvailableTodayPromoProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const AvailableTodayPromo = ({ onDismiss, showDismiss = true }: AvailableTodayPromoProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
    // Store dismissal in localStorage
    localStorage.setItem("availableTodayPromoDismissed", "true");
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-warning/5 to-accent/10 relative overflow-hidden">
      {showDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-background/20"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Icon Section */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-bold">Turn Availability Into Revenue</h3>
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />
                Infrastructure Tool
              </Badge>
            </div>

            <p className="text-muted-foreground">
              <strong className="text-foreground">38% of orders are same-day pickup.</strong> Enable "Available Today" each morning to capture urgent gift buyers.
              Listings get <strong className="text-primary">3x more views</strong> and priority search placement.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-background/50 rounded-lg border border-border/50">
                <div className="text-2xl font-bold text-primary">38%</div>
                <div className="text-xs text-muted-foreground">Same-Day Pickup Rate</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg border border-border/50">
                <div className="text-2xl font-bold text-primary">3x</div>
                <div className="text-xs text-muted-foreground">More Views</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg border border-border/50">
                <div className="text-2xl font-bold text-primary">+20%</div>
                <div className="text-xs text-muted-foreground">Weekly Revenue</div>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block">Priority Placement</strong>
                  <span className="text-muted-foreground">Top of search results</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block">Urgent Buyers</strong>
                  <span className="text-muted-foreground">Last-minute gift needs</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block">Immediate Revenue</strong>
                  <span className="text-muted-foreground">Zero shipping hassle</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex-shrink-0 w-full md:w-auto">
            <Button size="lg" className="w-full md:w-auto gap-2" asChild>
              <Link to="/dashboard?tab=ready-today">
                Enable Available Today
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Takes 30 seconds. Enable each morning.
            </p>
          </div>
        </div>

        {/* Competitive Advantage Footer */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong className="text-primary">Infrastructure Advantage:</strong> Etsy can't do same-day local filtering.
            Real-time availability requires hyperlocal infrastructure we spent a year building.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
