import {
  users,
  mentors,
  students,
  courses,
  courseEnrollments,
  bookings,
  bookingHolds,
  achievements,
  reviews,
  chatSessions,
  chatMessages,
  videoSessions,
  classFeedback,
  notifications,
  userSessions,
  emailOtps,
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
  type SelectBookingHold,
  type InsertBookingHold,
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
  azureStorageConfig,
  recordingParts,
  mergedRecordings,
  teacherSubjects,
  teacherQualifications,
  adminPaymentConfig,
  adminUiConfig,
  adminBookingLimits,
  sessionDossiers,
  teacherRestrictionAppeals,
  moderationWhitelist,
  type TeacherAudioMetrics,
  type InsertTeacherRestrictionAppeal,
  type SelectTeacherRestrictionAppeal,
  type InsertTeacherAudioMetrics,
  type HomeSectionControls,
  type InsertHomeSectionControls,
  type AzureStorageConfig,
  type RecordingPart,
  type InsertRecordingPart,
  type MergedRecording,
  type InsertMergedRecording,
  type TeacherSubject,
  type InsertTeacherSubject,
  type AdminPaymentConfig,
  type InsertAdminPaymentConfig,
  type AdminUiConfig,
  type InsertAdminUiConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, asc, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cache } from "./redis";
import { sendEmail } from "./email";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithRoleDataByEmail(email: string): Promise<{ user: User; student?: Student; mentor?: Mentor } | undefined>;
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
  getStudentByEmail(email: string): Promise<Student | undefined>;
  getStudentBookings(studentId: string): Promise<BookingWithDetails[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesByMentor(mentorId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<void>;
  deleteCourse(id: string): Promise<void>;
  
  // Course Enrollment operations
  createCourseEnrollment(enrollment: any): Promise<any>;
  getCourseEnrollment(id: string): Promise<any | undefined>;
  getCourseEnrollmentsByStudent(studentId: string): Promise<any[]>;
  getCourseEnrollmentsByMentor(mentorId: string): Promise<any[]>;
  getCourseEnrollmentsByCourse(courseId: string): Promise<any[]>;
  updateCourseEnrollmentStatus(id: string, status: string): Promise<void>;
  
  // Booking operations
  getBookings(): Promise<BookingWithDetails[]>;
  getBooking(id: string): Promise<BookingWithDetails | undefined>;
  getBookingsByStudent(studentId: string): Promise<BookingWithDetails[]>;
  getBookingsByMentor(mentorId: string): Promise<BookingWithDetails[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<void>;
  rescheduleBooking(id: string, newScheduledAt: Date): Promise<void>;
  cancelBooking(id: string): Promise<void>;
  
  // C4, C10: Booking hold operations
  createBookingHold(hold: InsertBookingHold): Promise<SelectBookingHold>;
  getBookingHold(id: string): Promise<SelectBookingHold | undefined>;
  getActiveBookingHolds(mentorId: string, scheduledAt: Date): Promise<SelectBookingHold[]>;
  confirmBookingHold(holdId: string, bookingId: string): Promise<void>;
  releaseBookingHold(holdId: string): Promise<void>;
  cleanupExpiredHolds(): Promise<number>;
  
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
  
  // Email OTP operations (for dual 2FA)
  sendEmailOTP(email: string): Promise<void>;
  verifyEmailOTP(email: string, otp: string): Promise<{ valid: boolean; userId?: string }>;
  
  // Teacher Profile operations
  createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile>;
  getTeacherProfile(userId: string): Promise<TeacherProfile | undefined>;
  updateTeacherProfile(userId: string, updates: Partial<InsertTeacherProfile>): Promise<void>;
  
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
  getSystemStats(): Promise<{
    totalUsers: number;
    totalMentors: number;
    totalStudents: number;
    totalBookings: number;
    completedBookings: number;
    completionRate: number;
    activeClasses: number;
    monthlyRevenue: number;
  }>;
  getFinanceAnalytics(): Promise<{
    totalAdminRevenue: number;
    totalTeacherPayouts: number;
    totalRefunds: number;
    totalTransactionFees: number;
    conflictAmount: number;
    studentsCount: number;
    teachersCount: number;
    pendingRefunds: number;
    pendingRefundsCount: number;
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
  
  // Recording Parts operations (Azure Storage)
  createRecordingPart(part: any): Promise<any>;
  getRecordingPartsByBooking(bookingId: string): Promise<any[]>;
  updateRecordingPartStatus(id: string, status: string): Promise<void>;
  updateRecordingPartsMergeStatus(bookingId: string, status: string): Promise<void>;
  createMergedRecording(recording: any): Promise<any>;
  getMergedRecordingByBooking(bookingId: string): Promise<any | undefined>;
  getMergedRecordingsForStudent(studentId: string): Promise<any[]>;
  getAzureStorageConfig(): Promise<any | undefined>;
  getBookingsForMerge(twentyMinutesAgo: Date): Promise<Booking[]>;
  getEndedScheduledBookings(): Promise<Booking[]>;
  
  // Recording Retention operations
  getExpiredRecordings(): Promise<any[]>;
  deleteMergedRecording(id: string): Promise<void>;
  deleteRecordingPartsByBooking(bookingId: string): Promise<void>;
  
  // Teacher Subject Fee operations
  getTeacherSubjectsByMentor(mentorId: string): Promise<TeacherSubject[]>;
  createTeacherSubject(mentorId: string, subject: string, experience: string, classFee?: number): Promise<TeacherSubject>;
  updateTeacherSubjectFee(subjectId: string, classFee: number): Promise<void>;
  getTeacherSubjectFee(mentorId: string, subject: string): Promise<number | null>;
  
  // Admin Payment Configuration operations
  getAdminPaymentConfig(): Promise<AdminPaymentConfig | undefined>;
  updateAdminPaymentConfig(
    paymentMode?: 'dummy' | 'realtime',
    razorpayMode?: 'upi' | 'api_keys',
    enableRazorpay?: boolean,
    adminUpiId?: string
  ): Promise<void>;
  
  // Admin UI Configuration operations
  getAdminUiConfig(): Promise<AdminUiConfig | undefined>;
  updateAdminUiConfig(config: { 
    footerLinks?: any; 
    showHelpCenter?: boolean; 
    abusiveLanguageMonitoring?: boolean;
    studentDashboardLinks?: any;
    teacherDashboardLinks?: any;
  }): Promise<void>;
  
  // Admin Booking Limits Configuration operations
  getAdminBookingLimits(): Promise<any | undefined>;
  updateAdminBookingLimits(config: { dailyBookingLimit?: number; weeklyBookingLimit?: number | null; enableWeeklyLimit?: boolean }): Promise<void>;
  
  // AI Moderation Session Dossier operations
  getSessionDossierById(dossierId: string): Promise<any | undefined>;
  
  // Teacher Restriction Appeals operations
  createTeacherRestrictionAppeal(appeal: InsertTeacherRestrictionAppeal): Promise<SelectTeacherRestrictionAppeal>;
  getTeacherRestrictionAppealsByTeacher(teacherId: string): Promise<SelectTeacherRestrictionAppeal[]>;
  getAllTeacherRestrictionAppeals(): Promise<SelectTeacherRestrictionAppeal[]>;
  getTeacherRestrictionAppeal(id: string): Promise<SelectTeacherRestrictionAppeal | undefined>;
  updateTeacherRestrictionAppealStatus(id: string, status: 'approved' | 'rejected', adminNotes: string, reviewedBy: string): Promise<void>;
  
  // Moderation Whitelist operations
  createModerationWhitelist(data: { contentPattern: string; subjectName?: string | null; modality: 'video' | 'audio' | 'text'; originalLogId?: string | null; addedBy: string; reason?: string | null }): Promise<any>;
  getAllModerationWhitelist(): Promise<any[]>;
  getModerationWhitelistBySubject(subjectName: string, modality?: 'video' | 'audio' | 'text'): Promise<any[]>;
  deleteModerationWhitelist(id: string): Promise<void>;
  
  // Azure Storage Config operations
  updateAzureStorageConfig(config: { storageAccountName: string; containerName: string; retentionMonths: number }): Promise<any>;
  
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

  async getUserWithRoleDataByEmail(email: string): Promise<{ user: User; student?: Student; mentor?: Mentor } | undefined> {
    // Try cache first
    const cacheKey = `user:email:${email}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // If not cached, fetch from database
    const result = await db
      .select()
      .from(users)
      .leftJoin(students, eq(users.id, students.userId))
      .leftJoin(mentors, eq(users.id, mentors.userId))
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      return undefined;
    }

    const row = result[0];
    const userData = {
      user: row.users,
      student: row.students || undefined,
      mentor: row.mentors || undefined,
    };

    // Cache for 5 minutes (300 seconds)
    await cache.set(cacheKey, userData, 300);

    return userData;
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
    // Try cache first - mentors data changes rarely
    const cacheKey = 'mentors:list';
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit: mentors list');
      return cached;
    }

    console.log('❌ Cache miss: mentors list - fetching from DB');

    const result = await db
      .select()
      .from(mentors)
      .leftJoin(users, eq(mentors.userId, users.id))
      .where(eq(mentors.isActive, true))
      .orderBy(desc(mentors.rating));

    // Get all bookings to calculate actual student counts
    const allBookings = await db.select().from(bookings);
    
    // Get all reviews to calculate ratings
    const allReviews = await db.select().from(reviews);

    // Get all teacher subjects - Use raw SQL as workaround for Drizzle ORM issue
    let allTeacherSubjects: any[] = [];
    try {
      const rawSubjects = await db.execute(sql`SELECT * FROM teacher_subjects`);
      allTeacherSubjects = rawSubjects.rows.map((row: any) => ({
        id: row.id,
        mentorId: row.mentor_id,
        subject: row.subject,
        experience: row.experience,
        classFee: row.class_fee,
        priority: row.priority,
        createdAt: row.created_at
      }));
      console.log(`📚 [DEBUG] Loaded ${allTeacherSubjects.length} teacher subjects using raw SQL`);
    } catch (error) {
      console.error(`📚 [DEBUG] ERROR fetching teacherSubjects:`, error);
    }

    // Get all teacher qualifications
    const allTeacherQualifications = await db.select().from(teacherQualifications);

    // Get all teacher profiles to fetch signup subjects
    const allTeacherProfiles = await db.select().from(teacherProfiles);

    const mentorsData = result.map(({ mentors: mentor, users: user }: any) => {
      // Calculate actual unique students for this mentor
      const mentorBookings = allBookings.filter((b: any) => b.mentorId === mentor.id);
      const uniqueStudentIds = new Set(mentorBookings.map((b: any) => b.studentId));
      const actualStudentCount = uniqueStudentIds.size;

      // Calculate rating from reviews
      const mentorReviews = allReviews.filter((r: any) => r.mentorId === mentor.id);
      let calculatedRating = "0.00";
      if (mentorReviews.length > 0) {
        const totalRating = mentorReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
        const avgRating = totalRating / mentorReviews.length;
        calculatedRating = avgRating.toFixed(2);
      }

      // Get subjects for this mentor from teacherSubjects table
      const mentorSubjects = allTeacherSubjects.filter((s: any) => s.mentorId === mentor.id);
      
      // Get qualifications for this mentor from teacherQualifications table
      const mentorQualifications = allTeacherQualifications.filter((q: any) => q.mentorId === mentor.id);

      // Get signup subjects from teacher profiles (these are the specialties)
      const teacherProfile = allTeacherProfiles.find((p: any) => p.userId === user?.id);
      const signupSubjects = teacherProfile?.subjects || [];

      // Calculate total experience from signup subjects (specialties)
      let totalExperience = mentor.experience || 0;
      if (signupSubjects.length > 0) {
        const summedExperience = signupSubjects.reduce(
          (sum: number, subj: any) => {
            const exp = parseInt(subj.experience) || 0;
            return sum + exp;
          }, 
          0
        );
        if (summedExperience > 0) {
          totalExperience = summedExperience;
        }
      }

      return {
        ...mentor,
        rating: calculatedRating,
        totalStudents: actualStudentCount,
        experience: totalExperience,
        specialties: mentor.specialties || [],
        signupSubjects: signupSubjects,
        subjects: mentorSubjects,
        qualifications: mentorQualifications,
        user: user!,
      };
    });

    // Cache for 5 minutes (mentors list changes rarely)
    await cache.set(cacheKey, mentorsData, 300);

    return mentorsData;
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

    // Calculate rating from reviews
    const mentorReviews = await db.select().from(reviews).where(eq(reviews.mentorId, id));
    let calculatedRating = "0.00";
    if (mentorReviews.length > 0) {
      const totalRating = mentorReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
      const avgRating = totalRating / mentorReviews.length;
      calculatedRating = avgRating.toFixed(2);
    }

    // Get subjects for this mentor from teacherSubjects table
    const mentorSubjects = await db.select().from(teacherSubjects).where(eq(teacherSubjects.mentorId, id));
    
    // Get qualifications for this mentor from teacherQualifications table
    const mentorQualifications = await db.select().from(teacherQualifications).where(eq(teacherQualifications.mentorId, id));
    
    // Get signup subjects from teacher profiles (these are the specialties)
    const [teacherProfile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, result.users?.id!));
    const signupSubjects = teacherProfile?.subjects || [];
    
    // Calculate total experience from signup subjects (specialties)
    let totalExperience = result.mentors.experience || 0;
    if (signupSubjects.length > 0) {
      const summedExperience = signupSubjects.reduce(
        (sum: number, subj: any) => {
          const exp = parseInt(subj.experience) || 0;
          return sum + exp;
        }, 
        0
      );
      if (summedExperience > 0) {
        totalExperience = summedExperience;
      }
    }

    return {
      ...result.mentors,
      rating: calculatedRating,
      totalStudents: actualStudentCount,
      experience: totalExperience,
      specialties: result.mentors.specialties || [],
      signupSubjects: signupSubjects,
      subjects: mentorSubjects,
      qualifications: mentorQualifications,
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
    
    // Invalidate mentor list cache (new mentor added)
    await cache.del('mentors:list');
    
    return mentor;
  }

  async updateMentorRating(mentorId: string, rating: number): Promise<void> {
    await db
      .update(mentors)
      .set({ rating: rating.toString() })
      .where(eq(mentors.id, mentorId));
    
    // Invalidate mentor list cache (ratings changed)
    await cache.del('mentors:list');
  }

  async updateMentorHourlyRate(mentorId: string, hourlyRate: string): Promise<void> {
    await db
      .update(mentors)
      .set({ hourlyRate: hourlyRate })
      .where(eq(mentors.id, mentorId));
    
    // Invalidate mentor list cache (pricing changed)
    await cache.del('mentors:list');
  }

  async updateMentorUpiId(mentorId: string, upiId: string): Promise<void> {
    await db
      .update(mentors)
      .set({ upiId: upiId })
      .where(eq(mentors.id, mentorId));
    
    // Invalidate mentor list cache
    await cache.del('mentors:list');
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

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    // First find the user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return undefined;
    
    // Then get the student by userId
    const [student] = await db.select().from(students).where(eq(students.userId, user.id));
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
    const studentUsers = alias(users, 'studentUsers');
    const mentorUsers = alias(users, 'mentorUsers');
    
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
      .leftJoin(studentUsers, eq(students.userId, studentUsers.id))
      .leftJoin(mentorUsers, eq(mentors.userId, mentorUsers.id))
      .where(eq(bookings.id, id));

    if (!result) return undefined;

    return {
      ...result.bookings,
      student: { ...result.students!, user: result.studentUsers! },
      mentor: { ...result.mentors!, user: result.mentorUsers! },
    };
  }

  async getMentorByUserId(userId: string): Promise<Mentor | undefined> {
    const [mentor] = await db.select().from(mentors).where(eq(mentors.userId, userId));
    return mentor;
  }
  
  async updateUser(id: string, updates: Partial<InsertUser>): Promise<void> {
    // Get user email for cache invalidation
    const user = await this.getUser(id);
    
    // Update user in database
    await db.update(users).set(updates).where(eq(users.id, id));
    
    // Invalidate cache
    if (user?.email) {
      await cache.del(`user:email:${user.email}`);
    }
    
    // If email was updated, also invalidate the new email cache
    if ('email' in updates && updates.email && updates.email !== user?.email) {
      await cache.del(`user:email:${updates.email}`);
    }
  }
  
  async deleteUser(id: string): Promise<void> {
    // Get user email for cache invalidation
    const user = await this.getUser(id);
    
    // Delete user from database
    await db.delete(users).where(eq(users.id, id));
    
    // Invalidate cache
    if (user?.email) {
      await cache.del(`user:email:${user.email}`);
    }
  }

  async getBookingsByStudent(studentId: string): Promise<BookingWithDetails[]> {
    // Try cache first
    const cacheKey = `bookings:student:${studentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: bookings for student ${studentId}`);
      return cached;
    }

    console.log(`❌ Cache miss: bookings for student ${studentId} - fetching from DB`);

    const studentUsers = alias(users, 'studentUsers');
    const mentorUsers = alias(users, 'mentorUsers');
    
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(studentUsers, eq(students.userId, studentUsers.id))
      .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
      .leftJoin(mentorUsers, eq(mentors.userId, mentorUsers.id))
      .where(eq(bookings.studentId, studentId))
      .orderBy(desc(bookings.scheduledAt));

    console.log('📊 [DEBUG] First row keys:', result[0] ? Object.keys(result[0]) : 'No results');
    if (result[0]) {
      console.log('📊 [DEBUG] Student user:', result[0].studentUsers);
      console.log('📊 [DEBUG] Mentor user:', result[0].mentorUsers);
    }

    const bookingsData = result.map((row: any) => ({
      ...row.bookings,
      student: { ...row.students!, user: row.studentUsers! },
      mentor: { ...row.mentors!, user: row.mentorUsers! },
    }));

    // Cache for 2 minutes (bookings change more frequently)
    await cache.set(cacheKey, bookingsData, 120);

    return bookingsData;
  }

  async getBookingsByMentor(mentorId: string): Promise<BookingWithDetails[]> {
    // Try cache first
    const cacheKey = `bookings:mentor:${mentorId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: bookings for mentor ${mentorId}`);
      return cached;
    }

    console.log(`❌ Cache miss: bookings for mentor ${mentorId} - fetching from DB`);

    const studentUsers = alias(users, 'studentUsers');
    const mentorUsers = alias(users, 'mentorUsers');
    
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(studentUsers, eq(students.userId, studentUsers.id))
      .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
      .leftJoin(mentorUsers, eq(mentors.userId, mentorUsers.id))
      .where(eq(bookings.mentorId, mentorId))
      .orderBy(desc(bookings.scheduledAt));

    const bookingsData = result.map((row: any) => ({
      ...row.bookings,
      student: { ...row.students!, user: row.studentUsers! },
      mentor: { ...row.mentors!, user: row.mentorUsers! },
    }));

    // Cache for 2 minutes
    await cache.set(cacheKey, bookingsData, 120);

    return bookingsData;
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    
    // Invalidate cache for student bookings and mentor list
    await cache.del(`bookings:student:${booking.studentId}`);
    await cache.del(`bookings:mentor:${booking.mentorId}`);
    await cache.del('mentors:list'); // Mentor stats may change
    
    return booking;
  }

  async updateBookingStatus(id: string, status: string): Promise<void> {
    // Get booking to know which caches to invalidate
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    
    await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id));
    
    // Invalidate cache
    if (booking) {
      await cache.del(`bookings:student:${booking.studentId}`);
      await cache.del(`bookings:mentor:${booking.mentorId}`);
      await cache.del('mentors:list');
    }
  }

  async rescheduleBooking(id: string, newScheduledAt: Date): Promise<void> {
    // Get booking to know which caches to invalidate
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    
    await db
      .update(bookings)
      .set({ scheduledAt: newScheduledAt, updatedAt: new Date() })
      .where(eq(bookings.id, id));
    
    // Invalidate cache
    if (booking) {
      await cache.del(`bookings:student:${booking.studentId}`);
      await cache.del(`bookings:mentor:${booking.mentorId}`);
    }
  }

  async cancelBooking(id: string): Promise<void> {
    // Get booking to know which caches to invalidate
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    
    await db
      .update(bookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(bookings.id, id));
    
    // Invalidate cache
    if (booking) {
      await cache.del(`bookings:student:${booking.studentId}`);
      await cache.del(`bookings:mentor:${booking.mentorId}`);
      await cache.del('mentors:list');
    }
  }

  // C4, C10: Booking hold operations
  async createBookingHold(hold: InsertBookingHold): Promise<SelectBookingHold> {
    const [created] = await db.insert(bookingHolds).values(hold).returning();
    return created;
  }

  async getBookingHold(id: string): Promise<SelectBookingHold | undefined> {
    const [hold] = await db.select().from(bookingHolds).where(eq(bookingHolds.id, id));
    return hold;
  }

  async getActiveBookingHolds(mentorId: string, scheduledAt: Date): Promise<SelectBookingHold[]> {
    const holds = await db
      .select()
      .from(bookingHolds)
      .where(
        and(
          eq(bookingHolds.mentorId, mentorId),
          eq(bookingHolds.scheduledAt, scheduledAt),
          eq(bookingHolds.status, 'active')
        )
      );
    return holds;
  }

  // Feature Gap #4: Atomic first-confirm-wins with database locking
  async confirmBookingHold(holdId: string, bookingId: string): Promise<void> {
    // Use transaction with SELECT FOR UPDATE to prevent race conditions
    await db.transaction(async (tx) => {
      // Step 1: Lock the hold row exclusively using raw SQL (first-come-first-served)
      // This ensures only one transaction can proceed at a time for this hold
      const lockResult = await tx.execute(
        sql`SELECT * FROM ${bookingHolds} WHERE ${bookingHolds.id} = ${holdId} FOR UPDATE`
      );
      
      const rawHold = lockResult.rows[0] as any;
      
      if (!rawHold) {
        throw new Error('Booking hold not found');
      }
      
      // Map PostgreSQL snake_case to camelCase
      const hold = {
        id: rawHold.id,
        studentId: rawHold.student_id,
        mentorId: rawHold.mentor_id,
        scheduledAt: new Date(rawHold.scheduled_at),
        duration: rawHold.duration,
        sessionType: rawHold.session_type,
        status: rawHold.status,
        expiresAt: new Date(rawHold.expires_at),
        bookingId: rawHold.booking_id,
        confirmedAt: rawHold.confirmed_at ? new Date(rawHold.confirmed_at) : null,
        createdAt: new Date(rawHold.created_at)
      };
      
      // Step 2: Verify hold is still active and not expired
      if (hold.status !== 'active') {
        throw new Error(`Cannot confirm hold: status is ${hold.status}`);
      }
      
      const now = new Date();
      if (hold.expiresAt < now) {
        throw new Error('Booking hold has expired');
      }
      
      // Step 3: Double-check no other confirmed holds exist for this slot (extra safety)
      const conflictingHolds = await tx
        .select()
        .from(bookingHolds)
        .where(
          and(
            eq(bookingHolds.mentorId, hold.mentorId),
            eq(bookingHolds.scheduledAt, hold.scheduledAt),
            eq(bookingHolds.status, 'confirmed')
          )
        );
      
      if (conflictingHolds.length > 0) {
        throw new Error('Time slot already confirmed by another student');
      }
      
      // Step 4: Confirm the hold (transaction ensures atomicity)
      await tx
        .update(bookingHolds)
        .set({ 
          status: 'confirmed',
          bookingId,
          confirmedAt: now
        })
        .where(eq(bookingHolds.id, holdId));
    });
  }

  async releaseBookingHold(holdId: string): Promise<void> {
    await db
      .update(bookingHolds)
      .set({ status: 'released' })
      .where(eq(bookingHolds.id, holdId));
  }

  async cleanupExpiredHolds(): Promise<number> {
    const now = new Date();
    const result = await db
      .update(bookingHolds)
      .set({ status: 'expired' })
      .where(
        and(
          eq(bookingHolds.status, 'active'),
          sql`${bookingHolds.expiresAt} < ${now}`
        )
      );
    return result.rowCount || 0;
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

  // Course Enrollment operations
  async createCourseEnrollment(enrollmentData: any): Promise<any> {
    const { randomUUID } = await import('crypto');
    const processedData = {
      ...enrollmentData,
      id: randomUUID(),
      weeklySchedule: enrollmentData.weeklySchedule || []
    };
    
    const [enrollment] = await db.insert(courseEnrollments).values([processedData]).returning();
    return enrollment;
  }

  async getCourseEnrollmentsByStudent(studentId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(courseEnrollments)
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .leftJoin(mentors, eq(courseEnrollments.mentorId, mentors.id))
      .leftJoin(users, eq(mentors.userId, users.id))
      .where(eq(courseEnrollments.studentId, studentId))
      .orderBy(desc(courseEnrollments.enrolledAt));

    return result.map((row: any) => ({
      ...row.course_enrollments,
      course: row.courses,
      mentor: row.mentors ? { ...row.mentors, user: row.users } : null,
    }));
  }

  async getCourseEnrollmentsByMentor(mentorId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(courseEnrollments)
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .leftJoin(students, eq(courseEnrollments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(courseEnrollments.mentorId, mentorId))
      .orderBy(desc(courseEnrollments.enrolledAt));

    return result.map((row: any) => ({
      ...row.course_enrollments,
      course: row.courses,
      student: row.students ? { ...row.students, user: row.users } : null,
    }));
  }

  async getCourseEnrollmentsByCourse(courseId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(courseEnrollments)
      .leftJoin(students, eq(courseEnrollments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          eq(courseEnrollments.status, 'active')
        )
      )
      .orderBy(desc(courseEnrollments.enrolledAt));

    return result.map((row: any) => ({
      ...row.course_enrollments,
      studentName: row.users ? `${row.users.firstName} ${row.users.lastName}` : 'Unknown Student',
      studentEmail: row.users?.email,
      student: row.students ? { ...row.students, user: row.users } : null,
    }));
  }

  async getCourseEnrollment(id: string): Promise<any | undefined> {
    const [result] = await db
      .select()
      .from(courseEnrollments)
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .leftJoin(mentors, eq(courseEnrollments.mentorId, mentors.id))
      .leftJoin(students, eq(courseEnrollments.studentId, students.id))
      .where(eq(courseEnrollments.id, id))
      .limit(1);

    if (!result) return undefined;

    return {
      ...result.course_enrollments,
      course: result.courses,
      mentor: result.mentors,
      student: result.students,
    };
  }

  async updateCourseEnrollmentStatus(id: string, status: string): Promise<void> {
    await db
      .update(courseEnrollments)
      .set({ status, updatedAt: new Date() })
      .where(eq(courseEnrollments.id, id));
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
    
    // Invalidate mentor list cache (ratings changed)
    await cache.del('mentors:list');
    
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

  async getChatMessages(bookingId: string): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.bookingId, bookingId))
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
    
    // Update the booking status to "completed" when feedback is submitted
    await db
      .update(bookings)
      .set({ status: 'completed' })
      .where(eq(bookings.id, (feedbackData as any).bookingId));
    
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
    
    // Also insert qualifications into teacher_qualifications table if mentor exists
    if (processedData.qualifications && processedData.qualifications.length > 0 && processedData.userId) {
      // Get mentor by userId
      const [mentor] = await db.select().from(mentors).where(eq(mentors.userId, processedData.userId));
      
      if (mentor) {
        const { randomUUID } = await import('crypto');
        const qualificationsToInsert = processedData.qualifications.map((qual: any, index: number) => ({
          id: randomUUID(),
          mentorId: mentor.id,
          qualification: qual.qualification || '',
          specialization: qual.specialization || '',
          score: qual.score || '',
          priority: index + 1  // 1=highest, 2=second, 3=third
        }));
        
        await db.insert(teacherQualifications).values(qualificationsToInsert);
        console.log(`✅ Inserted ${qualificationsToInsert.length} qualifications for mentor ${mentor.id}`);
      }
    }
    
    return profile;
  }

  async getTeacherProfile(userId: string): Promise<TeacherProfile | undefined> {
    const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
    return profile;
  }

  async updateTeacherProfile(userId: string, updates: Partial<InsertTeacherProfile>): Promise<void> {
    const processedUpdates: any = { ...updates };
    
    // Process array fields safely
    if (processedUpdates.achievements) {
      processedUpdates.achievements = Array.from(processedUpdates.achievements as any[]);
    }
    if (processedUpdates.qualifications) {
      processedUpdates.qualifications = Array.from(processedUpdates.qualifications as any[]);
    }
    if (processedUpdates.programmingLanguages) {
      processedUpdates.programmingLanguages = Array.from(processedUpdates.programmingLanguages as any[]);
    }
    if (processedUpdates.subjects) {
      processedUpdates.subjects = Array.from(processedUpdates.subjects as any[]);
    }
    
    await db
      .update(teacherProfiles)
      .set(processedUpdates)
      .where(eq(teacherProfiles.userId, userId));
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
    pendingRefunds: number;
    pendingRefundsCount: number;
  }> {
    // Get user counts
    const allUsers = await db.select().from(users);
    const studentsCount = allUsers.filter((u: User) => u.role === 'student').length;
    const teachersCount = allUsers.filter((u: User) => u.role === 'mentor').length;

    // Get completed bookings with their class fees from teacherSubjects
    const completedBookingsWithFees = await db.select({
      id: bookings.id,
      status: bookings.status,
      classFee: sql<number>`COALESCE(${teacherSubjects.classFee}::numeric, 150)`
    })
    .from(bookings)
    .leftJoin(teacherSubjects, and(
      eq(teacherSubjects.mentorId, bookings.mentorId),
      eq(teacherSubjects.subject, bookings.subject)
    ))
    .where(eq(bookings.status, 'completed'));

    // Get cancelled bookings for refunds
    const cancelledBookingsWithFees = await db.select({
      id: bookings.id,
      status: bookings.status,
      classFee: sql<number>`COALESCE(${teacherSubjects.classFee}::numeric, 150)`
    })
    .from(bookings)
    .leftJoin(teacherSubjects, and(
      eq(teacherSubjects.mentorId, bookings.mentorId),
      eq(teacherSubjects.subject, bookings.subject)
    ))
    .where(eq(bookings.status, 'cancelled'));

    // Get unsettled finance conflicts
    const conflicts = await db
      .select()
      .from(unsettledFinances)
      .where(eq(unsettledFinances.status, 'open'));

    // Get active transaction fee configuration
    const feeConfig = await this.getActiveTransactionFeeConfig();
    const platformFeePercent = feeConfig ? (parseFloat(feeConfig.feePercentage || '0') / 100) : 0.02;

    // Calculate financial metrics from bookings
    const totalAdminRevenue = completedBookingsWithFees.reduce((sum: number, b: any) => sum + Number(b.classFee), 0);
    const totalRefunds = cancelledBookingsWithFees.reduce((sum: number, b: any) => sum + Number(b.classFee), 0);
    
    // Platform fee from config (or default 2%)
    const totalTransactionFees = totalAdminRevenue * platformFeePercent;
    
    // Teacher payouts = revenue - platform fees
    const totalTeacherPayouts = totalAdminRevenue - totalTransactionFees;

    // Pending refunds (same as total refunds for now)
    const pendingRefunds = totalRefunds;
    const pendingRefundsCount = cancelledBookingsWithFees.length;

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
      pendingRefunds,
      pendingRefundsCount,
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
    activeClasses: number;
    monthlyRevenue: number;
  }> {
    const allUsers = await db.select().from(users);
    const allMentors = await db.select().from(mentors);
    const allStudents = await db.select().from(students);
    const allBookings = await db.select().from(bookings);
    const completedBookingsList = await db.select().from(bookings).where(eq(bookings.status, 'completed'));
    
    // Get active classes (scheduled bookings from all students)
    const activeClasses = await db.select().from(bookings).where(eq(bookings.status, 'scheduled'));
    
    // Calculate monthly revenue from completed bookings with actual class fees
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get bookings with their class fees from teacherSubjects
    const bookingsWithFees = await db.select({
      id: bookings.id,
      scheduledAt: bookings.scheduledAt,
      duration: bookings.duration,
      status: bookings.status,
      subject: bookings.subject,
      mentorId: bookings.mentorId,
      classFee: sql<number>`COALESCE(${teacherSubjects.classFee}::numeric, 150)`
    })
    .from(bookings)
    .leftJoin(teacherSubjects, and(
      eq(teacherSubjects.mentorId, bookings.mentorId),
      eq(teacherSubjects.subject, bookings.subject)
    ))
    .where(ne(bookings.status, 'cancelled'));
    
    // Filter for completed bookings this month (same logic as teacher stats)
    const monthlyCompletedBookings = bookingsWithFees.filter((b: any) => {
      const bookingDate = new Date(b.scheduledAt);
      if (bookingDate < firstDayOfMonth) return false;
      
      // Check if completed or past its end time
      if (b.status === 'completed') return true;
      if (b.status === 'scheduled') {
        const classEndTime = new Date(new Date(b.scheduledAt).getTime() + b.duration * 60000);
        return now >= classEndTime;
      }
      return false;
    });
    
    const monthlyRevenue = monthlyCompletedBookings.reduce((sum: number, b: any) => {
      return sum + (Number(b.classFee) || 0);
    }, 0);

    return {
      totalUsers: allUsers.length || 0,
      totalMentors: allMentors.length || 0,
      totalStudents: allStudents.length || 0,
      totalBookings: allBookings.length || 0,
      completedBookings: completedBookingsList.length || 0,
      completionRate: allBookings.length > 0 ? (completedBookingsList.length / allBookings.length) * 100 : 0,
      activeClasses: activeClasses.length || 0,
      monthlyRevenue: monthlyRevenue || 0
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

  async deleteUserSessions(userId: string): Promise<void> {
    await db.delete(userSessions)
      .where(eq(userSessions.userId, userId));
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await db.delete(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
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

  // Email OTP operations (for dual 2FA)
  // TODO: Add automated cleanup job to delete expired emailOtp rows (expiresAt < NOW())
  // to prevent table bloat and reduce brute-force attack surface
  async sendEmailOTP(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP before storing
    const bcrypt = await import('bcrypt');
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Store OTP in database with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(emailOtps).values({
      email: user.email,
      otpHash: hashedOtp,
      purpose: 'login',
      expiresAt,
      attempts: 0
    });
    
    // Send email with OTP
    await sendEmail({
      to: user.email,
      subject: 'Your CodeConnect Login Code',
      text: `Your CodeConnect Login Code: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Your Login Code</h2>
          <p>Enter this code to complete your login:</p>
          <div style="background: #F3F4F6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes.</p>
          <p style="color: #6B7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    });
  }

  async verifyEmailOTP(email: string, otp: string): Promise<{ valid: boolean; userId?: string }> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return { valid: false };
    }

    // Get the most recent OTP for this user
    const [otpRecord] = await db.select()
      .from(emailOtps)
      .where(and(
        eq(emailOtps.email, user.email),
        eq(emailOtps.verified, false)
      ))
      .orderBy(desc(emailOtps.createdAt))
      .limit(1);

    if (!otpRecord) {
      return { valid: false };
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      return { valid: false };
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= 5) {
      return { valid: false };
    }

    // Verify OTP
    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValid) {
      // Increment attempts
      await db.update(emailOtps)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(emailOtps.id, otpRecord.id));
      return { valid: false };
    }

    // Mark OTP as verified
    await db.update(emailOtps)
      .set({ verified: true })
      .where(eq(emailOtps.id, otpRecord.id));

    return { valid: true, userId: user.id };
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

    // Convert to number to handle both string "0" and number 0
    if (!result || Number(result.totalClasses) === 0) return undefined;

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

  // Recording Parts operations (Azure Storage)
  async createRecordingPart(part: any): Promise<any> {
    const { randomUUID } = await import('crypto');
    const partWithId = {
      ...part,
      id: part.id || randomUUID()
    };
    const [created] = await db.insert(recordingParts).values(partWithId).returning();
    return created;
  }

  async getRecordingPartsByBooking(bookingId: string): Promise<RecordingPart[]> {
    return await db.select().from(recordingParts)
      .where(eq(recordingParts.bookingId, bookingId))
      .orderBy(recordingParts.partNumber);
  }

  async updateRecordingPartStatus(id: string, status: string): Promise<void> {
    await db.update(recordingParts)
      .set({ status })
      .where(eq(recordingParts.id, id));
  }

  async createMergedRecording(recording: any): Promise<any> {
    const { randomUUID } = await import('crypto');
    const recordingWithId = {
      ...recording,
      id: recording.id || randomUUID()
    };
    const [created] = await db.insert(mergedRecordings).values(recordingWithId).returning();
    return created;
  }

  async getMergedRecordingByBooking(bookingId: string): Promise<MergedRecording | undefined> {
    const [recording] = await db.select().from(mergedRecordings)
      .where(eq(mergedRecordings.bookingId, bookingId));
    return recording;
  }

  async getMergedRecordingsForStudent(studentId: string): Promise<Array<MergedRecording & { booking: BookingWithDetails }>> {
    const recordings = await db.select()
      .from(mergedRecordings)
      .innerJoin(bookings, eq(mergedRecordings.bookingId, bookings.id))
      .where(
        and(
          eq(bookings.studentId, studentId),
          eq(mergedRecordings.status, 'completed')  // Changed from 'active' to 'completed'
        )
      )
      .orderBy(desc(bookings.scheduledAt));

    const results = [];
    for (const row of recordings) {
      const booking = await this.getBooking(row.bookings.id);
      if (booking) {
        results.push({
          ...row.merged_recordings,
          booking
        });
      }
    }
    
    return results;
  }

  async getAzureStorageConfig(): Promise<AzureStorageConfig | undefined> {
    const [config] = await db.select().from(azureStorageConfig)
      .where(eq(azureStorageConfig.isActive, true))
      .limit(1);
    return config;
  }

  async updateRecordingPartsMergeStatus(bookingId: string, status: string): Promise<void> {
    await db.update(recordingParts)
      .set({ status })
      .where(eq(recordingParts.bookingId, bookingId));
  }

  async getBookingsForMerge(twentyMinutesAgo: Date): Promise<Booking[]> {
    const result = await db.select().from(bookings)
      .where(
        and(
          eq(bookings.status, 'completed'),
          sql`${bookings.scheduledAt} <= ${twentyMinutesAgo}`
        )
      );
    
    const bookingsWithParts = [];
    for (const booking of result) {
      const parts = await this.getRecordingPartsByBooking(booking.id);
      const merged = await this.getMergedRecordingByBooking(booking.id);
      
      if (parts.length > 0 && !merged) {
        const firstPartStatus = parts[0]?.status;
        if (firstPartStatus !== 'merging' && firstPartStatus !== 'merge_failed') {
          bookingsWithParts.push(booking);
        }
      }
    }
    
    return bookingsWithParts;
  }

  async getEndedScheduledBookings(): Promise<Booking[]> {
    const now = new Date();
    
    // Find all 'scheduled' bookings where (scheduledAt + duration) < now
    const result = await db.select().from(bookings)
      .where(
        and(
          eq(bookings.status, 'scheduled'),
          sql`${bookings.scheduledAt} + (${bookings.duration} || ' minutes')::interval < ${now}`
        )
      );
    
    return result;
  }

  // Recording Retention operations
  async getExpiredRecordings(): Promise<MergedRecording[]> {
    const now = new Date();
    return await db.select().from(mergedRecordings)
      .where(
        and(
          sql`${mergedRecordings.expiresAt} <= ${now}`,
          eq(mergedRecordings.status, 'active')
        )
      );
  }

  async deleteMergedRecording(id: string): Promise<void> {
    await db.update(mergedRecordings)
      .set({ status: 'deleted' })
      .where(eq(mergedRecordings.id, id));
  }

  async deleteRecordingPartsByBooking(bookingId: string): Promise<void> {
    await db.update(recordingParts)
      .set({ status: 'deleted' })
      .where(eq(recordingParts.bookingId, bookingId));
  }

  // Teacher Subject Fee operations
  async getTeacherSubjectsByMentor(mentorId: string): Promise<TeacherSubject[]> {
    return await db
      .select()
      .from(teacherSubjects)
      .where(eq(teacherSubjects.mentorId, mentorId))
      .orderBy(teacherSubjects.priority);
  }

  async createTeacherSubject(mentorId: string, subject: string, experience: string, classFee?: number): Promise<TeacherSubject> {
    const [teacherSubject] = await db
      .insert(teacherSubjects)
      .values({
        mentorId,
        subject,
        experience,
        classFee: classFee ? classFee.toString() : "500.00",
        priority: 1
      })
      .returning();
    return teacherSubject;
  }

  async updateTeacherSubjectFee(subjectId: string, classFee: number): Promise<void> {
    await db
      .update(teacherSubjects)
      .set({ classFee: classFee.toString() })
      .where(eq(teacherSubjects.id, subjectId));
  }

  async getTeacherSubjectFee(mentorId: string, subject: string): Promise<number | null> {
    const results = await db
      .select()
      .from(teacherSubjects)
      .where(
        and(
          eq(teacherSubjects.mentorId, mentorId),
          eq(teacherSubjects.subject, subject)
        )
      );
    
    if (results.length > 0 && results[0].classFee) {
      return parseFloat(results[0].classFee.toString());
    }
    return null;
  }

  // Admin Payment Configuration operations
  async getAdminPaymentConfig(): Promise<AdminPaymentConfig | undefined> {
    const results = await db.select().from(adminPaymentConfig).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async updateAdminPaymentConfig(
    paymentMode?: 'dummy' | 'realtime',
    razorpayMode?: 'upi' | 'api_keys',
    enableRazorpay?: boolean,
    adminUpiId?: string
  ): Promise<void> {
    const existing = await this.getAdminPaymentConfig();
    
    const updates: any = { updatedAt: new Date() };
    if (paymentMode !== undefined) updates.paymentMode = paymentMode;
    if (razorpayMode !== undefined) updates.razorpayMode = razorpayMode;
    if (enableRazorpay !== undefined) updates.enableRazorpay = enableRazorpay;
    if (adminUpiId !== undefined) updates.adminUpiId = adminUpiId;
    
    if (existing) {
      await db
        .update(adminPaymentConfig)
        .set(updates)
        .where(eq(adminPaymentConfig.id, existing.id));
    } else {
      await db.insert(adminPaymentConfig).values({ 
        paymentMode: paymentMode || 'dummy',
        razorpayMode: razorpayMode || 'upi',
        enableRazorpay: enableRazorpay || false,
        ...(adminUpiId && { adminUpiId })
      });
    }
  }

  // Admin UI Configuration operations
  async getAdminUiConfig(): Promise<AdminUiConfig | undefined> {
    const results = await db.select().from(adminUiConfig).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async updateAdminUiConfig(config: { 
    footerLinks?: any; 
    showHelpCenter?: boolean; 
    abusiveLanguageMonitoring?: boolean;
    studentDashboardLinks?: any;
    teacherDashboardLinks?: any;
  }): Promise<void> {
    const existing = await this.getAdminUiConfig();
    
    if (existing) {
      await db
        .update(adminUiConfig)
        .set({ 
          ...(config.footerLinks && { footerLinks: config.footerLinks }),
          ...(config.showHelpCenter !== undefined && { showHelpCenter: config.showHelpCenter }),
          ...(config.abusiveLanguageMonitoring !== undefined && { abusiveLanguageMonitoring: config.abusiveLanguageMonitoring }),
          ...(config.studentDashboardLinks && { studentDashboardLinks: config.studentDashboardLinks }),
          ...(config.teacherDashboardLinks && { teacherDashboardLinks: config.teacherDashboardLinks }),
          updatedAt: new Date() 
        })
        .where(eq(adminUiConfig.id, existing.id));
    } else {
      await db.insert(adminUiConfig).values({
        footerLinks: config.footerLinks || {
          studentCommunity: true,
          mentorCommunity: true,
          successStories: true,
          achievementBadges: true,
          discussionForums: true,
          projectShowcase: true,
          communityEvents: true,
          contactUs: true,
        },
        showHelpCenter: config.showHelpCenter ?? false,
        abusiveLanguageMonitoring: config.abusiveLanguageMonitoring ?? false,
        studentDashboardLinks: config.studentDashboardLinks || { browseCourses: true },
        teacherDashboardLinks: config.teacherDashboardLinks || { createCourse: true, courseDetails: true },
      });
    }
  }

  // Admin Booking Limits Configuration operations
  async getAdminBookingLimits(): Promise<any | undefined> {
    const results = await db.select().from(adminBookingLimits).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async updateAdminBookingLimits(config: { dailyBookingLimit?: number; weeklyBookingLimit?: number | null; enableWeeklyLimit?: boolean }): Promise<void> {
    const existing = await this.getAdminBookingLimits();
    
    if (existing) {
      await db
        .update(adminBookingLimits)
        .set({ 
          ...(config.dailyBookingLimit !== undefined && { dailyBookingLimit: config.dailyBookingLimit }),
          ...(config.weeklyBookingLimit !== undefined && { weeklyBookingLimit: config.weeklyBookingLimit }),
          ...(config.enableWeeklyLimit !== undefined && { enableWeeklyLimit: config.enableWeeklyLimit }),
          updatedAt: new Date() 
        })
        .where(eq(adminBookingLimits.id, existing.id));
    } else {
      await db.insert(adminBookingLimits).values({
        dailyBookingLimit: config.dailyBookingLimit ?? 3,
        weeklyBookingLimit: config.weeklyBookingLimit ?? null,
        enableWeeklyLimit: config.enableWeeklyLimit ?? false,
      });
    }
  }

  // AI Moderation Session Dossier operations
  async getSessionDossierById(dossierId: string): Promise<any | undefined> {
    const [dossier] = await db.select().from(sessionDossiers).where(eq(sessionDossiers.id, dossierId));
    return dossier;
  }

  // Teacher Restriction Appeals operations
  async createTeacherRestrictionAppeal(appeal: InsertTeacherRestrictionAppeal): Promise<SelectTeacherRestrictionAppeal> {
    const [created] = await db.insert(teacherRestrictionAppeals).values(appeal).returning();
    return created;
  }

  async getTeacherRestrictionAppealsByTeacher(teacherId: string): Promise<SelectTeacherRestrictionAppeal[]> {
    return await db.select()
      .from(teacherRestrictionAppeals)
      .where(eq(teacherRestrictionAppeals.teacherId, teacherId))
      .orderBy(desc(teacherRestrictionAppeals.createdAt));
  }

  async getAllTeacherRestrictionAppeals(): Promise<SelectTeacherRestrictionAppeal[]> {
    return await db.select()
      .from(teacherRestrictionAppeals)
      .orderBy(desc(teacherRestrictionAppeals.createdAt));
  }

  async getTeacherRestrictionAppeal(id: string): Promise<SelectTeacherRestrictionAppeal | undefined> {
    const [appeal] = await db.select()
      .from(teacherRestrictionAppeals)
      .where(eq(teacherRestrictionAppeals.id, id));
    return appeal;
  }

  async updateTeacherRestrictionAppealStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    adminNotes: string, 
    reviewedBy: string
  ): Promise<void> {
    await db.update(teacherRestrictionAppeals)
      .set({ 
        status, 
        adminReviewNotes: adminNotes,
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(teacherRestrictionAppeals.id, id));
  }

  // Moderation Whitelist operations
  async createModerationWhitelist(data: { 
    contentPattern: string; 
    subjectName?: string | null; 
    modality: 'video' | 'audio' | 'text'; 
    originalLogId?: string | null; 
    addedBy: string; 
    reason?: string | null 
  }): Promise<any> {
    const [created] = await db.insert(moderationWhitelist).values(data).returning();
    return created;
  }

  async getAllModerationWhitelist(): Promise<any[]> {
    return await db.select()
      .from(moderationWhitelist)
      .orderBy(desc(moderationWhitelist.createdAt));
  }

  async getModerationWhitelistBySubject(subjectName: string, modality?: 'video' | 'audio' | 'text'): Promise<any[]> {
    if (modality) {
      return await db.select()
        .from(moderationWhitelist)
        .where(and(
          eq(moderationWhitelist.subjectName, subjectName),
          eq(moderationWhitelist.modality, modality)
        ));
    }
    return await db.select()
      .from(moderationWhitelist)
      .where(eq(moderationWhitelist.subjectName, subjectName));
  }

  async deleteModerationWhitelist(id: string): Promise<void> {
    await db.delete(moderationWhitelist).where(eq(moderationWhitelist.id, id));
  }

  // Azure Storage Config operations
  async updateAzureStorageConfig(config: { storageAccountName: string; containerName: string; retentionMonths: number }): Promise<AzureStorageConfig> {
    const existing = await this.getAzureStorageConfig();
    
    if (existing) {
      const [updated] = await db.update(azureStorageConfig)
        .set({
          storageAccountName: config.storageAccountName,
          containerName: config.containerName,
          retentionMonths: config.retentionMonths,
          updatedAt: new Date(),
        })
        .where(eq(azureStorageConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const { randomUUID } = await import('crypto');
      const [created] = await db.insert(azureStorageConfig)
        .values({
          id: randomUUID(),
          storageAccountName: config.storageAccountName,
          containerName: config.containerName,
          retentionMonths: config.retentionMonths,
          isActive: true,
        })
        .returning();
      return created;
    }
  }

}

export const storage = new DatabaseStorage();
