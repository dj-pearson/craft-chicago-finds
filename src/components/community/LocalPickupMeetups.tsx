import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Calendar,
  Clock,
  Users,
  Coffee,
  Briefcase,
  Package,
  Plus,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Phone,
  Mail,
  Star,
  Heart,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";

interface PickupMeetup {
  id: string;
  title: string;
  description: string;
  location: {
    name: string;
    address: string;
    type: 'coffee_shop' | 'coworking' | 'community_center' | 'park' | 'other';
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  organizer: {
    id: string;
    name: string;
    avatar?: string;
    is_verified_seller: boolean;
  };
  orders_available: number;
  participating_sellers: Array<{
    id: string;
    name: string;
    shop_name: string;
    avatar?: string;
    order_count: number;
  }>;
  amenities: string[];
  requirements: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_user_registered: boolean;
  contact_info: {
    phone?: string;
    email?: string;
  };
}

interface LocalPickupMeetupsProps {
  className?: string;
}

export const LocalPickupMeetups = ({ className }: LocalPickupMeetupsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const [loading, setLoading] = useState(true);
  const [meetups, setMeetups] = useState<PickupMeetup[]>([]);
  const [selectedMeetup, setSelectedMeetup] = useState<PickupMeetup | null>(null);
  const [creatingMeetup, setCreatingMeetup] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);
  
  const [newMeetup, setNewMeetup] = useState({
    title: '',
    description: '',
    location_name: '',
    location_address: '',
    location_type: 'coffee_shop' as PickupMeetup['location']['type'],
    date: '',
    start_time: '',
    end_time: '',
    max_participants: 20,
    contact_phone: '',
    contact_email: ''
  });

  useEffect(() => {
    if (user && currentCity) {
      fetchMeetups();
    }
  }, [user, currentCity]);

  const fetchMeetups = async () => {
    if (!user || !currentCity) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pickup_meetups')
        .select('*')
        .eq('city_id', currentCity.id)
        .eq('is_active', true)
        .gte('meetup_date', new Date().toISOString())
        .order('meetup_date', { ascending: true });

      if (error) throw error;

      // Transform to component format
      const transformedMeetups: PickupMeetup[] = (data || []).map(meetup => ({
        id: meetup.id,
        title: meetup.title,
        description: meetup.description,
        location: {
          name: meetup.location_name,
          address: meetup.location_address,
          type: 'other' as const
        },
        date: meetup.meetup_date.split('T')[0],
        start_time: new Date(meetup.meetup_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        end_time: new Date(new Date(meetup.meetup_date).getTime() + 4 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        max_participants: meetup.max_attendees || 25,
        current_participants: meetup.current_attendees,
        organizer: {
          id: meetup.seller_id,
          name: 'Organizer',
          is_verified_seller: true
        },
        orders_available: 0,
        participating_sellers: [],
        amenities: ['Secure pickup area'],
        requirements: ['Bring order confirmation'],
        status: 'upcoming' as const,
        is_user_registered: false,
        contact_info: {}
      }));

      setMeetups(transformedMeetups);
    } catch (error) {
      console.error("Error fetching meetups:", error);
      toast({
        title: "Error",
        description: "Failed to load pickup meetups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockMeetups = (cityName: string): PickupMeetup[] => {
    const locations = [
      {
        name: 'Intelligentsia Coffee - Wicker Park',
        address: '1331 N Milwaukee Ave, Chicago, IL 60622',
        type: 'coffee_shop' as const
      },
      {
        name: 'Second City Works',
        address: '1340 W Washington Blvd, Chicago, IL 60607',
        type: 'coworking' as const
      },
      {
        name: 'Logan Square Community Center',
        address: '2840 W Fullerton Pkwy, Chicago, IL 60647',
        type: 'community_center' as const
      }
    ];

    return locations.map((location, index) => {
      const meetupDate = new Date();
      meetupDate.setDate(meetupDate.getDate() + (index + 1) * 3); // Spread out over next week

      return {
        id: `meetup-${index + 1}`,
        title: `${cityName} Craft Pickup Day`,
        description: `Monthly community pickup event. Save on shipping and meet fellow craft lovers! Bring your order confirmation and enjoy complimentary refreshments.`,
        location: {
          name: location.name,
          address: location.address,
          type: location.type,
          coordinates: {
            lat: 41.8781 + (Math.random() - 0.5) * 0.1,
            lng: -87.6298 + (Math.random() - 0.5) * 0.1
          }
        },
        date: meetupDate.toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '14:00',
        max_participants: 25 + index * 5,
        current_participants: Math.floor(Math.random() * 15) + 5,
        organizer: {
          id: 'organizer-1',
          name: 'Sarah Chen',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100',
          is_verified_seller: true
        },
        orders_available: Math.floor(Math.random() * 50) + 20,
        participating_sellers: [
          {
            id: 'seller-1',
            name: 'Emily Rodriguez',
            shop_name: 'Chicago Candle Co.',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
            order_count: Math.floor(Math.random() * 10) + 3
          },
          {
            id: 'seller-2',
            name: 'Marcus Johnson',
            shop_name: 'Windy City Woodworks',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
            order_count: Math.floor(Math.random() * 8) + 2
          },
          {
            id: 'seller-3',
            name: 'Lisa Park',
            shop_name: 'Prairie Pottery',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
            order_count: Math.floor(Math.random() * 12) + 1
          }
        ],
        amenities: [
          'Free WiFi',
          'Complimentary coffee/tea',
          'Secure pickup area',
          'Order verification',
          'Parking available'
        ],
        requirements: [
          'Bring order confirmation',
          'Valid ID required',
          'Arrive within pickup window',
          'Respect venue guidelines'
        ],
        status: index === 0 ? 'upcoming' : index === 1 ? 'upcoming' : 'upcoming',
        is_user_registered: index === 0 ? true : false,
        contact_info: {
          phone: '+1 (312) 555-0123',
          email: 'pickup@craftlocal.com'
        }
      };
    });
  };

  const registerForMeetup = async (meetupId: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to register for meetups",
        variant: "destructive",
      });
      return;
    }

    setRegistering(meetupId);
    try {
      const { error } = await supabase
        .from('meetup_attendees')
        .insert({
          meetup_id: meetupId,
          user_id: user.id,
          status: 'registered'
        });

      if (error) throw error;

      // Update local state
      setMeetups(prev => prev.map(meetup => 
        meetup.id === meetupId 
          ? { 
              ...meetup, 
              is_user_registered: true,
              current_participants: meetup.current_participants + 1
            }
          : meetup
      ));

      // Update meetup count
      const meetup = meetups.find(m => m.id === meetupId);
      if (meetup) {
        await supabase
          .from('pickup_meetups')
          .update({ current_attendees: meetup.current_participants + 1 })
          .eq('id', meetupId);
      }

      toast({
        title: "Registered successfully!",
        description: "You'll receive a confirmation email with pickup details",
      });
    } catch (error) {
      console.error("Error registering for meetup:", error);
      toast({
        title: "Error",
        description: "Failed to register for meetup",
        variant: "destructive",
      });
    } finally {
      setRegistering(null);
    }
  };

  const createMeetup = async () => {
    if (!user || !currentCity || !newMeetup.title || !newMeetup.location_name || !newMeetup.date) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setCreatingMeetup(true);
    try {
      const meetupDate = new Date(`${newMeetup.date}T${newMeetup.start_time || '10:00'}`);

      const { data, error } = await supabase
        .from('pickup_meetups')
        .insert({
          seller_id: user.id,
          city_id: currentCity.id,
          title: newMeetup.title,
          description: newMeetup.description,
          location_name: newMeetup.location_name,
          location_address: newMeetup.location_address,
          meetup_date: meetupDate.toISOString(),
          max_attendees: newMeetup.max_participants,
          current_attendees: 0,
          tags: [],
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await fetchMeetups();

      // Reset form
      setNewMeetup({
        title: '',
        description: '',
        location_name: '',
        location_address: '',
        location_type: 'coffee_shop',
        date: '',
        start_time: '',
        end_time: '',
        max_participants: 20,
        contact_phone: '',
        contact_email: ''
      });

      toast({
        title: "Meetup created!",
        description: "Your pickup meetup has been created successfully",
      });
    } catch (error) {
      console.error("Error creating meetup:", error);
      toast({
        title: "Error",
        description: "Failed to create meetup",
        variant: "destructive",
      });
    } finally {
      setCreatingMeetup(false);
    }
  };

  const getLocationIcon = (type: PickupMeetup['location']['type']) => {
    switch (type) {
      case 'coffee_shop':
        return <Coffee className="h-4 w-4" />;
      case 'coworking':
        return <Briefcase className="h-4 w-4" />;
      case 'community_center':
        return <Users className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getLocationColor = (type: PickupMeetup['location']['type']) => {
    switch (type) {
      case 'coffee_shop':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'coworking':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'community_center':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading pickup meetups...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Local Pickup Meetups
        </CardTitle>
        <CardDescription>
          Save on shipping and build community with local pickup days at coffee shops and coworking spaces
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meetups" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meetups">Upcoming Meetups</TabsTrigger>
            <TabsTrigger value="organize">Organize Meetup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meetups" className="space-y-6">
            {meetups.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No upcoming meetups</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to organize a pickup meetup in your area
                </p>
                <Button onClick={() => setSelectedMeetup(null)}>
                  Organize First Meetup
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {meetups.map((meetup) => (
                  <Card 
                    key={meetup.id}
                    className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                      selectedMeetup?.id === meetup.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedMeetup(selectedMeetup?.id === meetup.id ? null : meetup)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{meetup.title}</h4>
                            {meetup.is_user_registered && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {meetup.description.substring(0, 100)}...
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              {getLocationIcon(meetup.location.type)}
                              {meetup.location.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(meetup.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(meetup.start_time)} - {formatTime(meetup.end_time)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={getLocationColor(meetup.location.type)}
                          >
                            {meetup.location.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {meetup.current_participants}/{meetup.max_participants}
                          </Badge>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span>{meetup.current_participants} attending</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-green-500" />
                          <span>{meetup.orders_available} orders</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{meetup.participating_sellers.length} sellers</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {!meetup.is_user_registered ? (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            registerForMeetup(meetup.id);
                          }}
                          disabled={registering === meetup.id || meetup.current_participants >= meetup.max_participants}
                          className="w-full"
                        >
                          {registering === meetup.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2" />
                              Registering...
                            </>
                          ) : meetup.current_participants >= meetup.max_participants ? (
                            'Full - Join Waitlist'
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-2" />
                              Register for Pickup
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded text-green-700 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          You're registered!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Detailed Meetup View */}
            {selectedMeetup && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedMeetup.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getLocationColor(selectedMeetup.location.type)}>
                        {selectedMeetup.location.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {selectedMeetup.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Details */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Location</Label>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getLocationIcon(selectedMeetup.location.type)}
                            <span className="font-medium">{selectedMeetup.location.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {selectedMeetup.location.address}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Date & Time</Label>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(selectedMeetup.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(selectedMeetup.start_time)} - {formatTime(selectedMeetup.end_time)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Contact</Label>
                        <div className="space-y-1">
                          {selectedMeetup.contact_info.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${selectedMeetup.contact_info.email}`} className="text-primary hover:underline">
                                {selectedMeetup.contact_info.email}
                              </a>
                            </div>
                          )}
                          {selectedMeetup.contact_info.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${selectedMeetup.contact_info.phone}`} className="text-primary hover:underline">
                                {selectedMeetup.contact_info.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Participating Sellers */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Participating Sellers ({selectedMeetup.participating_sellers.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedMeetup.participating_sellers.map((seller) => (
                            <div key={seller.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                              <div className="flex items-center gap-2">
                                {seller.avatar && (
                                  <div className="w-8 h-8 rounded-full overflow-hidden">
                                    <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-sm">{seller.shop_name}</div>
                                  <div className="text-xs text-muted-foreground">by {seller.name}</div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {seller.order_count} orders
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Amenities</Label>
                        <div className="flex flex-wrap gap-1">
                          {selectedMeetup.amenities.map((amenity) => (
                            <Badge key={amenity} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Requirements</Label>
                        <div className="space-y-1">
                          {selectedMeetup.requirements.map((requirement) => (
                            <div key={requirement} className="flex items-start gap-2 text-xs">
                              <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                              {requirement}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedMeetup.location.address)}`, '_blank')}
                      variant="outline"
                      className="flex-1"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button 
                      onClick={() => {
                        const text = `Join me at ${selectedMeetup.title} on ${new Date(selectedMeetup.date).toLocaleDateString()}!`;
                        navigator.share?.({ text }) || navigator.clipboard.writeText(text);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="organize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organize a Pickup Meetup</CardTitle>
                <CardDescription>
                  Create a community pickup event and help reduce shipping costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={newMeetup.title}
                      onChange={(e) => setNewMeetup(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Chicago Craft Pickup Day"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location-type">Location Type</Label>
                    <Select 
                      value={newMeetup.location_type} 
                      onValueChange={(value: PickupMeetup['location']['type']) => 
                        setNewMeetup(prev => ({ ...prev, location_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coffee_shop">Coffee Shop</SelectItem>
                        <SelectItem value="coworking">Coworking Space</SelectItem>
                        <SelectItem value="community_center">Community Center</SelectItem>
                        <SelectItem value="park">Park</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newMeetup.description}
                    onChange={(e) => setNewMeetup(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the event, what to expect, any special instructions..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-name">Location Name *</Label>
                    <Input
                      id="location-name"
                      value={newMeetup.location_name}
                      onChange={(e) => setNewMeetup(prev => ({ ...prev, location_name: e.target.value }))}
                      placeholder="e.g., Intelligentsia Coffee"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location-address">Address *</Label>
                    <Input
                      id="location-address"
                      value={newMeetup.location_address}
                      onChange={(e) => setNewMeetup(prev => ({ ...prev, location_address: e.target.value }))}
                      placeholder="Full street address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newMeetup.date}
                      onChange={(e) => setNewMeetup(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time *</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={newMeetup.start_time}
                      onChange={(e) => setNewMeetup(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time *</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newMeetup.end_time}
                      onChange={(e) => setNewMeetup(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-participants">Max Participants</Label>
                    <Input
                      id="max-participants"
                      type="number"
                      min="5"
                      max="100"
                      value={newMeetup.max_participants}
                      onChange={(e) => setNewMeetup(prev => ({ 
                        ...prev, 
                        max_participants: parseInt(e.target.value) || 20 
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Contact Phone</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={newMeetup.contact_phone}
                      onChange={(e) => setNewMeetup(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="(312) 555-0123"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={newMeetup.contact_email}
                      onChange={(e) => setNewMeetup(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="organizer@example.com"
                    />
                  </div>
                </div>

                <Button 
                  onClick={createMeetup} 
                  disabled={creatingMeetup || !newMeetup.title || !newMeetup.location_name || !newMeetup.date}
                  className="w-full"
                >
                  {creatingMeetup ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Creating Meetup...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Pickup Meetup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
              <p><strong>Organizing tips:</strong></p>
              <p>• Choose accessible locations with parking</p>
              <p>• Coordinate with venue owners in advance</p>
              <p>• Allow 4+ hours for pickup windows</p>
              <p>• Bring order verification system</p>
              <p>• Consider refreshments to build community</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
