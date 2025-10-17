import { users, mentors, students, courses, courseEnrollments, bookings, achievements, reviews, chatSessions, chatMessages, videoSessions, classFeedback, notifications, userSessions, teacherProfiles, paymentMethods, transactionFeeConfig, paymentTransactions, unsettledFinances, paymentWorkflows, helpTickets, qualifications, specializations, subjects, teacherAudioMetrics, homeSectionControls, azureStorageConfig, recordingParts, mergedRecordings, teacherSubjects, teacherQualifications, adminPaymentConfig, adminUiConfig, } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, and, sql, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cache } from "./redis.js";
export class DatabaseStorage {
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
    async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
    }
    async getUserWithRoleDataByEmail(email) {
        const cacheKey = `user:email:${email}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }
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
        await cache.set(cacheKey, userData, 300);
        return userData;
    }
    async createUser(userData) {
        const { randomUUID } = await import('crypto');
        const userDataWithId = {
            ...userData,
            id: userData.id || randomUUID()
        };
        const [user] = await db.insert(users).values(userDataWithId).returning();
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
                country: "NA-Country",
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
        const allBookings = await db.select().from(bookings);
        const allReviews = await db.select().from(reviews);
        let allTeacherSubjects = [];
        try {
            const rawSubjects = await db.execute(sql `SELECT * FROM teacher_subjects`);
            allTeacherSubjects = rawSubjects.rows.map((row) => ({
                id: row.id,
                mentorId: row.mentor_id,
                subject: row.subject,
                experience: row.experience,
                classFee: row.class_fee,
                priority: row.priority,
                createdAt: row.created_at
            }));
            console.log(`📚 [DEBUG] Loaded ${allTeacherSubjects.length} teacher subjects using raw SQL`);
        }
        catch (error) {
            console.error(`📚 [DEBUG] ERROR fetching teacherSubjects:`, error);
        }
        const allTeacherQualifications = await db.select().from(teacherQualifications);
        const allTeacherProfiles = await db.select().from(teacherProfiles);
        const mentorsData = result.map(({ mentors: mentor, users: user }) => {
            const mentorBookings = allBookings.filter((b) => b.mentorId === mentor.id);
            const uniqueStudentIds = new Set(mentorBookings.map((b) => b.studentId));
            const actualStudentCount = uniqueStudentIds.size;
            const mentorReviews = allReviews.filter((r) => r.mentorId === mentor.id);
            let calculatedRating = "0.00";
            if (mentorReviews.length > 0) {
                const totalRating = mentorReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
                const avgRating = totalRating / mentorReviews.length;
                calculatedRating = avgRating.toFixed(2);
            }
            const mentorSubjects = allTeacherSubjects.filter((s) => s.mentorId === mentor.id);
            const mentorQualifications = allTeacherQualifications.filter((q) => q.mentorId === mentor.id);
            const teacherProfile = allTeacherProfiles.find((p) => p.userId === user?.id);
            const signupSubjects = teacherProfile?.subjects || [];
            let totalExperience = mentor.experience || 0;
            if (signupSubjects.length > 0) {
                const summedExperience = signupSubjects.reduce((sum, subj) => {
                    const exp = parseInt(subj.experience) || 0;
                    return sum + exp;
                }, 0);
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
                user: user,
            };
        });
        await cache.set(cacheKey, mentorsData, 300);
        return mentorsData;
    }
    async getMentor(id) {
        const [result] = await db
            .select()
            .from(mentors)
            .leftJoin(users, eq(mentors.userId, users.id))
            .where(eq(mentors.id, id));
        if (!result)
            return undefined;
        const mentorBookings = await db.select().from(bookings).where(eq(bookings.mentorId, id));
        const uniqueStudentIds = new Set(mentorBookings.map((b) => b.studentId));
        const actualStudentCount = uniqueStudentIds.size;
        const mentorReviews = await db.select().from(reviews).where(eq(reviews.mentorId, id));
        let calculatedRating = "0.00";
        if (mentorReviews.length > 0) {
            const totalRating = mentorReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            const avgRating = totalRating / mentorReviews.length;
            calculatedRating = avgRating.toFixed(2);
        }
        const mentorSubjects = await db.select().from(teacherSubjects).where(eq(teacherSubjects.mentorId, id));
        const mentorQualifications = await db.select().from(teacherQualifications).where(eq(teacherQualifications.mentorId, id));
        const [teacherProfile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, result.users?.id));
        const signupSubjects = teacherProfile?.subjects || [];
        let totalExperience = result.mentors.experience || 0;
        if (signupSubjects.length > 0) {
            const summedExperience = signupSubjects.reduce((sum, subj) => {
                const exp = parseInt(subj.experience) || 0;
                return sum + exp;
            }, 0);
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
            user: result.users,
        };
    }
    async createMentor(mentorData) {
        const { randomUUID } = await import('crypto');
        const data = mentorData;
        const processedData = {
            ...mentorData,
            id: data.id || randomUUID(),
            specialties: data.specialties ? Array.from(data.specialties) : [],
            availableSlots: data.availableSlots ? Array.from(data.availableSlots) : []
        };
        const [mentor] = await db.insert(mentors).values([processedData]).returning();
        await cache.del('mentors:list');
        return mentor;
    }
    async updateMentorRating(mentorId, rating) {
        await db
            .update(mentors)
            .set({ rating: rating.toString() })
            .where(eq(mentors.id, mentorId));
        await cache.del('mentors:list');
    }
    async updateMentorHourlyRate(mentorId, hourlyRate) {
        await db
            .update(mentors)
            .set({ hourlyRate: hourlyRate })
            .where(eq(mentors.id, mentorId));
        await cache.del('mentors:list');
    }
    async updateMentorUpiId(mentorId, upiId) {
        await db
            .update(mentors)
            .set({ upiId: upiId })
            .where(eq(mentors.id, mentorId));
        await cache.del('mentors:list');
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
    async getStudentByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user)
            return undefined;
        const [student] = await db.select().from(students).where(eq(students.userId, user.id));
        return student;
    }
    async createStudent(studentData) {
        const { randomUUID } = await import('crypto');
        const data = studentData;
        const processedData = {
            ...studentData,
            id: data.id || randomUUID(),
            interests: data.interests ? Array.from(data.interests) : []
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
        if (!result)
            return undefined;
        return {
            ...result.bookings,
            student: { ...result.students, user: result.studentUsers },
            mentor: { ...result.mentors, user: result.mentorUsers },
        };
    }
    async getMentorByUserId(userId) {
        const [mentor] = await db.select().from(mentors).where(eq(mentors.userId, userId));
        return mentor;
    }
    async updateUser(id, updates) {
        const user = await this.getUser(id);
        await db.update(users).set(updates).where(eq(users.id, id));
        if (user?.email) {
            await cache.del(`user:email:${user.email}`);
        }
        if ('email' in updates && updates.email && updates.email !== user?.email) {
            await cache.del(`user:email:${updates.email}`);
        }
    }
    async deleteUser(id) {
        const user = await this.getUser(id);
        await db.delete(users).where(eq(users.id, id));
        if (user?.email) {
            await cache.del(`user:email:${user.email}`);
        }
    }
    async getBookingsByStudent(studentId) {
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
        const bookingsData = result.map((row) => ({
            ...row.bookings,
            student: { ...row.students, user: row.studentUsers },
            mentor: { ...row.mentors, user: row.mentorUsers },
        }));
        await cache.set(cacheKey, bookingsData, 120);
        return bookingsData;
    }
    async getBookingsByMentor(mentorId) {
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
        const bookingsData = result.map((row) => ({
            ...row.bookings,
            student: { ...row.students, user: row.studentUsers },
            mentor: { ...row.mentors, user: row.mentorUsers },
        }));
        await cache.set(cacheKey, bookingsData, 120);
        return bookingsData;
    }
    async createBooking(bookingData) {
        const [booking] = await db.insert(bookings).values(bookingData).returning();
        await cache.del(`bookings:student:${booking.studentId}`);
        await cache.del(`bookings:mentor:${booking.mentorId}`);
        await cache.del('mentors:list');
        return booking;
    }
    async updateBookingStatus(id, status) {
        const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
        await db
            .update(bookings)
            .set({ status, updatedAt: new Date() })
            .where(eq(bookings.id, id));
        if (booking) {
            await cache.del(`bookings:student:${booking.studentId}`);
            await cache.del(`bookings:mentor:${booking.mentorId}`);
            await cache.del('mentors:list');
        }
    }
    async rescheduleBooking(id, newScheduledAt) {
        const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
        await db
            .update(bookings)
            .set({ scheduledAt: newScheduledAt, updatedAt: new Date() })
            .where(eq(bookings.id, id));
        if (booking) {
            await cache.del(`bookings:student:${booking.studentId}`);
            await cache.del(`bookings:mentor:${booking.mentorId}`);
        }
    }
    async cancelBooking(id) {
        const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
        await db
            .update(bookings)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(bookings.id, id));
        if (booking) {
            await cache.del(`bookings:student:${booking.studentId}`);
            await cache.del(`bookings:mentor:${booking.mentorId}`);
            await cache.del('mentors:list');
        }
    }
    async getCourses() {
        const result = await db
            .select()
            .from(courses)
            .where(eq(courses.isActive, true))
            .orderBy(desc(courses.createdAt));
        return result;
    }
    async getCourse(id) {
        const [course] = await db.select().from(courses).where(eq(courses.id, id));
        return course;
    }
    async getCoursesByMentor(mentorId) {
        const result = await db
            .select()
            .from(courses)
            .where(and(eq(courses.mentorId, mentorId), eq(courses.isActive, true)))
            .orderBy(desc(courses.createdAt));
        return result;
    }
    async createCourse(courseData) {
        const processedData = {
            ...courseData,
            tags: courseData.tags ? Array.from(courseData.tags) : []
        };
        const [course] = await db.insert(courses).values([processedData]).returning();
        return course;
    }
    async updateCourse(id, courseData) {
        const processedData = {
            ...courseData,
            updatedAt: new Date()
        };
        if (courseData.tags) {
            processedData.tags = Array.from(courseData.tags);
        }
        const filteredData = Object.entries(processedData).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        await db
            .update(courses)
            .set(filteredData)
            .where(eq(courses.id, id));
    }
    async deleteCourse(id) {
        await db
            .update(courses)
            .set({ isActive: false })
            .where(eq(courses.id, id));
    }
    async createCourseEnrollment(enrollmentData) {
        const { randomUUID } = await import('crypto');
        const processedData = {
            ...enrollmentData,
            id: randomUUID(),
            weeklySchedule: enrollmentData.weeklySchedule || []
        };
        const [enrollment] = await db.insert(courseEnrollments).values([processedData]).returning();
        return enrollment;
    }
    async getCourseEnrollmentsByStudent(studentId) {
        const result = await db
            .select()
            .from(courseEnrollments)
            .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
            .leftJoin(mentors, eq(courseEnrollments.mentorId, mentors.id))
            .leftJoin(users, eq(mentors.userId, users.id))
            .where(eq(courseEnrollments.studentId, studentId))
            .orderBy(desc(courseEnrollments.enrolledAt));
        return result.map((row) => ({
            ...row.course_enrollments,
            course: row.courses,
            mentor: row.mentors ? { ...row.mentors, user: row.users } : null,
        }));
    }
    async getCourseEnrollmentsByMentor(mentorId) {
        const result = await db
            .select()
            .from(courseEnrollments)
            .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
            .leftJoin(students, eq(courseEnrollments.studentId, students.id))
            .leftJoin(users, eq(students.userId, users.id))
            .where(eq(courseEnrollments.mentorId, mentorId))
            .orderBy(desc(courseEnrollments.enrolledAt));
        return result.map((row) => ({
            ...row.course_enrollments,
            course: row.courses,
            student: row.students ? { ...row.students, user: row.users } : null,
        }));
    }
    async getCourseEnrollmentsByCourse(courseId) {
        const result = await db
            .select()
            .from(courseEnrollments)
            .leftJoin(students, eq(courseEnrollments.studentId, students.id))
            .leftJoin(users, eq(students.userId, users.id))
            .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.status, 'active')))
            .orderBy(desc(courseEnrollments.enrolledAt));
        return result.map((row) => ({
            ...row.course_enrollments,
            studentName: row.users ? `${row.users.firstName} ${row.users.lastName}` : 'Unknown Student',
            studentEmail: row.users?.email,
            student: row.students ? { ...row.students, user: row.users } : null,
        }));
    }
    async getCourseEnrollment(id) {
        const [result] = await db
            .select()
            .from(courseEnrollments)
            .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
            .leftJoin(mentors, eq(courseEnrollments.mentorId, mentors.id))
            .leftJoin(students, eq(courseEnrollments.studentId, students.id))
            .where(eq(courseEnrollments.id, id))
            .limit(1);
        if (!result)
            return undefined;
        return {
            ...result.course_enrollments,
            course: result.courses,
            mentor: result.mentors,
            student: result.students,
        };
    }
    async updateCourseEnrollmentStatus(id, status) {
        await db
            .update(courseEnrollments)
            .set({ status, updatedAt: new Date() })
            .where(eq(courseEnrollments.id, id));
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
        const data = reviewData;
        const mentorReviews = await this.getReviewsByMentor(data.mentorId);
        const averageRating = mentorReviews.reduce((sum, r) => sum + r.rating, 0) / mentorReviews.length;
        await this.updateMentorRating(data.mentorId, averageRating);
        await cache.del('mentors:list');
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
    async getStudentRecordings(studentUserId) {
        const recordings = await db
            .select()
            .from(videoSessions)
            .leftJoin(bookings, eq(videoSessions.bookingId, bookings.id))
            .leftJoin(students, eq(bookings.studentId, students.id))
            .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
            .leftJoin(users, eq(students.userId, users.id))
            .where(and(eq(users.id, studentUserId), sql `${videoSessions.recordingUrl} IS NOT NULL`, eq(videoSessions.status, 'ended')))
            .orderBy(desc(videoSessions.createdAt));
        return recordings.map((record) => ({
            ...record.video_sessions,
            booking: {
                ...record.bookings,
                student: {
                    ...record.students,
                    user: record.users
                },
                mentor: {
                    ...record.mentors,
                    user: record.users
                }
            }
        }));
    }
    async getRecordingById(recordingId) {
        const [recording] = await db
            .select()
            .from(videoSessions)
            .where(eq(videoSessions.id, recordingId));
        return recording;
    }
    async validateStudentRecordingAccess(studentUserId, recordingId) {
        const [result] = await db
            .select()
            .from(videoSessions)
            .leftJoin(bookings, eq(videoSessions.bookingId, bookings.id))
            .leftJoin(students, eq(bookings.studentId, students.id))
            .where(and(eq(videoSessions.id, recordingId), eq(students.userId, studentUserId)));
        return !!result;
    }
    async updateVideoSessionRecording(sessionId, recordingUrl) {
        await db
            .update(videoSessions)
            .set({ recordingUrl })
            .where(eq(videoSessions.id, sessionId));
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
    async getChatMessages(bookingId) {
        const messages = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.bookingId, bookingId))
            .orderBy(chatMessages.sentAt);
        return messages;
    }
    async checkStudentMentorRelationshipStatus(studentUserId, mentorUserId) {
        const recentBooking = await db
            .select()
            .from(bookings)
            .leftJoin(students, eq(bookings.studentId, students.id))
            .leftJoin(mentors, eq(bookings.mentorId, mentors.id))
            .where(and(eq(students.userId, studentUserId), eq(mentors.userId, mentorUserId)))
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
        const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        const nineMonthsAgo = new Date(now.getTime() - 9 * 30 * 24 * 60 * 60 * 1000);
        const isWithin6Months = lastBookingDate > sixMonthsAgo;
        const isWithin9Months = lastBookingDate > nineMonthsAgo;
        return {
            isActive: isWithin6Months,
            lastBookingDate,
            canChat: isWithin6Months,
            canViewMessages: isWithin9Months
        };
    }
    async validateChatAccess(studentUserId, mentorUserId) {
        const relationshipStatus = await this.checkStudentMentorRelationshipStatus(studentUserId, mentorUserId);
        return relationshipStatus.canChat;
    }
    async submitClassFeedback(feedbackData) {
        const [feedback] = await db.insert(classFeedback).values(feedbackData).returning();
        await db
            .update(bookings)
            .set({ status: 'completed' })
            .where(eq(bookings.id, feedbackData.bookingId));
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
        if (processedData.qualifications && processedData.qualifications.length > 0 && processedData.userId) {
            const [mentor] = await db.select().from(mentors).where(eq(mentors.userId, processedData.userId));
            if (mentor) {
                const { randomUUID } = await import('crypto');
                const qualificationsToInsert = processedData.qualifications.map((qual, index) => ({
                    id: randomUUID(),
                    mentorId: mentor.id,
                    qualification: qual.qualification || '',
                    specialization: qual.specialization || '',
                    score: qual.score || '',
                    priority: index + 1
                }));
                await db.insert(teacherQualifications).values(qualificationsToInsert);
                console.log(`✅ Inserted ${qualificationsToInsert.length} qualifications for mentor ${mentor.id}`);
            }
        }
        return profile;
    }
    async getTeacherProfile(userId) {
        const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
        return profile;
    }
    async updateTeacherProfile(userId, updates) {
        const processedUpdates = { ...updates };
        if (processedUpdates.achievements) {
            processedUpdates.achievements = Array.from(processedUpdates.achievements);
        }
        if (processedUpdates.qualifications) {
            processedUpdates.qualifications = Array.from(processedUpdates.qualifications);
        }
        if (processedUpdates.programmingLanguages) {
            processedUpdates.programmingLanguages = Array.from(processedUpdates.programmingLanguages);
        }
        if (processedUpdates.subjects) {
            processedUpdates.subjects = Array.from(processedUpdates.subjects);
        }
        await db
            .update(teacherProfiles)
            .set(processedUpdates)
            .where(eq(teacherProfiles.userId, userId));
    }
    async createPaymentMethod(paymentMethodData) {
        const [paymentMethod] = await db.insert(paymentMethods).values(paymentMethodData).returning();
        return paymentMethod;
    }
    async getUserPaymentMethods(userId) {
        return await db
            .select()
            .from(paymentMethods)
            .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.isActive, true)))
            .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));
    }
    async getPaymentMethod(id) {
        const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
        return paymentMethod;
    }
    async updatePaymentMethod(id, updates) {
        await db
            .update(paymentMethods)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(paymentMethods.id, id));
    }
    async deletePaymentMethod(id) {
        await db
            .update(paymentMethods)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(paymentMethods.id, id));
    }
    async setDefaultPaymentMethod(userId, paymentMethodId) {
        await db
            .update(paymentMethods)
            .set({ isDefault: false, updatedAt: new Date() })
            .where(eq(paymentMethods.userId, userId));
        await db
            .update(paymentMethods)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(paymentMethods.id, paymentMethodId));
    }
    async getActiveTransactionFeeConfig() {
        const [config] = await db
            .select()
            .from(transactionFeeConfig)
            .where(eq(transactionFeeConfig.isActive, true))
            .orderBy(desc(transactionFeeConfig.createdAt))
            .limit(1);
        return config;
    }
    async createTransactionFeeConfig(configData) {
        await this.deactivateOldFeeConfigs();
        const [config] = await db.insert(transactionFeeConfig).values(configData).returning();
        return config;
    }
    async updateTransactionFeeConfig(id, updates) {
        await db
            .update(transactionFeeConfig)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(transactionFeeConfig.id, id));
    }
    async deactivateOldFeeConfigs() {
        await db
            .update(transactionFeeConfig)
            .set({ isActive: false, updatedAt: new Date() });
    }
    async createPaymentTransaction(transactionData) {
        const [transaction] = await db.insert(paymentTransactions).values(transactionData).returning();
        return transaction;
    }
    async getPaymentTransaction(id) {
        const [transaction] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
        return transaction;
    }
    async updatePaymentTransactionStatus(id, status, workflowStage) {
        const updateData = { status, updatedAt: new Date() };
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
    async getTransactionsByUser(userId) {
        return await db
            .select()
            .from(paymentTransactions)
            .where(eq(paymentTransactions.fromUserId, userId))
            .orderBy(desc(paymentTransactions.createdAt));
    }
    async getPendingTeacherPayouts() {
        return await db
            .select()
            .from(paymentTransactions)
            .where(and(eq(paymentTransactions.workflowStage, 'admin_to_teacher'), eq(paymentTransactions.status, 'pending')));
    }
    async getPaymentTransactionByStripeId(stripePaymentIntentId) {
        const [transaction] = await db
            .select()
            .from(paymentTransactions)
            .where(eq(paymentTransactions.stripePaymentIntentId, stripePaymentIntentId));
        return transaction;
    }
    async updatePaymentTransaction(id, updates) {
        await db
            .update(paymentTransactions)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(paymentTransactions.id, id));
    }
    async createUnsettledFinance(unsettledFinanceData) {
        const [unsettledFinance] = await db.insert(unsettledFinances).values(unsettledFinanceData).returning();
        return unsettledFinance;
    }
    async getUnsettledFinancesByStatus(status) {
        return await db
            .select()
            .from(unsettledFinances)
            .where(eq(unsettledFinances.status, status))
            .orderBy(desc(unsettledFinances.createdAt));
    }
    async resolveUnsettledFinance(id, resolution) {
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
    async createPaymentWorkflow(workflowData) {
        const processedData = {
            ...workflowData,
            processingErrors: workflowData.processingErrors ? Array.from(workflowData.processingErrors) : []
        };
        const [workflow] = await db.insert(paymentWorkflows).values(processedData).returning();
        return workflow;
    }
    async getActivePaymentWorkflows() {
        return await db
            .select()
            .from(paymentWorkflows)
            .where(eq(paymentWorkflows.status, 'active'))
            .orderBy(paymentWorkflows.nextActionAt);
    }
    async updatePaymentWorkflowStage(id, stage, nextActionAt) {
        const updateData = {
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
    async getFinanceAnalytics() {
        const allUsers = await db.select().from(users);
        const studentsCount = allUsers.filter((u) => u.role === 'student').length;
        const teachersCount = allUsers.filter((u) => u.role === 'mentor').length;
        const completedBookingsWithFees = await db.select({
            id: bookings.id,
            status: bookings.status,
            classFee: sql `COALESCE(${teacherSubjects.classFee}::numeric, 150)`
        })
            .from(bookings)
            .leftJoin(teacherSubjects, and(eq(teacherSubjects.mentorId, bookings.mentorId), eq(teacherSubjects.subject, bookings.subject)))
            .where(eq(bookings.status, 'completed'));
        const cancelledBookingsWithFees = await db.select({
            id: bookings.id,
            status: bookings.status,
            classFee: sql `COALESCE(${teacherSubjects.classFee}::numeric, 150)`
        })
            .from(bookings)
            .leftJoin(teacherSubjects, and(eq(teacherSubjects.mentorId, bookings.mentorId), eq(teacherSubjects.subject, bookings.subject)))
            .where(eq(bookings.status, 'cancelled'));
        const conflicts = await db
            .select()
            .from(unsettledFinances)
            .where(eq(unsettledFinances.status, 'open'));
        const feeConfig = await this.getActiveTransactionFeeConfig();
        const platformFeePercent = feeConfig ? (parseFloat(feeConfig.feePercentage || '0') / 100) : 0.02;
        const totalAdminRevenue = completedBookingsWithFees.reduce((sum, b) => sum + Number(b.classFee), 0);
        const totalRefunds = cancelledBookingsWithFees.reduce((sum, b) => sum + Number(b.classFee), 0);
        const totalTransactionFees = totalAdminRevenue * platformFeePercent;
        const totalTeacherPayouts = totalAdminRevenue - totalTransactionFees;
        const pendingRefunds = totalRefunds;
        const pendingRefundsCount = cancelledBookingsWithFees.length;
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
            pendingRefunds,
            pendingRefundsCount,
        };
    }
    async getSystemStats() {
        const allUsers = await db.select().from(users);
        const allMentors = await db.select().from(mentors);
        const allStudents = await db.select().from(students);
        const allBookings = await db.select().from(bookings);
        const completedBookingsList = await db.select().from(bookings).where(eq(bookings.status, 'completed'));
        const activeClasses = await db.select().from(bookings).where(eq(bookings.status, 'scheduled'));
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const bookingsWithFees = await db.select({
            id: bookings.id,
            scheduledAt: bookings.scheduledAt,
            duration: bookings.duration,
            status: bookings.status,
            subject: bookings.subject,
            mentorId: bookings.mentorId,
            classFee: sql `COALESCE(${teacherSubjects.classFee}::numeric, 150)`
        })
            .from(bookings)
            .leftJoin(teacherSubjects, and(eq(teacherSubjects.mentorId, bookings.mentorId), eq(teacherSubjects.subject, bookings.subject)))
            .where(ne(bookings.status, 'cancelled'));
        const monthlyCompletedBookings = bookingsWithFees.filter((b) => {
            const bookingDate = new Date(b.scheduledAt);
            if (bookingDate < firstDayOfMonth)
                return false;
            if (b.status === 'completed')
                return true;
            if (b.status === 'scheduled') {
                const classEndTime = new Date(new Date(b.scheduledAt).getTime() + b.duration * 60000);
                return now >= classEndTime;
            }
            return false;
        });
        const monthlyRevenue = monthlyCompletedBookings.reduce((sum, b) => {
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
    async createHelpTicket(ticketData) {
        const [ticket] = await db.insert(helpTickets).values(ticketData).returning();
        return ticket;
    }
    async getQualifications() {
        return await db.select().from(qualifications)
            .where(eq(qualifications.isActive, true))
            .orderBy(qualifications.displayOrder, qualifications.name);
    }
    async getSpecializations() {
        return await db.select().from(specializations)
            .where(eq(specializations.isActive, true))
            .orderBy(specializations.displayOrder, specializations.name);
    }
    async getSubjects() {
        return await db.select().from(subjects)
            .where(eq(subjects.isActive, true))
            .orderBy(subjects.displayOrder, subjects.name);
    }
    async clearQualifications() {
        await db.delete(qualifications);
    }
    async clearSpecializations() {
        await db.delete(specializations);
    }
    async clearSubjects() {
        await db.delete(subjects);
    }
    async createQualification(qualification) {
        await db.insert(qualifications).values({
            name: qualification.name,
            description: qualification.description,
            category: qualification.category,
            displayOrder: qualification.displayOrder || 0,
            isActive: true
        }).onConflictDoNothing();
    }
    async createSpecialization(specialization) {
        await db.insert(specializations).values({
            name: specialization.name,
            description: specialization.description,
            category: specialization.category,
            displayOrder: specialization.displayOrder || 0,
            isActive: true
        }).onConflictDoNothing();
    }
    async createSubject(subject) {
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
    async batchCreateQualifications(qualificationsList) {
        if (qualificationsList.length === 0)
            return;
        const values = qualificationsList.map(q => ({
            name: q.name,
            description: q.description,
            category: q.category,
            displayOrder: q.displayOrder || 0,
            isActive: true
        }));
        await db.insert(qualifications).values(values).onConflictDoNothing();
    }
    async batchCreateSpecializations(specializationsList) {
        if (specializationsList.length === 0)
            return;
        const values = specializationsList.map(s => ({
            name: s.name,
            description: s.description,
            category: s.category,
            displayOrder: s.displayOrder || 0,
            isActive: true
        }));
        await db.insert(specializations).values(values).onConflictDoNothing();
    }
    async batchCreateSubjects(subjectsList) {
        if (subjectsList.length === 0)
            return;
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
    async getQualificationsCount() {
        const result = await db.select({ count: sql `count(*)` }).from(qualifications);
        return result[0]?.count || 0;
    }
    async getSpecializationsCount() {
        const result = await db.select({ count: sql `count(*)` }).from(specializations);
        return result[0]?.count || 0;
    }
    async getSubjectsCount() {
        const result = await db.select({ count: sql `count(*)` }).from(subjects);
        return result[0]?.count || 0;
    }
    async createUserSession(session) {
        const [newSession] = await db.insert(userSessions).values(session).returning();
        return newSession;
    }
    async getUserSessions(userId) {
        return await db.select().from(userSessions)
            .where(eq(userSessions.userId, userId))
            .orderBy(desc(userSessions.lastActivity));
    }
    async getActiveUserSessions(userId) {
        return await db.select().from(userSessions)
            .where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, true)))
            .orderBy(desc(userSessions.lastActivity));
    }
    async getUserSessionByToken(sessionToken) {
        const [session] = await db.select().from(userSessions)
            .where(eq(userSessions.sessionToken, sessionToken));
        return session;
    }
    async updateSessionActivity(sessionToken) {
        await db.update(userSessions)
            .set({ lastActivity: new Date() })
            .where(eq(userSessions.sessionToken, sessionToken));
    }
    async deactivateSession(sessionToken) {
        await db.update(userSessions)
            .set({ isActive: false })
            .where(eq(userSessions.sessionToken, sessionToken));
    }
    async deactivateUserSessions(userId) {
        await db.update(userSessions)
            .set({ isActive: false })
            .where(eq(userSessions.userId, userId));
    }
    async deleteUserSessions(userId) {
        await db.delete(userSessions)
            .where(eq(userSessions.userId, userId));
    }
    async deleteSession(sessionToken) {
        await db.delete(userSessions)
            .where(eq(userSessions.sessionToken, sessionToken));
    }
    async getMultipleLoginUsers() {
        const activeSessions = await db.select({
            userId: userSessions.userId,
            sessionCount: sql `COUNT(*)`.as('sessionCount')
        })
            .from(userSessions)
            .where(eq(userSessions.isActive, true))
            .groupBy(userSessions.userId)
            .having(sql `COUNT(*) > 1`);
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
    async createAzureVm(vmConfig) {
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
        setTimeout(() => {
            console.log('✅ Azure VM created successfully:', vmConfig.vmName);
        }, 5000);
        return vmData;
    }
    async getAzureVm(vmName) {
        console.log('🔍 Getting Azure VM details:', vmName);
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
    async listAzureVms() {
        console.log('📋 Listing all Azure VMs');
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
    async updateAzureVm(vmName, updates) {
        console.log('⚙️ Updating Azure VM:', vmName, 'Updates:', updates);
    }
    async deleteAzureVm(vmName) {
        console.log('🗑️ Deleting Azure VM:', vmName);
    }
    async getVmStatus(vmName) {
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
    async startAzureVm(vmName) {
        console.log('▶️ Starting Azure VM:', vmName);
    }
    async stopAzureVm(vmName) {
        console.log('⏹️ Stopping Azure VM:', vmName);
    }
    async restartAzureVm(vmName) {
        console.log('🔄 Restarting Azure VM:', vmName);
    }
    async uploadRecordingToVm(sessionId, fileData) {
        console.log('⬆️ Uploading recording to VM for session:', sessionId);
        const recordingUrl = `https://codeconnect.blob.core.windows.net/recordings/session-${sessionId}-${Date.now()}.mp4`;
        await this.updateVideoSessionRecording(sessionId, recordingUrl);
        return recordingUrl;
    }
    async downloadRecordingFromVm(sessionId) {
        console.log('⬇️ Downloading recording from VM for session:', sessionId);
        return {
            sessionId,
            downloadUrl: `https://codeconnect.blob.core.windows.net/recordings/session-${sessionId}.mp4?signed-url-token`,
            expiresAt: new Date(Date.now() + 3600000),
            fileSize: 52428800,
            format: 'mp4'
        };
    }
    async deleteRecordingFromVm(sessionId) {
        console.log('🗑️ Deleting recording from VM for session:', sessionId);
        await this.updateVideoSessionRecording(sessionId, '');
    }
    async getRecordingStorageStats() {
        console.log('📊 Getting recording storage statistics');
        return {
            totalRecordings: 45,
            totalStorageUsed: 8589934592,
            averageRecordingSize: 190840217,
            storageQuota: 107374182400,
            storageUsagePercent: 8.0,
            monthlyUploadCount: 12,
            monthlyDownloadCount: 34,
            retentionDays: 365,
            oldestRecording: new Date('2024-01-15'),
            newestRecording: new Date()
        };
    }
    async createTeacherAudioMetrics(metrics) {
        const overallScore = (metrics.encourageInvolvement +
            metrics.pleasantCommunication +
            metrics.avoidPersonalDetails +
            metrics.studentTalkRatio +
            metrics.questionRate +
            metrics.clarity +
            metrics.adherenceToTopic +
            metrics.politeness) / 8;
        const [result] = await db.insert(teacherAudioMetrics).values({
            ...metrics,
            overallScore: overallScore.toFixed(1)
        }).returning();
        console.log(`📊 Created audio analytics for mentor ${metrics.mentorId} with overall score ${overallScore.toFixed(1)}`);
        return result;
    }
    async getTeacherAudioMetrics(mentorId, options) {
        const baseQuery = db.select().from(teacherAudioMetrics)
            .where(eq(teacherAudioMetrics.mentorId, mentorId))
            .orderBy(desc(teacherAudioMetrics.computedAt));
        if (options?.limit) {
            return await baseQuery.limit(options.limit);
        }
        return await baseQuery;
    }
    async getTeacherAudioMetricsAggregates(window) {
        const results = await db
            .select({
            mentorId: teacherAudioMetrics.mentorId,
            mentorName: sql `COALESCE(users.first_name || ' ' || users.last_name, users.email)`,
            avgEncourageInvolvement: sql `AVG(${teacherAudioMetrics.encourageInvolvement})`,
            avgPleasantCommunication: sql `AVG(${teacherAudioMetrics.pleasantCommunication})`,
            avgAvoidPersonalDetails: sql `AVG(${teacherAudioMetrics.avoidPersonalDetails})`,
            avgOverallScore: sql `AVG(${teacherAudioMetrics.overallScore})`,
            totalClasses: sql `COUNT(*)`
        })
            .from(teacherAudioMetrics)
            .leftJoin(mentors, eq(teacherAudioMetrics.mentorId, mentors.id))
            .leftJoin(users, eq(mentors.userId, users.id))
            .groupBy(teacherAudioMetrics.mentorId, users.firstName, users.lastName, users.email);
        return results.map((row) => ({
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
    async getTeacherAudioAggregate(mentorId) {
        const [result] = await db
            .select({
            avgEncourageInvolvement: sql `AVG(${teacherAudioMetrics.encourageInvolvement})`,
            avgPleasantCommunication: sql `AVG(${teacherAudioMetrics.pleasantCommunication})`,
            avgAvoidPersonalDetails: sql `AVG(${teacherAudioMetrics.avoidPersonalDetails})`,
            avgOverallScore: sql `AVG(${teacherAudioMetrics.overallScore})`,
            totalClasses: sql `COUNT(*)`
        })
            .from(teacherAudioMetrics)
            .where(eq(teacherAudioMetrics.mentorId, mentorId));
        if (!result || Number(result.totalClasses) === 0)
            return undefined;
        return {
            encourageInvolvement: Math.round(result.avgEncourageInvolvement * 10) / 10,
            pleasantCommunication: Math.round(result.avgPleasantCommunication * 10) / 10,
            avoidPersonalDetails: Math.round(result.avgAvoidPersonalDetails * 10) / 10,
            overallScore: Math.round(result.avgOverallScore * 10) / 10,
            totalClasses: result.totalClasses
        };
    }
    async getHomeSectionControls() {
        return await db.select().from(homeSectionControls).orderBy(homeSectionControls.displayOrder);
    }
    async updateHomeSectionControl(sectionType, sectionName, isEnabled) {
        await db.insert(homeSectionControls).values({
            sectionType,
            sectionName,
            isEnabled
        }).onConflictDoUpdate({
            target: [homeSectionControls.sectionType, homeSectionControls.sectionName],
            set: {
                isEnabled,
                updatedAt: sql `NOW()`
            }
        });
        console.log(`⚙️ Updated home section control: ${sectionType}.${sectionName} = ${isEnabled}`);
    }
    async getHomeSectionControlsForType(sectionType) {
        return await db.select().from(homeSectionControls)
            .where(eq(homeSectionControls.sectionType, sectionType))
            .orderBy(homeSectionControls.displayOrder);
    }
    async createRecordingPart(part) {
        const { randomUUID } = await import('crypto');
        const partWithId = {
            ...part,
            id: part.id || randomUUID()
        };
        const [created] = await db.insert(recordingParts).values(partWithId).returning();
        return created;
    }
    async getRecordingPartsByBooking(bookingId) {
        return await db.select().from(recordingParts)
            .where(eq(recordingParts.bookingId, bookingId))
            .orderBy(recordingParts.partNumber);
    }
    async updateRecordingPartStatus(id, status) {
        await db.update(recordingParts)
            .set({ status })
            .where(eq(recordingParts.id, id));
    }
    async createMergedRecording(recording) {
        const { randomUUID } = await import('crypto');
        const recordingWithId = {
            ...recording,
            id: recording.id || randomUUID()
        };
        const [created] = await db.insert(mergedRecordings).values(recordingWithId).returning();
        return created;
    }
    async getMergedRecordingByBooking(bookingId) {
        const [recording] = await db.select().from(mergedRecordings)
            .where(eq(mergedRecordings.bookingId, bookingId));
        return recording;
    }
    async getMergedRecordingsForStudent(studentId) {
        const recordings = await db.select()
            .from(mergedRecordings)
            .innerJoin(bookings, eq(mergedRecordings.bookingId, bookings.id))
            .where(and(eq(bookings.studentId, studentId), eq(mergedRecordings.status, 'completed')))
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
    async getAzureStorageConfig() {
        const [config] = await db.select().from(azureStorageConfig)
            .where(eq(azureStorageConfig.isActive, true))
            .limit(1);
        return config;
    }
    async updateRecordingPartsMergeStatus(bookingId, status) {
        await db.update(recordingParts)
            .set({ status })
            .where(eq(recordingParts.bookingId, bookingId));
    }
    async getBookingsForMerge(twentyMinutesAgo) {
        const result = await db.select().from(bookings)
            .where(and(eq(bookings.status, 'completed'), sql `${bookings.scheduledAt} <= ${twentyMinutesAgo}`));
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
    async getEndedScheduledBookings() {
        const now = new Date();
        const result = await db.select().from(bookings)
            .where(and(eq(bookings.status, 'scheduled'), sql `${bookings.scheduledAt} + (${bookings.duration} || ' minutes')::interval < ${now}`));
        return result;
    }
    async getExpiredRecordings() {
        const now = new Date();
        return await db.select().from(mergedRecordings)
            .where(and(sql `${mergedRecordings.expiresAt} <= ${now}`, eq(mergedRecordings.status, 'active')));
    }
    async deleteMergedRecording(id) {
        await db.update(mergedRecordings)
            .set({ status: 'deleted' })
            .where(eq(mergedRecordings.id, id));
    }
    async deleteRecordingPartsByBooking(bookingId) {
        await db.update(recordingParts)
            .set({ status: 'deleted' })
            .where(eq(recordingParts.bookingId, bookingId));
    }
    async getTeacherSubjectsByMentor(mentorId) {
        return await db
            .select()
            .from(teacherSubjects)
            .where(eq(teacherSubjects.mentorId, mentorId))
            .orderBy(teacherSubjects.priority);
    }
    async createTeacherSubject(mentorId, subject, experience, classFee) {
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
    async updateTeacherSubjectFee(subjectId, classFee) {
        await db
            .update(teacherSubjects)
            .set({ classFee: classFee.toString() })
            .where(eq(teacherSubjects.id, subjectId));
    }
    async getTeacherSubjectFee(mentorId, subject) {
        const results = await db
            .select()
            .from(teacherSubjects)
            .where(and(eq(teacherSubjects.mentorId, mentorId), eq(teacherSubjects.subject, subject)));
        if (results.length > 0 && results[0].classFee) {
            return parseFloat(results[0].classFee.toString());
        }
        return null;
    }
    async getAdminPaymentConfig() {
        const results = await db.select().from(adminPaymentConfig).limit(1);
        return results.length > 0 ? results[0] : undefined;
    }
    async updateAdminPaymentConfig(paymentMode, razorpayMode, enableRazorpay, adminUpiId) {
        const existing = await this.getAdminPaymentConfig();
        const updates = { updatedAt: new Date() };
        if (paymentMode !== undefined)
            updates.paymentMode = paymentMode;
        if (razorpayMode !== undefined)
            updates.razorpayMode = razorpayMode;
        if (enableRazorpay !== undefined)
            updates.enableRazorpay = enableRazorpay;
        if (adminUpiId !== undefined)
            updates.adminUpiId = adminUpiId;
        if (existing) {
            await db
                .update(adminPaymentConfig)
                .set(updates)
                .where(eq(adminPaymentConfig.id, existing.id));
        }
        else {
            await db.insert(adminPaymentConfig).values({
                paymentMode: paymentMode || 'dummy',
                razorpayMode: razorpayMode || 'upi',
                enableRazorpay: enableRazorpay || false,
                ...(adminUpiId && { adminUpiId })
            });
        }
    }
    async getAdminUiConfig() {
        const results = await db.select().from(adminUiConfig).limit(1);
        return results.length > 0 ? results[0] : undefined;
    }
    async updateAdminUiConfig(config) {
        const existing = await this.getAdminUiConfig();
        if (existing) {
            await db
                .update(adminUiConfig)
                .set({
                ...(config.footerLinks && { footerLinks: config.footerLinks }),
                ...(config.showHelpCenter !== undefined && { showHelpCenter: config.showHelpCenter }),
                updatedAt: new Date()
            })
                .where(eq(adminUiConfig.id, existing.id));
        }
        else {
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
            });
        }
    }
    async updateAzureStorageConfig(config) {
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
        }
        else {
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
//# sourceMappingURL=storage.js.map