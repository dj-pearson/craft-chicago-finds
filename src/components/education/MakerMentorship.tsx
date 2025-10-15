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
  Users, 
  Video,
  Calendar,
  Star,
  MessageCircle,
  Award,
  Clock,
  DollarSign,
  CheckCircle,
  User,
  BookOpen,
  TrendingUp,
  Heart,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface Mentor {
  id: string;
  name: string;
  shop_name: string;
  avatar?: string;
  bio: string;
  specialties: string[];
  experience_years: number;
  rating: number;
  review_count: number;
  mentee_count: number;
  hourly_rate: number;
  response_time: string;
  availability: {
    timezone: string;
    available_days: string[];
    preferred_times: string[];
  };
  skills_offered: Array<{
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced';
  }>;
  success_stories: number;
  is_verified: boolean;
  is_available: boolean;
  location: string;
  languages: string[];
  mentorship_style: string[];
  created_at: string;
}

interface MentorshipSession {
  id: string;
  mentor_id: string;
  mentee_id: string;
  title: string;
  description: string;
  session_type: 'video_call' | 'in_person' | 'chat' | 'portfolio_review';
  duration_minutes: number;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
  price: number;
  meeting_link?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  created_at: string;
}

interface MentorshipProgram {
  id: string;
  title: string;
  description: string;
  duration_weeks: number;
  session_count: number;
  price: number;
  skills_covered: string[];
  graduation_requirements: string[];
  success_rate: number;
  graduate_count: number;
  next_cohort_date: string;
  is_open_for_enrollment: boolean;
}

interface MakerMentorshipProps {
  className?: string;
}

export const MakerMentorship = ({ className }: MakerMentorshipProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [programs, setPrograms] = useState<MentorshipProgram[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [bookingSession, setBookingSession] = useState(false);

  const [sessionForm, setSessionForm] = useState({
    session_type: 'video_call' as MentorshipSession['session_type'],
    duration_minutes: 60,
    title: '',
    description: '',
    preferred_time: ''
  });

  useEffect(() => {
    fetchMentors();
    fetchSessions();
    fetchPrograms();
  }, []);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mentorship_programs')
        .select('*')
        .eq('is_accepting', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedMentors: Mentor[] = (data || []).map(program => ({
        id: program.mentor_id,
        name: 'Mentor',
        shop_name: 'Shop',
        bio: program.description,
        specialties: [program.craft_specialty],
        experience_years: 10,
        rating: 4.8,
        review_count: 45,
        mentee_count: program.current_mentees,
        hourly_rate: 75,
        response_time: '< 4 hours',
        availability: {
          timezone: 'CST',
          available_days: ['Monday', 'Tuesday', 'Wednesday'],
          preferred_times: ['Morning', 'Afternoon']
        },
        skills_offered: [
          { skill: program.craft_specialty, level: 'advanced' as const }
        ],
        success_stories: 15,
        is_verified: true,
        is_available: program.is_accepting,
        location: 'Chicago',
        languages: ['English'],
        mentorship_style: ['Supportive'],
        created_at: program.created_at
      }));

      setMentors(transformedMentors);
    } catch (error) {
      console.error("Error fetching mentors:", error);
      toast({
        title: "Error",
        description: "Failed to load mentors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      if (user) {
        const mockSessions = generateMockSessions(user.id);
        setSessions(mockSessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const mockPrograms = generateMockPrograms();
      setPrograms(mockPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const generateMockMentors = (): Mentor[] => {
    const specialties = ['Pottery', 'Jewelry Making', 'Woodworking', 'Business', 'Photography', 'Marketing'];
    const mentorshipStyles = ['Hands-on', 'Analytical', 'Supportive', 'Direct', 'Creative'];
    
    return [
      {
        id: 'mentor-1',
        name: 'Sarah Chen',
        shop_name: 'Chicago Clay Studio',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100',
        bio: 'Master potter with 15 years of experience. I help new makers develop their technical skills and build sustainable craft businesses. Specializing in wheel throwing and glazing techniques.',
        specialties: ['Pottery', 'Business', 'Glazing'],
        experience_years: 15,
        rating: 4.9,
        review_count: 89,
        mentee_count: 156,
        hourly_rate: 75,
        response_time: '< 2 hours',
        availability: {
          timezone: 'CST',
          available_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
          preferred_times: ['Morning', 'Afternoon']
        },
        skills_offered: [
          { skill: 'Wheel Throwing', level: 'advanced' },
          { skill: 'Glazing Techniques', level: 'advanced' },
          { skill: 'Business Planning', level: 'intermediate' },
          { skill: 'Pricing Strategy', level: 'intermediate' }
        ],
        success_stories: 23,
        is_verified: true,
        is_available: true,
        location: 'Logan Square, Chicago',
        languages: ['English', 'Mandarin'],
        mentorship_style: ['Hands-on', 'Supportive'],
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'mentor-2',
        name: 'Marcus Johnson',
        shop_name: 'Windy City Woodworks',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        bio: 'Award-winning furniture maker and business mentor. I focus on helping makers scale their operations and develop premium product lines. Expert in woodworking and digital marketing.',
        specialties: ['Woodworking', 'Business', 'Marketing'],
        experience_years: 12,
        rating: 4.8,
        review_count: 67,
        mentee_count: 98,
        hourly_rate: 85,
        response_time: '< 4 hours',
        availability: {
          timezone: 'CST',
          available_days: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
          preferred_times: ['Evening', 'Weekend']
        },
        skills_offered: [
          { skill: 'Fine Woodworking', level: 'advanced' },
          { skill: 'Digital Marketing', level: 'advanced' },
          { skill: 'Product Photography', level: 'intermediate' },
          { skill: 'Pricing & Positioning', level: 'advanced' }
        ],
        success_stories: 31,
        is_verified: true,
        is_available: true,
        location: 'Wicker Park, Chicago',
        languages: ['English', 'Spanish'],
        mentorship_style: ['Analytical', 'Direct'],
        created_at: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'mentor-3',
        name: 'Elena Rodriguez',
        shop_name: 'Prairie Jewelry Co.',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        bio: 'Jewelry designer and craft business coach. I help makers transition from hobby to full-time business. Specializing in metalworking, stone setting, and e-commerce strategy.',
        specialties: ['Jewelry Making', 'Business', 'E-commerce'],
        experience_years: 8,
        rating: 4.7,
        review_count: 45,
        mentee_count: 72,
        hourly_rate: 65,
        response_time: '< 6 hours',
        availability: {
          timezone: 'CST',
          available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          preferred_times: ['Morning', 'Afternoon']
        },
        skills_offered: [
          { skill: 'Metalworking', level: 'advanced' },
          { skill: 'Stone Setting', level: 'intermediate' },
          { skill: 'E-commerce Setup', level: 'advanced' },
          { skill: 'Social Media Marketing', level: 'intermediate' }
        ],
        success_stories: 18,
        is_verified: false,
        is_available: true,
        location: 'Lincoln Park, Chicago',
        languages: ['English', 'Spanish'],
        mentorship_style: ['Creative', 'Supportive'],
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  const generateMockSessions = (userId: string): MentorshipSession[] => {
    return [
      {
        id: 'session-1',
        mentor_id: 'mentor-1',
        mentee_id: userId,
        title: 'Pottery Business Planning Session',
        description: 'Review business plan and pricing strategy for pottery shop',
        session_type: 'video_call',
        duration_minutes: 60,
        scheduled_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        price: 75,
        meeting_link: 'https://zoom.us/j/example',
        created_at: new Date().toISOString()
      },
      {
        id: 'session-2',
        mentor_id: 'mentor-2',
        mentee_id: userId,
        title: 'Woodworking Technique Review',
        description: 'Advanced joinery techniques and tool recommendations',
        session_type: 'video_call',
        duration_minutes: 90,
        scheduled_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        price: 127.50,
        rating: 5,
        feedback: 'Excellent session! Marcus provided detailed feedback on my technique and recommended specific tools that really improved my work.',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  const generateMockPrograms = (): MentorshipProgram[] => {
    return [
      {
        id: 'program-1',
        title: 'Hobby to Business Bootcamp',
        description: 'Transform your craft hobby into a profitable business in 8 weeks. Learn pricing, marketing, operations, and financial management.',
        duration_weeks: 8,
        session_count: 12,
        price: 497,
        skills_covered: [
          'Business Planning',
          'Pricing Strategy',
          'Marketing Fundamentals',
          'Financial Management',
          'Customer Service',
          'Legal Basics'
        ],
        graduation_requirements: [
          'Complete all 12 sessions',
          'Submit business plan',
          'Launch first product line',
          'Achieve first $1000 in sales'
        ],
        success_rate: 87,
        graduate_count: 143,
        next_cohort_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_open_for_enrollment: true
      },
      {
        id: 'program-2',
        title: 'Master Craftsperson Certification',
        description: 'Advanced 12-week program for experienced makers looking to achieve master-level skills and mentor others.',
        duration_weeks: 12,
        session_count: 18,
        price: 897,
        skills_covered: [
          'Advanced Techniques',
          'Teaching & Mentoring',
          'Quality Control',
          'Innovation & Design',
          'Business Scaling',
          'Leadership'
        ],
        graduation_requirements: [
          'Complete all 18 sessions',
          'Create masterpiece portfolio',
          'Mentor 2 junior makers',
          'Pass practical examination'
        ],
        success_rate: 92,
        graduate_count: 67,
        next_cohort_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        is_open_for_enrollment: true
      }
    ];
  };

  const bookSession = async (mentorId: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to book mentorship sessions",
        variant: "destructive",
      });
      return;
    }

    if (!sessionForm.title || !sessionForm.description || !sessionForm.preferred_time) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setBookingSession(true);
    try {
      const mentor = mentors.find(m => m.id === mentorId);
      if (!mentor) return;

      const session: MentorshipSession = {
        id: `session-${Date.now()}`,
        mentor_id: mentorId,
        mentee_id: user.id,
        title: sessionForm.title,
        description: sessionForm.description,
        session_type: sessionForm.session_type,
        duration_minutes: sessionForm.duration_minutes,
        scheduled_time: sessionForm.preferred_time,
        status: 'scheduled',
        price: mentor.hourly_rate * (sessionForm.duration_minutes / 60),
        created_at: new Date().toISOString()
      };

      setSessions(prev => [session, ...prev]);

      // Reset form
      setSessionForm({
        session_type: 'video_call',
        duration_minutes: 60,
        title: '',
        description: '',
        preferred_time: ''
      });

      setSelectedMentor(null);

      toast({
        title: "Session booked!",
        description: `Your session with ${mentor.name} has been scheduled`,
      });
    } catch (error) {
      console.error("Error booking session:", error);
      toast({
        title: "Error",
        description: "Failed to book session",
        variant: "destructive",
      });
    } finally {
      setBookingSession(false);
    }
  };

  const enrollInProgram = async (programId: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to enroll in programs",
        variant: "destructive",
      });
      return;
    }

    try {
      const program = programs.find(p => p.id === programId);
      if (!program) return;

      toast({
        title: "Enrollment successful!",
        description: `You're enrolled in ${program.title}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enroll in program",
        variant: "destructive",
      });
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSpecialty = selectedSpecialty === 'all' || mentor.specialties.includes(selectedSpecialty);
    const matchesPrice = priceRange === 'all' || 
                        (priceRange === 'under-50' && mentor.hourly_rate < 50) ||
                        (priceRange === '50-75' && mentor.hourly_rate >= 50 && mentor.hourly_rate <= 75) ||
                        (priceRange === 'over-75' && mentor.hourly_rate > 75);
    
    return matchesSearch && matchesSpecialty && matchesPrice && mentor.is_available;
  });

  const getSessionTypeIcon = (type: MentorshipSession['session_type']) => {
    switch (type) {
      case 'video_call':
        return <Video className="h-4 w-4" />;
      case 'in_person':
        return <Users className="h-4 w-4" />;
      case 'chat':
        return <MessageCircle className="h-4 w-4" />;
      case 'portfolio_review':
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: MentorshipSession['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'in_progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading mentorship program...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Maker Mentorship Program
        </CardTitle>
        <CardDescription>
          Connect with experienced makers for 1-on-1 coaching, business guidance, and skill development
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mentors" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mentors">Find Mentors</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="become-mentor">Become Mentor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mentors" className="space-y-6">
            {!selectedMentor ? (
              <>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search mentors by name, specialty, or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Specialties</option>
                      <option value="Pottery">Pottery</option>
                      <option value="Jewelry Making">Jewelry Making</option>
                      <option value="Woodworking">Woodworking</option>
                      <option value="Business">Business</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Prices</option>
                      <option value="under-50">Under $50/hr</option>
                      <option value="50-75">$50-75/hr</option>
                      <option value="over-75">Over $75/hr</option>
                    </select>
                  </div>
                </div>

                {/* Mentor Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMentors.map((mentor) => (
                    <Card 
                      key={mentor.id}
                      className="transition-all duration-200 hover:shadow-md cursor-pointer"
                      onClick={() => setSelectedMentor(mentor)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="relative">
                            {mentor.avatar && (
                              <img 
                                src={mentor.avatar} 
                                alt={mentor.name}
                                className="w-12 h-12 rounded-full"
                              />
                            )}
                            {mentor.is_verified && (
                              <div className="absolute -bottom-1 -right-1">
                                <CheckCircle className="h-4 w-4 text-blue-500 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold line-clamp-1">{mentor.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {mentor.shop_name}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs font-medium">{mentor.rating}</span>
                              <span className="text-xs text-muted-foreground">({mentor.review_count})</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${mentor.hourly_rate}/hr</div>
                            <div className="text-xs text-muted-foreground">
                              {mentor.response_time}
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {mentor.bio}
                        </p>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Specialties</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {mentor.specialties.slice(0, 3).map((specialty) => (
                                <Badge key={specialty} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {mentor.specialties.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{mentor.specialties.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {mentor.mentee_count} mentees
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {mentor.success_stories} success stories
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {mentor.experience_years}y exp
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {mentor.location}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              // Mentor Detail View
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedMentor(null)}
                  >
                    ← Back to Mentors
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Mentor Profile */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {selectedMentor.avatar && (
                          <img 
                            src={selectedMentor.avatar} 
                            alt={selectedMentor.name}
                            className="w-20 h-20 rounded-full"
                          />
                        )}
                        {selectedMentor.is_verified && (
                          <div className="absolute -bottom-1 -right-1">
                            <CheckCircle className="h-6 w-6 text-blue-500 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold">{selectedMentor.name}</h1>
                        <p className="text-lg text-muted-foreground">{selectedMentor.shop_name}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{selectedMentor.rating}</span>
                            <span className="text-sm text-muted-foreground">
                              ({selectedMentor.review_count} reviews)
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {selectedMentor.mentee_count} mentees
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Award className="h-4 w-4" />
                            {selectedMentor.success_stories} success stories
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${selectedMentor.hourly_rate}/hr</div>
                        <div className="text-sm text-muted-foreground">
                          Responds {selectedMentor.response_time}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">About</h3>
                        <p className="text-muted-foreground">{selectedMentor.bio}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold mb-2">Specialties</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedMentor.specialties.map((specialty) => (
                              <Badge key={specialty} variant="outline">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2">Skills Offered</h3>
                          <div className="space-y-2">
                            {selectedMentor.skills_offered.map((skill, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm">{skill.skill}</span>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    skill.level === 'advanced' ? 'border-green-200 text-green-700' :
                                    skill.level === 'intermediate' ? 'border-yellow-200 text-yellow-700' :
                                    'border-blue-200 text-blue-700'
                                  }
                                >
                                  {skill.level}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Availability</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">Available Days</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedMentor.availability.available_days.map((day) => (
                                <Badge key={day} variant="outline" className="text-xs">
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Preferred Times</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedMentor.availability.preferred_times.map((time) => (
                                <Badge key={time} variant="outline" className="text-xs">
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Additional Info</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">Location</Label>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {selectedMentor.location}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Languages</Label>
                            <div>{selectedMentor.languages.join(', ')}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Experience</Label>
                            <div>{selectedMentor.experience_years} years</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Sidebar */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Book a Session</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="session-type">Session Type</Label>
                          <Select 
                            value={sessionForm.session_type} 
                            onValueChange={(value: MentorshipSession['session_type']) => 
                              setSessionForm(prev => ({ ...prev, session_type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video_call">Video Call</SelectItem>
                              <SelectItem value="in_person">In Person</SelectItem>
                              <SelectItem value="chat">Chat Session</SelectItem>
                              <SelectItem value="portfolio_review">Portfolio Review</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="duration">Duration</Label>
                          <Select 
                            value={sessionForm.duration_minutes.toString()} 
                            onValueChange={(value) => 
                              setSessionForm(prev => ({ ...prev, duration_minutes: parseInt(value) }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="90">1.5 hours</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="session-title">Session Title</Label>
                          <Input
                            id="session-title"
                            value={sessionForm.title}
                            onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Business Planning Session"
                          />
                        </div>

                        <div>
                          <Label htmlFor="session-description">What would you like to work on?</Label>
                          <Textarea
                            id="session-description"
                            value={sessionForm.description}
                            onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your goals and what you'd like to focus on..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="preferred-time">Preferred Time</Label>
                          <Input
                            id="preferred-time"
                            type="datetime-local"
                            value={sessionForm.preferred_time}
                            onChange={(e) => setSessionForm(prev => ({ ...prev, preferred_time: e.target.value }))}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span>Session Cost:</span>
                            <span className="text-xl font-bold">
                              ${(selectedMentor.hourly_rate * (sessionForm.duration_minutes / 60)).toFixed(2)}
                            </span>
                          </div>
                          
                          <Button 
                            onClick={() => bookSession(selectedMentor.id)}
                            disabled={bookingSession}
                            className="w-full"
                            size="lg"
                          >
                            {bookingSession ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                Booking...
                              </>
                            ) : (
                              'Book Session'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center space-y-2">
                          <h4 className="font-medium">Mentorship Style</h4>
                          <div className="flex flex-wrap justify-center gap-1">
                            {selectedMentor.mentorship_style.map((style) => (
                              <Badge key={style} variant="outline" className="text-xs">
                                {style}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="programs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {programs.map((program) => (
                <Card key={program.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      {program.title}
                    </CardTitle>
                    <CardDescription>
                      {program.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Duration</Label>
                        <div className="font-semibold">{program.duration_weeks} weeks</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Sessions</Label>
                        <div className="font-semibold">{program.session_count} sessions</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Success Rate</Label>
                        <div className="font-semibold">{program.success_rate}%</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Graduates</Label>
                        <div className="font-semibold">{program.graduate_count}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Skills Covered</Label>
                      <div className="flex flex-wrap gap-1">
                        {program.skills_covered.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Graduation Requirements</Label>
                      <div className="space-y-1">
                        {program.graduation_requirements.map((req, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {req}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-2xl font-bold">${program.price}</div>
                          <div className="text-xs text-muted-foreground">
                            Next cohort: {new Date(program.next_cohort_date).toLocaleDateString()}
                          </div>
                        </div>
                        <Button 
                          onClick={() => enrollInProgram(program.id)}
                          disabled={!program.is_open_for_enrollment}
                        >
                          {program.is_open_for_enrollment ? 'Enroll Now' : 'Waitlist'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No sessions yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book your first mentorship session to get started
                </p>
                <Button onClick={() => setSelectedMentor(null)}>
                  Find a Mentor
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const mentor = mentors.find(m => m.id === session.mentor_id);
                  return (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              {getSessionTypeIcon(session.session_type)}
                            </div>
                            <div>
                              <h4 className="font-medium">{session.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                with {mentor?.name} • {session.duration_minutes} minutes
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {session.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                            <div className="text-sm font-medium mt-1">${session.price}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(session.scheduled_time).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(session.scheduled_time).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {session.status === 'scheduled' && session.meeting_link && (
                              <Button size="sm" variant="outline">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Join Meeting
                              </Button>
                            )}
                            {session.status === 'completed' && !session.rating && (
                              <Button size="sm" variant="outline">
                                <Star className="h-3 w-3 mr-1" />
                                Rate Session
                              </Button>
                            )}
                          </div>
                        </div>

                        {session.feedback && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${
                                      i < (session.rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">Your feedback:</span>
                            </div>
                            <p className="text-sm">{session.feedback}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="become-mentor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Become a Mentor
                </CardTitle>
                <CardDescription>
                  Share your expertise and help the next generation of makers succeed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-2">Share Your Knowledge</h3>
                    <p className="text-sm text-muted-foreground">
                      Help aspiring makers learn from your experience and avoid common pitfalls
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-2">Earn Extra Income</h3>
                    <p className="text-sm text-muted-foreground">
                      Set your own rates and schedule. Top mentors earn $500+ per month
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-2">Build Your Reputation</h3>
                    <p className="text-sm text-muted-foreground">
                      Establish yourself as an expert and grow your professional network
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Requirements to Become a Mentor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">3+ years of craft experience</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">Active seller on CraftLocal</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">4.5+ star seller rating</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">Completed mentor training</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">Background check (for in-person sessions)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">Commitment to respond within 24 hours</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button size="lg" className="px-8">
                    Apply to Become a Mentor
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Application review typically takes 3-5 business days
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
