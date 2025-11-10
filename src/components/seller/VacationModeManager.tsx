import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Plane,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface VacationInfo {
  is_on_vacation: boolean;
  vacation_message: string | null;
  vacation_start_date: string | null;
  vacation_end_date: string | null;
  vacation_auto_return: boolean;
  days_remaining: number | null;
}

export function VacationModeManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vacationInfo, setVacationInfo] = useState<VacationInfo | null>(null);

  // Form state
  const [isOnVacation, setIsOnVacation] = useState(false);
  const [vacationMessage, setVacationMessage] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoReturn, setAutoReturn] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVacationInfo();
    }
  }, [user]);

  const fetchVacationInfo = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_vacation_info', {
        p_seller_id: user.id,
      });

      if (error) throw error;

      setVacationInfo(data as VacationInfo);
      setIsOnVacation(data.is_on_vacation);
      setVacationMessage(data.vacation_message || '');
      setEndDate(data.vacation_end_date ? format(new Date(data.vacation_end_date), "yyyy-MM-dd'T'HH:mm") : '');
      setAutoReturn(data.vacation_auto_return);
    } catch (error) {
      console.error('Error fetching vacation info:', error);
      toast.error('Failed to load vacation settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate
    if (isOnVacation && !vacationMessage.trim()) {
      toast.error('Please enter a vacation message for your customers');
      return;
    }

    if (isOnVacation && endDate && new Date(endDate) <= new Date()) {
      toast.error('End date must be in the future');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.rpc('set_vacation_mode', {
        p_seller_id: user.id,
        p_is_on_vacation: isOnVacation,
        p_vacation_message: vacationMessage.trim() || null,
        p_vacation_start_date: isOnVacation ? null : null, // Will default to NOW() if turning on
        p_vacation_end_date: isOnVacation && endDate ? new Date(endDate).toISOString() : null,
        p_vacation_auto_return: autoReturn,
      });

      if (error) throw error;

      toast.success(
        isOnVacation
          ? 'Vacation mode activated!'
          : 'Vacation mode deactivated - welcome back!'
      );

      // Refresh the vacation info
      await fetchVacationInfo();
    } catch (error) {
      console.error('Error saving vacation mode:', error);
      toast.error('Failed to update vacation mode');
    } finally {
      setSaving(false);
    }
  };

  const getDaysRemaining = () => {
    if (!vacationInfo?.vacation_end_date) return null;
    const days = differenceInDays(new Date(vacationInfo.vacation_end_date), new Date());
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          <CardTitle>Vacation Mode</CardTitle>
        </div>
        <CardDescription>
          Take a break without losing your shop presence or search rankings
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status Alert */}
        {vacationInfo?.is_on_vacation && (
          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Your shop is currently in vacation mode.</strong>
              {daysRemaining !== null && daysRemaining > 0 && (
                <span className="ml-2">Returning in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.</span>
              )}
              <br />
              Your listings remain visible, but a vacation banner will be shown to buyers.
            </AlertDescription>
          </Alert>
        )}

        {/* Vacation Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="vacation-toggle" className="text-base font-medium">
              Vacation Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Pause your shop temporarily while keeping your presence
            </p>
          </div>
          <Switch
            id="vacation-toggle"
            checked={isOnVacation}
            onCheckedChange={setIsOnVacation}
            disabled={saving}
          />
        </div>

        {isOnVacation && (
          <>
            <Separator />

            {/* Vacation Message */}
            <div className="space-y-2">
              <Label htmlFor="vacation-message">
                Vacation Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="vacation-message"
                value={vacationMessage}
                onChange={(e) => setVacationMessage(e.target.value)}
                placeholder="e.g., Taking a break to restock! Back on January 15th. Orders will be processed after my return."
                rows={4}
                maxLength={500}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                {vacationMessage.length}/500 characters - This message will be displayed to buyers
              </p>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end-date">Return Date (Optional)</Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if you're not sure when you'll return
              </p>
            </div>

            {/* Auto Return */}
            {endDate && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <div className="space-y-1">
                  <Label htmlFor="auto-return" className="text-sm font-medium">
                    Auto-return from vacation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically deactivate vacation mode after the return date
                  </p>
                </div>
                <Switch
                  id="auto-return"
                  checked={autoReturn}
                  onCheckedChange={setAutoReturn}
                  disabled={saving}
                />
              </div>
            )}
          </>
        )}

        {/* Info Section */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Your listings remain visible in search results and on your shop page</li>
              <li>A vacation banner with your message appears on your shop</li>
              <li>New orders can still be placed (you can disable this separately)</li>
              <li>Your shop maintains its search ranking and SEO</li>
              <li>Buyers know when to expect order processing</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>

          {vacationInfo?.is_on_vacation && !isOnVacation && (
            <Button
              variant="outline"
              onClick={fetchVacationInfo}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Current Vacation Info Display */}
        {vacationInfo?.is_on_vacation && !isOnVacation && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Current Vacation Details
            </h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Started:</strong>{' '}
                {vacationInfo.vacation_start_date
                  ? format(new Date(vacationInfo.vacation_start_date), 'MMM d, yyyy h:mm a')
                  : 'N/A'}
              </p>
              {vacationInfo.vacation_end_date && (
                <p>
                  <strong>Returns:</strong>{' '}
                  {format(new Date(vacationInfo.vacation_end_date), 'MMM d, yyyy h:mm a')}
                </p>
              )}
              <p>
                <strong>Message:</strong> {vacationInfo.vacation_message}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
