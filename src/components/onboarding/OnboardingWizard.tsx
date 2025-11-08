/**
 * Onboarding Wizard Component
 * Multi-step wizard for new user onboarding
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCityContext } from '@/hooks/useCityContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  User,
  MapPin,
  Briefcase,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Store,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

interface City {
  id: string;
  name: string;
  state: string;
}

export const OnboardingWizard = ({ open, onComplete }: OnboardingWizardProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { setCurrentCity } = useCityContext();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);

  // Form data
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [accountType, setAccountType] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [selectedCityId, setSelectedCityId] = useState('');

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Load cities on mount
  useEffect(() => {
    const loadCities = async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, state')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setCities(data);
      }
    };
    loadCities();
  }, []);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName || null,
          location: location || null,
          bio: bio || null,
          is_seller: accountType === 'seller' || accountType === 'both',
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Set preferred city if selected
      if (selectedCityId) {
        const selectedCity = cities.find((c) => c.id === selectedCityId);
        if (selectedCity) {
          setCurrentCity(selectedCity);
          localStorage.setItem('preferredCity', JSON.stringify(selectedCity));
        }
      }

      await refreshProfile();

      toast.success('Welcome to Craft Chicago Finds!');
      onComplete();

      // Navigate based on account type
      if (accountType === 'seller' || accountType === 'both') {
        navigate('/dashboard');
      } else {
        navigate('/browse');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return true; // Welcome screen, no validation
      case 2:
        return displayName.trim().length > 0;
      case 3:
        return accountType !== '';
      case 4:
        return true; // City selection is optional
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl" hideClose>
        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">
                Welcome to Craft Chicago Finds!
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                Let's take a moment to set up your account. This will only take a minute and
                will help us personalize your experience.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <User className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">Complete Profile</p>
                  <p className="text-xs text-muted-foreground">Tell us about yourself</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Briefcase className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">Choose Your Path</p>
                  <p className="text-xs text-muted-foreground">Buyer, seller, or both</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">Select City</p>
                  <p className="text-xs text-muted-foreground">Find local artisans</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNext} size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Profile Setup */}
        {step === 2 && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <User className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">Complete Your Profile</DialogTitle>
              <DialogDescription className="text-center">
                Help others in the community get to know you
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Sarah Miller"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is how you'll appear to other users
                </p>
              </div>

              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Chicago, IL"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bio.length}/500 characters
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Account Type */}
        {step === 3 && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 rounded-full">
                  <Briefcase className="h-12 w-12 text-purple-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">What brings you here?</DialogTitle>
              <DialogDescription className="text-center">
                Choose your primary interest (you can change this later)
              </DialogDescription>
            </DialogHeader>

            <RadioGroup value={accountType} onValueChange={(value: any) => setAccountType(value)}>
              <div className="space-y-3">
                <Card
                  className={`cursor-pointer transition-all ${
                    accountType === 'buyer' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setAccountType('buyer')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="buyer" id="buyer" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingBag className="h-5 w-5 text-primary" />
                          <Label htmlFor="buyer" className="text-lg font-semibold cursor-pointer">
                            I want to buy
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Discover and purchase unique handmade items from local artisans
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    accountType === 'seller' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setAccountType('seller')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="seller" id="seller" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="h-5 w-5 text-primary" />
                          <Label htmlFor="seller" className="text-lg font-semibold cursor-pointer">
                            I want to sell
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Share your crafts with the community and start earning
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    accountType === 'both' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setAccountType('both')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="both" id="both" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <Label htmlFor="both" className="text-lg font-semibold cursor-pointer">
                            Both!
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Buy from others and sell your own creations
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>

            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: City Selection */}
        {step === 4 && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <MapPin className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">Choose Your City</DialogTitle>
              <DialogDescription className="text-center">
                Select your preferred city to discover local makers (optional)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="city">Preferred City</Label>
                <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}, {city.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  You can browse other cities anytime
                </p>
              </div>

              {selectedCityId && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Great choice!</p>
                      <p className="text-xs text-green-700">
                        You'll see listings from local artisans in{' '}
                        {cities.find((c) => c.id === selectedCityId)?.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleComplete} disabled={loading} size="lg" className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
