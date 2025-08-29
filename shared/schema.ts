import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("student"), // student, mentor, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mentors = pgTable("mentors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  specialties: jsonb("specialties").$type<string[]>().default([]),
  experience: integer("experience").notNull(), // years
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalStudents: integer("total_students").default(0),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  availableSlots: jsonb("available_slots").$type<{ day: string; times: string[] }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  age: integer("age"),
  interests: jsonb("interests").$type<string[]>().default([]),
  skillLevel: varchar("skill_level").default("beginner"), // beginner, intermediate, advanced
  parentEmail: varchar("parent_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // minutes
  status: varchar("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  badgeIcon: varchar("badge_icon").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher qualifications table
export const teacherQualifications = pgTable("teacher_qualifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  qualification: varchar("qualification").notNull(), // e.g., "Bachelor's in Computer Science"
  specialization: varchar("specialization").notNull(), // e.g., "Machine Learning"
  score: varchar("score").notNull(), // e.g., "3.8 GPA", "First Class"
  priority: integer("priority").notNull().default(1), // 1=highest, 2=second, 3=third
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher subjects table
export const teacherSubjects = pgTable("teacher_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  subject: varchar("subject").notNull(), // e.g., "Python Programming"
  experience: varchar("experience").notNull(), // e.g., "5 years", "Advanced"
  priority: integer("priority").notNull().default(1), // 1-5 for ordering
  createdAt: timestamp("created_at").defaultNow(),
});

// Success Stories table
export const successStories = pgTable("success_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentName: varchar("student_name").notNull(),
  mentorName: varchar("mentor_name").notNull(),
  studentAge: integer("student_age").notNull(),
  programmingLanguage: varchar("programming_language").notNull(),
  achievementTitle: varchar("achievement_title").notNull(),
  story: text("story").notNull(),
  imageUrl: varchar("image_url"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  mentor: one(mentors, {
    fields: [users.id],
    references: [mentors.userId],
  }),
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
}));

export const mentorsRelations = relations(mentors, ({ one, many }) => ({
  user: one(users, {
    fields: [mentors.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
  qualifications: many(teacherQualifications),
  subjects: many(teacherSubjects),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
  achievements: many(achievements),
  reviews: many(reviews),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  student: one(students, {
    fields: [bookings.studentId],
    references: [students.id],
  }),
  mentor: one(mentors, {
    fields: [bookings.mentorId],
    references: [mentors.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  student: one(students, {
    fields: [reviews.studentId],
    references: [students.id],
  }),
  mentor: one(mentors, {
    fields: [reviews.mentorId],
    references: [mentors.id],
  }),
}));

export const teacherQualificationsRelations = relations(teacherQualifications, ({ one }) => ({
  mentor: one(mentors, {
    fields: [teacherQualifications.mentorId],
    references: [mentors.id],
  }),
}));

export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
  mentor: one(mentors, {
    fields: [teacherSubjects.mentorId],
    references: [mentors.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  student: one(students, {
    fields: [achievements.studentId],
    references: [students.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMentorSchema = createInsertSchema(mentors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  totalStudents: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TeacherQualification = typeof teacherQualifications.$inferSelect;
export type InsertTeacherQualification = typeof teacherQualifications.$inferInsert;
export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type InsertTeacherSubject = typeof teacherSubjects.$inferInsert;

export type Mentor = typeof mentors.$inferSelect;
export type InsertMentor = z.infer<typeof insertMentorSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

// Extended types with relations
export type MentorWithUser = Mentor & { user: User };
export type StudentWithUser = Student & { user: User };
export type BookingWithDetails = Booking & {
  student: StudentWithUser;
  mentor: MentorWithUser;
};
export type ReviewWithDetails = Review & {
  student: StudentWithUser;
  mentor: MentorWithUser;
};

// Additional tables for chat, video sessions, and feedback
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  isActive: boolean("is_active").default(true),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatSessionId: varchar("chat_session_id").references(() => chatSessions.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const videoSessions = pgTable("video_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  roomId: varchar("room_id").notNull(),
  status: varchar("status").notNull().default("waiting"), // waiting, active, ended
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  recordingUrl: varchar("recording_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classFeedback = pgTable("class_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  feedback: text("feedback"),
  whatWorked: text("what_worked"),
  improvements: text("improvements"),
  wouldRecommend: boolean("would_recommend").default(true),
  isVisible: boolean("is_visible").default(true), // for students: visible for 12 hours
  expiresAt: timestamp("expires_at"), // 12 hours after class for students
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // class_reminder, chat_message, feedback_request, etc.
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id"), // booking_id, chat_session_id, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Additional Relations
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [chatSessions.bookingId],
    references: [bookings.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chatSession: one(chatSessions, {
    fields: [chatMessages.chatSessionId],
    references: [chatSessions.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

export const videoSessionsRelations = relations(videoSessions, ({ one }) => ({
  booking: one(bookings, {
    fields: [videoSessions.bookingId],
    references: [bookings.id],
  }),
}));

export const classFeedbackRelations = relations(classFeedback, ({ one }) => ({
  booking: one(bookings, {
    fields: [classFeedback.bookingId],
    references: [bookings.id],
  }),
  student: one(students, {
    fields: [classFeedback.studentId],
    references: [students.id],
  }),
  mentor: one(mentors, {
    fields: [classFeedback.mentorId],
    references: [mentors.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Additional Insert Schemas
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  startedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  sentAt: true,
});

export const insertVideoSessionSchema = createInsertSchema(videoSessions).omit({
  id: true,
  createdAt: true,
});

export const insertClassFeedbackSchema = createInsertSchema(classFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Additional Types
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type VideoSession = typeof videoSessions.$inferSelect;
export type InsertVideoSession = z.infer<typeof insertVideoSessionSchema>;

export type ClassFeedback = typeof classFeedback.$inferSelect;
export type InsertClassFeedback = z.infer<typeof insertClassFeedbackSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Admin Configuration Table
export const adminConfig = pgTable("admin_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: varchar("config_key").unique().notNull(),
  configValue: text("config_value"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Time Slots Management Table
export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  dayOfWeek: varchar("day_of_week").notNull(), // monday, tuesday, etc.
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true),
  isRecurring: boolean("is_recurring").default(true),
  isBlocked: boolean("is_blocked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Footer Links Configuration Table
export const footerLinks = pgTable("footer_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  section: varchar("section").notNull(), // students, mentors, support
  title: varchar("title").notNull(),
  url: varchar("url").notNull(),
  isExternal: boolean("is_external").default(false),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Additional Relations
export const adminConfigRelations = relations(adminConfig, ({ }) => ({}));

export const timeSlotsRelations = relations(timeSlots, ({ one }) => ({
  mentor: one(mentors, {
    fields: [timeSlots.mentorId],
    references: [mentors.id],
  }),
}));

export const footerLinksRelations = relations(footerLinks, ({ }) => ({}));

// Additional Insert Schemas
export const insertAdminConfigSchema = createInsertSchema(adminConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFooterLinkSchema = createInsertSchema(footerLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Courses Table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // programming, web-development, mobile-development, etc.
  difficulty: varchar("difficulty").notNull(), // beginner, intermediate, advanced
  duration: varchar("duration"), // e.g., "2 hours", "1 week", etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxStudents: integer("max_students").default(10),
  prerequisites: text("prerequisites"),
  tags: jsonb("tags").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teacher Profile Table
export const teacherProfiles = pgTable("teacher_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  // Qualifications
  highestQualification: varchar("highest_qualification").notNull(), // Masters, Bachelors, PhD, etc.
  qualificationScore: varchar("qualification_score"), // GPA, percentage, etc.
  instituteName: varchar("institute_name"),
  graduationYear: integer("graduation_year"),
  // Computer Language Experience  
  programmingLanguages: jsonb("programming_languages").$type<{
    language: string;
    yearsOfExperience: number;
    proficiencyLevel: string; // beginner, intermediate, advanced, expert
    certifications?: string[];
  }[]>().default([]),
  // Achievements
  achievements: jsonb("achievements").$type<{
    category: string; // technical, teaching, professional, academic
    achievement: string;
    year?: number;
    description?: string;
  }[]>().default([]),
  // Additional fields
  totalTeachingExperience: integer("total_teaching_experience").default(0), // in years
  isProfileComplete: boolean("is_profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses Relations
export const coursesRelations = relations(courses, ({ one }) => ({
  mentor: one(mentors, {
    fields: [courses.mentorId],
    references: [mentors.id],
  }),
}));

// Teacher Profile Relations
export const teacherProfilesRelations = relations(teacherProfiles, ({ one }) => ({
  user: one(users, {
    fields: [teacherProfiles.userId],
    references: [users.id],
  }),
}));

// Course Insert Schema
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Teacher Profile Insert Schema
export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Additional Types
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;

export type AdminConfig = typeof adminConfig.$inferSelect;
export type InsertAdminConfig = z.infer<typeof insertAdminConfigSchema>;

export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;

export type FooterLink = typeof footerLinks.$inferSelect;
export type InsertFooterLink = z.infer<typeof insertFooterLinkSchema>;

// AI Analytics and Business Intelligence Tables
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  eventType: varchar("event_type").notNull(), // page_view, button_click, booking_created, course_completed, etc.
  eventName: varchar("event_name").notNull(),
  properties: jsonb("properties").$type<Record<string, any>>().default({}),
  url: varchar("url"),
  userAgent: varchar("user_agent"),
  ipAddress: varchar("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  insightType: varchar("insight_type").notNull(), // pattern_recognition, prediction, anomaly_detection, recommendation
  category: varchar("category").notNull(), // user_behavior, business_metrics, compliance, performance
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  data: jsonb("data").$type<Record<string, any>>().default({}),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  status: varchar("status").notNull().default("active"), // active, dismissed, resolved
  actionRequired: boolean("action_required").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const businessMetrics = pgTable("business_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar("metric_name").notNull(),
  metricValue: decimal("metric_value", { precision: 15, scale: 2 }).notNull(),
  metricType: varchar("metric_type").notNull(), // revenue, users, sessions, conversion_rate, etc.
  period: varchar("period").notNull(), // hourly, daily, weekly, monthly
  date: timestamp("date").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

export const complianceMonitoring = pgTable("compliance_monitoring", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  complianceType: varchar("compliance_type").notNull(), // gdpr, coppa, data_security, content_moderation
  ruleId: varchar("rule_id").notNull(),
  ruleName: varchar("rule_name").notNull(),
  description: text("description").notNull(),
  severity: varchar("severity").notNull(), // info, warning, violation, critical
  status: varchar("status").notNull(), // compliant, non_compliant, under_review, resolved
  relatedEntity: varchar("related_entity"), // user_id, booking_id, content_id, etc.
  details: jsonb("details").$type<Record<string, any>>().default({}),
  detectedAt: timestamp("detected_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const chatAnalytics = pgTable("chat_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatSessionId: varchar("chat_session_id").references(() => chatSessions.id).notNull(),
  messageCount: integer("message_count").default(0),
  avgResponseTime: decimal("avg_response_time", { precision: 10, scale: 2 }), // in seconds
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }), // -1 to 1
  topicsTags: jsonb("topics_tags").$type<string[]>().default([]),
  languageUsed: varchar("language_used").default("english"),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }), // 0 to 1
  engagementScore: decimal("engagement_score", { precision: 3, scale: 2 }), // 0 to 1
  aiAnalysis: jsonb("ai_analysis").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const audioAnalytics = pgTable("audio_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoSessionId: varchar("video_session_id").references(() => videoSessions.id).notNull(),
  duration: integer("duration"), // in seconds
  speakingTimeRatio: decimal("speaking_time_ratio", { precision: 3, scale: 2 }), // mentor vs student speaking time
  audioQuality: decimal("audio_quality", { precision: 3, scale: 2 }), // 0 to 1
  backgroundNoise: decimal("background_noise", { precision: 3, scale: 2 }), // 0 to 1
  emotionalTone: jsonb("emotional_tone").$type<Record<string, number>>().default({}), // excited, confused, engaged, etc.
  keyTopics: jsonb("key_topics").$type<string[]>().default([]),
  teachingEffectiveness: decimal("teaching_effectiveness", { precision: 3, scale: 2 }), // 0 to 1
  aiTranscription: text("ai_transcription"),
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const predictiveModels = pgTable("predictive_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelName: varchar("model_name").notNull(),
  modelType: varchar("model_type").notNull(), // churn_prediction, demand_forecasting, price_optimization, etc.
  version: varchar("version").notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }), // 0 to 1
  trainingData: jsonb("training_data").$type<Record<string, any>>().default({}),
  features: jsonb("features").$type<string[]>().default([]),
  predictions: jsonb("predictions").$type<Record<string, any>>().default({}),
  isActive: boolean("is_active").default(true),
  lastTrained: timestamp("last_trained").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cloudDeployments = pgTable("cloud_deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: varchar("provider").notNull(), // aws, azure, gcp
  region: varchar("region").notNull(),
  environment: varchar("environment").notNull(), // development, staging, production
  serviceName: varchar("service_name").notNull(),
  deploymentStatus: varchar("deployment_status").notNull(), // pending, deploying, active, failed, terminated
  resourceConfig: jsonb("resource_config").$type<Record<string, any>>().default({}),
  healthStatus: varchar("health_status").default("unknown"), // healthy, warning, critical, unknown
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  deployedAt: timestamp("deployed_at"),
  lastHealthCheck: timestamp("last_health_check"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const technologyStack = pgTable("technology_stack", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  component: varchar("component").notNull(), // database, frontend, backend, cache, etc.
  technology: varchar("technology").notNull(), // postgresql, react, node.js, redis, etc.
  currentVersion: varchar("current_version").notNull(),
  latestVersion: varchar("latest_version"),
  status: varchar("status").notNull().default("current"), // current, outdated, deprecated, vulnerable
  securityScore: decimal("security_score", { precision: 3, scale: 2 }), // 0 to 1
  performanceScore: decimal("performance_score", { precision: 3, scale: 2 }), // 0 to 1
  upgradeRecommendation: text("upgrade_recommendation"),
  upgradePriority: varchar("upgrade_priority").default("medium"), // low, medium, high, critical
  lastChecked: timestamp("last_checked").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quantum Computing Integration Table (for competitive advantage)
export const quantumTasks = pgTable("quantum_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskType: varchar("task_type").notNull(), // optimization, machine_learning, cryptography, simulation
  algorithm: varchar("algorithm").notNull(), // qaoa, vqe, grover, shor, etc.
  problemDescription: text("problem_description").notNull(),
  inputData: jsonb("input_data").$type<Record<string, any>>().default({}),
  quantumCircuit: text("quantum_circuit"), // QASM or circuit description
  classicalPreprocessing: text("classical_preprocessing"),
  quantumProcessing: text("quantum_processing"),
  classicalPostprocessing: text("classical_postprocessing"),
  results: jsonb("results").$type<Record<string, any>>().default({}),
  executionTime: decimal("execution_time", { precision: 10, scale: 4 }), // in seconds
  quantumAdvantage: decimal("quantum_advantage", { precision: 5, scale: 2 }), // speedup factor
  status: varchar("status").notNull().default("pending"), // pending, running, completed, failed
  provider: varchar("provider").default("ibm"), // ibm, google, rigetti, aws_braket, etc.
  qubitsUsed: integer("qubits_used"),
  gateCount: integer("gate_count"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations for new tables
export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ }) => ({}));

export const businessMetricsRelations = relations(businessMetrics, ({ }) => ({}));

export const complianceMonitoringRelations = relations(complianceMonitoring, ({ }) => ({}));

export const chatAnalyticsRelations = relations(chatAnalytics, ({ one }) => ({
  chatSession: one(chatSessions, {
    fields: [chatAnalytics.chatSessionId],
    references: [chatSessions.id],
  }),
}));

export const audioAnalyticsRelations = relations(audioAnalytics, ({ one }) => ({
  videoSession: one(videoSessions, {
    fields: [audioAnalytics.videoSessionId],
    references: [videoSessions.id],
  }),
}));

export const predictiveModelsRelations = relations(predictiveModels, ({ }) => ({}));

export const cloudDeploymentsRelations = relations(cloudDeployments, ({ }) => ({}));

export const technologyStackRelations = relations(technologyStack, ({ }) => ({}));

export const quantumTasksRelations = relations(quantumTasks, ({ }) => ({}));

// Insert Schemas for new tables
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  timestamp: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessMetricSchema = createInsertSchema(businessMetrics).omit({
  id: true,
  calculatedAt: true,
});

export const insertComplianceMonitoringSchema = createInsertSchema(complianceMonitoring).omit({
  id: true,
  detectedAt: true,
});

export const insertChatAnalyticsSchema = createInsertSchema(chatAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertAudioAnalyticsSchema = createInsertSchema(audioAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertPredictiveModelSchema = createInsertSchema(predictiveModels).omit({
  id: true,
  lastTrained: true,
  createdAt: true,
});

export const insertCloudDeploymentSchema = createInsertSchema(cloudDeployments).omit({
  id: true,
  createdAt: true,
});

export const insertTechnologyStackSchema = createInsertSchema(technologyStack).omit({
  id: true,
  lastChecked: true,
  updatedAt: true,
});

export const insertQuantumTaskSchema = createInsertSchema(quantumTasks).omit({
  id: true,
  createdAt: true,
});

export const insertSuccessStorySchema = createInsertSchema(successStories).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;

export type BusinessMetric = typeof businessMetrics.$inferSelect;
export type InsertBusinessMetric = z.infer<typeof insertBusinessMetricSchema>;

export type ComplianceMonitoring = typeof complianceMonitoring.$inferSelect;
export type InsertComplianceMonitoring = z.infer<typeof insertComplianceMonitoringSchema>;

export type ChatAnalytics = typeof chatAnalytics.$inferSelect;
export type InsertChatAnalytics = z.infer<typeof insertChatAnalyticsSchema>;

export type AudioAnalytics = typeof audioAnalytics.$inferSelect;
export type InsertAudioAnalytics = z.infer<typeof insertAudioAnalyticsSchema>;

export type PredictiveModel = typeof predictiveModels.$inferSelect;
export type InsertPredictiveModel = z.infer<typeof insertPredictiveModelSchema>;

export type CloudDeployment = typeof cloudDeployments.$inferSelect;
export type InsertCloudDeployment = z.infer<typeof insertCloudDeploymentSchema>;

export type TechnologyStack = typeof technologyStack.$inferSelect;
export type InsertTechnologyStack = z.infer<typeof insertTechnologyStackSchema>;

export type QuantumTask = typeof quantumTasks.$inferSelect;
export type InsertQuantumTask = z.infer<typeof insertQuantumTaskSchema>;

export type SuccessStory = typeof successStories.$inferSelect;
export type InsertSuccessStory = z.infer<typeof insertSuccessStorySchema>;
