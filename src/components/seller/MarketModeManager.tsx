import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  MapPin,
  QrCode,
  TrendingUp,
  Eye,
  Package,
  ShoppingCart,
  Play,
  Square,
  Zap,
  Building2,
  ExternalLink
} from "lucide-react";
import { useMarketMode } from "@/hooks/useMarketMode";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MarketModeManagerProps {
  sellerId: string;
}

export const MarketModeManager = ({ sellerId }: MarketModeManagerProps) => {
  const { participations, activeSessions, isLoading, startSession, endSession } = useMarketMode(sellerId);
  const [selectedParticipation, setSelectedParticipation] = useState<string | null>(null);
  const [sessionConfig, setSessionConfig] = useState({
    availableForPickup: true,
    availableForShipping: true,
    boothNotes: ""
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Market Mode</CardTitle>
          </div>
          <CardDescription>Loading craft fair information...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const handleStartSession = (participationId: string, fairId: string) => {
    startSession.mutate({
      participantId: participationId,
      fairId,
      ...sessionConfig
    });
  };

  const handleEndSession = (sessionId: string) => {
    endSession.mutate(sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Infrastructure Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Market Mode - Physical + Digital Integration</CardTitle>
          </div>
          <CardDescription>
            Bridge your craft fair booth with digital commerce. Display QR code at booth → buyers scan →
            browse full catalog → reserve/order for pickup or shipping. Sell out? Keep selling online.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Active Sessions */}
      {activeSessions && activeSessions.length > 0 && (
        <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-warning animate-pulse" />
              Market Mode Active
            </CardTitle>
            <CardDescription>Your booth is live! Buyers can scan your QR code now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.fair.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {session.participant.booth_number && `Booth ${session.participant.booth_number} - `}
                        {session.fair.venue_name}
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleEndSession(session.id)}
                      disabled={endSession.isPending}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Live Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-background rounded border border-border">
                      <QrCode className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{session.qr_scans}</div>
                      <div className="text-xs text-muted-foreground">QR Scans</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded border border-border">
                      <Eye className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{session.catalog_views}</div>
                      <div className="text-xs text-muted-foreground">Catalog Views</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded border border-border">
                      <Package className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{session.items_viewed}</div>
                      <div className="text-xs text-muted-foreground">Items Viewed</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded border border-border">
                      <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{session.reservations_made}</div>
                      <div className="text-xs text-muted-foreground">Reservations</div>
                    </div>
                    <div className="text-center p-3 bg-primary/10 rounded border border-primary/20">
                      <ShoppingCart className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold text-primary">{session.orders_placed}</div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                    </div>
                  </div>

                  {/* Booth Notes */}
                  {session.booth_notes && (
                    <Alert>
                      <AlertTitle>Booth Notes</AlertTitle>
                      <AlertDescription>{session.booth_notes}</AlertDescription>
                    </Alert>
                  )}

                  {/* Session Started */}
                  <p className="text-xs text-muted-foreground">
                    Session started: {new Date(session.session_start).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Fairs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Your Craft Fair Schedule
          </CardTitle>
          <CardDescription>
            Fairs you're registered for. Enable Market Mode when you arrive at the venue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!participations || participations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No upcoming craft fairs</p>
              <Button variant="outline" asChild>
                <a href="/for-craft-fairs" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Learn About Market Mode
                </a>
              </Button>
            </div>
          ) : (
            participations.map((participation) => {
              const isActive = activeSessions?.some(s => s.participant_id === participation.id);
              const isFairActive = participation.fair.status === 'active';
              const fairStart = new Date(participation.fair.start_date);
              const fairEnd = new Date(participation.fair.end_date);
              const isUpcoming = fairStart > new Date();
              const isOngoing = fairStart <= new Date() && fairEnd >= new Date();

              return (
                <Card key={participation.id} className={isActive ? "border-primary/30" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{participation.fair.name}</CardTitle>
                          {isActive && (
                            <Badge variant="default" className="gap-1">
                              <Zap className="w-3 h-3" />
                              Live
                            </Badge>
                          )}
                          {isUpcoming && (
                            <Badge variant="outline">Upcoming</Badge>
                          )}
                          {isOngoing && !isActive && (
                            <Badge variant="secondary">Ongoing</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {participation.booth_number && `Booth ${participation.booth_number} - `}
                            {participation.fair.venue_name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(participation.fair.start_date).toLocaleDateString()} -{" "}
                            {new Date(participation.fair.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {!isActive && isOngoing && (
                        <Button
                          onClick={() => setSelectedParticipation(
                            selectedParticipation === participation.id ? null : participation.id
                          )}
                          variant={selectedParticipation === participation.id ? "secondary" : "default"}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Market Mode
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  {/* Market Mode Configuration */}
                  {selectedParticipation === participation.id && !isActive && (
                    <CardContent className="space-y-4 border-t pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`pickup-${participation.id}`}>
                            Available for booth pickup
                          </Label>
                          <Switch
                            id={`pickup-${participation.id}`}
                            checked={sessionConfig.availableForPickup}
                            onCheckedChange={(checked) =>
                              setSessionConfig({ ...sessionConfig, availableForPickup: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor={`shipping-${participation.id}`}>
                            Available for shipping
                          </Label>
                          <Switch
                            id={`shipping-${participation.id}`}
                            checked={sessionConfig.availableForShipping}
                            onCheckedChange={(checked) =>
                              setSessionConfig({ ...sessionConfig, availableForShipping: checked })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`notes-${participation.id}`}>
                            Booth notes (optional)
                          </Label>
                          <Textarea
                            id={`notes-${participation.id}`}
                            placeholder="e.g., 'Booth #47, ask for Sarah' or 'Pickup after 4pm'"
                            value={sessionConfig.boothNotes}
                            onChange={(e) =>
                              setSessionConfig({ ...sessionConfig, boothNotes: e.target.value })
                            }
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStartSession(participation.id, participation.fair_id)}
                            disabled={startSession.isPending}
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Activate Market Mode
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedParticipation(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Infrastructure Footer */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-primary">Infrastructure Advantage:</strong> Market Mode bridges
              physical craft fairs with e-commerce. Buyers scan QR → browse full catalog → reserve/order.
              Track engagement in real-time. No other platform offers craft fair integration. Part of Spring
              2025 pilot program.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
