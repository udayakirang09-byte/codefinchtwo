import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

// User types
export const UserRole = z.enum(['student', 'teacher', 'admin']);
export const UserStatus = z.enum(['active', 'inactive', 'suspended']);

export interface User {
  id: string;
  email: string;
  name: string;
  role: z.infer<typeof UserRole>;
  status: z.infer<typeof UserStatus>;
  profileImage?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  experience?: number;
  rating?: number;
  totalClasses?: number;
  totalEarnings?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Class/Session types
export const ClassStatus = z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']);
export const ClassType = z.enum(['one-on-one', 'group']);

export interface Class {
  id: string;
  teacherId: string;
  studentId: string;
  title: string;
  description: string;
  subject: string;
  type: z.infer<typeof ClassType>;
  status: z.infer<typeof ClassStatus>;
  scheduledAt: Date;
  duration: number;
  fee: number;
  platformFee: number;
  teacherEarnings: number;
  meetingLink?: string;
  chatRoomId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Feedback types
export interface Feedback {
  id: string;
  classId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Analytics types
export interface TeacherAnalytics {
  teacherId: string;
  totalClasses: number;
  totalEarnings: number;
  averageRating: number;
  studentRetentionRate: number;
  teachingBrillanceScore: number;
  skillPopularity: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    classes: number;
    earnings: number;
    rating: number;
  }>;
}

export interface StudentAnalytics {
  studentId: string;
  totalClasses: number;
  totalSpent: number;
  learningProgress: Record<string, number>;
  participationScore: number;
  favoriteSubjects: string[];
  monthlyActivity: Array<{
    month: string;
    classes: number;
    subjects: string[];
  }>;
}

export interface PlatformAnalytics {
  totalUsers: number;
  totalClasses: number;
  totalRevenue: number;
  growthRate: number;
  popularSubjects: Array<{
    subject: string;
    demand: number;
    avgPrice: number;
  }>;
  trendingSkills: Array<{
    skill: string;
    growth: number;
    teacherCount: number;
  }>;
  abuseReports: Array<{
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// Chat and Communication
export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
}

export interface ChatRoom {
  id: string;
  classId: string;
  participants: string[];
  createdAt: Date;
  lastActivity: Date;
}

// Admin toggles and settings
export interface AdminSettings {
  id: string;
  featureTogles: {
    videoClasses: boolean;
    chatSystem: boolean;
    aiAnalytics: boolean;
    powerBiIntegration: boolean;
    quantumAI: boolean;
    abuseTracking: boolean;
  };
  platformSettings: {
    commissionRate: number;
    minClassFee: number;
    maxClassFee: number;
    allowGroupClasses: boolean;
    requireTeacherVerification: boolean;
  };
  updatedAt: Date;
}

// Zod schemas for validation
export const userInsertSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: UserRole,
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0).optional(),
  experience: z.number().min(0).optional(),
});

export const classInsertSchema = z.object({
  teacherId: z.string(),
  studentId: z.string(),
  title: z.string().min(3),
  description: z.string().min(10),
  subject: z.string(),
  type: ClassType,
  scheduledAt: z.string().datetime(),
  duration: z.number().min(30),
  fee: z.number().min(1),
});

export const feedbackInsertSchema = z.object({
  classId: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
});

export const chatMessageInsertSchema = z.object({
  roomId: z.string(),
  userId: z.string(),
  message: z.string().min(1),
  type: z.enum(['text', 'file', 'system']).default('text'),
});

// Types for API responses
export type UserInsert = z.infer<typeof userInsertSchema>;
export type ClassInsert = z.infer<typeof classInsertSchema>;
export type FeedbackInsert = z.infer<typeof feedbackInsertSchema>;
export type ChatMessageInsert = z.infer<typeof chatMessageInsertSchema>;