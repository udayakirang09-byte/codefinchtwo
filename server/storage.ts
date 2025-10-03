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
  userSessions,
  teacherProfiles,
  paymentMethods,
  transactionFeeConfig,
  paymentTransactions,
  unsettledFinances,
  paymentWorkflows,
  helpTickets,
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
  type UserSession,
  type InsertUserSession,
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
  qualifications,
  specializations,
  subjects,
  type Qualification,
  type Specialization,
  type Subject,
  teacherAudioMetrics,
  homeSectionControls,
  type TeacherAudioMetrics,
  type InsertTeacherAudioMetrics,
  type HomeSectionControls,
  type InsertHomeSectionControls,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

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
  getStudentRecordings(studentUserId: string): Promise<Array<VideoSession & { booking: BookingWithDetails }>>;
  getRecordingById(recordingId: string): Promise<VideoSession | undefined>;
  validateStudentRecordingAccess(studentUserId: string, recordingId: string): Promise<boolean>;
  updateVideoSessionRecording(sessionId: string, recordingUrl: string): Promise<void>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSessionByBooking(bookingId: string): Promise<ChatSession | undefined>;
  sendChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  checkStudentMentorRelationshipStatus(studentUserId: string, mentorUserId: string): Promise<{
    isActive: boolean;
    lastBookingDate: Date | null;
    canChat: boolean;
    canViewMessages: boolean;
  }>;
  validateChatAccess(studentUserId: string, mentorUserId: string): Promise<boolean>;
  
  // Feedback operations
  submitClassFeedback(feedback: InsertClassFeedback): Promise<ClassFeedback>;
  getClassFeedback(bookingId: string): Promise<ClassFeedback | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  
  // Session operations
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  getActiveUserSessions(userId: string): Promise<UserSession[]>;
  getUserSessionByToken(sessionToken: string): Promise<UserSession | undefined>;
  updateSessionActivity(sessionToken: string): Promise<void>;
  deactivateSession(sessionToken: string): Promise<void>;
  deactivateUserSessions(userId: string): Promise<void>;
  getMultipleLoginUsers(): Promise<{ userId: string; sessionCount: number; user: User }[]>;
  
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
  getPaymentTransactionByStripeId(stripePaymentIntentId: string): Promise<PaymentTransaction | undefined>;
  updatePaymentTransaction(id: string, updates: Partial<InsertPaymentTransaction>): Promise<void>;
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
  
  // Help System operations
  createHelpTicket(ticket: any): Promise<any>;
  
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
  
  // Educational dropdown operations
  getQualifications(): Promise<Qualification[]>;
  getSpecializations(): Promise<Specialization[]>;
  getSubjects(): Promise<Subject[]>;
  
  // Educational dropdown management operations
  clearQualifications(): Promise<void>;
  clearSpecializations(): Promise<void>;
  clearSubjects(): Promise<void>;
  createQualification(qualification: { name: string; description?: string; category?: string; displayOrder?: number }): Promise<void>;
  createSpecialization(specialization: { name: string; description?: string; category?: string; displayOrder?: number }): Promise<void>;
  createSubject(subject: { name: string; description?: string; board?: string; grade?: string; category?: string; displayOrder?: number }): Promise<void>;
  batchCreateQualifications(qualifications: { name: string; description?: string; category?: string; displayOrder?: number }[]): Promise<void>;
  batchCreateSpecializations(specializations: { name: string; description?: string; category?: string; displayOrder?: number }[]): Promise<void>;
  batchCreateSubjects(subjects: { name: string; description?: string; board?: string; grade?: string; category?: string; displayOrder?: number }[]): Promise<void>;
  getQualificationsCount(): Promise<number>;
  getSpecializationsCount(): Promise<number>;
  getSubjectsCount(): Promise<number>;
  
  // Azure VM Management operations
  createAzureVm(vmConfig: any): Promise<any>;
  getAzureVm(vmName: string): Promise<any>;
  listAzureVms(): Promise<any[]>;
  updateAzureVm(vmName: string, updates: any): Promise<void>;
  deleteAzureVm(vmName: string): Promise<void>;
  getVmStatus(vmName: string): Promise<any>;
  startAzureVm(vmName: string): Promise<void>;
  stopAzureVm(vmName: string): Promise<void>;
  restartAzureVm(vmName: string): Promise<void>;
  
  // Recording Storage operations
  uploadRecordingToVm(sessionId: string, fileData: any): Promise<string>;
  downloadRecordingFromVm(sessionId: string): Promise<any>;
  deleteRecordingFromVm(sessionId: string): Promise<void>;
  getRecordingStorageStats(): Promise<any>;
  
  // Teacher Audio Analytics operations
  createTeacherAudioMetrics(metrics: InsertTeacherAudioMetrics): Promise<TeacherAudioMetrics>;
  getTeacherAudioMetrics(mentorId: string, options?: { limit?: number; from?: Date; to?: Date }): Promise<TeacherAudioMetrics[]>;
  getTeacherAudioMetricsAggregates(window?: string): Promise<Array<{
    mentorId: string;
    mentorName: string;
    encourageInvolvement: number;
    pleasantCommunication: number;
    avoidPersonalDetails: number;
    overallScore: number;
    totalClasses: number;
    highlightGreen: boolean;
    highlightRed: boolean;
  }>>;
  getTeacherAudioAggregate(mentorId: string): Promise<{
    encourageInvolvement: number;
    pleasantCommunication: number;
    avoidPersonalDetails: number;
    overallScore: number;
    totalClasses: number;
  } | undefined>;
  
  // Home Section Controls operations  
  getHomeSectionControls(): Promise<HomeSectionControls[]>;
  updateHomeSectionControl(sectionType: string, sectionName: string, isEnabled: boolean): Promise<void>;
  getHomeSectionControlsForType(sectionType: 'teacher' | 'student'): Promise<HomeSectionControls[]>;
  
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

  async createUser(userData: any): Promise<User> {
    // Generate UUID manually for Azure PostgreSQL compatibility
    const { randomUUID } = await import('crypto');
    const userDataWithId = {
      ...userData,
      id: userData.id || randomUUID()
    };
    const [user] = await db.insert(users).values(userDataWithId).returning();
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
        country: "NA-Country", // Add country field to mock data
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

    // Get all bookings to calculate actual student counts
    const allBookings = await db.select().from(bookings);

    return result.map(({ mentors: mentor, users: user }: { mentors: Mentor; users: User }) => {
      // Calculate actual unique students for this mentor
      const mentorBookings = allBookings.filter((b: any) => b.mentorId === mentor.id);
      const uniqueStudentIds = new Set(mentorBookings.map((b: any) => b.studentId));
      const actualStudentCount = uniqueStudentIds.size;

      return {
        ...mentor,
        totalStudents: actualStudentCount, // Use actual count from bookings
        user: user!,
      };
    });
  }

  async getMentor(id: string): Promise<MentorWithUser | undefined> {
    const [result] = await db
      .select()
      .from(mentors)
      .leftJoin(users, eq(mentors.userId, users.id))
      .where(eq(mentors.id, id));

    if (!result) return undefined;

    // Calculate actual unique students for this mentor
    const mentorBookings = await db.select().from(bookings).where(eq(bookings.mentorId, id));
    const uniqueStudentIds = new Set(mentorBookings.map((b: any) => b.studentId));
    const actualStudentCount = uniqueStudentIds.size;

    return {
      ...result.mentors,
      totalStudents: actualStudentCount, // Use actual count from bookings
      user: result.users!,
    };
  }


  async createMentor(mentorData: InsertMentor): Promise<Mentor> {
    // Generate UUID manually for Azure PostgreSQL compatibility
    const { randomUUID } = await import('crypto');
    const data = mentorData as any;
    const processedData = {
      ...mentorData,
      id: data.id || randomUUID(),
      specialties: data.specialties ? Array.from(data.specialties as string[]) : [],
      availableSlots: data.availableSlots ? Array.from(data.availableSlots as any[]) : []
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
    // Generate UUID manually for Azure PostgreSQL compatibility
    const { randomUUID } = await import('crypto');
    const data = studentData as any;
    const processedData = {
      ...studentData,
      id: data.id || randomUUID(),
      interests: data.interests ? Array.from(data.interests as string[]) : []
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

    return result.map(({ bookings: booking, students: student, mentors: mentor, users: user }: { bookings: Booking; students: Student; mentors: Mentor; users: User }) => ({
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
  
  async updateUser(id: string, updates: Partial<InsertUser>): Promise<void> {
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

    return result.map(({ bookings: booking, students: student, mentors: mentor, users: user }: { bookings: Booking; students: Student; mentors: Mentor; users: User }) => ({
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

    return result.map(({ bookings: booking, students: student, mentors: mentor, users: user }: { bookings: Booking; students: Student; mentors: Mentor; users: User }) => ({
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

  // Course operations - fixed implementation
  async createCourse(courseData: any): Promise<Course> {
    const processedData = {
      ...courseData,
      tags: courseData.tags ? Array.from(courseData.tags as string[]) : []
    };
    
    const [course] = await db.insert(courses).values([processedData]).returning();
    return course;
  }

  async updateCourse(id: string, courseData: any): Promise<void> {
    const processedData: any = {
      ...courseData,
      updatedAt: new Date()
    };

    // Process tags array if provided
    if (courseData.tags) {
      processedData.tags = Array.from(courseData.tags as string[]);
    }

    // Remove undefined values safely
    const filteredData = Object.entries(processedData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    await db
      .update(courses)
      .set(filteredData)
      .where(eq(courses.id, id));
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

    return result.map(({ reviews: review, students: student, mentors: mentor, users: user }: { reviews: Review; students: Student; mentors: Mentor; users: User }) => ({
      ...review,
      student: { ...student!, user: user! },
      mentor: { ...mentor!, user: user! },
    }));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    
    // Update mentor rating
    const data = reviewData as any;
    const mentorReviews = await this.getReviewsByMentor(data.mentorId);
    const averageRating = mentorReviews.reduce((sum, r) => sum + r.rating, 0) / mentorReviews.length;
    await this.updateMentorRating(data.mentorId, averageRating);
    
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

  // Recording access methods with role-based permissions
  async getStudentRecordings(studentUserId: string): Promise<Array<VideoSession & {
    booking: BookingWithDetails;
  }>> {
    const recordings = await db
      .select()
      .from(videoSessions)
      .leftJoin(bookings, eq(videoSessions.bookingId, bookings.id))
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(
        and(
          eq(users.id, studentUserId),
          sql`${videoSessions.recordingUrl} IS NOT NULL`,
          eq(videoSessions.status, 'ended')
        )
      )
      .orderBy(desc(videoSessions.createdAt));

    return recordings.map((record: any) => ({
      ...record.video_sessions!,
      booking: {
        ...record.bookings!,
        student: {
          ...record.students!,
          user: record.users!
        },
        mentor: {
          ...record.mentors!,
          user: record.users! // This will need to be joined separately
        }
      } as BookingWithDetails
    }));
  }

  async getRecordingById(recordingId: string): Promise<VideoSession | undefined> {
    const [recording] = await db
      .select()
      .from(videoSessions)
      .where(eq(videoSessions.id, recordingId));
    return recording;
  }

  async validateStudentRecordingAccess(studentUserId: string, recordingId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(videoSessions)
      .leftJoin(bookings, eq(videoSessions.bookingId, bookings.id))
      .leftJoin(students, eq(bookings.studentId, students.id))
      .where(
        and(
          eq(videoSessions.id, recordingId),
          eq(students.userId, studentUserId)
        )
      );

    return !!result;
  }

  async updateVideoSessionRecording(sessionId: string, recordingUrl: string): Promise<void> {
    await db
      .update(videoSessions)
      .set({ recordingUrl })
      .where(eq(videoSessions.id, sessionId));
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

  // Chat timing control methods
  async checkStudentMentorRelationshipStatus(studentUserId: string, mentorUserId: string): Promise<{
    isActive: boolean;
    lastBookingDate: Date | null;
    canChat: boolean;
    canViewMessages: boolean;
  }> {
    // Find the most recent booking between this student-mentor pair
    const recentBooking = await db
      .select()
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
      .where(
        and(
          eq(students.userId, studentUserId),
          eq(mentors.userId, mentorUserId)
        )
      )
      .orderBy(desc(bookings.scheduledAt))
      .limit(1);

    if (recentBooking.length === 0) {
      return {
        isActive: false,
        lastBookingDate: null,
        canChat: false,
        canViewMessages: false
      };
    }

    const lastBookingDate = recentBooking[0].bookings.scheduledAt;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000); // 6 months
    const nineMonthsAgo = new Date(now.getTime() - 9 * 30 * 24 * 60 * 60 * 1000); // 6 + 3 months

    const isWithin6Months = lastBookingDate > sixMonthsAgo;
    const isWithin9Months = lastBookingDate > nineMonthsAgo;

    return {
      isActive: isWithin6Months,
      lastBookingDate,
      canChat: isWithin6Months, // Can send new messages within 6 months
      canViewMessages: isWithin9Months // Can view messages for 3 additional months
    };
  }

  async validateChatAccess(studentUserId: string, mentorUserId: string): Promise<boolean> {
    const relationshipStatus = await this.checkStudentMentorRelationshipStatus(studentUserId, mentorUserId);
    return relationshipStatus.canChat;
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

  async getPaymentTransactionByStripeId(stripePaymentIntentId: string): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.stripePaymentIntentId, stripePaymentIntentId));
    return transaction;
  }

  async updatePaymentTransaction(id: string, updates: Partial<InsertPaymentTransaction>): Promise<void> {
    await db
      .update(paymentTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentTransactions.id, id));
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
  async createPaymentWorkflow(workflowData: any): Promise<PaymentWorkflow> {
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
    const studentsCount = allUsers.filter((u: User) => u.role === 'student').length;
    const teachersCount = allUsers.filter((u: User) => u.role === 'mentor').length;

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

    const conflictAmount = conflicts.reduce((sum: number, conflict: UnsettledFinance) => {
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
  async getSystemStats(): Promise<{
    totalUsers: number;
    totalMentors: number;
    totalStudents: number;
    totalBookings: number;
    completedBookings: number;
    completionRate: number;
  }> {
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

  // Help System operations
  async createHelpTicket(ticketData: any): Promise<any> {
    const [ticket] = await db.insert(helpTickets).values(ticketData).returning();
    return ticket;
  }

  // Educational dropdown operations
  async getQualifications(): Promise<Qualification[]> {
    return await db.select().from(qualifications)
      .where(eq(qualifications.isActive, true))
      .orderBy(qualifications.displayOrder, qualifications.name);
  }

  async getSpecializations(): Promise<Specialization[]> {
    return await db.select().from(specializations)
      .where(eq(specializations.isActive, true))
      .orderBy(specializations.displayOrder, specializations.name);
  }

  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects)
      .where(eq(subjects.isActive, true))
      .orderBy(subjects.displayOrder, subjects.name);
  }

  // Educational dropdown management operations
  async clearQualifications(): Promise<void> {
    await db.delete(qualifications);
  }

  async clearSpecializations(): Promise<void> {
    await db.delete(specializations);
  }

  async clearSubjects(): Promise<void> {
    await db.delete(subjects);
  }

  async createQualification(qualification: { name: string; description?: string; category?: string; displayOrder?: number }): Promise<void> {
    await db.insert(qualifications).values({
      name: qualification.name,
      description: qualification.description,
      category: qualification.category,
      displayOrder: qualification.displayOrder || 0,
      isActive: true
    }).onConflictDoNothing();
  }

  async createSpecialization(specialization: { name: string; description?: string; category?: string; displayOrder?: number }): Promise<void> {
    await db.insert(specializations).values({
      name: specialization.name,
      description: specialization.description,
      category: specialization.category,
      displayOrder: specialization.displayOrder || 0,
      isActive: true
    }).onConflictDoNothing();
  }

  async createSubject(subject: { name: string; description?: string; board?: string; grade?: string; category?: string; displayOrder?: number }): Promise<void> {
    await db.insert(subjects).values({
      name: subject.name,
      description: subject.description,
      board: subject.board,
      grade: subject.grade,
      category: subject.category,
      displayOrder: subject.displayOrder || 0,
      isActive: true
    }).onConflictDoNothing();
  }

  // Batch insert methods for better performance
  async batchCreateQualifications(qualificationsList: { name: string; description?: string; category?: string; displayOrder?: number }[]): Promise<void> {
    if (qualificationsList.length === 0) return;
    
    const values = qualificationsList.map(q => ({
      name: q.name,
      description: q.description,
      category: q.category,
      displayOrder: q.displayOrder || 0,
      isActive: true
    }));
    
    await db.insert(qualifications).values(values).onConflictDoNothing();
  }

  async batchCreateSpecializations(specializationsList: { name: string; description?: string; category?: string; displayOrder?: number }[]): Promise<void> {
    if (specializationsList.length === 0) return;
    
    const values = specializationsList.map(s => ({
      name: s.name,
      description: s.description,
      category: s.category,
      displayOrder: s.displayOrder || 0,
      isActive: true
    }));
    
    await db.insert(specializations).values(values).onConflictDoNothing();
  }

  async batchCreateSubjects(subjectsList: { name: string; description?: string; board?: string; grade?: string; category?: string; displayOrder?: number }[]): Promise<void> {
    if (subjectsList.length === 0) return;
    
    const values = subjectsList.map(s => ({
      name: s.name,
      description: s.description,
      board: s.board,
      grade: s.grade,
      category: s.category,
      displayOrder: s.displayOrder || 0,
      isActive: true
    }));
    
    await db.insert(subjects).values(values).onConflictDoNothing();
  }

  async getQualificationsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(qualifications);
    return result[0]?.count || 0;
  }

  async getSpecializationsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(specializations);
    return result[0]?.count || 0;
  }

  async getSubjectsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(subjects);
    return result[0]?.count || 0;
  }

  // Session management operations
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return await db.select().from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.lastActivity));
  }

  async getActiveUserSessions(userId: string): Promise<UserSession[]> {
    return await db.select().from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.isActive, true)
      ))
      .orderBy(desc(userSessions.lastActivity));
  }

  async getUserSessionByToken(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
    return session;
  }

  async updateSessionActivity(sessionToken: string): Promise<void> {
    await db.update(userSessions)
      .set({ lastActivity: new Date() })
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async deactivateSession(sessionToken: string): Promise<void> {
    await db.update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async deactivateUserSessions(userId: string): Promise<void> {
    await db.update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.userId, userId));
  }

  async getMultipleLoginUsers(): Promise<{ userId: string; sessionCount: number; user: User }[]> {
    const activeSessions = await db.select({
      userId: userSessions.userId,
      sessionCount: sql<number>`COUNT(*)`.as('sessionCount')
    })
    .from(userSessions)
    .where(eq(userSessions.isActive, true))
    .groupBy(userSessions.userId)
    .having(sql`COUNT(*) > 1`);

    const result = [];
    for (const session of activeSessions) {
      const user = await this.getUser(session.userId);
      if (user) {
        result.push({
          userId: session.userId,
          sessionCount: session.sessionCount,
          user
        });
      }
    }
    return result;
  }

  // Azure VM Management operations
  async createAzureVm(vmConfig: any): Promise<any> {
    // Mock implementation for Azure VM creation
    console.log('🚀 Azure VM creation requested:', vmConfig.vmName);
    
    const vmData = {
      id: `vm-${Date.now()}`,
      name: vmConfig.vmName,
      status: 'Creating',
      location: vmConfig.location || 'eastus',
      size: vmConfig.vmSize || 'Standard_D2s_v3',
      createdAt: new Date(),
      publicIpAddress: null,
      privateIpAddress: null,
      isHealthy: false
    };
    
    // In a real implementation, this would call Azure ARM APIs
    // For now, we'll simulate the creation process
    setTimeout(() => {
      console.log('✅ Azure VM created successfully:', vmConfig.vmName);
    }, 5000);
    
    return vmData;
  }
  
  async getAzureVm(vmName: string): Promise<any> {
    console.log('🔍 Getting Azure VM details:', vmName);
    
    // Mock VM data - in real implementation, would query Azure ARM APIs
    return {
      id: `vm-${vmName}`,
      name: vmName,
      status: 'Running',
      location: 'eastus',
      size: 'Standard_D2s_v3',
      publicIpAddress: '20.62.132.45',
      privateIpAddress: '10.0.0.4',
      isHealthy: true,
      lastHealthCheck: new Date(),
      diskUsage: {
        total: 30720000000, // 30GB
        used: 5120000000,   // 5GB
        available: 25600000000 // 25GB
      },
      recordings: {
        count: 12,
        totalSize: 2048000000, // 2GB
        lastUploaded: new Date()
      }
    };
  }
  
  async listAzureVms(): Promise<any[]> {
    console.log('📋 Listing all Azure VMs');
    
    // Mock VM list - in real implementation, would query Azure ARM APIs
    return [
      {
        id: 'vm-codeconnect-prod-1',
        name: 'codeconnect-prod-1',
        status: 'Running',
        location: 'eastus',
        size: 'Standard_D2s_v3',
        isHealthy: true,
        recordings: { count: 15, totalSize: 3072000000 }
      },
      {
        id: 'vm-codeconnect-backup-1',
        name: 'codeconnect-backup-1', 
        status: 'Stopped',
        location: 'eastus',
        size: 'Standard_B2s',
        isHealthy: false,
        recordings: { count: 0, totalSize: 0 }
      }
    ];
  }
  
  async updateAzureVm(vmName: string, updates: any): Promise<void> {
    console.log('⚙️ Updating Azure VM:', vmName, 'Updates:', updates);
    
    // In real implementation, would call Azure ARM APIs to update VM
    // This could include resizing, updating tags, changing network settings, etc.
  }
  
  async deleteAzureVm(vmName: string): Promise<void> {
    console.log('🗑️ Deleting Azure VM:', vmName);
    
    // In real implementation, would call Azure ARM APIs to delete VM
    // This would also clean up associated resources like disks, network interfaces, etc.
  }
  
  async getVmStatus(vmName: string): Promise<any> {
    console.log('📊 Getting VM status:', vmName);
    
    return {
      vmName,
      powerState: 'VM running',
      provisioningState: 'Succeeded',
      publicIpAddress: '20.62.132.45',
      privateIpAddress: '10.0.0.4',
      lastHealthCheck: new Date(),
      isHealthy: true,
      diskUsage: {
        total: 30720000000,
        used: 5120000000,
        available: 25600000000
      },
      recordings: {
        count: 12,
        totalSize: 2048000000,
        lastUploaded: new Date()
      }
    };
  }
  
  async startAzureVm(vmName: string): Promise<void> {
    console.log('▶️ Starting Azure VM:', vmName);
    
    // In real implementation, would call Azure ARM APIs to start the VM
    // This would be an async operation that could take 1-2 minutes
  }
  
  async stopAzureVm(vmName: string): Promise<void> {
    console.log('⏹️ Stopping Azure VM:', vmName);
    
    // In real implementation, would call Azure ARM APIs to stop the VM
    // This would be an async operation
  }
  
  async restartAzureVm(vmName: string): Promise<void> {
    console.log('🔄 Restarting Azure VM:', vmName);
    
    // In real implementation, would call Azure ARM APIs to restart the VM
    // This combines stop + start operations
  }

  // Recording Storage operations
  async uploadRecordingToVm(sessionId: string, fileData: any): Promise<string> {
    console.log('⬆️ Uploading recording to VM for session:', sessionId);
    
    // In real implementation, would:
    // 1. Connect to the Azure VM via SSH or Azure Storage API
    // 2. Process the video file (compression, format standardization)
    // 3. Upload to Azure Storage Blob
    // 4. Return the blob URL
    
    const recordingUrl = `https://codeconnect.blob.core.windows.net/recordings/session-${sessionId}-${Date.now()}.mp4`;
    
    // Update the video session with the recording URL
    await this.updateVideoSessionRecording(sessionId, recordingUrl);
    
    return recordingUrl;
  }
  
  async downloadRecordingFromVm(sessionId: string): Promise<any> {
    console.log('⬇️ Downloading recording from VM for session:', sessionId);
    
    // In real implementation, would:
    // 1. Look up the recording URL from the database
    // 2. Generate a signed download URL from Azure Storage
    // 3. Return the download metadata
    
    return {
      sessionId,
      downloadUrl: `https://codeconnect.blob.core.windows.net/recordings/session-${sessionId}.mp4?signed-url-token`,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      fileSize: 52428800, // 50MB
      format: 'mp4'
    };
  }
  
  async deleteRecordingFromVm(sessionId: string): Promise<void> {
    console.log('🗑️ Deleting recording from VM for session:', sessionId);
    
    // In real implementation, would:
    // 1. Look up the recording URL from the database
    // 2. Delete the blob from Azure Storage
    // 3. Update the database to remove the recording URL
    
    await this.updateVideoSessionRecording(sessionId, '');
  }
  
  async getRecordingStorageStats(): Promise<any> {
    console.log('📊 Getting recording storage statistics');
    
    // In real implementation, would query Azure Storage Account for usage stats
    return {
      totalRecordings: 45,
      totalStorageUsed: 8589934592, // 8GB
      averageRecordingSize: 190840217, // ~190MB
      storageQuota: 107374182400, // 100GB
      storageUsagePercent: 8.0,
      monthlyUploadCount: 12,
      monthlyDownloadCount: 34,
      retentionDays: 365,
      oldestRecording: new Date('2024-01-15'),
      newestRecording: new Date()
    };
  }

  // Teacher Audio Analytics operations
  async createTeacherAudioMetrics(metrics: any): Promise<TeacherAudioMetrics> {
    // Calculate overall score from key metrics
    const overallScore = (
      metrics.encourageInvolvement + 
      metrics.pleasantCommunication + 
      metrics.avoidPersonalDetails + 
      metrics.studentTalkRatio + 
      metrics.questionRate + 
      metrics.clarity + 
      metrics.adherenceToTopic + 
      metrics.politeness
    ) / 8;

    const [result] = await db.insert(teacherAudioMetrics).values({
      ...metrics,
      overallScore: overallScore.toFixed(1)
    }).returning();
    
    console.log(`📊 Created audio analytics for mentor ${metrics.mentorId} with overall score ${overallScore.toFixed(1)}`);
    return result;
  }

  async getTeacherAudioMetrics(mentorId: string, options?: { limit?: number; from?: Date; to?: Date }): Promise<TeacherAudioMetrics[]> {
    const baseQuery = db.select().from(teacherAudioMetrics)
      .where(eq(teacherAudioMetrics.mentorId, mentorId))
      .orderBy(desc(teacherAudioMetrics.computedAt));

    if (options?.limit) {
      return await baseQuery.limit(options.limit);
    }

    // Additional filtering could be added here for date ranges
    return await baseQuery;
  }

  async getTeacherAudioMetricsAggregates(window?: string): Promise<Array<{
    mentorId: string;
    mentorName: string;
    encourageInvolvement: number;
    pleasantCommunication: number;
    avoidPersonalDetails: number;
    overallScore: number;
    totalClasses: number;
    highlightGreen: boolean;
    highlightRed: boolean;
  }>> {
    // Get aggregated metrics for all mentors
    const results = await db
      .select({
        mentorId: teacherAudioMetrics.mentorId,
        mentorName: sql<string>`COALESCE(users.first_name || ' ' || users.last_name, users.email)`,
        avgEncourageInvolvement: sql<number>`AVG(${teacherAudioMetrics.encourageInvolvement})`,
        avgPleasantCommunication: sql<number>`AVG(${teacherAudioMetrics.pleasantCommunication})`,
        avgAvoidPersonalDetails: sql<number>`AVG(${teacherAudioMetrics.avoidPersonalDetails})`,
        avgOverallScore: sql<number>`AVG(${teacherAudioMetrics.overallScore})`,
        totalClasses: sql<number>`COUNT(*)`
      })
      .from(teacherAudioMetrics)
      .leftJoin(mentors, eq(teacherAudioMetrics.mentorId, mentors.id))
      .leftJoin(users, eq(mentors.userId, users.id))
      .groupBy(teacherAudioMetrics.mentorId, users.firstName, users.lastName, users.email);

    return results.map((row: any) => ({
      mentorId: row.mentorId,
      mentorName: row.mentorName,
      encourageInvolvement: Math.round(row.avgEncourageInvolvement * 10) / 10,
      pleasantCommunication: Math.round(row.avgPleasantCommunication * 10) / 10,
      avoidPersonalDetails: Math.round(row.avgAvoidPersonalDetails * 10) / 10,
      overallScore: Math.round(row.avgOverallScore * 10) / 10,
      totalClasses: row.totalClasses,
      highlightGreen: row.avgOverallScore >= 9,
      highlightRed: row.avgEncourageInvolvement < 8 || row.avgPleasantCommunication < 8 || row.avgAvoidPersonalDetails < 8
    }));
  }

  async getTeacherAudioAggregate(mentorId: string): Promise<{
    encourageInvolvement: number;
    pleasantCommunication: number;
    avoidPersonalDetails: number;
    overallScore: number;
    totalClasses: number;
  } | undefined> {
    const [result] = await db
      .select({
        avgEncourageInvolvement: sql<number>`AVG(${teacherAudioMetrics.encourageInvolvement})`,
        avgPleasantCommunication: sql<number>`AVG(${teacherAudioMetrics.pleasantCommunication})`,
        avgAvoidPersonalDetails: sql<number>`AVG(${teacherAudioMetrics.avoidPersonalDetails})`,
        avgOverallScore: sql<number>`AVG(${teacherAudioMetrics.overallScore})`,
        totalClasses: sql<number>`COUNT(*)`
      })
      .from(teacherAudioMetrics)
      .where(eq(teacherAudioMetrics.mentorId, mentorId));

    if (!result || result.totalClasses === 0) return undefined;

    return {
      encourageInvolvement: Math.round(result.avgEncourageInvolvement * 10) / 10,
      pleasantCommunication: Math.round(result.avgPleasantCommunication * 10) / 10,
      avoidPersonalDetails: Math.round(result.avgAvoidPersonalDetails * 10) / 10,
      overallScore: Math.round(result.avgOverallScore * 10) / 10,
      totalClasses: result.totalClasses
    };
  }

  // Home Section Controls operations
  async getHomeSectionControls(): Promise<HomeSectionControls[]> {
    return await db.select().from(homeSectionControls).orderBy(homeSectionControls.displayOrder);
  }

  async updateHomeSectionControl(sectionType: string, sectionName: string, isEnabled: boolean): Promise<void> {
    await db.insert(homeSectionControls).values({
      sectionType,
      sectionName,
      isEnabled
    }).onConflictDoUpdate({
      target: [homeSectionControls.sectionType, homeSectionControls.sectionName],
      set: {
        isEnabled,
        updatedAt: sql`NOW()`
      }
    });

    console.log(`⚙️ Updated home section control: ${sectionType}.${sectionName} = ${isEnabled}`);
  }

  async getHomeSectionControlsForType(sectionType: 'teacher' | 'student'): Promise<HomeSectionControls[]> {
    return await db.select().from(homeSectionControls)
      .where(eq(homeSectionControls.sectionType, sectionType))
      .orderBy(homeSectionControls.displayOrder);
  }

}

export const storage = new DatabaseStorage();
