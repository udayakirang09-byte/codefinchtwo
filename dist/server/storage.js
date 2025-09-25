import { users, mentors, students, bookings, achievements, reviews, chatSessions, chatMessages, videoSessions, classFeedback, notifications, teacherProfiles, } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc } from "drizzle-orm";
export class DatabaseStorage {
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
    async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
    }
    async createUser(userData) {
        const [user] = await db.insert(users).values(userData).returning();
        return user;
    }
    async getAllUsers() {
        const result = await db.select().from(users).orderBy(desc(users.createdAt));
        return result;
    }
    async getUsers() {
        return await db.select().from(users).limit(10);
    }
    async getMentorApplications(status) {
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
    async updateMentorApplicationStatus(id, status, feedback) {
        console.log(`Updated application ${id} to ${status} with feedback: ${feedback}`);
    }
    async getMentors() {
        const result = await db
            .select()
            .from(mentors)
            .leftJoin(users, eq(mentors.userId, users.id))
            .where(eq(mentors.isActive, true))
            .orderBy(desc(mentors.rating));
        return result.map(({ mentors: mentor, users: user }) => ({
            ...mentor,
            user: user,
        }));
    }
    async getMentor(id) {
        const [result] = await db
            .select()
            .from(mentors)
            .leftJoin(users, eq(mentors.userId, users.id))
            .where(eq(mentors.id, id));
        if (!result)
            return undefined;
        return {
            ...result.mentors,
            user: result.users,
        };
    }
    async createMentor(mentorData) {
        const processedData = {
            ...mentorData,
            specialties: mentorData.specialties ? Array.from(mentorData.specialties) : [],
            availableSlots: mentorData.availableSlots ? Array.from(mentorData.availableSlots) : []
        };
        const [mentor] = await db.insert(mentors).values([processedData]).returning();
        return mentor;
    }
    async updateMentorRating(mentorId, rating) {
        await db
            .update(mentors)
            .set({ rating: rating.toString() })
            .where(eq(mentors.id, mentorId));
    }
    async getMentorReviews(mentorId) {
        return this.getReviewsByMentor(mentorId);
    }
    async getStudent(id) {
        const [result] = await db
            .select()
            .from(students)
            .leftJoin(users, eq(students.userId, users.id))
            .where(eq(students.id, id));
        if (!result)
            return undefined;
        return {
            ...result.students,
            user: result.users,
        };
    }
    async getStudentByUserId(userId) {
        const [student] = await db.select().from(students).where(eq(students.userId, userId));
        return student;
    }
    async createStudent(studentData) {
        const processedData = {
            ...studentData,
            interests: studentData.interests ? Array.from(studentData.interests) : []
        };
        const [student] = await db.insert(students).values([processedData]).returning();
        return student;
    }
    async getStudentBookings(studentId) {
        return this.getBookingsByStudent(studentId);
    }
    async getBookings() {
        const result = await db
            .select()
            .from(bookings)
            .leftJoin(students, eq(bookings.studentId, students.id))
            .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
            .leftJoin(users, eq(students.userId, users.id))
            .orderBy(desc(bookings.scheduledAt));
        return result.map(({ bookings: booking, students: student, mentors: mentor, users: user }) => ({
            ...booking,
            student: { ...student, user: user },
            mentor: { ...mentor, user: user },
        }));
    }
    async getBooking(id) {
        const [result] = await db
            .select()
            .from(bookings)
            .leftJoin(students, eq(bookings.studentId, students.id))
            .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
            .leftJoin(users, eq(students.userId, users.id))
            .where(eq(bookings.id, id));
        if (!result)
            return undefined;
        return {
            ...result.bookings,
            student: { ...result.students, user: result.users },
            mentor: { ...result.mentors, user: result.users },
        };
    }
    async getMentorByUserId(userId) {
        const [mentor] = await db.select().from(mentors).where(eq(mentors.userId, userId));
        return mentor;
    }
    async updateUser(id, updates) {
        await db.update(users).set(updates).where(eq(users.id, id));
    }
    async deleteUser(id) {
        await db.delete(users).where(eq(users.id, id));
    }
    async getBookingsByStudent(studentId) {
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
            student: { ...student, user: user },
            mentor: { ...mentor, user: user },
        }));
    }
    async getBookingsByMentor(mentorId) {
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
            student: { ...student, user: user },
            mentor: { ...mentor, user: user },
        }));
    }
    async createBooking(bookingData) {
        const [booking] = await db.insert(bookings).values(bookingData).returning();
        return booking;
    }
    async updateBookingStatus(id, status) {
        await db
            .update(bookings)
            .set({ status, updatedAt: new Date() })
            .where(eq(bookings.id, id));
    }
    async getReviewsByMentor(mentorId) {
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
            student: { ...student, user: user },
            mentor: { ...mentor, user: user },
        }));
    }
    async createReview(reviewData) {
        const [review] = await db.insert(reviews).values(reviewData).returning();
        const mentorReviews = await this.getReviewsByMentor(reviewData.mentorId);
        const averageRating = mentorReviews.reduce((sum, r) => sum + r.rating, 0) / mentorReviews.length;
        await this.updateMentorRating(reviewData.mentorId, averageRating);
        return review;
    }
    async getAchievementsByStudent(studentId) {
        const result = await db
            .select()
            .from(achievements)
            .where(eq(achievements.studentId, studentId))
            .orderBy(desc(achievements.earnedAt));
        return result;
    }
    async createAchievement(achievementData) {
        const [achievement] = await db.insert(achievements).values(achievementData).returning();
        return achievement;
    }
    async createVideoSession(sessionData) {
        const [session] = await db.insert(videoSessions).values(sessionData).returning();
        return session;
    }
    async getVideoSessionByBooking(bookingId) {
        const [session] = await db.select().from(videoSessions).where(eq(videoSessions.bookingId, bookingId));
        return session;
    }
    async createChatSession(sessionData) {
        const [session] = await db.insert(chatSessions).values(sessionData).returning();
        return session;
    }
    async getChatSessionByBooking(bookingId) {
        const [session] = await db.select().from(chatSessions).where(eq(chatSessions.bookingId, bookingId));
        return session;
    }
    async sendChatMessage(messageData) {
        const [message] = await db.insert(chatMessages).values(messageData).returning();
        return message;
    }
    async getChatMessages(sessionId) {
        const messages = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.chatSessionId, sessionId))
            .orderBy(chatMessages.sentAt);
        return messages;
    }
    async submitClassFeedback(feedbackData) {
        const [feedback] = await db.insert(classFeedback).values(feedbackData).returning();
        return feedback;
    }
    async getClassFeedback(bookingId) {
        const [feedback] = await db.select().from(classFeedback).where(eq(classFeedback.bookingId, bookingId));
        return feedback;
    }
    async createNotification(notificationData) {
        const [notification] = await db.insert(notifications).values(notificationData).returning();
        return notification;
    }
    async getUserNotifications(userId) {
        const result = await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt));
        return result;
    }
    async markNotificationAsRead(notificationId) {
        await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, notificationId));
    }
    async createTeacherProfile(profileData) {
        const processedData = { ...profileData };
        if (processedData.achievements) {
            processedData.achievements = Array.from(processedData.achievements);
        }
        if (processedData.qualifications) {
            processedData.qualifications = Array.from(processedData.qualifications);
        }
        if (processedData.programmingLanguages) {
            processedData.programmingLanguages = Array.from(processedData.programmingLanguages);
        }
        if (processedData.subjects) {
            processedData.subjects = Array.from(processedData.subjects);
        }
        const [profile] = await db.insert(teacherProfiles).values(processedData).returning();
        return profile;
    }
    async getTeacherProfile(userId) {
        const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
        return profile;
    }
    async getSystemStats() {
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
//# sourceMappingURL=storage.js.map