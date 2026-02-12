import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar,
  Clock,
  MapPin,
  Mail,
  Users,
  Store,
  Star,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LAUNCH_CONFIG, getLaunchCountdown, formatLaunchDate } from "@/lib/launch-config";

interface ComingSoonBannerProps {
  className?: string;
  variant?: 'full' | 'compact' | 'hero';
}

export const ComingSoonBanner = ({ className, variant = 'full' }: ComingSoonBannerProps) => {
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(getLaunchCountdown());
  const [emailSignup, setEmailSignup] = useState({
    email: "",
    type: "buyer" as "buyer" | "seller"
  });
  const [signupLoading, setSignupLoading] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getLaunchCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);

    try {
      // In production, this would save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Thanks for signing up!",
        description: "We'll notify you as soon as Chicago launches on November 1st.",
      });

      setEmailSignup({ email: "", type: "buyer" });
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSignupLoading(false);
    }
  };

  if (variant === 'hero') {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 ${className}`}>
        <div className="absolute inset-0 bg-[url('/images/craft-pattern.svg')] opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium">
              <Calendar className="h-4 w-4 mr-2" />
              Launching {formatLaunchDate('month-day')}
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
              {LAUNCH_CONFIG.LAUNCH_HEADLINE}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {LAUNCH_CONFIG.LAUNCH_SUBHEADLINE}
            </p>

            {!countdown.isLaunched && (
              <div className="grid grid-cols-4 gap-4 max-w-md mx-auto mb-8">
                <div className="bg-white/80 backdrop-blur rounded-lg p-4 border">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{countdown.days}</div>
                  <div className="text-sm text-muted-foreground">Days</div>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-lg p-4 border">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{countdown.hours}</div>
                  <div className="text-sm text-muted-foreground">Hours</div>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-lg p-4 border">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{countdown.minutes}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-lg p-4 border">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{countdown.seconds}</div>
                  <div className="text-sm text-muted-foreground">Seconds</div>
                </div>
              </div>
            )}

            <div className="max-w-md mx-auto">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={emailSignup.email}
                      onChange={(e) => setEmailSignup(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={signupLoading} size="lg">
                    {signupLoading ? "..." : "Notify Me"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                
                <div className="flex justify-center gap-6 text-sm">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="signup-type"
                      value="buyer"
                      checked={emailSignup.type === "buyer"}
                      onChange={(e) => setEmailSignup(prev => ({ ...prev, type: e.target.value as "buyer" | "seller" }))}
                      className="text-primary"
                    />
                    <span>I want to shop</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="signup-type"
                      value="seller"
                      checked={emailSignup.type === "seller"}
                      onChange={(e) => setEmailSignup(prev => ({ ...prev, type: e.target.value as "buyer" | "seller" }))}
                      className="text-primary"
                    />
                    <span>I want to sell</span>
                  </label>
                </div>
              </form>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">50+ Local Artisans</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with talented makers across Chicago neighborhoods
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Unique Handmade Items</h3>
                <p className="text-sm text-muted-foreground">
                  Discover one-of-a-kind crafts you won't find anywhere else
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Local Pickup & Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Support local business with convenient pickup options
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`border-primary/20 bg-primary/5 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Chicago Launch: {formatLaunchDate('month-day')}</h3>
                <p className="text-sm text-muted-foreground">
                  {countdown.days}d {countdown.hours}h {countdown.minutes}m remaining
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              Get Notified
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant (default)
  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <Badge variant="outline" className="px-3 py-1">
              <Calendar className="h-3 w-3 mr-1" />
              Coming {formatLaunchDate('month-day')}
            </Badge>
            <h2 className="text-2xl font-bold">{LAUNCH_CONFIG.LAUNCH_HEADLINE}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {LAUNCH_CONFIG.PRE_LAUNCH_MESSAGE}
            </p>
          </div>

          {!countdown.isLaunched && (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
              <div className="bg-white/80 rounded-lg p-3 border">
                <div className="text-xl font-bold text-primary">{countdown.days}</div>
                <div className="text-xs text-muted-foreground">Days</div>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border">
                <div className="text-xl font-bold text-primary">{countdown.hours}</div>
                <div className="text-xs text-muted-foreground">Hours</div>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border">
                <div className="text-xl font-bold text-primary">{countdown.minutes}</div>
                <div className="text-xs text-muted-foreground">Minutes</div>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border">
                <div className="text-xl font-bold text-primary">{countdown.seconds}</div>
                <div className="text-xs text-muted-foreground">Seconds</div>
              </div>
            </div>
          )}

          <div className="bg-white/50 rounded-lg p-4 max-w-lg mx-auto">
            <h3 className="font-semibold mb-3">What to expect:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>50+ local artisans</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Unique handmade items</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Local pickup options</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Support local makers</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4 max-w-md mx-auto">
            <div className="space-y-2">
              <Label htmlFor="email-signup">Get notified when we launch</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="Enter your email"
                  value={emailSignup.email}
                  onChange={(e) => setEmailSignup(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-center gap-4 text-sm">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="signup-type"
                  value="buyer"
                  checked={emailSignup.type === "buyer"}
                  onChange={(e) => setEmailSignup(prev => ({ ...prev, type: e.target.value as "buyer" | "seller" }))}
                  className="text-primary"
                />
                <span>I want to shop</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="signup-type"
                  value="seller"
                  checked={emailSignup.type === "seller"}
                  onChange={(e) => setEmailSignup(prev => ({ ...prev, type: e.target.value as "buyer" | "seller" }))}
                  className="text-primary"
                />
                <span>I want to sell</span>
              </label>
            </div>
            
            <Button type="submit" disabled={signupLoading} className="w-full">
              {signupLoading ? "Signing up..." : "Notify Me When We Launch"}
            </Button>
          </form>

          <div className="text-xs text-muted-foreground">
            Questions? Email us at{" "}
            <a href={`mailto:${LAUNCH_CONFIG.LAUNCH_EMAIL}`} className="text-primary hover:underline">
              {LAUNCH_CONFIG.LAUNCH_EMAIL}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
