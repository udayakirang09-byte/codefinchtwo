-- Azure PostgreSQL Database Setup Commands
-- Run these commands in order using your Azure CLI connection

-- Step 1: Create required extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Create users table
CREATE TABLE users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar UNIQUE NOT NULL,
  password varchar NOT NULL DEFAULT 'Hello111',
  first_name varchar,
  last_name varchar,
  profile_image_url varchar,
  role varchar NOT NULL DEFAULT 'student',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Step 3: Create mentors table
CREATE TABLE mentors (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id),
  title varchar NOT NULL,
  description text NOT NULL,
  specialties jsonb DEFAULT '[]'::jsonb,
  experience integer NOT NULL,
  rating decimal(3,2) DEFAULT 0.00,
  total_students integer DEFAULT 0,
  hourly_rate decimal(10,2),
  is_active boolean DEFAULT true,
  available_slots jsonb DEFAULT '[]'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Step 4: Create students table  
CREATE TABLE students (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id),
  age integer,
  interests jsonb DEFAULT '[]'::jsonb,
  skill_level varchar DEFAULT 'beginner',
  parent_email varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Step 5: Create bookings table
CREATE TABLE bookings (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id varchar NOT NULL REFERENCES students(id),
  mentor_id varchar NOT NULL REFERENCES mentors(id),
  scheduled_at timestamp NOT NULL,
  duration integer NOT NULL,
  status varchar NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Step 6: Create reviews table
CREATE TABLE reviews (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id varchar NOT NULL REFERENCES bookings(id),
  student_id varchar NOT NULL REFERENCES students(id),
  mentor_id varchar NOT NULL REFERENCES mentors(id),
  rating integer NOT NULL,
  comment text,
  created_at timestamp DEFAULT now()
);

-- Step 7: Create achievements table
CREATE TABLE achievements (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id varchar NOT NULL REFERENCES students(id),
  title varchar NOT NULL,
  description text NOT NULL,
  badge_icon varchar NOT NULL,
  earned_at timestamp DEFAULT now()
);

-- Step 8: Insert test data
INSERT INTO users (email, password, first_name, last_name, role) VALUES 
('udayakirang99@gmail.com', 'Hello111', 'Student', 'User', 'student'),
('teacher@codeconnect.com', 'Hello111', 'Teacher', 'User', 'mentor'),
('admin@codeconnect.com', 'Hello111', 'Admin', 'User', 'admin');

-- Step 9: Get user IDs for creating related records
INSERT INTO students (user_id, age, interests) 
SELECT id, 16, '["JavaScript", "Python"]'::jsonb 
FROM users WHERE role = 'student' LIMIT 1;

INSERT INTO mentors (user_id, title, description, specialties, experience, hourly_rate) 
SELECT id, 'Senior JavaScript Developer', 'Experienced developer with 8+ years in web development', '["JavaScript", "React", "Node.js"]'::jsonb, 8, 75.00
FROM users WHERE role = 'mentor' LIMIT 1;

-- Step 10: Verify setup
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Mentors' as table_name, COUNT(*) as count FROM mentors  
UNION ALL
SELECT 'Students' as table_name, COUNT(*) as count FROM students;