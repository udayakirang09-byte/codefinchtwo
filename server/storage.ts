import {
  users,
  mentors,
  students,
  bookings,
  achievements,
  reviews,
  chatSessions,
  chatMessages,
  videoSessions,
  classFeedback,
  notifications,
  teacherProfiles,
  type User,
  type InsertUser,
  type Mentor,
  type InsertMentor,
  type Student,
  type InsertStudent,
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
  
  // Admin operations
  getSystemStats(): Promise<any>;
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
    const [mentor] = await db.insert(mentors).values([mentorData]).returning();
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
    const [student] = await db.insert(students).values([studentData]).returning();
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
    const [profile] = await db.insert(teacherProfiles).values(profileData).returning();
    return profile;
  }

  async getTeacherProfile(userId: string): Promise<TeacherProfile | undefined> {
    const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
    return profile;
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
