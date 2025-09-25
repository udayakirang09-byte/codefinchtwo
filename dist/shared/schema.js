import { sql, relations } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, integer, decimal, boolean, jsonb, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    email: varchar("email").unique().notNull(),
    password: varchar("password").notNull().default("Hello111"),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    role: varchar("role").notNull().default("student"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const mentors = pgTable("mentors", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id).notNull(),
    title: varchar("title").notNull(),
    description: text("description").notNull(),
    specialties: jsonb("specialties").$type().default([]),
    experience: integer("experience").notNull(),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
    totalStudents: integer("total_students").default(0),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    isActive: boolean("is_active").default(true),
    availableSlots: jsonb("available_slots").$type().default([]),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const students = pgTable("students", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id).notNull(),
    age: integer("age"),
    interests: jsonb("interests").$type().default([]),
    skillLevel: varchar("skill_level").default("beginner"),
    parentEmail: varchar("parent_email"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const bookings = pgTable("bookings", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    studentId: varchar("student_id").references(() => students.id).notNull(),
    mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
    scheduledAt: timestamp("scheduled_at").notNull(),
    duration: integer("duration").notNull(),
    status: varchar("status").notNull().default("scheduled"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const achievements = pgTable("achievements", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    studentId: varchar("student_id").references(() => students.id).notNull(),
    title: varchar("title").notNull(),
    description: text("description").notNull(),
    badgeIcon: varchar("badge_icon").notNull(),
    earnedAt: timestamp("earned_at").defaultNow(),
});
export const reviews = pgTable("reviews", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
    studentId: varchar("student_id").references(() => students.id).notNull(),
    mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const teacherQualifications = pgTable("teacher_qualifications", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
    qualification: varchar("qualification").notNull(),
    specialization: varchar("specialization").notNull(),
    score: varchar("score").notNull(),
    priority: integer("priority").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow(),
});
export const teacherSubjects = pgTable("teacher_subjects", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
    subject: varchar("subject").notNull(),
    experience: varchar("experience").notNull(),
    priority: integer("priority").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow(),
});
export const successStories = pgTable("success_stories", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
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
export const chatSessions = pgTable("chat_sessions", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
    isActive: boolean("is_active").default(true),
    startedAt: timestamp("started_at").defaultNow(),
    endedAt: timestamp("ended_at"),
});
export const chatMessages = pgTable("chat_messages", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    chatSessionId: varchar("chat_session_id").references(() => chatSessions.id).notNull(),
    senderId: varchar("sender_id").references(() => users.id).notNull(),
    message: text("message").notNull(),
    sentAt: timestamp("sent_at").defaultNow(),
});
export const videoSessions = pgTable("video_sessions", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
    roomId: varchar("room_id").notNull(),
    status: varchar("status").notNull().default("waiting"),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    recordingUrl: varchar("recording_url"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const classFeedback = pgTable("class_feedback", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
    studentId: varchar("student_id").references(() => students.id).notNull(),
    mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
    rating: integer("rating").notNull(),
    feedback: text("feedback"),
    whatWorked: text("what_worked"),
    improvements: text("improvements"),
    wouldRecommend: boolean("would_recommend").default(true),
    isVisible: boolean("is_visible").default(true),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const notifications = pgTable("notifications", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id).notNull(),
    title: varchar("title").notNull(),
    message: text("message").notNull(),
    type: varchar("type").notNull(),
    isRead: boolean("is_read").default(false),
    relatedId: varchar("related_id"),
    createdAt: timestamp("created_at").defaultNow(),
});
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
export const adminConfig = pgTable("admin_config", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    configKey: varchar("config_key").unique().notNull(),
    configValue: text("config_value"),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const timeSlots = pgTable("time_slots", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
    dayOfWeek: varchar("day_of_week").notNull(),
    startTime: varchar("start_time").notNull(),
    endTime: varchar("end_time").notNull(),
    isAvailable: boolean("is_available").default(true),
    isRecurring: boolean("is_recurring").default(true),
    isBlocked: boolean("is_blocked").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const footerLinks = pgTable("footer_links", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    section: varchar("section").notNull(),
    title: varchar("title").notNull(),
    url: varchar("url").notNull(),
    isExternal: boolean("is_external").default(false),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const adminConfigRelations = relations(adminConfig, ({}) => ({}));
export const timeSlotsRelations = relations(timeSlots, ({ one }) => ({
    mentor: one(mentors, {
        fields: [timeSlots.mentorId],
        references: [mentors.id],
    }),
}));
export const footerLinksRelations = relations(footerLinks, ({}) => ({}));
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
export const courses = pgTable("courses", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    mentorId: varchar("mentor_id").references(() => mentors.id).notNull(),
    title: varchar("title").notNull(),
    description: text("description").notNull(),
    category: varchar("category").notNull(),
    difficulty: varchar("difficulty").notNull(),
    duration: varchar("duration"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    maxStudents: integer("max_students").default(10),
    prerequisites: text("prerequisites"),
    tags: jsonb("tags").$type().default([]),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const teacherProfiles = pgTable("teacher_profiles", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id).notNull(),
    qualifications: jsonb("qualifications").$type().default([]),
    subjects: jsonb("subjects").$type().default([]),
    highestQualification: varchar("highest_qualification"),
    qualificationScore: varchar("qualification_score"),
    instituteName: varchar("institute_name"),
    graduationYear: integer("graduation_year"),
    programmingLanguages: jsonb("programming_languages").$type().default([]),
    achievements: jsonb("achievements").$type().default([]),
    totalTeachingExperience: integer("total_teaching_experience").default(0),
    isProfileComplete: boolean("is_profile_complete").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const coursesRelations = relations(courses, ({ one }) => ({
    mentor: one(mentors, {
        fields: [courses.mentorId],
        references: [mentors.id],
    }),
}));
export const teacherProfilesRelations = relations(teacherProfiles, ({ one }) => ({
    user: one(users, {
        fields: [teacherProfiles.userId],
        references: [users.id],
    }),
}));
export const insertCourseSchema = createInsertSchema(courses).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const analyticsEvents = pgTable("analytics_events", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id),
    sessionId: varchar("session_id"),
    eventType: varchar("event_type").notNull(),
    eventName: varchar("event_name").notNull(),
    properties: jsonb("properties").$type().default({}),
    url: varchar("url"),
    userAgent: varchar("user_agent"),
    ipAddress: varchar("ip_address"),
    timestamp: timestamp("timestamp").defaultNow(),
});
export const systemAlerts = pgTable("system_alerts", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    type: varchar("type").notNull(),
    title: varchar("title").notNull(),
    message: text("message").notNull(),
    resolved: boolean("resolved").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const aiInsights = pgTable("ai_insights", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    insightType: varchar("insight_type").notNull(),
    category: varchar("category").notNull(),
    title: varchar("title").notNull(),
    description: text("description").notNull(),
    data: jsonb("data").$type().default({}),
    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
    priority: varchar("priority").notNull().default("medium"),
    status: varchar("status").notNull().default("active"),
    actionRequired: boolean("action_required").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const businessMetrics = pgTable("business_metrics", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    metricName: varchar("metric_name").notNull(),
    metricValue: decimal("metric_value", { precision: 15, scale: 2 }).notNull(),
    metricType: varchar("metric_type").notNull(),
    period: varchar("period").notNull(),
    date: timestamp("date").notNull(),
    metadata: jsonb("metadata").$type().default({}),
    calculatedAt: timestamp("calculated_at").defaultNow(),
});
export const complianceMonitoring = pgTable("compliance_monitoring", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    complianceType: varchar("compliance_type").notNull(),
    ruleId: varchar("rule_id").notNull(),
    ruleName: varchar("rule_name").notNull(),
    description: text("description").notNull(),
    severity: varchar("severity").notNull(),
    status: varchar("status").notNull(),
    relatedEntity: varchar("related_entity"),
    details: jsonb("details").$type().default({}),
    detectedAt: timestamp("detected_at").defaultNow(),
    resolvedAt: timestamp("resolved_at"),
});
export const chatAnalytics = pgTable("chat_analytics", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    chatSessionId: varchar("chat_session_id").references(() => chatSessions.id).notNull(),
    messageCount: integer("message_count").default(0),
    avgResponseTime: decimal("avg_response_time", { precision: 10, scale: 2 }),
    sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
    topicsTags: jsonb("topics_tags").$type().default([]),
    languageUsed: varchar("language_used").default("english"),
    qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
    engagementScore: decimal("engagement_score", { precision: 3, scale: 2 }),
    aiAnalysis: jsonb("ai_analysis").$type().default({}),
    createdAt: timestamp("created_at").defaultNow(),
});
export const audioAnalytics = pgTable("audio_analytics", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    videoSessionId: varchar("video_session_id").references(() => videoSessions.id).notNull(),
    duration: integer("duration"),
    speakingTimeRatio: decimal("speaking_time_ratio", { precision: 3, scale: 2 }),
    audioQuality: decimal("audio_quality", { precision: 3, scale: 2 }),
    backgroundNoise: decimal("background_noise", { precision: 3, scale: 2 }),
    emotionalTone: jsonb("emotional_tone").$type().default({}),
    keyTopics: jsonb("key_topics").$type().default([]),
    teachingEffectiveness: decimal("teaching_effectiveness", { precision: 3, scale: 2 }),
    aiTranscription: text("ai_transcription"),
    aiSummary: text("ai_summary"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const predictiveModels = pgTable("predictive_models", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    modelName: varchar("model_name").notNull(),
    modelType: varchar("model_type").notNull(),
    version: varchar("version").notNull(),
    accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
    trainingData: jsonb("training_data").$type().default({}),
    features: jsonb("features").$type().default([]),
    predictions: jsonb("predictions").$type().default({}),
    isActive: boolean("is_active").default(true),
    lastTrained: timestamp("last_trained").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
});
export const cloudDeployments = pgTable("cloud_deployments", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    provider: varchar("provider").notNull(),
    region: varchar("region").notNull(),
    environment: varchar("environment").notNull(),
    serviceName: varchar("service_name").notNull(),
    deploymentStatus: varchar("deployment_status").notNull(),
    resourceConfig: jsonb("resource_config").$type().default({}),
    healthStatus: varchar("health_status").default("unknown"),
    costEstimate: decimal("cost_estimate", { precision: 10, scale: 2 }),
    actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
    deployedAt: timestamp("deployed_at"),
    lastHealthCheck: timestamp("last_health_check"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const technologyStack = pgTable("technology_stack", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    component: varchar("component").notNull(),
    technology: varchar("technology").notNull(),
    currentVersion: varchar("current_version").notNull(),
    latestVersion: varchar("latest_version"),
    status: varchar("status").notNull().default("current"),
    securityScore: decimal("security_score", { precision: 3, scale: 2 }),
    performanceScore: decimal("performance_score", { precision: 3, scale: 2 }),
    upgradeRecommendation: text("upgrade_recommendation"),
    upgradePriority: varchar("upgrade_priority").default("medium"),
    lastChecked: timestamp("last_checked").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const quantumTasks = pgTable("quantum_tasks", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    taskType: varchar("task_type").notNull(),
    algorithm: varchar("algorithm").notNull(),
    problemDescription: text("problem_description").notNull(),
    inputData: jsonb("input_data").$type().default({}),
    quantumCircuit: text("quantum_circuit"),
    classicalPreprocessing: text("classical_preprocessing"),
    quantumProcessing: text("quantum_processing"),
    classicalPostprocessing: text("classical_postprocessing"),
    results: jsonb("results").$type().default({}),
    executionTime: decimal("execution_time", { precision: 10, scale: 4 }),
    quantumAdvantage: decimal("quantum_advantage", { precision: 5, scale: 2 }),
    status: varchar("status").notNull().default("pending"),
    provider: varchar("provider").default("ibm"),
    qubitsUsed: integer("qubits_used"),
    gateCount: integer("gate_count"),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
});
export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
    user: one(users, {
        fields: [analyticsEvents.userId],
        references: [users.id],
    }),
}));
export const aiInsightsRelations = relations(aiInsights, ({}) => ({}));
export const businessMetricsRelations = relations(businessMetrics, ({}) => ({}));
export const complianceMonitoringRelations = relations(complianceMonitoring, ({}) => ({}));
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
export const predictiveModelsRelations = relations(predictiveModels, ({}) => ({}));
export const cloudDeploymentsRelations = relations(cloudDeployments, ({}) => ({}));
export const technologyStackRelations = relations(technologyStack, ({}) => ({}));
export const quantumTasksRelations = relations(quantumTasks, ({}) => ({}));
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
//# sourceMappingURL=schema.js.map