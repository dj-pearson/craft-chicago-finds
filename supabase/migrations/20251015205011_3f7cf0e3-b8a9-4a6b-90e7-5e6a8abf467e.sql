-- Pickup Meetups Table
CREATE TABLE IF NOT EXISTS public.pickup_meetups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_name TEXT NOT NULL,
  location_address TEXT NOT NULL,
  meetup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_attendees INTEGER,
  current_attendees INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meetup Attendees Table
CREATE TABLE IF NOT EXISTS public.meetup_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id UUID NOT NULL REFERENCES public.pickup_meetups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meetup_id, user_id)
);

-- Livestreams Table
CREATE TABLE IF NOT EXISTS public.maker_livestreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  stream_url TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  viewer_count INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Learning Courses Table
CREATE TABLE IF NOT EXISTS public.craft_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2),
  is_free BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url TEXT,
  video_url TEXT,
  materials_needed TEXT[],
  learning_outcomes TEXT[],
  enrollment_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Course Enrollments Table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.craft_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- Mentorship Programs Table
CREATE TABLE IF NOT EXISTS public.mentorship_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  craft_specialty TEXT NOT NULL,
  experience_required TEXT NOT NULL,
  max_mentees INTEGER NOT NULL DEFAULT 5,
  current_mentees INTEGER NOT NULL DEFAULT 0,
  duration_weeks INTEGER NOT NULL,
  time_commitment_hours INTEGER NOT NULL,
  is_accepting BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mentorship Applications Table
CREATE TABLE IF NOT EXISTS public.mentorship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.mentorship_programs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  application_message TEXT NOT NULL,
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, applicant_id)
);

-- Enable RLS
ALTER TABLE public.pickup_meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maker_livestreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.craft_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pickup_meetups
CREATE POLICY "Anyone can view active meetups" ON public.pickup_meetups
  FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can manage their own meetups" ON public.pickup_meetups
  FOR ALL USING (auth.uid() = seller_id);

-- RLS Policies for meetup_attendees
CREATE POLICY "Users can view meetup attendees" ON public.meetup_attendees
  FOR SELECT USING (true);

CREATE POLICY "Users can register for meetups" ON public.meetup_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own registrations" ON public.meetup_attendees
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for maker_livestreams
CREATE POLICY "Anyone can view livestreams" ON public.maker_livestreams
  FOR SELECT USING (true);

CREATE POLICY "Makers can manage their own livestreams" ON public.maker_livestreams
  FOR ALL USING (auth.uid() = maker_id);

-- RLS Policies for craft_courses
CREATE POLICY "Anyone can view published courses" ON public.craft_courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Instructors can manage their own courses" ON public.craft_courses
  FOR ALL USING (auth.uid() = instructor_id);

-- RLS Policies for course_enrollments
CREATE POLICY "Users can view their own enrollments" ON public.course_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses" ON public.course_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON public.course_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for mentorship_programs
CREATE POLICY "Anyone can view accepting programs" ON public.mentorship_programs
  FOR SELECT USING (is_accepting = true);

CREATE POLICY "Mentors can manage their own programs" ON public.mentorship_programs
  FOR ALL USING (auth.uid() = mentor_id);

-- RLS Policies for mentorship_applications
CREATE POLICY "Users can view their own applications" ON public.mentorship_applications
  FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Mentors can view applications to their programs" ON public.mentorship_applications
  FOR SELECT USING (auth.uid() IN (
    SELECT mentor_id FROM public.mentorship_programs WHERE id = program_id
  ));

CREATE POLICY "Users can create applications" ON public.mentorship_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can withdraw their applications" ON public.mentorship_applications
  FOR UPDATE USING (auth.uid() = applicant_id);

CREATE POLICY "Mentors can respond to applications" ON public.mentorship_applications
  FOR UPDATE USING (auth.uid() IN (
    SELECT mentor_id FROM public.mentorship_programs WHERE id = program_id
  ));

-- Indexes for performance
CREATE INDEX idx_pickup_meetups_seller ON public.pickup_meetups(seller_id);
CREATE INDEX idx_pickup_meetups_city ON public.pickup_meetups(city_id);
CREATE INDEX idx_pickup_meetups_date ON public.pickup_meetups(meetup_date);
CREATE INDEX idx_meetup_attendees_meetup ON public.meetup_attendees(meetup_id);
CREATE INDEX idx_meetup_attendees_user ON public.meetup_attendees(user_id);
CREATE INDEX idx_livestreams_maker ON public.maker_livestreams(maker_id);
CREATE INDEX idx_livestreams_status ON public.maker_livestreams(status);
CREATE INDEX idx_courses_instructor ON public.craft_courses(instructor_id);
CREATE INDEX idx_courses_published ON public.craft_courses(is_published);
CREATE INDEX idx_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX idx_mentorship_mentor ON public.mentorship_programs(mentor_id);
CREATE INDEX idx_applications_program ON public.mentorship_applications(program_id);
CREATE INDEX idx_applications_applicant ON public.mentorship_applications(applicant_id);