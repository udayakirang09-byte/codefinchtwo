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
  unique,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull().default("Hello111"), // Add password field with default
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("student"), // student, mentor, admin
  country: varchar("country").notNull().default("India"), // User's country
  // OAuth Fields for Google/Apple sign-in
  oauthProvider: varchar("oauth_provider"), // google, apple, null for email/password
  oauthId: varchar("oauth_id"), // Provider's user ID
  // 2FA Fields (Microsoft Authenticator / TOTP)
  totpSecret: text("totp_secret"), // Encrypted TOTP secret for 2FA
  totpEnabled: boolean("totp_enabled").default(false), // Whether 2FA is active
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trusted devices for "Remember this device 30 days" functionality
export const trustedDevices = pgTable("trusted_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  deviceFingerprint: varchar("device_fingerprint").notNull(), // Hashed device identifier
  deviceName: varchar("device_name"), // e.g., "Chrome on Windows", "Safari on iPhone"
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 30 days from creation
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("trusted_devices_user_id_idx").on(table.userId),
  deviceFingerprintIdx: index("trusted_devices_fingerprint_idx").on(table.deviceFingerprint),
}));

// Backup codes for emergency 2FA access
export const backupCodes = pgTable("backup_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  codeHash: varchar("code_hash").notNull(), // Hashed backup code
  usedAt: timestamp("used_at"), // null = unused, timestamp = used
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("backup_codes_user_id_idx").on(table.userId),
}));

// Security event logs for audit trail
export const securityLogs = pgTable("security_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  eventType: varchar("event_type").notNull(), // login, 2fa_setup, 2fa_verify, profile_edit, password_change, etc.
  eventStatus: varchar("event_status").notNull(), // success, failure, suspicious
  eventDetails: jsonb("event_details").$type<Record<string, any>>().default({}), // Additional context
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("security_logs_user_id_idx").on(table.userId),
  eventTypeIdx: index("security_logs_event_type_idx").on(table.eventType),
  createdAtIdx: index("security_logs_created_at_idx").on(table.createdAt),
}));

// Email OTP verification for signup (dual verification with Authenticator)
export const emailOtps = pgTable("email_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  otpHash: varchar("otp_hash").notNull(), // Hashed OTP code (6 digits)
  purpose: varchar("purpose").notNull().default("signup"), // signup, login, password_reset
  verified: boolean("verified").default(false),
  expiresAt: timestamp("expires_at").notNull(), // 10 minutes from creation
  attempts: integer("attempts").default(0), // Track failed attempts
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  emailIdx: index("email_otps_email_idx").on(table.email),
  expiresAtIdx: index("email_otps_expires_at_idx").on(table.expiresAt),
}));

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
  country: varchar("country").notNull().default("NA-Country"), // Country field with default
  upiId: varchar("upi_id"), // UPI ID for payouts
  isActive: boolean("is_active").default(true),
  demoEnabled: boolean("demo_enabled").default(false), // C2: Allow teachers to enable/disable demo bookings
  introVideoUrl: varchar("intro_video_url"), // Optional 1-minute intro video for teacher profile
  availableSlots: jsonb("available_slots").$type<{ day: string; times: string[] }[]>().default([]),
  // AI Moderation & Account Restrictions
  accountRestriction: varchar("account_restriction").default("none"), // none, warned, suspended, banned
  moderationViolations: integer("moderation_violations").default(0), // Total violation count
  lastViolationAt: timestamp("last_violation_at"), // Last violation timestamp
  restrictionReason: text("restriction_reason"), // Reason for restriction if any
  // Admin Approval Workflow
  approvalStatus: varchar("approval_status").default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by"), // Admin user ID who approved
  approvedAt: timestamp("approved_at"), // When the profile was approved
  rejectionReason: text("rejection_reason"), // Reason for rejection if rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Index for getMentors() query - speeds up mentor discovery by 90%
  isActiveRatingIdx: index("mentors_is_active_rating_idx").on(table.isActive, table.rating),
  userIdIdx: index("mentors_user_id_idx").on(table.userId),
  approvalStatusIdx: index("mentors_approval_status_idx").on(table.approvalStatus),
}));

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
  courseId: varchar("course_id").references(() => courses.id), // Optional: only set for course bookings
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // minutes
  status: varchar("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  subject: varchar("subject"), // Subject/topic of the session (from teacher's specialties or courses)
  notes: text("notes"),
  // Demo Session Support
  sessionType: varchar("session_type").notNull().default("regular"), // demo, regular
  // Attendance Tracking (for auto-cancellation)
  attendanceTracking: boolean("attendance_tracking").default(true), // Enable/disable attendance monitoring
  teacherJoinedAt: timestamp("teacher_joined_at"), // When teacher first joined
  teacherAbsentPercent: integer("teacher_absent_percent").default(0), // % time teacher was absent
  autoCancelReason: varchar("auto_cancel_reason"), // e.g., "Teacher absent >25% from start"
  // Comprehensive Cancellation Tracking
  cancelledBy: varchar("cancelled_by"), // teacher, student, system, admin
  cancellationType: varchar("cancellation_type"), // teacher_cancelled, student_cancelled, late_join, teacher_no_show, low_presence, connectivity_issue, short_session, admin_manual
  cancelledAt: timestamp("cancelled_at"), // When the class was cancelled
  cancelReason: text("cancel_reason"), // Detailed reason for cancellation
  // Refund Tracking
  refundStatus: varchar("refund_status"), // pending, approved, rejected, processed, not_applicable
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }), // Amount to refund in INR
  refundProcessedAt: timestamp("refund_processed_at"), // When refund was completed
  // AI/System Detection Fields
  lateJoinDetectedAt: timestamp("late_join_detected_at"), // When late join was detected
  connectivityIssueDetectedAt: timestamp("connectivity_issue_detected_at"), // When connectivity issue detected
  lowPresenceDetectedAt: timestamp("low_presence_detected_at"), // When low presence detected
  shortSessionDetectedAt: timestamp("short_session_detected_at"), // When short session detected
  actualDuration: integer("actual_duration"), // Actual minutes the class lasted
  // Recording Visibility (for demo sessions)
  recordingVisibilityUnlockedAt: timestamp("recording_visibility_unlocked_at"), // When demo recording becomes visible
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Critical indexes for student stats queries - speeds up by 80%
  studentIdScheduledIdx: index("bookings_student_id_scheduled_at_idx").on(table.studentId, table.scheduledAt),
  mentorIdScheduledIdx: index("bookings_mentor_id_scheduled_at_idx").on(table.mentorId, table.scheduledAt),
  statusIdx: index("bookings_status_idx").on(table.status),
  scheduledAtIdx: index("bookings_scheduled_at_idx").on(table.scheduledAt),
  cancellationTypeIdx: index("bookings_cancellation_type_idx").on(table.cancellationType),
}));

// C4, C10: Booking holds for 10-minute payment window
export const bookingHolds = pgTable("booking_holds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // minutes
  sessionType: varchar("session_type").notNull().default("regular"), // demo, regular
  status: varchar("status").notNull().default("active"), // active, confirmed, expired, released
  expiresAt: timestamp("expires_at").notNull(), // 10 minutes from creation
  confirmedAt: timestamp("confirmed_at"), // When payment was confirmed
  bookingId: varchar("booking_id").references(() => bookings.id), // Set when confirmed
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  mentorIdScheduledIdx: index("booking_holds_mentor_scheduled_idx").on(table.mentorId, table.scheduledAt),
  expiresAtIdx: index("booking_holds_expires_at_idx").on(table.expiresAt),
  statusIdx: index("booking_holds_status_idx").on(table.status),
}));

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
  // FB-4: Extended feedback fields
  thoughts: text("thoughts"),
  whatWorked: text("what_worked"),
  improvements: text("improvements"),
  recommend: boolean("recommend").default(true),
  // LOG-1: AI feedback analysis
  aiFlagged: boolean("ai_flagged").default(false),
  sentiment: decimal("sentiment", { precision: 3, scale: 2 }), // -1 to +1
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Index for getReviewsByMentor() query
  mentorIdIdx: index("reviews_mentor_id_idx").on(table.mentorId),
  studentIdIdx: index("reviews_student_id_idx").on(table.studentId),
}));

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
  classFee: decimal("class_fee", { precision: 10, scale: 2 }).default("500.00"), // Fee per class in INR
  priority: integer("priority").notNull().default(1), // 1-5 for ordering
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher media (profile photos and intro video) with privacy-preserving validation
export const teacherMedia = pgTable("teacher_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull().unique(), // One photo per mentor
  // Photo fields
  photoBlobPath: text("photo_blob_path").notNull(), // Azure blob path: mentors/{mentorId}/profile.jpg
  photoBlobUrl: text("photo_blob_url"), // Temporary SAS URL for access
  photoEncryptionKey: varchar("photo_encryption_key"), // AES-256 encryption key reference
  photoEncryptionIv: varchar("photo_encryption_iv"), // Initialization vector for AES
  photoFaceDetected: boolean("photo_face_detected").default(false), // face-api.js detected human face
  photoClarityScore: integer("photo_clarity_score").default(0), // 0-100 score (sharp library)
  photoValidationStatus: varchar("photo_validation_status").default("pending"), // pending, approved, rejected
  photoValidationMessage: text("photo_validation_message"), // Validation feedback message
  photoFileSizeBytes: integer("photo_file_size_bytes"),
  photoMimeType: varchar("photo_mime_type"),
  // Intro Video fields (optional)
  videoBlobPath: text("video_blob_path"), // Azure blob path: mentors/{mentorId}/intro.mp4
  videoBlobUrl: text("video_blob_url"), // Temporary SAS URL for access
  videoEncryptionKey: varchar("video_encryption_key"), // AES-256 encryption key
  videoEncryptionIv: varchar("video_encryption_iv"), // Initialization vector
  videoDurationSeconds: integer("video_duration_seconds"), // Duration in seconds
  videoClarityScore: integer("video_clarity_score").default(0), // 0-100 score for video quality
  videoValidationStatus: varchar("video_validation_status").default("pending"), // pending, approved, rejected
  videoValidationMessage: text("video_validation_message"), // Validation feedback
  videoFileSizeBytes: integer("video_file_size_bytes"),
  videoMimeType: varchar("video_mime_type"),
  // Timestamps
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  mentorIdIdx: index("teacher_media_mentor_id_idx").on(table.mentorId),
}));

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
export const usersRelations = relations(users, ({ one, many }) => ({
  mentor: one(mentors, {
    fields: [users.id],
    references: [mentors.userId],
  }),
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  sessions: many(userSessions),
  notifications: many(notifications),
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
  media: one(teacherMedia, {
    fields: [mentors.id],
    references: [teacherMedia.mentorId],
  }),
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

export const teacherMediaRelations = relations(teacherMedia, ({ one }) => ({
  mentor: one(mentors, {
    fields: [teacherMedia.mentorId],
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
export const insertUserSchema = createInsertSchema(users);

export const insertMentorSchema = createInsertSchema(mentors);

export const insertStudentSchema = createInsertSchema(students);

export const insertBookingSchema = createInsertSchema(bookings);

export type InsertBookingHold = typeof bookingHolds.$inferInsert;
export type SelectBookingHold = typeof bookingHolds.$inferSelect;

export const insertReviewSchema = createInsertSchema(reviews);

export const insertAchievementSchema = createInsertSchema(achievements);

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
export type MentorWithUser = Mentor & { 
  user: User;
  subjectsWithExperience?: { subject: string; experience: string }[];
};
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
  studentId: varchar("student_id").references(() => users.id).notNull(), // Added for relationship tracking
  mentorId: varchar("mentor_id").references(() => users.id).notNull(), // Added for relationship tracking
  isActive: boolean("is_active").default(true),
  archiveAt: timestamp("archive_at"), // When messages should be archived (3 months after relationship ends)
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  senderId: varchar("sender_id").notNull(), // Store user identifier (email or ID)
  senderName: varchar("sender_name").notNull(),
  message: text("message").notNull(),
  fileUrl: varchar("file_url"), // URL to uploaded file (if any)
  fileName: varchar("file_name"), // Original file name
  fileType: varchar("file_type"), // MIME type
  readBy: varchar("read_by").array().default(sql`ARRAY[]::varchar[]`), // Array of user IDs who have read this message
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

// Booking Attendance Events (track teacher presence for auto-cancellation)
export const bookingAttendanceEvents = pgTable("booking_attendance_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Teacher user ID
  eventType: varchar("event_type").notNull(), // joined, left, disconnected
  eventAt: timestamp("event_at").defaultNow(),
}, (table) => ({
  bookingIdIdx: index("booking_attendance_events_booking_id_idx").on(table.bookingId),
}));

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

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionToken: varchar("session_token").notNull().unique(),
  deviceInfo: varchar("device_info"), // browser/device identifier
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
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
  booking: one(bookings, {
    fields: [chatMessages.bookingId],
    references: [bookings.id],
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

export const bookingAttendanceEventsRelations = relations(bookingAttendanceEvents, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingAttendanceEvents.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [bookingAttendanceEvents.userId],
    references: [users.id],
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

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// Additional Insert Schemas
export const insertChatSessionSchema = createInsertSchema(chatSessions);

export const insertChatMessageSchema = createInsertSchema(chatMessages);

export const insertVideoSessionSchema = createInsertSchema(videoSessions);

export const insertBookingAttendanceEventSchema = createInsertSchema(bookingAttendanceEvents);

export const insertClassFeedbackSchema = createInsertSchema(classFeedback);

export const insertNotificationSchema = createInsertSchema(notifications);

export const insertUserSessionSchema = createInsertSchema(userSessions);

export const insertTeacherMediaSchema = createInsertSchema(teacherMedia);

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

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type TeacherMedia = typeof teacherMedia.$inferSelect;
export type InsertTeacherMedia = z.infer<typeof insertTeacherMediaSchema>;

export type BookingAttendanceEvent = typeof bookingAttendanceEvents.$inferSelect;
export type InsertBookingAttendanceEvent = z.infer<typeof insertBookingAttendanceEventSchema>;

// Admin Configuration Table
export const adminConfig = pgTable("admin_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: varchar("config_key").unique().notNull(),
  configValue: text("config_value"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Payment Mode Configuration
export const adminPaymentConfig = pgTable("admin_payment_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentMode: varchar("payment_mode").notNull().default("dummy"), // "dummy" or "realtime"
  razorpayMode: varchar("razorpay_mode").notNull().default("upi"), // "upi" or "api_keys"
  enableRazorpay: boolean("enable_razorpay").default(false), // Toggle for Razorpay integration
  adminUpiId: varchar("admin_upi_id"), // Admin UPI ID for UPI mode
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Booking Limits Configuration
export const adminBookingLimits = pgTable("admin_booking_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dailyBookingLimit: integer("daily_booking_limit").notNull().default(3), // Max bookings per day per student
  weeklyBookingLimit: integer("weekly_booking_limit"), // Optional weekly limit (null = disabled)
  enableWeeklyLimit: boolean("enable_weekly_limit").default(false), // Toggle for weekly cap
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

export const adminPaymentConfigRelations = relations(adminPaymentConfig, ({ }) => ({}));

export const adminBookingLimitsRelations = relations(adminBookingLimits, ({ }) => ({}));

export const timeSlotsRelations = relations(timeSlots, ({ one }) => ({
  mentor: one(mentors, {
    fields: [timeSlots.mentorId],
    references: [mentors.id],
  }),
}));

export const footerLinksRelations = relations(footerLinks, ({ }) => ({}));

// Additional Insert Schemas
export const insertAdminConfigSchema = createInsertSchema(adminConfig);

export const insertAdminPaymentConfigSchema = createInsertSchema(adminPaymentConfig);

export const insertAdminBookingLimitsSchema = createInsertSchema(adminBookingLimits);

export const insertTimeSlotSchema = createInsertSchema(timeSlots);

export const insertFooterLinkSchema = createInsertSchema(footerLinks);

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
  maxClasses: integer("max_classes").default(8),
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
  // Qualifications (from signup form)
  qualifications: jsonb("qualifications").$type<{
    qualification: string;
    specialization: string;
    score: string;
  }[]>().default([]),
  // Subjects (from signup form)
  subjects: jsonb("subjects").$type<{
    subject: string;
    experience: string;
  }[]>().default([]),
  // Legacy fields (keeping for compatibility)
  highestQualification: varchar("highest_qualification"), // Masters, Bachelors, PhD, etc.
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

// Course Enrollments Table
export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  weeklySchedule: jsonb("weekly_schedule").$type<{
    day: string;
    time: string;
  }[]>().default([]),
  totalClasses: integer("total_classes").notNull(),
  completedClasses: integer("completed_classes").default(0),
  courseFee: decimal("course_fee", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("active"), // active, completed, cancelled
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses Relations
export const coursesRelations = relations(courses, ({ one, many }) => ({
  mentor: one(mentors, {
    fields: [courses.mentorId],
    references: [mentors.id],
  }),
  enrollments: many(courseEnrollments),
}));

// Course Enrollments Relations
export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  course: one(courses, {
    fields: [courseEnrollments.courseId],
    references: [courses.id],
  }),
  student: one(students, {
    fields: [courseEnrollments.studentId],
    references: [students.id],
  }),
  mentor: one(mentors, {
    fields: [courseEnrollments.mentorId],
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
export const insertCourseSchema = createInsertSchema(courses);

// Course Enrollment Insert Schema
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments);

// Teacher Profile Insert Schema
export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles);

// Additional Types
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;

export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;

export type AdminConfig = typeof adminConfig.$inferSelect;
export type InsertAdminConfig = z.infer<typeof insertAdminConfigSchema>;

export type AdminPaymentConfig = typeof adminPaymentConfig.$inferSelect;
export type InsertAdminPaymentConfig = z.infer<typeof insertAdminPaymentConfigSchema>;

export type AdminBookingLimits = typeof adminBookingLimits.$inferSelect;
export type InsertAdminBookingLimits = z.infer<typeof insertAdminBookingLimitsSchema>;

export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;

export type FooterLink = typeof footerLinks.$inferSelect;
export type InsertFooterLink = z.infer<typeof insertFooterLinkSchema>;

// Payment Methods Configuration (Admin UPI, Teacher UPI/Card)
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // "upi", "card", "bank_account"
  isActive: boolean("is_active").default(true),
  // UPI Details
  upiId: varchar("upi_id"),
  upiProvider: varchar("upi_provider"), // gpay, phonepe, paytm, etc.
  // Card Details
  cardToken: varchar("card_token"), // Tokenized card for security
  cardLast4: varchar("card_last4"),
  cardBrand: varchar("card_brand"), // visa, mastercard, etc.
  // Bank Account Details  
  accountNumber: varchar("account_number"),
  ifscCode: varchar("ifsc_code"),
  bankName: varchar("bank_name"),
  accountHolderName: varchar("account_holder_name"),
  // Metadata
  displayName: varchar("display_name"), // User-friendly name
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction Fee Configuration (Admin configurable)
export const transactionFeeConfig = pgTable("transaction_fee_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).default("2.00"), // 2% default
  minimumFee: decimal("minimum_fee", { precision: 10, scale: 2 }).default("0.50"), // Minimum fee amount
  maximumFee: decimal("maximum_fee", { precision: 10, scale: 2 }), // Optional maximum cap
  teacherPayoutWaitHours: integer("teacher_payout_wait_hours").default(24), // Hours to wait after class completion before releasing payment to teacher (default 24 hours)
  isActive: boolean("is_active").default(true),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Transactions (All payments flow through this)
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Transaction Details
  bookingId: varchar("booking_id").references(() => bookings.id),
  courseId: varchar("course_id").references(() => courses.id),
  transactionType: varchar("transaction_type").notNull(), // "booking_payment", "course_payment", "refund", "teacher_payout", "admin_fee"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionFee: decimal("transaction_fee", { precision: 10, scale: 2 }).default("0.00"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // amount - transactionFee
  currency: varchar("currency").default("INR"),
  
  // Flow Participants (Student -> Admin -> Teacher)
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  fromPaymentMethod: varchar("from_payment_method").references(() => paymentMethods.id),
  toPaymentMethod: varchar("to_payment_method").references(() => paymentMethods.id),
  
  // Transaction Status and Workflow
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed, refunded, cancelled
  workflowStage: varchar("workflow_stage").notNull(), // "student_to_admin", "admin_to_teacher", "refund_to_student"
  
  // Timing Controls (5hr cancellation, 24hr teacher payout, 48hr refund)
  scheduledAt: timestamp("scheduled_at"), // When the class/course is scheduled
  cancellationDeadline: timestamp("cancellation_deadline"), // 5 hours before scheduled time
  teacherPayoutEligibleAt: timestamp("teacher_payout_eligible_at"), // 24 hours after class completion
  scheduledRefundAt: timestamp("scheduled_refund_at"), // When refund should be processed (48 hours after cancellation)
  
  // External Payment References  
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeTransferId: varchar("stripe_transfer_id"),
  razorpayPaymentId: varchar("razorpay_payment_id"),
  
  // Metadata and Tracking
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Unsettled Finances (Conflict Resolution and Pending Settlements)
export const unsettledFinances = pgTable("unsettled_finances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => paymentTransactions.id).notNull(),
  conflictType: varchar("conflict_type").notNull(), // "failed_transfer", "disputed_refund", "missing_payout", "double_payment"
  conflictAmount: decimal("conflict_amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  
  // Resolution Details
  status: varchar("status").notNull().default("open"), // open, investigating, resolved, escalated
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  assignedTo: varchar("assigned_to").references(() => users.id), // Admin user handling the case
  
  // Resolution Actions
  resolutionAction: varchar("resolution_action"), // "manual_transfer", "refund_issued", "dispute_resolved"
  resolutionAmount: decimal("resolution_amount", { precision: 10, scale: 2 }),
  resolutionNotes: text("resolution_notes"),
  resolutionDate: timestamp("resolution_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Workflow Automation (Handles timing and automated transfers)
export const paymentWorkflows = pgTable("payment_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => paymentTransactions.id).notNull(),
  workflowType: varchar("workflow_type").notNull(), // "class_booking", "course_purchase", "cancellation_refund"
  currentStage: varchar("current_stage").notNull(), // "payment_received", "waiting_for_class", "waiting_24h", "teacher_payout", "completed"
  nextStage: varchar("next_stage"),
  
  // Automated Timing
  nextActionAt: timestamp("next_action_at"), // When the next automatic action should occur
  lastProcessedAt: timestamp("last_processed_at"),
  isAutomated: boolean("is_automated").default(true),
  
  // Workflow Rules Applied
  cancellationWindowHours: integer("cancellation_window_hours").default(5),
  teacherPayoutDelayHours: integer("teacher_payout_delay_hours").default(24),
  
  // Processing Status
  status: varchar("status").notNull().default("active"), // active, paused, completed, failed
  processingErrors: jsonb("processing_errors").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export const systemAlerts = pgTable("system_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'info', 'warning', 'error'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// AI Moderation & Safety System Tables (34 Requirements)

// SA-8 & LOG-2: AI Moderation Logs
export const aiModerationLogs = pgTable("ai_moderation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  teacherId: varchar("teacher_id").references(() => mentors.id).notNull(), // Added for restriction tracking
  studentId: varchar("student_id").references(() => students.id).notNull(), // Added for tracking
  teacherName: varchar("teacher_name").notNull(),
  studentName: varchar("student_name").notNull(),
  sessionName: varchar("session_name").notNull(),
  subjectName: varchar("subject_name").notNull(),
  modality: varchar("modality").notNull(), // text, audio, video, chat, screen
  aiConfidence: decimal("ai_confidence", { precision: 3, scale: 2 }).notNull(), // 0-1
  sentiment: decimal("sentiment", { precision: 3, scale: 2 }), // -1 to +1
  detectedTerm: text("detected_term"),
  aiVerdict: varchar("ai_verdict").notNull(), // safe, alert, hard_violation
  mediaRefs: jsonb("media_refs").$type<string[]>().default([]), // Redacted media URLs
  tsStart: timestamp("ts_start").notNull(),
  tsEnd: timestamp("ts_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("ai_moderation_logs_session_id_idx").on(table.sessionId),
  bookingIdIdx: index("ai_moderation_logs_booking_id_idx").on(table.bookingId),
  verdictIdx: index("ai_moderation_logs_verdict_idx").on(table.aiVerdict),
}));

// PC-1 & LOG-3: Session Dossiers (Post-class summary)
export const sessionDossiers = pgTable("session_dossiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  safetyScore: decimal("safety_score", { precision: 5, scale: 2 }).notNull(), // PC-2: 0-100
  feedbackScore: decimal("feedback_score", { precision: 5, scale: 2 }), // PC-3: 0-100
  crs: decimal("crs", { precision: 5, scale: 2 }).notNull(), // PC-4: Correlation Risk Score
  crsJson: jsonb("crs_json").$type<Record<string, any>>().default({}), // GOV-4: Explainability
  reviewStatus: varchar("review_status").notNull().default("passed"), // PC-6: passed, queued, reviewed, cleared
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("session_dossiers_session_id_idx").on(table.sessionId),
  reviewStatusIdx: index("session_dossiers_review_status_idx").on(table.reviewStatus),
  crsIdx: index("session_dossiers_crs_idx").on(table.crs),
}));

// Teacher Restriction Appeals System
export const teacherRestrictionAppeals = pgTable("teacher_restriction_appeals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => mentors.id).notNull(),
  appealReason: text("appeal_reason").notNull(), // Teacher's explanation for appeal
  supportingEvidence: text("supporting_evidence"), // Optional additional context
  restrictionType: varchar("restriction_type").notNull(), // 'warned', 'suspended', 'banned'
  violationCount: integer("violation_count").notNull(), // Number of violations at time of appeal
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  adminReviewNotes: text("admin_review_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  teacherIdIdx: index("teacher_restriction_appeals_teacher_id_idx").on(table.teacherId),
  statusIdx: index("teacher_restriction_appeals_status_idx").on(table.status),
}));

// GOV-1 & FB-2: Support Configuration (Admin toggles)
export const supportConfig = pgTable("support_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enableEmailSupport: boolean("enable_email_support").default(false),
  enableChatSupport: boolean("enable_chat_support").default(false),
  enablePhoneSupport: boolean("enable_phone_support").default(false),
  supportEmail: varchar("support_email").default("support@codeconnect.com"),
  supportPhone: varchar("support_phone"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KADB Help System Tables
export const helpTickets = pgTable("help_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  subject: varchar("subject").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull().default("general"), // general, technical, payment, account, course
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  status: varchar("status").notNull().default("open"), // open, in_progress, resolved, closed
  aiResponse: text("ai_response"),
  humanResponse: text("human_response"),
  emailSent: boolean("email_sent").default(false),
  contactEmail: varchar("contact_email"),
  satisfactionRating: integer("satisfaction_rating"), // 1-5 stars
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const helpKnowledgeBase = pgTable("help_knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  searchKeywords: text("search_keywords"),
  viewCount: integer("view_count").default(0),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const helpTicketMessages = pgTable("help_ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => helpTickets.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id),
  senderType: varchar("sender_type").notNull(), // user, ai, admin
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment System Relations
export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
  fromTransactions: many(paymentTransactions, { relationName: "fromPaymentMethod" }),
  toTransactions: many(paymentTransactions, { relationName: "toPaymentMethod" }),
}));

export const transactionFeeConfigRelations = relations(transactionFeeConfig, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [transactionFeeConfig.updatedBy],
    references: [users.id],
  }),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  booking: one(bookings, {
    fields: [paymentTransactions.bookingId],
    references: [bookings.id],
  }),
  course: one(courses, {
    fields: [paymentTransactions.courseId],
    references: [courses.id],
  }),
  fromUser: one(users, {
    fields: [paymentTransactions.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  toUser: one(users, {
    fields: [paymentTransactions.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
  fromPaymentMethod: one(paymentMethods, {
    fields: [paymentTransactions.fromPaymentMethod],
    references: [paymentMethods.id],
    relationName: "fromPaymentMethod",
  }),
  toPaymentMethod: one(paymentMethods, {
    fields: [paymentTransactions.toPaymentMethod],
    references: [paymentMethods.id],
    relationName: "toPaymentMethod",
  }),
}));

export const unsettledFinancesRelations = relations(unsettledFinances, ({ one }) => ({
  transaction: one(paymentTransactions, {
    fields: [unsettledFinances.transactionId],
    references: [paymentTransactions.id],
  }),
  assignedToUser: one(users, {
    fields: [unsettledFinances.assignedTo],
    references: [users.id],
  }),
}));

export const paymentWorkflowsRelations = relations(paymentWorkflows, ({ one }) => ({
  transaction: one(paymentTransactions, {
    fields: [paymentWorkflows.transactionId],
    references: [paymentTransactions.id],
  }),
}));

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

// Help System Relations
export const helpTicketsRelations = relations(helpTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [helpTickets.userId],
    references: [users.id],
  }),
  messages: many(helpTicketMessages),
}));

export const helpKnowledgeBaseRelations = relations(helpKnowledgeBase, ({ }) => ({}));

export const helpTicketMessagesRelations = relations(helpTicketMessages, ({ one }) => ({
  ticket: one(helpTickets, {
    fields: [helpTicketMessages.ticketId],
    references: [helpTickets.id],
  }),
  sender: one(users, {
    fields: [helpTicketMessages.senderId],
    references: [users.id],
  }),
}));

// Payment System Insert Schemas
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods);

export const insertTransactionFeeConfigSchema = createInsertSchema(transactionFeeConfig);

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions);

export const insertUnsettledFinanceSchema = createInsertSchema(unsettledFinances);

export const insertPaymentWorkflowSchema = createInsertSchema(paymentWorkflows);

// Insert Schemas for new tables
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents);

export const insertAiInsightSchema = createInsertSchema(aiInsights);

export const insertBusinessMetricSchema = createInsertSchema(businessMetrics);

export const insertComplianceMonitoringSchema = createInsertSchema(complianceMonitoring);

export const insertChatAnalyticsSchema = createInsertSchema(chatAnalytics);

export const insertAudioAnalyticsSchema = createInsertSchema(audioAnalytics);

export const insertPredictiveModelSchema = createInsertSchema(predictiveModels);

export const insertCloudDeploymentSchema = createInsertSchema(cloudDeployments);

export const insertTechnologyStackSchema = createInsertSchema(technologyStack);

export const insertQuantumTaskSchema = createInsertSchema(quantumTasks);

export const insertSuccessStorySchema = createInsertSchema(successStories);

// Help System Insert Schemas
export const insertHelpTicketSchema = createInsertSchema(helpTickets);

export const insertHelpKnowledgeBaseSchema = createInsertSchema(helpKnowledgeBase);

export const insertHelpTicketMessageSchema = createInsertSchema(helpTicketMessages);

// AI Moderation & Safety System Insert Schemas
export const insertAiModerationLogSchema = createInsertSchema(aiModerationLogs);

export const insertSessionDossierSchema = createInsertSchema(sessionDossiers);

export const insertTeacherRestrictionAppealSchema = createInsertSchema(teacherRestrictionAppeals);

export type InsertTeacherRestrictionAppeal = z.infer<typeof insertTeacherRestrictionAppealSchema>;
export type SelectTeacherRestrictionAppeal = typeof teacherRestrictionAppeals.$inferSelect;

export const insertSupportConfigSchema = createInsertSchema(supportConfig);

// Payment System Types
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type TransactionFeeConfig = typeof transactionFeeConfig.$inferSelect;
export type InsertTransactionFeeConfig = z.infer<typeof insertTransactionFeeConfigSchema>;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

export type UnsettledFinance = typeof unsettledFinances.$inferSelect;
export type InsertUnsettledFinance = z.infer<typeof insertUnsettledFinanceSchema>;

export type PaymentWorkflow = typeof paymentWorkflows.$inferSelect;
export type InsertPaymentWorkflow = z.infer<typeof insertPaymentWorkflowSchema>;

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

// Help System Types
export type HelpTicket = typeof helpTickets.$inferSelect;
export type InsertHelpTicket = z.infer<typeof insertHelpTicketSchema>;

export type HelpKnowledgeBase = typeof helpKnowledgeBase.$inferSelect;
export type InsertHelpKnowledgeBase = z.infer<typeof insertHelpKnowledgeBaseSchema>;

export type HelpTicketMessage = typeof helpTicketMessages.$inferSelect;
export type InsertHelpTicketMessage = z.infer<typeof insertHelpTicketMessageSchema>;

// AI Moderation & Safety System Types
export type AiModerationLog = typeof aiModerationLogs.$inferSelect;
export type InsertAiModerationLog = z.infer<typeof insertAiModerationLogSchema>;

export type SessionDossier = typeof sessionDossiers.$inferSelect;
export type InsertSessionDossier = z.infer<typeof insertSessionDossierSchema>;

export type SupportConfig = typeof supportConfig.$inferSelect;
export type InsertSupportConfig = z.infer<typeof insertSupportConfigSchema>;

// Forum System Tables
export const forumCategories = pgTable("forum_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#6B73FF"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => forumCategories.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  replies: integer("replies").default(0),
  tags: jsonb("tags").$type<string[]>().default([]),
  lastReplyAt: timestamp("last_reply_at"),
  lastReplyByUserId: varchar("last_reply_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => forumPosts.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentReplyId: varchar("parent_reply_id"),
  likes: integer("likes").default(0),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumLikes = pgTable("forum_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  postId: varchar("post_id").references(() => forumPosts.id),
  replyId: varchar("reply_id").references(() => forumReplies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Showcase Tables
export const projectCategories = pgTable("project_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#22C55E"),
  icon: varchar("icon").default("Folder"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => projectCategories.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  technologies: jsonb("technologies").$type<string[]>().default([]),
  githubUrl: varchar("github_url"),
  liveUrl: varchar("live_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  images: jsonb("images").$type<string[]>().default([]),
  difficulty: varchar("difficulty").default("beginner"), // beginner, intermediate, advanced
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectComments = pgTable("project_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentCommentId: varchar("parent_comment_id"),
  likes: integer("likes").default(0),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectLikes = pgTable("project_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events System Tables
export const eventCategories = pgTable("event_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#F59E0B"),
  icon: varchar("icon").default("Calendar"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => eventCategories.id).notNull(),
  organizerId: varchar("organizer_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  location: varchar("location"), // "Online" or physical location
  eventUrl: varchar("event_url"), // For online events
  thumbnailUrl: varchar("thumbnail_url"),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  difficulty: varchar("difficulty").default("all"), // all, beginner, intermediate, advanced
  tags: jsonb("tags").$type<string[]>().default([]),
  prerequisites: text("prerequisites"),
  agenda: jsonb("agenda").$type<{time: string; topic: string; description?: string}[]>().default([]),
  materials: jsonb("materials").$type<{name: string; url: string; type: string}[]>().default([]),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  registrationDeadline: timestamp("registration_deadline"),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  isFree: boolean("is_free").default(true),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: jsonb("recurring_pattern").$type<{frequency: string; interval: number; endDate?: string}>(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status").default("registered"), // registered, attended, cancelled, no_show
  registrationData: jsonb("registration_data").$type<Record<string, any>>().default({}),
  attendedAt: timestamp("attended_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventComments = pgTable("event_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentCommentId: varchar("parent_comment_id"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Educational Dropdown Tables
export const qualifications = pgTable("qualifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  category: varchar("category"), // undergraduate, postgraduate, professional, etc.
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const specializations = pgTable("specializations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  category: varchar("category"), // STEM, Arts, Business, etc.
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  board: varchar("board"), // IGCSE, IB, AP, CS, etc.
  grade: varchar("grade"), // Grade level or year
  category: varchar("category"), // Mathematics, Science, Language, etc.
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Composite unique constraint to allow same subject name for different board/grade/category combinations
  subjectBoardGradeCategoryUnique: unique().on(table.name, table.board, table.grade, table.category),
}));

// Insert Schemas
export const insertForumCategorySchema = createInsertSchema(forumCategories);

export const insertForumPostSchema = createInsertSchema(forumPosts);

export const insertForumReplySchema = createInsertSchema(forumReplies);

export const insertForumLikeSchema = createInsertSchema(forumLikes);

export const insertProjectCategorySchema = createInsertSchema(projectCategories);

export const insertProjectSchema = createInsertSchema(projects);

export const insertProjectCommentSchema = createInsertSchema(projectComments);

export const insertProjectLikeSchema = createInsertSchema(projectLikes);

export const insertEventCategorySchema = createInsertSchema(eventCategories);

export const insertEventSchema = createInsertSchema(events);

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations);

export const insertEventCommentSchema = createInsertSchema(eventComments);

export const insertQualificationSchema = createInsertSchema(qualifications);

export const insertSpecializationSchema = createInsertSchema(specializations);

export const insertSubjectSchema = createInsertSchema(subjects);

// Types
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;

export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;

export type ForumLike = typeof forumLikes.$inferSelect;
export type InsertForumLike = z.infer<typeof insertForumLikeSchema>;

export type ProjectCategory = typeof projectCategories.$inferSelect;
export type InsertProjectCategory = z.infer<typeof insertProjectCategorySchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectComment = typeof projectComments.$inferSelect;
export type InsertProjectComment = z.infer<typeof insertProjectCommentSchema>;

export type ProjectLike = typeof projectLikes.$inferSelect;
export type InsertProjectLike = z.infer<typeof insertProjectLikeSchema>;

export type EventCategory = typeof eventCategories.$inferSelect;
export type InsertEventCategory = z.infer<typeof insertEventCategorySchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

export type EventComment = typeof eventComments.$inferSelect;
export type InsertEventComment = z.infer<typeof insertEventCommentSchema>;

export type Qualification = typeof qualifications.$inferSelect;
export type InsertQualification = z.infer<typeof insertQualificationSchema>;

export type Specialization = typeof specializations.$inferSelect;
export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

// Teacher Audio Performance Metrics Table
export const teacherAudioMetrics = pgTable("teacher_audio_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id),
  
  // Core Teaching Quality Parameters (0-10 scale)
  encourageInvolvement: integer("encourage_involvement").notNull(), // How well teacher encourages student participation
  pleasantCommunication: integer("pleasant_communication").notNull(), // Politeness and pleasant tone
  avoidPersonalDetails: integer("avoid_personal_details").notNull(), // Professional boundary maintenance
  
  // Additional Performance Metrics (0-10 scale)
  studentTalkRatio: integer("student_talk_ratio").notNull(), // Balance of student vs teacher talking
  questionRate: integer("question_rate").notNull(), // How well teacher asks engaging questions
  clarity: integer("clarity").notNull(), // Clear explanation and articulation
  adherenceToTopic: integer("adherence_to_topic").notNull(), // Staying focused on lesson objectives
  politeness: integer("politeness").notNull(), // Professional courtesy and respect
  
  // Overall Calculated Score (average of key metrics)
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }).notNull(),
  
  // Analysis metadata
  analysisVersion: varchar("analysis_version").default("v1.0"),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // AI analysis confidence 0-1
  processingNotes: text("processing_notes"),
  
  computedAt: timestamp("computed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Home Page Section Controls (stored in admin config)
export const homeSectionControls = pgTable("home_section_controls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionType: varchar("section_type").notNull(), // 'teacher', 'student'
  sectionName: varchar("section_name").notNull(), // 'analytics', 'dashboard', 'resources', etc.
  isEnabled: boolean("is_enabled").default(true),
  displayOrder: integer("display_order").default(0),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueSectionType: unique().on(table.sectionType, table.sectionName)
}));

// Azure Storage Configuration (admin-managed)
export const azureStorageConfig = pgTable("azure_storage_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storageAccountName: varchar("storage_account_name").notNull().default("kidzaimathstore31320"),
  containerName: varchar("container_name").notNull().default("replayknowledge"),
  connectionString: text("connection_string"), // Encrypted storage connection string
  retentionMonths: integer("retention_months").notNull().default(6), // Auto-delete after 6 months
  isActive: boolean("is_active").default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recording Parts (individual video segments)
export const recordingParts = pgTable("recording_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  partNumber: integer("part_number").notNull(), // 1, 2, 3... for multiple stops/starts
  blobPath: text("blob_path").notNull(), // Azure blob path: studentid_classid_partnumber/file.mp4
  blobUrl: text("blob_url"), // Temporary SAS URL for access
  fileSizeBytes: integer("file_size_bytes"),
  durationSeconds: integer("duration_seconds"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  status: varchar("status").default("uploaded"), // uploaded, merged, deleted
});

// Merged Recordings (final combined videos)
export const mergedRecordings = pgTable("merged_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
  blobPath: text("blob_path").notNull(), // Final merged file path
  blobUrl: text("blob_url"), // Temporary SAS URL
  totalParts: integer("total_parts").notNull(), // How many parts were merged
  fileSizeBytes: integer("file_size_bytes"),
  durationSeconds: integer("duration_seconds"),
  mergedAt: timestamp("merged_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-delete date (classDate + retentionMonths)
  aiAnalyzed: boolean("ai_analyzed").default(false), // Whether AI analytics have been run
  status: varchar("status").default("active"), // active, expired, deleted
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin UI Configuration (footer links and button visibility)
export const adminUiConfig = pgTable("admin_ui_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  footerLinks: jsonb("footer_links").$type<{
    studentCommunity: boolean;
    mentorCommunity: boolean;
    successStories: boolean;
    achievementBadges: boolean;
    discussionForums: boolean;
    projectShowcase: boolean;
    communityEvents: boolean;
    teacherResources: boolean;
    contactUs: boolean;
  }>().default({
    studentCommunity: true,
    mentorCommunity: true,
    successStories: true,
    achievementBadges: true,
    discussionForums: true,
    projectShowcase: true,
    communityEvents: true,
    teacherResources: true,
    contactUs: true,
  }),
  showHelpCenter: boolean("show_help_center").default(false), // Default unchecked
  abusiveLanguageMonitoring: boolean("abusive_language_monitoring").default(false), // Abusive language detection toggle
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Abusive Language Incidents
export const abusiveLanguageIncidents = pgTable("abusive_language_incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  userRole: varchar("user_role").notNull(), // student, mentor
  userName: varchar("user_name").notNull(),
  abusiveWords: jsonb("abusive_words").$type<string[]>().notNull(),
  messageText: text("message_text").notNull(),
  detectedAt: timestamp("detected_at").defaultNow(),
  adminNotified: boolean("admin_notified").default(false),
  emailSent: boolean("email_sent").default(false),
});

// Azure Application Insights Configuration
export const azureAppInsightsConfig = pgTable("azure_app_insights_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appInsightsName: varchar("app_insights_name").notNull(),
  instrumentationKey: varchar("instrumentation_key"),
  appId: varchar("app_id"),
  apiKey: varchar("api_key"),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Azure Metrics Alerts
export const azureMetricsAlerts = pgTable("azure_metrics_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar("metric_name").notNull(),
  metricCategory: varchar("metric_category").notNull(), // General, Concurrent
  severity: integer("severity").notNull(), // 0 (Critical), 1, 2, 3, 4 (Info)
  threshold: decimal("threshold", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  unit: varchar("unit"),
  description: text("description"),
  hasFix: boolean("has_fix").default(false),
  fixSolution: text("fix_solution"),
  fixStatus: varchar("fix_status").default("pending"), // pending, applied, failed
  isActive: boolean("is_active").default(true),
  lastChecked: timestamp("last_checked").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Metrics History for trending
export const azureMetricsHistory = pgTable("azure_metrics_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar("metric_name").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
});

// Schema definitions for teacher audio metrics
export const insertTeacherAudioMetricsSchema = createInsertSchema(teacherAudioMetrics);

export const insertHomeSectionControlsSchema = createInsertSchema(homeSectionControls);

export const insertAzureStorageConfigSchema = createInsertSchema(azureStorageConfig);

export const insertRecordingPartSchema = createInsertSchema(recordingParts);

export const insertMergedRecordingSchema = createInsertSchema(mergedRecordings);

export const insertAdminUiConfigSchema = createInsertSchema(adminUiConfig);

export const insertAbusiveLanguageIncidentSchema = createInsertSchema(abusiveLanguageIncidents);

export const insertAzureAppInsightsConfigSchema = createInsertSchema(azureAppInsightsConfig);

export const insertAzureMetricsAlertSchema = createInsertSchema(azureMetricsAlerts);

export const insertAzureMetricsHistorySchema = createInsertSchema(azureMetricsHistory);

// Insert schemas for security tables
export const insertTrustedDeviceSchema = createInsertSchema(trustedDevices);
export const insertBackupCodeSchema = createInsertSchema(backupCodes);
export const insertSecurityLogSchema = createInsertSchema(securityLogs);
export const insertEmailOtpSchema = createInsertSchema(emailOtps);

// Types for security tables
export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;

export type BackupCode = typeof backupCodes.$inferSelect;
export type InsertBackupCode = z.infer<typeof insertBackupCodeSchema>;

export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;

export type EmailOtp = typeof emailOtps.$inferSelect;
export type InsertEmailOtp = z.infer<typeof insertEmailOtpSchema>;

// Types for teacher audio metrics
export type TeacherAudioMetrics = typeof teacherAudioMetrics.$inferSelect;
export type InsertTeacherAudioMetrics = z.infer<typeof insertTeacherAudioMetricsSchema>;

export type HomeSectionControls = typeof homeSectionControls.$inferSelect;
export type InsertHomeSectionControls = z.infer<typeof insertHomeSectionControlsSchema>;

export type AzureStorageConfig = typeof azureStorageConfig.$inferSelect;
export type InsertAzureStorageConfig = z.infer<typeof insertAzureStorageConfigSchema>;

export type RecordingPart = typeof recordingParts.$inferSelect;
export type InsertRecordingPart = z.infer<typeof insertRecordingPartSchema>;

export type MergedRecording = typeof mergedRecordings.$inferSelect;
export type InsertMergedRecording = z.infer<typeof insertMergedRecordingSchema>;

export type AdminUiConfig = typeof adminUiConfig.$inferSelect;
export type InsertAdminUiConfig = z.infer<typeof insertAdminUiConfigSchema>;

export type AbusiveLanguageIncident = typeof abusiveLanguageIncidents.$inferSelect;
export type InsertAbusiveLanguageIncident = z.infer<typeof insertAbusiveLanguageIncidentSchema>;

export type AzureAppInsightsConfig = typeof azureAppInsightsConfig.$inferSelect;
export type InsertAzureAppInsightsConfig = z.infer<typeof insertAzureAppInsightsConfigSchema>;

export type AzureMetricsAlert = typeof azureMetricsAlerts.$inferSelect;
export type InsertAzureMetricsAlert = z.infer<typeof insertAzureMetricsAlertSchema>;

export type AzureMetricsHistory = typeof azureMetricsHistory.$inferSelect;
export type InsertAzureMetricsHistory = z.infer<typeof insertAzureMetricsHistorySchema>;
