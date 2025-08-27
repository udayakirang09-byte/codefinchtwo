import {
  users,
  mentors,
  students,
  bookings,
  achievements,
  reviews,
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
  
  // Mentor operations
  getMentors(): Promise<MentorWithUser[]>;
  getMentor(id: string): Promise<MentorWithUser | undefined>;
  getMentorByUserId(userId: string): Promise<Mentor | undefined>;
  createMentor(mentor: InsertMentor): Promise<Mentor>;
  updateMentorRating(mentorId: string, rating: number): Promise<void>;
  
  // Student operations
  getStudent(id: string): Promise<StudentWithUser | undefined>;
  getStudentByUserId(userId: string): Promise<Student | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
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

  async getMentorByUserId(userId: string): Promise<Mentor | undefined> {
    const [mentor] = await db.select().from(mentors).where(eq(mentors.userId, userId));
    return mentor;
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
}

export const storage = new DatabaseStorage();
