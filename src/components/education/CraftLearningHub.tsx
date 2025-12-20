import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlayCircle, 
  BookOpen,
  Award,
  ShoppingCart,
  Clock,
  Users,
  Star,
  CheckCircle,
  Lock,
  Search,
  Filter,
  Trophy,
  Calendar,
  Video,
  FileText,
  Download,
  Heart,
  Share2,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    id: string;
    name: string;
    shop_name: string;
    avatar?: string;
    bio: string;
    rating: number;
    student_count: number;
    is_verified: boolean;
  };
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  lesson_count: number;
  price: number;
  thumbnail: string;
  preview_video?: string;
  rating: number;
  review_count: number;
  student_count: number;
  completion_rate: number;
  materials_list: Array<{
    id: string;
    name: string;
    price?: number;
    supplier?: string;
    is_optional: boolean;
  }>;
  learning_outcomes: string[];
  prerequisites: string[];
  certification_available: boolean;
  is_purchased: boolean;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  participant_count: number;
  submission_count: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  categories: string[];
  judging_criteria: string[];
  prizes: Array<{
    rank: number;
    prize: string;
    value: number;
  }>;
  is_active: boolean;
  is_registered: boolean;
  submission_deadline: string;
  voting_enabled: boolean;
}

interface CraftLearningHubProps {
  className?: string;
}

export const CraftLearningHub = ({ className }: CraftLearningHubProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const cart = useCart();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
    fetchChallenges();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('craft_courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedCourses: Course[] = (data || []).map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        instructor: {
          id: course.instructor_id,
          name: 'Instructor',
          shop_name: 'Shop',
          bio: '',
          rating: 4.8,
          student_count: 0,
          is_verified: true
        },
        category: course.category,
        difficulty_level: course.skill_level as 'beginner' | 'intermediate' | 'advanced',
        duration_minutes: course.duration_minutes,
        lesson_count: 8,
        price: Number(course.price || 0),
        thumbnail: course.thumbnail_url || '',
        preview_video: course.video_url || undefined,
        rating: Number(course.rating || 0),
        review_count: course.review_count,
        student_count: course.enrollment_count,
        completion_rate: 85,
        materials_list: course.materials_needed?.map((material, idx) => ({
          id: `${course.id}-material-${idx}`,
          name: material,
          is_optional: false
        })) || [],
        learning_outcomes: course.learning_outcomes || [],
        prerequisites: [],
        certification_available: false,
        is_purchased: false,
        progress_percent: 0,
        created_at: course.created_at,
        updated_at: course.updated_at
      }));

      setCourses(transformedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      // Query real challenges from database if table exists
      const { data, error } = await supabase
        .from('craft_challenges')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        // Table may not exist yet - show empty state
        console.log('Challenges table not available yet');
        setChallenges([]);
        return;
      }

      const transformedChallenges: Challenge[] = (data || []).map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        theme: challenge.theme || '',
        start_date: challenge.start_date,
        end_date: challenge.end_date,
        prize_pool: Number(challenge.prize_pool || 0),
        participant_count: challenge.participant_count || 0,
        submission_count: challenge.submission_count || 0,
        difficulty_level: challenge.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
        categories: challenge.categories || [],
        judging_criteria: challenge.judging_criteria || [],
        prizes: challenge.prizes || [],
        is_active: new Date(challenge.start_date) <= new Date() && new Date(challenge.end_date) >= new Date(),
        is_registered: false,
        submission_deadline: challenge.submission_deadline || challenge.end_date,
        voting_enabled: challenge.voting_enabled || false
      }));

      setChallenges(transformedChallenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      setChallenges([]);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to enroll in courses",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: courseId,
          user_id: user.id,
          progress: 0,
          completed: false
        });

      if (error) throw error;

      // Update local state
      setCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, is_purchased: true, progress_percent: 0 }
          : c
      ));

      toast({
        title: "Enrolled successfully!",
        description: `You're now enrolled in the course`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
    }
  };

  const registerForChallenge = async (challengeId: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to register for challenges",
        variant: "destructive",
      });
      return;
    }

    try {
      setChallenges(prev => prev.map(c => 
        c.id === challengeId 
          ? { ...c, is_registered: true, participant_count: c.participant_count + 1 }
          : c
      ));

      toast({
        title: "Registered successfully!",
        description: "You're now registered for the challenge",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register for challenge",
        variant: "destructive",
      });
    }
  };

  const addMaterialToCart = async (material: Course['materials_list'][0]) => {
    try {
      // In production, this would add the actual material product to cart
      toast({
        title: "Added to cart!",
        description: `${material.name} added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add material to cart",
        variant: "destructive",
      });
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty_level === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'intermediate':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'advanced':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading learning hub...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Craft Learning Hub
        </CardTitle>
        <CardDescription>
          Learn from Chicago's best makers with hands-on video courses and monthly challenges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">Video Courses</TabsTrigger>
            <TabsTrigger value="challenges">Monthly Challenges</TabsTrigger>
            <TabsTrigger value="my-learning">My Learning</TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses, instructors, or topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="Pottery">Pottery</option>
                  <option value="Jewelry Making">Jewelry Making</option>
                  <option value="Woodworking">Woodworking</option>
                  <option value="Candle Making">Candle Making</option>
                  <option value="Knitting">Knitting</option>
                </select>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Course Grid */}
            {!selectedCourse ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card 
                    key={course.id}
                    className="transition-all duration-200 hover:shadow-md cursor-pointer"
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                      <OptimizedImage
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <PlayCircle className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className={getDifficultyColor(course.difficulty_level)}>
                          {course.difficulty_level}
                        </Badge>
                      </div>
                      {course.is_purchased && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Enrolled
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold line-clamp-2 mb-1">{course.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {course.instructor.avatar && (
                              <img 
                                src={course.instructor.avatar} 
                                alt={course.instructor.name}
                                className="w-4 h-4 rounded-full"
                              />
                            )}
                            {course.instructor.name}
                            {course.instructor.is_verified && (
                              <CheckCircle className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(course.duration_minutes)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              {course.lesson_count} lessons
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course.student_count}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{course.rating}</span>
                            <span className="text-xs text-muted-foreground">({course.review_count})</span>
                          </div>
                          <div className="text-lg font-bold">${course.price}</div>
                        </div>

                        {course.is_purchased && course.progress_percent > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{course.progress_percent}%</span>
                            </div>
                            <Progress value={course.progress_percent} className="h-2" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Course Detail View
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCourse(null)}
                  >
                    ← Back to Courses
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Course Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
                      <OptimizedImage
                        src={selectedCourse.thumbnail}
                        alt={selectedCourse.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button size="lg" className="bg-white/20 hover:bg-white/30">
                          <PlayCircle className="h-6 w-6 mr-2" />
                          {selectedCourse.is_purchased ? 'Continue Learning' : 'Preview Course'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h1 className="text-2xl font-bold mb-2">{selectedCourse.title}</h1>
                        <p className="text-muted-foreground">{selectedCourse.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {selectedCourse.instructor.avatar && (
                            <img 
                              src={selectedCourse.instructor.avatar} 
                              alt={selectedCourse.instructor.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{selectedCourse.instructor.name}</span>
                              {selectedCourse.instructor.is_verified && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {selectedCourse.instructor.shop_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{selectedCourse.instructor.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({selectedCourse.instructor.student_count} students)
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold">{formatDuration(selectedCourse.duration_minutes)}</div>
                          <div className="text-xs text-muted-foreground">Duration</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{selectedCourse.lesson_count}</div>
                          <div className="text-xs text-muted-foreground">Lessons</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{selectedCourse.student_count}</div>
                          <div className="text-xs text-muted-foreground">Students</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{selectedCourse.completion_rate}%</div>
                          <div className="text-xs text-muted-foreground">Complete</div>
                        </div>
                      </div>

                      {/* Learning Outcomes */}
                      <div>
                        <h3 className="font-semibold mb-3">What you'll learn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedCourse.learning_outcomes.map((outcome, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{outcome}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prerequisites */}
                      {selectedCourse.prerequisites.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Prerequisites</h3>
                          <div className="space-y-2">
                            {selectedCourse.prerequisites.map((prereq, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <BookOpen className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{prereq}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Purchase Card */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center space-y-4">
                          <div className="text-3xl font-bold">${selectedCourse.price}</div>
                          
                          {!selectedCourse.is_purchased ? (
                            <Button 
                              onClick={() => enrollInCourse(selectedCourse.id)}
                              className="w-full"
                              size="lg"
                            >
                              Enroll Now
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <Button className="w-full" size="lg">
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Continue Learning
                              </Button>
                              {selectedCourse.progress_percent > 0 && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Progress</span>
                                    <span>{selectedCourse.progress_percent}%</span>
                                  </div>
                                  <Progress value={selectedCourse.progress_percent} className="h-2" />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Materials List */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Required Materials</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedCourse.materials_list.map((material) => (
                          <div key={material.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{material.name}</div>
                              {material.supplier && (
                                <div className="text-xs text-muted-foreground">
                                  from {material.supplier}
                                </div>
                              )}
                              {material.is_optional && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Optional
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              {material.price && (
                                <div className="font-medium text-sm">${material.price}</div>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => addMaterialToCart(material)}
                              >
                                <ShoppingCart className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Certification */}
                    {selectedCourse.certification_available && (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                          <h4 className="font-medium mb-1">Certification Available</h4>
                          <p className="text-xs text-muted-foreground">
                            Complete the course to earn your certificate
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Monthly Craft Challenges</h3>
                {challenges.length > 0 && (
                  <Badge variant="outline" className="px-3 py-1">
                    <Trophy className="h-3 w-3 mr-1" />
                    ${challenges.reduce((sum, c) => sum + c.prize_pool, 0)} in prizes
                  </Badge>
                )}
              </div>

              {challenges.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">No Active Challenges</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      There are no craft challenges available right now. Check back soon for exciting monthly challenges with prizes!
                    </p>
                  </CardContent>
                </Card>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {challenges.map((challenge) => (
                  <Card key={challenge.id} className="relative overflow-hidden">
                    {challenge.is_active && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-green-500 text-white">
                          Active
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        {challenge.title}
                      </CardTitle>
                      <CardDescription>
                        {challenge.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Prize Pool</Label>
                          <div className="font-semibold">${challenge.prize_pool}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Participants</Label>
                          <div className="font-semibold">{challenge.participant_count}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Submissions</Label>
                          <div className="font-semibold">{challenge.submission_count}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Level</Label>
                          <Badge variant="outline" className={getDifficultyColor(challenge.difficulty_level)}>
                            {challenge.difficulty_level}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Timeline</Label>
                        <div className="text-sm">
                          <div>Start: {new Date(challenge.start_date).toLocaleDateString()}</div>
                          <div>End: {new Date(challenge.end_date).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Top Prizes</Label>
                        <div className="space-y-1">
                          {challenge.prizes.slice(0, 3).map((prize) => (
                            <div key={prize.rank} className="flex justify-between text-sm">
                              <span>#{prize.rank}: {prize.prize}</span>
                              <span className="font-medium">${prize.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {challenge.is_active ? (
                        !challenge.is_registered ? (
                          <Button 
                            onClick={() => registerForChallenge(challenge.id)}
                            className="w-full"
                          >
                            Register Now
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded text-green-700 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              You're registered!
                            </div>
                            <Button variant="outline" className="w-full">
                              Submit Entry
                            </Button>
                          </div>
                        )
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Coming Soon
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-learning" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enrolled Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">My Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  {courses.filter(c => c.is_purchased).length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No enrolled courses yet</p>
                      <Button variant="outline" className="mt-4">
                        Browse Courses
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courses.filter(c => c.is_purchased).map((course) => (
                        <div key={course.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                            <OptimizedImage
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium line-clamp-1">{course.title}</h4>
                            <p className="text-sm text-muted-foreground">{course.instructor.name}</p>
                            {course.progress_percent > 0 && (
                              <div className="mt-2">
                                <Progress value={course.progress_percent} className="h-1" />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {course.progress_percent}% complete
                                </p>
                              </div>
                            )}
                          </div>
                          <Button size="sm" variant="outline">
                            Continue
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Challenge History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">My Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  {challenges.filter(c => c.is_registered).length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No challenges joined yet</p>
                      <Button variant="outline" className="mt-4">
                        Join Challenge
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {challenges.filter(c => c.is_registered).map((challenge) => (
                        <div key={challenge.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{challenge.title}</h4>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Registered
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Deadline: {new Date(challenge.submission_deadline).toLocaleDateString()}
                          </p>
                          <Button size="sm" variant="outline" className="w-full">
                            Submit Entry
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
