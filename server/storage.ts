import {
  users,
  mentors,
  students,
  courses,
  bookings,
  achievements,
  reviews,
  chatSessions,
  chatMessages,
  videoSessions,
  classFeedback,
  notifications,
  teacherProfiles,
  paymentMethods,
  transactionFeeConfig,
  paymentTransactions,
  unsettledFinances,
  paymentWorkflows,
  type User,
  type InsertUser,
  type Mentor,
  type InsertMentor,
  type Student,
  type InsertStudent,
  type Course,
  type InsertCourse,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type Achievement,
  type InsertAchievement,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type VideoSession,
  type InsertVideoSession,
  type ClassFeedback,
  type InsertClassFeedback,
  type Notification,
  type InsertNotification,
  type TeacherProfile,
  type InsertTeacherProfile,
  type PaymentMethod,
  type InsertPaymentMethod,
  type TransactionFeeConfig,
  type InsertTransactionFeeConfig,
  type PaymentTransaction,
  type InsertPaymentTransaction,
  type UnsettledFinance,
  type InsertUnsettledFinance,
  type PaymentWorkflow,
  type InsertPaymentWorkflow,
  type MentorWithUser,
  type StudentWithUser,
  type BookingWithDetails,
  type ReviewWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsers(): Promise<User[]>;
  
  // Mentor operations
  getMentors(): Promise<MentorWithUser[]>;
  getMentor(id: string): Promise<MentorWithUser | undefined>;
  getMentorByUserId(userId: string): Promise<Mentor | undefined>;
  getMentorReviews(mentorId: string): Promise<ReviewWithDetails[]>;
  createMentor(mentor: InsertMentor): Promise<Mentor>;
  updateMentorRating(mentorId: string, rating: number): Promise<void>;
  
  // Student operations
  getStudent(id: string): Promise<StudentWithUser | undefined>;
  getStudentByUserId(userId: string): Promise<Student | undefined>;
  getStudentBookings(studentId: string): Promise<BookingWithDetails[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesByMentor(mentorId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<void>;
  deleteCourse(id: string): Promise<void>;
  
  // Booking operations
  getBookings(): Promise<BookingWithDetails[]>;
  getBooking(id: string): Promise<BookingWithDetails | undefined>;
  getBookingsByStudent(studentId: string): Promise<BookingWithDetails[]>;
  getBookingsByMentor(mentorId: string): Promise<BookingWithDetails[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<void>;
  
  // Review operations
  getReviewsByMentor(mentorId: string): Promise<ReviewWithDetails[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Achievement operations
  getAchievementsByStudent(studentId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Video session operations
  createVideoSession(session: InsertVideoSession): Promise<VideoSession>;
  getVideoSessionByBooking(bookingId: string): Promise<VideoSession | undefined>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSessionByBooking(bookingId: string): Promise<ChatSession | undefined>;
  sendChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  
  // Feedback operations
  submitClassFeedback(feedback: InsertClassFeedback): Promise<ClassFeedback>;
  getClassFeedback(bookingId: string): Promise<ClassFeedback | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  
  // Teacher Profile operations
  createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile>;
  getTeacherProfile(userId: string): Promise<TeacherProfile | undefined>;
  
  // Payment Method operations
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  getUserPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  getPaymentMethod(id: string): Promise<PaymentMethod | undefined>;
  updatePaymentMethod(id: string, updates: Partial<InsertPaymentMethod>): Promise<void>;
  deletePaymentMethod(id: string): Promise<void>;
  setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
  
  // Transaction Fee Configuration operations
  getActiveTransactionFeeConfig(): Promise<TransactionFeeConfig | undefined>;
  createTransactionFeeConfig(config: InsertTransactionFeeConfig): Promise<TransactionFeeConfig>;
  updateTransactionFeeConfig(id: string, updates: Partial<InsertTransactionFeeConfig>): Promise<void>;
  deactivateOldFeeConfigs(): Promise<void>;
  
  // Payment Transaction operations
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined>;
  updatePaymentTransactionStatus(id: string, status: string, workflowStage?: string): Promise<void>;
  getTransactionsByUser(userId: string): Promise<PaymentTransaction[]>;
  getPendingTeacherPayouts(): Promise<PaymentTransaction[]>;
  
  // Unsettled Finance operations
  createUnsettledFinance(unsettledFinance: InsertUnsettledFinance): Promise<UnsettledFinance>;
  getUnsettledFinancesByStatus(status: string): Promise<UnsettledFinance[]>;
  resolveUnsettledFinance(id: string, resolution: { action: string; amount: number; notes: string }): Promise<void>;
  
  // Payment Workflow operations
  createPaymentWorkflow(workflow: InsertPaymentWorkflow): Promise<PaymentWorkflow>;
  getActivePaymentWorkflows(): Promise<PaymentWorkflow[]>;
  updatePaymentWorkflowStage(id: string, stage: string, nextActionAt?: Date): Promise<void>;
  
  // Admin operations
  getSystemStats(): Promise<any>;
  getFinanceAnalytics(): Promise<{
    totalAdminRevenue: number;
    totalTeacherPayouts: number;
    totalRefunds: number;
    totalTransactionFees: number;
    conflictAmount: number;
    studentsCount: number;
    teachersCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users).orderBy(desc(users.createdAt));
    return result;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).limit(10);
  }


  async getMentorApplications(status?: string): Promise<any[]> {
    // Return sample data for now
    const sampleApplications = [
      {
        id: "app1",
        user: {
          firstName: "John",
          lastName: "Doe", 
          email: "john.doe@example.com"
        },
        bio: "Experienced software engineer with 5+ years",
        expertise: ["JavaScript", "React", "Node.js"],
        experience: "Senior developer at tech startup",
        pricing: 50,
        languages: ["English", "Spanish"],
        status: status || "pending",
        appliedAt: new Date().toISOString()
      }
    ];
    return sampleApplications.filter(app => !status || app.status === status);
  }

  async updateMentorApplicationStatus(id: string, status: string, feedback?: string): Promise<void> {
    // Implementation would update application status
    console.log(`Updated application ${id} to ${status} with feedback: ${feedback}`);
  }

  // Mentor operations
  async getMentors(): Promise<MentorWithUser[]> {
    const result = await db
      .select()
      .from(mentors)
      .leftJoin(users, eq(mentors.userId, users.id))
      .where(eq(mentors.isActive, true))
      .orderBy(desc(mentors.rating));

    return result.map(({ mentors: mentor, users: user }) => ({
      ...mentor,
      user: user!,
    }));
  }

  async getMentor(id: string): Promise<MentorWithUser | undefined> {
    const [result] = await db
      .select()
      .from(mentors)
      .leftJoin(users, eq(mentors.userId, users.id))
      .where(eq(mentors.id, id));

    if (!result) return undefined;

    return {
      ...result.mentors,
      user: result.users!,
    };
  }


  async createMentor(mentorData: InsertMentor): Promise<Mentor> {
    const processedData = {
      ...mentorData,
      specialties: mentorData.specialties ? Array.from(mentorData.specialties as string[]) : [],
      availableSlots: mentorData.availableSlots ? Array.from(mentorData.availableSlots as any[]) : []
    };
    const [mentor] = await db.insert(mentors).values([processedData]).returning();
    return mentor;
  }

  async updateMentorRating(mentorId: string, rating: number): Promise<void> {
    await db
      .update(mentors)
      .set({ rating: rating.toString() })
      .where(eq(mentors.id, mentorId));
  }

  async getMentorReviews(mentorId: string): Promise<ReviewWithDetails[]> {
    return this.getReviewsByMentor(mentorId);
  }

  // Student operations
  async getStudent(id: string): Promise<StudentWithUser | undefined> {
    const [result] = await db
      .select()
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(students.id, id));

    if (!result) return undefined;

    return {
      ...result.students,
      user: result.users!,
    };
  }

  async getStudentByUserId(userId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.userId, userId));
    return student;
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const processedData = {
      ...studentData,
      interests: studentData.interests ? Array.from(studentData.interests as string[]) : []
    };
    const [student] = await db.insert(students).values([processedData]).returning();
    return student;
  }

  async getStudentBookings(studentId: string): Promise<BookingWithDetails[]> {
    return this.getBookingsByStudent(studentId);
  }

  // Booking operations
  async getBookings(): Promise<BookingWithDetails[]> {
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
      .leftJoin(users, eq(students.userId, users.id))
      .orderBy(desc(bookings.scheduledAt));

    return result.map(({ bookings: booking, students: student, mentors: mentor, users: user }) => ({
      ...booking,
      student: { ...student!, user: user! },
      mentor: { ...mentor!, user: user! },
    }));
  }

  async getBooking(id: string): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(bookings.id, id));

    if (!result) return undefined;

    return {
      ...result.bookings,
      student: { ...result.students!, user: result.users! },
      mentor: { ...result.mentors!, user: result.users! },
    };
  }

  async getMentorByUserId(userId: string): Promise<Mentor | undefined> {
    const [mentor] = await db.select().from(mentors).where(eq(mentors.userId, userId));
    return mentor;
  }
  
  async updateUser(id: string, updates: any): Promise<void> {
    await db.update(users).set(updates).where(eq(users.id, id));
  }
  
  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getBookingsByStudent(studentId: string): Promise<BookingWithDetails[]> {
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(bookings.studentId, studentId))
      .orderBy(desc(bookings.scheduledAt));

    return result.map(({ bookings: booking, students: student, mentors: mentor, users: user }) => ({
      ...booking,
      student: { ...student!, user: user! },
      mentor: { ...mentor!, user: user! },
    }));
  }

  async getBookingsByMentor(mentorId: string): Promise<BookingWithDetails[]> {
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(bookings.mentorId, mentorId))
      .orderBy(desc(bookings.scheduledAt));

    return result.map(({ bookings: booking, students: student, mentors: mentor, users: user }) => ({
      ...booking,
      student: { ...student!, user: user! },
      mentor: { ...mentor!, user: user! },
    }));
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }

  async updateBookingStatus(id: string, status: string): Promise<void> {
    await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id));
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    const result = await db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(desc(courses.createdAt));
    return result;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByMentor(mentorId: string): Promise<Course[]> {
    const result = await db
      .select()
      .from(courses)
      .where(and(eq(courses.mentorId, mentorId), eq(courses.isActive, true)))
      .orderBy(desc(courses.createdAt));
    return result;
  }

  // TODO: Fix course operations - temporarily disabled due to type issues
  async createCourse(courseData: InsertCourse): Promise<Course> {
    throw new Error("Course creation not implemented yet");
  }

  async updateCourse(id: string, courseData: Partial<InsertCourse>): Promise<void> {
    throw new Error("Course update not implemented yet");
  }

  async deleteCourse(id: string): Promise<void> {
    await db
      .update(courses)
      .set({ isActive: false })
      .where(eq(courses.id, id));
  }

  // Review operations
  async getReviewsByMentor(mentorId: string): Promise<ReviewWithDetails[]> {
    const result = await db
      .select()
      .from(reviews)
      .leftJoin(students, eq(reviews.studentId, students.id))
      .leftJoin(mentors, eq(reviews.mentorId, mentors.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(reviews.mentorId, mentorId))
      .orderBy(desc(reviews.createdAt));

    return result.map(({ reviews: review, students: student, mentors: mentor, users: user }) => ({
      ...review,
      student: { ...student!, user: user! },
      mentor: { ...mentor!, user: user! },
    }));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    
    // Update mentor rating
    const mentorReviews = await this.getReviewsByMentor(reviewData.mentorId);
    const averageRating = mentorReviews.reduce((sum, r) => sum + r.rating, 0) / mentorReviews.length;
    await this.updateMentorRating(reviewData.mentorId, averageRating);
    
    return review;
  }

  // Achievement operations
  async getAchievementsByStudent(studentId: string): Promise<Achievement[]> {
    const result = await db
      .select()
      .from(achievements)
      .where(eq(achievements.studentId, studentId))
      .orderBy(desc(achievements.earnedAt));

    return result;
  }

  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(achievementData).returning();
    return achievement;
  }

  // Video session operations
  async createVideoSession(sessionData: InsertVideoSession): Promise<VideoSession> {
    const [session] = await db.insert(videoSessions).values(sessionData).returning();
    return session;
  }

  async getVideoSessionByBooking(bookingId: string): Promise<VideoSession | undefined> {
    const [session] = await db.select().from(videoSessions).where(eq(videoSessions.bookingId, bookingId));
    return session;
  }

  // Chat operations
  async createChatSession(sessionData: InsertChatSession): Promise<ChatSession> {
    const [session] = await db.insert(chatSessions).values(sessionData).returning();
    return session;
  }

  async getChatSessionByBooking(bookingId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.bookingId, bookingId));
    return session;
  }

  async sendChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatSessionId, sessionId))
      .orderBy(chatMessages.sentAt);
    return messages;
  }

  // Feedback operations
  async submitClassFeedback(feedbackData: InsertClassFeedback): Promise<ClassFeedback> {
    const [feedback] = await db.insert(classFeedback).values(feedbackData).returning();
    return feedback;
  }

  async getClassFeedback(bookingId: string): Promise<ClassFeedback | undefined> {
    const [feedback] = await db.select().from(classFeedback).where(eq(classFeedback.bookingId, bookingId));
    return feedback;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    return result;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  // Teacher Profile operations
  async createTeacherProfile(profileData: InsertTeacherProfile): Promise<TeacherProfile> {
    const processedData: any = { ...profileData };
    
    // Process array fields safely
    if (processedData.achievements) {
      processedData.achievements = Array.from(processedData.achievements as any[]);
    }
    if (processedData.qualifications) {
      processedData.qualifications = Array.from(processedData.qualifications as any[]);
    }
    if (processedData.programmingLanguages) {
      processedData.programmingLanguages = Array.from(processedData.programmingLanguages as any[]);
    }
    if (processedData.subjects) {
      processedData.subjects = Array.from(processedData.subjects as any[]);
    }
    
    const [profile] = await db.insert(teacherProfiles).values(processedData).returning();
    return profile;
  }

  async getTeacherProfile(userId: string): Promise<TeacherProfile | undefined> {
    const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
    return profile;
  }

  // Payment Method operations
  async createPaymentMethod(paymentMethodData: InsertPaymentMethod): Promise<PaymentMethod> {
    const [paymentMethod] = await db.insert(paymentMethods).values(paymentMethodData).returning();
    return paymentMethod;
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.isActive, true)))
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));
  }

  async getPaymentMethod(id: string): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return paymentMethod;
  }

  async updatePaymentMethod(id: string, updates: Partial<InsertPaymentMethod>): Promise<void> {
    await db
      .update(paymentMethods)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id));
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await db
      .update(paymentMethods)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id));
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    // First, unset all default payment methods for the user
    await db
      .update(paymentMethods)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(paymentMethods.userId, userId));
    
    // Then set the new default
    await db
      .update(paymentMethods)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(paymentMethods.id, paymentMethodId));
  }

  // Transaction Fee Configuration operations
  async getActiveTransactionFeeConfig(): Promise<TransactionFeeConfig | undefined> {
    const [config] = await db
      .select()
      .from(transactionFeeConfig)
      .where(eq(transactionFeeConfig.isActive, true))
      .orderBy(desc(transactionFeeConfig.createdAt))
      .limit(1);
    return config;
  }

  async createTransactionFeeConfig(configData: InsertTransactionFeeConfig): Promise<TransactionFeeConfig> {
    // Deactivate old configs first
    await this.deactivateOldFeeConfigs();
    
    const [config] = await db.insert(transactionFeeConfig).values(configData).returning();
    return config;
  }

  async updateTransactionFeeConfig(id: string, updates: Partial<InsertTransactionFeeConfig>): Promise<void> {
    await db
      .update(transactionFeeConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactionFeeConfig.id, id));
  }

  async deactivateOldFeeConfigs(): Promise<void> {
    await db
      .update(transactionFeeConfig)
      .set({ isActive: false, updatedAt: new Date() });
  }

  // Payment Transaction operations
  async createPaymentTransaction(transactionData: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [transaction] = await db.insert(paymentTransactions).values(transactionData).returning();
    return transaction;
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    return transaction;
  }

  async updatePaymentTransactionStatus(id: string, status: string, workflowStage?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (workflowStage) {
      updateData.workflowStage = workflowStage;
    }
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    await db
      .update(paymentTransactions)
      .set(updateData)
      .where(eq(paymentTransactions.id, id));
  }

  async getTransactionsByUser(userId: string): Promise<PaymentTransaction[]> {
    return await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.fromUserId, userId))
      .orderBy(desc(paymentTransactions.createdAt));
  }

  async getPendingTeacherPayouts(): Promise<PaymentTransaction[]> {
    return await db
      .select()
      .from(paymentTransactions)
      .where(and(
        eq(paymentTransactions.workflowStage, 'admin_to_teacher'),
        eq(paymentTransactions.status, 'pending')
      ));
  }

  // Unsettled Finance operations
  async createUnsettledFinance(unsettledFinanceData: InsertUnsettledFinance): Promise<UnsettledFinance> {
    const [unsettledFinance] = await db.insert(unsettledFinances).values(unsettledFinanceData).returning();
    return unsettledFinance;
  }

  async getUnsettledFinancesByStatus(status: string): Promise<UnsettledFinance[]> {
    return await db
      .select()
      .from(unsettledFinances)
      .where(eq(unsettledFinances.status, status))
      .orderBy(desc(unsettledFinances.createdAt));
  }

  async resolveUnsettledFinance(id: string, resolution: { action: string; amount: number; notes: string }): Promise<void> {
    await db
      .update(unsettledFinances)
      .set({
        status: 'resolved',
        resolutionAction: resolution.action,
        resolutionAmount: resolution.amount.toString(),
        resolutionNotes: resolution.notes,
        resolutionDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(unsettledFinances.id, id));
  }

  // Payment Workflow operations
  async createPaymentWorkflow(workflowData: InsertPaymentWorkflow): Promise<PaymentWorkflow> {
    // Ensure processingErrors is a proper array
    const processedData = {
      ...workflowData,
      processingErrors: workflowData.processingErrors ? Array.from(workflowData.processingErrors as string[]) : []
    };
    const [workflow] = await db.insert(paymentWorkflows).values(processedData).returning();
    return workflow;
  }

  async getActivePaymentWorkflows(): Promise<PaymentWorkflow[]> {
    return await db
      .select()
      .from(paymentWorkflows)
      .where(eq(paymentWorkflows.status, 'active'))
      .orderBy(paymentWorkflows.nextActionAt);
  }

  async updatePaymentWorkflowStage(id: string, stage: string, nextActionAt?: Date): Promise<void> {
    const updateData: any = { 
      currentStage: stage,
      lastProcessedAt: new Date(),
      updatedAt: new Date() 
    };
    if (nextActionAt) {
      updateData.nextActionAt = nextActionAt;
    }
    
    await db
      .update(paymentWorkflows)
      .set(updateData)
      .where(eq(paymentWorkflows.id, id));
  }

  async getFinanceAnalytics(): Promise<{
    totalAdminRevenue: number;
    totalTeacherPayouts: number;
    totalRefunds: number;
    totalTransactionFees: number;
    conflictAmount: number;
    studentsCount: number;
    teachersCount: number;
  }> {
    // Get all completed transactions
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.status, 'completed'));

    // Get unsettled finance conflicts
    const conflicts = await db
      .select()
      .from(unsettledFinances)
      .where(eq(unsettledFinances.status, 'open'));

    // Get user counts
    const allUsers = await db.select().from(users);
    const studentsCount = allUsers.filter(u => u.role === 'student').length;
    const teachersCount = allUsers.filter(u => u.role === 'mentor').length;

    // Calculate financial metrics
    let totalAdminRevenue = 0;
    let totalTeacherPayouts = 0;
    let totalRefunds = 0;
    let totalTransactionFees = 0;

    for (const transaction of transactions) {
      const amount = parseFloat(transaction.amount);
      const fee = parseFloat(transaction.transactionFee || '0');

      if (transaction.transactionType === 'booking_payment' || transaction.transactionType === 'course_payment') {
        totalAdminRevenue += amount;
        totalTransactionFees += fee;
      } else if (transaction.transactionType === 'teacher_payout') {
        totalTeacherPayouts += amount;
      } else if (transaction.transactionType === 'refund') {
        totalRefunds += amount;
      }
    }

    const conflictAmount = conflicts.reduce((sum, conflict) => {
      return sum + parseFloat(conflict.conflictAmount);
    }, 0);

    return {
      totalAdminRevenue,
      totalTeacherPayouts,
      totalRefunds,
      totalTransactionFees,
      conflictAmount,
      studentsCount,
      teachersCount,
    };
  }

  // Admin operations
  async getSystemStats(): Promise<any> {
    const allUsers = await db.select().from(users);
    const allMentors = await db.select().from(mentors);
    const allStudents = await db.select().from(students);
    const allBookings = await db.select().from(bookings);
    const completedBookings = await db.select().from(bookings).where(eq(bookings.status, 'completed'));

    return {
      totalUsers: allUsers.length || 0,
      totalMentors: allMentors.length || 0,
      totalStudents: allStudents.length || 0,
      totalBookings: allBookings.length || 0,
      completedBookings: completedBookings.length || 0,
      completionRate: allBookings.length > 0 ? (completedBookings.length / allBookings.length) * 100 : 0
    };
  }
}

export const storage = new DatabaseStorage();
