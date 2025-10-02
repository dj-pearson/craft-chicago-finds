import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Mail, Lock, User, Store, Calendar, AlertTriangle, Clock } from "lucide-react";
import { z } from "zod";
import { LAUNCH_CONFIG, isLaunched, isPreLaunch, getLaunchCountdown, formatLaunchDate } from "@/lib/launch-config";

// Validation schemas
const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters").max(50, "Display name must be less than 50 characters"),
  isSeller: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  // Sign Up Form
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    isSeller: false,
    agreeToTerms: false,
    agreeToPrivacy: false,
    marketingOptIn: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(getLaunchCountdown());
  const [registrationEnabled, setRegistrationEnabled] = useState(LAUNCH_CONFIG.REGISTRATION_ENABLED);
  const [emailSignupData, setEmailSignupData] = useState({
    email: "",
    type: "general" as "general" | "seller"
  });
  const [emailSignupLoading, setEmailSignupLoading] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getLaunchCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check registration status from admin settings
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        // In production, this would fetch from Supabase
        // For now, use launch config default
        setRegistrationEnabled(LAUNCH_CONFIG.REGISTRATION_ENABLED);
      } catch (error) {
        console.error("Error checking registration status:", error);
      }
    };

    checkRegistrationStatus();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo);
    }
  }, [user, navigate, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});

    try {
      const validatedData = signInSchema.parse(signInData);
      
      const { error } = await signIn(validatedData.email, validatedData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email not confirmed",
            description: "Please check your email and click the confirmation link before signing in.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if registration is enabled
    if (!registrationEnabled) {
      toast({
        title: "Registration Currently Disabled",
        description: "We're preparing for our Chicago launch on November 1st. Sign up below to be notified when registration opens!",
        variant: "destructive",
      });
      return;
    }
    
    setFormLoading(true);
    setErrors({});

    try {
      const validatedData = signUpSchema.parse(signUpData);
      
      const { error } = await signUp(
        validatedData.email, 
        validatedData.password,
        {
          display_name: validatedData.displayName,
          is_seller: validatedData.isSeller,
        }
      );
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account already exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account before signing in.",
      });
      
      setActiveTab('signin');
      setSignInData({ email: validatedData.email, password: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSignupLoading(true);

    try {
      // In production, this would save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Thanks for signing up!",
        description: "We'll notify you as soon as Chicago registration opens on November 1st.",
      });

      setEmailSignupData({ email: "", type: "general" });
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setEmailSignupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">CM</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Chicago Makers</h1>
          <p className="text-muted-foreground">Your local handmade marketplace</p>
        </div>

        {/* Launch Status Banner */}
        {!registrationEnabled && isPreLaunch() && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">Chicago Launch Coming Soon!</h3>
              </div>
              <p className="text-amber-800 text-sm mb-3">
                {LAUNCH_CONFIG.LAUNCH_HEADLINE}
              </p>
              <div className="text-center">
                <p className="text-amber-700 font-medium mb-2">Launching {formatLaunchDate('month-day')}</p>
                {!countdown.isLaunched && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white rounded p-2">
                      <div className="text-lg font-bold text-amber-900">{countdown.days}</div>
                      <div className="text-xs text-amber-600">Days</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-lg font-bold text-amber-900">{countdown.hours}</div>
                      <div className="text-xs text-amber-600">Hours</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-lg font-bold text-amber-900">{countdown.minutes}</div>
                      <div className="text-xs text-amber-600">Minutes</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-lg font-bold text-amber-900">{countdown.seconds}</div>
                      <div className="text-xs text-amber-600">Seconds</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 shadow-elevated">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup" disabled={!registrationEnabled}>
                Sign Up
                {!registrationEnabled && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Soon
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Welcome back
                  </CardTitle>
                  <CardDescription>
                    Sign in to your account to continue shopping
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={formLoading}
                  >
                    {formLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Don't have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setActiveTab('signup')}
                    >
                      Sign up here
                    </Button>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              {!registrationEnabled ? (
                <div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Registration Opens November 1st
                    </CardTitle>
                    <CardDescription>
                      Get notified when Chicago registration opens and be among the first to join!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-2">What's Coming:</h3>
                        <ul className="text-blue-800 text-sm space-y-1">
                          <li>• Connect with 50+ local Chicago artisans</li>
                          <li>• Shop unique handmade items from your neighborhood</li>
                          <li>• Support local makers and small businesses</li>
                          <li>• Enjoy local pickup and fast shipping</li>
                        </ul>
                      </div>
                      
                      <form onSubmit={handleEmailSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="notify-email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="notify-email"
                              type="email"
                              placeholder="Enter your email"
                              value={emailSignupData.email}
                              onChange={(e) => setEmailSignupData(prev => ({ ...prev, email: e.target.value }))}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>I'm interested in:</Label>
                          <div className="flex gap-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="signup-type"
                                value="general"
                                checked={emailSignupData.type === "general"}
                                onChange={(e) => setEmailSignupData(prev => ({ ...prev, type: e.target.value as "general" | "seller" }))}
                                className="text-primary"
                              />
                              <span className="text-sm">Shopping handmade items</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="signup-type"
                                value="seller"
                                checked={emailSignupData.type === "seller"}
                                onChange={(e) => setEmailSignupData(prev => ({ ...prev, type: e.target.value as "general" | "seller" }))}
                                className="text-primary"
                              />
                              <span className="text-sm">Selling my crafts</span>
                            </label>
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={emailSignupLoading}
                        >
                          {emailSignupLoading ? "Signing up..." : "Notify Me When Registration Opens"}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </div>
              ) : (
                <form onSubmit={handleSignUp}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Create an account
                    </CardTitle>
                    <CardDescription>
                      Join our community of local makers and buyers
                    </CardDescription>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your display name"
                        value={signUpData.displayName}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="seller-account"
                      checked={signUpData.isSeller}
                      onCheckedChange={(checked) => 
                        setSignUpData(prev => ({ ...prev, isSeller: checked as boolean }))
                      }
                    />
                    <Label htmlFor="seller-account" className="flex items-center gap-2 text-sm">
                      <Store className="h-4 w-4" />
                      I want to sell handmade items
                    </Label>
                  </div>

                  {/* Legal Agreements */}
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="age-verification"
                        checked={signUpData.agreeToTerms}
                        onCheckedChange={(checked) => 
                          setSignUpData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                        }
                        required
                      />
                      <Label htmlFor="age-verification" className="text-sm leading-relaxed cursor-pointer">
                        I confirm that I am 18 years of age or older and agree to the{" "}
                        <a href="/terms" target="_blank" className="text-primary hover:underline">
                          Terms of Service
                        </a>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="privacy-agreement"
                        checked={signUpData.agreeToPrivacy}
                        onCheckedChange={(checked) => 
                          setSignUpData(prev => ({ ...prev, agreeToPrivacy: checked as boolean }))
                        }
                        required
                      />
                      <Label htmlFor="privacy-agreement" className="text-sm leading-relaxed cursor-pointer">
                        I have read and agree to the{" "}
                        <a href="/privacy" target="_blank" className="text-primary hover:underline">
                          Privacy Policy
                        </a>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="marketing-opt-in"
                        checked={signUpData.marketingOptIn}
                        onCheckedChange={(checked) => 
                          setSignUpData(prev => ({ ...prev, marketingOptIn: checked as boolean }))
                        }
                      />
                      <Label htmlFor="marketing-opt-in" className="text-sm leading-relaxed cursor-pointer">
                        Send me updates about new makers and local events (optional)
                      </Label>
                    </div>
                  </div>

                  {/* Intermediary Notice */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900">
                      <strong>Notice:</strong> Craft Local is a marketplace platform connecting buyers and sellers. 
                      We are not the seller of products listed. Each seller is responsible for their products and fulfillment.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={formLoading || !signUpData.agreeToTerms || !signUpData.agreeToPrivacy}
                  >
                    {formLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setActiveTab('signin')}
                    >
                      Sign in here
                    </Button>
                  </p>
                </CardFooter>
              </form>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;