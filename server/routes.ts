import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { eq, desc, and, gte, lte, or } from "drizzle-orm";
import { db } from "./db";
import { adminConfig, footerLinks, timeSlots, teacherProfiles, courses, type InsertAdminConfig, type InsertFooterLink, type InsertTimeSlot, type InsertTeacherProfile, type InsertCourse } from "@shared/schema";
import Stripe from "stripe";
import {
  insertUserSchema,
  insertMentorSchema,
  insertStudentSchema,
  insertBookingSchema,
  insertReviewSchema,
  insertAchievementSchema,
  insertChatSessionSchema,
  insertChatMessageSchema,
  insertVideoSessionSchema,
  insertClassFeedbackSchema,
  insertNotificationSchema,
  insertCourseSchema,
} from "@shared/schema";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'NA') {
  console.warn('⚠️ Stripe not configured - payment features disabled');
}
const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'NA' 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check credentials against test users
      const validCredentials = [
        { email: "udayakirang09@gmail.com", password: "Hello111", role: "student" },
        { email: "teacher@codeconnect.com", password: "Hello111", role: "mentor" },
        { email: "admin@codeconnect.com", password: "Hello111", role: "admin" }
      ];
      
      const validUser = validCredentials.find(cred => 
        cred.email === email.trim() && cred.password === password.trim()
      );
      
      if (!validUser) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if user exists in database, if not create them
      let user = await storage.getUserByEmail(email.trim());
      if (!user) {
        user = await storage.createUser({
          email: email.trim(),
          firstName: validUser.email.split('@')[0],
          lastName: 'User',
          role: validUser.role
        });
        
        // Create corresponding student/mentor record
        if (validUser.role === 'student') {
          await storage.createStudent({
            userId: user.id,
            age: 16,
            interests: ['programming']
          });
        } else if (validUser.role === 'mentor') {
          await storage.createMentor({
            userId: user.id,
            title: 'Programming Mentor',
            description: 'Experienced programming mentor',
            experience: 5,
            specialties: ['JavaScript', 'Python'],
            hourlyRate: '35.00',
            availableSlots: []
          });
        }
      }
      
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Generate reset code and store it temporarily
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Import email service dynamically to avoid startup errors
      const { sendEmail, generateResetEmail } = await import('./email');
      
      // Generate email content
      const emailContent = generateResetEmail(email, resetCode);
      
      // Send real email
      const emailSent = await sendEmail({
        to: email,
        from: 'noreply@codeconnect.com',
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });
      
      if (emailSent) {
        // TODO: Store reset code in database with expiration
        // For now, we'll use the demo code "123456"
        console.log(`📧 Password reset email sent to: ${email} with code: ${resetCode}`);
        res.json({ 
          success: true, 
          message: "Reset code sent to your email. Please check your inbox.",
          demoCode: "123456" // Remove this in production
        });
      } else {
        console.log(`❌ Failed to send email to: ${email}`);
        res.status(500).json({ message: "Failed to send reset email. Please try again." });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });
  
  // Mentor routes
  app.get("/api/mentors", async (req, res) => {
    try {
      const mentors = await storage.getMentors();
      res.json(mentors);
    } catch (error) {
      console.error("Error fetching mentors:", error);
      res.status(500).json({ message: "Failed to fetch mentors" });
    }
  });

  app.get("/api/mentors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const mentor = await storage.getMentor(id);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      res.json(mentor);
    } catch (error) {
      console.error("Error fetching mentor:", error);
      res.status(500).json({ message: "Failed to fetch mentor" });
    }
  });

  app.post("/api/mentors", async (req, res) => {
    try {
      const mentorData = insertMentorSchema.parse(req.body);
      const mentor = await storage.createMentor(mentorData);
      res.status(201).json(mentor);
    } catch (error) {
      console.error("Error creating mentor:", error);
      res.status(400).json({ message: "Invalid mentor data" });
    }
  });

  // Student routes
  app.get("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getStudent(id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: "Invalid student data" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Booking routes
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.get("/api/students/:id/bookings", async (req, res) => {
    try {
      const { id } = req.params;
      const bookings = await storage.getBookingsByStudent(id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching student bookings:", error);
      res.status(500).json({ message: "Failed to fetch student bookings" });
    }
  });

  app.get("/api/mentors/:id/bookings", async (req, res) => {
    try {
      const { id } = req.params;
      const bookings = await storage.getBookingsByMentor(id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching mentor bookings:", error);
      res.status(500).json({ message: "Failed to fetch mentor bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      // Convert scheduledAt string to Date if needed
      if (req.body.scheduledAt && typeof req.body.scheduledAt === 'string') {
        req.body.scheduledAt = new Date(req.body.scheduledAt);
      }
      
      // Convert duration string to number if needed
      if (req.body.duration && typeof req.body.duration === 'string') {
        req.body.duration = parseInt(req.body.duration);
      }
      
      // Get user info from request
      const userEmail = req.body.userEmail; // We'll get this from the frontend
      if (!userEmail) {
        return res.status(400).json({ message: "User not authenticated" });
      }
      
      // Find user and their student record
      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      let student = await storage.getStudentByUserId(user.id);
      if (!student) {
        // Auto-create student record if doesn't exist
        student = await storage.createStudent({
          userId: user.id,
          age: req.body.studentAge || null,
          interests: ['programming']
        });
      }
      
      const bookingData = {
        studentId: student.id,
        mentorId: req.body.mentorId,
        scheduledAt: req.body.scheduledAt,
        duration: req.body.duration,
        notes: req.body.notes || ''
      };
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create booking" });
      }
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["scheduled", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateBookingStatus(id, status);
      res.json({ message: "Booking status updated successfully" });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Review routes
  app.get("/api/mentors/:id/reviews", async (req, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getReviewsByMentor(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching mentor reviews:", error);
      res.status(500).json({ message: "Failed to fetch mentor reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  // Achievement routes
  app.get("/api/students/:id/achievements", async (req, res) => {
    try {
      const { id } = req.params;
      const achievements = await storage.getAchievementsByStudent(id);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching student achievements:", error);
      res.status(500).json({ message: "Failed to fetch student achievements" });
    }
  });

  app.post("/api/achievements", async (req, res) => {
    try {
      const achievementData = insertAchievementSchema.parse(req.body);
      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Error creating achievement:", error);
      res.status(400).json({ message: "Invalid achievement data" });
    }
  });

  // Video session routes
  app.post("/api/video-sessions", async (req, res) => {
    console.log("🎥 POST /api/video-sessions - Creating video session");
    try {
      const videoData = insertVideoSessionSchema.parse(req.body);
      const session = await storage.createVideoSession(videoData);
      console.log(`✅ Created video session ${session.id}`);
      res.status(201).json(session);
    } catch (error) {
      console.error("❌ Error creating video session:", error);
      res.status(500).json({ message: "Failed to create video session" });
    }
  });

  app.get("/api/bookings/:bookingId/video-session", async (req, res) => {
    console.log(`🔍 GET /api/bookings/${req.params.bookingId}/video-session - Fetching video session`);
    try {
      const session = await storage.getVideoSessionByBooking(req.params.bookingId);
      if (!session) {
        return res.status(404).json({ message: "Video session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("❌ Error fetching video session:", error);
      res.status(500).json({ message: "Failed to fetch video session" });
    }
  });

  // Chat session routes
  app.post("/api/chat-sessions", async (req, res) => {
    console.log("💬 POST /api/chat-sessions - Creating chat session");
    try {
      const chatData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(chatData);
      console.log(`✅ Created chat session ${session.id}`);
      res.status(201).json(session);
    } catch (error) {
      console.error("❌ Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.post("/api/chat-sessions/:sessionId/messages", async (req, res) => {
    console.log(`💬 POST /api/chat-sessions/${req.params.sessionId}/messages - Sending message`);
    try {
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        chatSessionId: req.params.sessionId
      });
      const message = await storage.sendChatMessage(messageData);
      console.log(`✅ Sent message ${message.id}`);
      res.status(201).json(message);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/chat-sessions/:sessionId/messages", async (req, res) => {
    console.log(`🔍 GET /api/chat-sessions/${req.params.sessionId}/messages - Fetching messages`);
    try {
      const messages = await storage.getChatMessages(req.params.sessionId);
      console.log(`✅ Found ${messages.length} messages`);
      res.json(messages);
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Class feedback routes
  app.post("/api/class-feedback", async (req, res) => {
    console.log("⭐ POST /api/class-feedback - Submitting feedback");
    try {
      const feedbackData = insertClassFeedbackSchema.parse(req.body);
      const feedback = await storage.submitClassFeedback(feedbackData);
      console.log(`✅ Submitted feedback ${feedback.id}`);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("❌ Error submitting feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  app.get("/api/bookings/:bookingId/feedback", async (req, res) => {
    console.log(`🔍 GET /api/bookings/${req.params.bookingId}/feedback - Fetching feedback`);
    try {
      const feedback = await storage.getClassFeedback(req.params.bookingId);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      res.json(feedback);
    } catch (error) {
      console.error("❌ Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Notification routes
  app.post("/api/notifications", async (req, res) => {
    console.log("🔔 POST /api/notifications - Creating notification");
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      console.log(`✅ Created notification ${notification.id}`);
      res.status(201).json(notification);
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.get("/api/users/:userId/notifications", async (req, res) => {
    console.log(`🔍 GET /api/users/${req.params.userId}/notifications - Fetching notifications`);
    try {
      const notifications = await storage.getUserNotifications(req.params.userId);
      console.log(`✅ Found ${notifications.length} notifications`);
      res.json(notifications);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    console.log(`📖 PATCH /api/notifications/${req.params.id}/read - Marking as read`);
    try {
      await storage.markNotificationAsRead(req.params.id);
      console.log(`✅ Marked notification ${req.params.id} as read`);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Teacher routes
  app.get("/api/teacher/classes", async (req, res) => {
    try {
      const teacherId = req.query.teacherId as string;
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID required" });
      }
      
      const mentor = await storage.getMentorByUserId(teacherId);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      const bookings = await storage.getBookingsByMentor(mentor.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
      res.status(500).json({ message: "Failed to fetch teacher classes" });
    }
  });

  app.get("/api/teacher/stats", async (req, res) => {
    try {
      const teacherId = req.query.teacherId as string;
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID required" });
      }
      
      const mentor = await storage.getMentorByUserId(teacherId);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      const bookings = await storage.getBookingsByMentor(mentor.id);
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.duration * parseFloat(mentor.hourlyRate || '0') / 60), 0);
      
      const stats = {
        totalStudents: new Set(bookings.map(b => b.studentId)).size,
        monthlyEarnings: totalEarnings,
        averageRating: parseFloat(mentor.rating || '0') || 0,
        completedSessions: completedBookings.length
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Failed to fetch teacher stats" });
    }
  });

  // Teacher Profile routes
  app.get("/api/teacher/profile", async (req, res) => {
    try {
      const teacherId = req.query.teacherId as string;
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID required" });
      }
      
      const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, teacherId));
      
      if (!profile) {
        return res.status(404).json({ message: "Teacher profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      res.status(500).json({ message: "Failed to fetch teacher profile" });
    }
  });

  app.post("/api/teacher/profile", async (req, res) => {
    try {
      const teacherId = req.query.teacherId as string;
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID required" });
      }
      
      const profileData: InsertTeacherProfile = {
        userId: teacherId,
        ...req.body
      };
      
      // Check if profile already exists
      const [existing] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, teacherId));
      
      if (existing) {
        // Update existing profile
        const [updated] = await db.update(teacherProfiles)
          .set(profileData)
          .where(eq(teacherProfiles.userId, teacherId))
          .returning();
        res.json(updated);
      } else {
        // Create new profile
        const [created] = await db.insert(teacherProfiles).values([profileData]).returning();
        res.status(201).json(created);
      }
    } catch (error) {
      console.error("Error saving teacher profile:", error);
      res.status(500).json({ message: "Failed to save teacher profile" });
    }
  });

  app.put("/api/teacher/profile", async (req, res) => {
    try {
      const teacherId = req.query.teacherId as string;
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID required" });
      }
      
      const [updated] = await db.update(teacherProfiles)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(teacherProfiles.userId, teacherId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Teacher profile not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating teacher profile:", error);
      res.status(500).json({ message: "Failed to update teacher profile" });
    }
  });

  // Teacher Course routes
  app.get("/api/teacher/courses", async (req, res) => {
    try {
      const teacherId = req.query.teacherId as string;
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID required" });
      }
      
      const mentor = await storage.getMentorByUserId(teacherId);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      const teacherCourses = await db.select().from(courses).where(eq(courses.mentorId, mentor.id));
      res.json(teacherCourses);
    } catch (error) {
      console.error("Error fetching teacher courses:", error);
      res.status(500).json({ message: "Failed to fetch teacher courses" });
    }
  });

  app.post("/api/teacher/courses", async (req, res) => {
    try {
      const teacherId = req.query.teacherId as string;
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID required" });
      }
      
      const mentor = await storage.getMentorByUserId(teacherId);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }

      // Get teacher profile to validate experience
      const [teacherProfile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, teacherId));
      
      if (!teacherProfile) {
        return res.status(400).json({ 
          message: "Teacher profile required. Please complete your profile first to create courses." 
        });
      }

      // Validate course data
      const courseData = insertCourseSchema.parse({
        ...req.body,
        mentorId: mentor.id
      });

      // Validate that teacher has experience in the course category
      const { category, title } = courseData;
      let hasExperience = false;
      let experienceMessage = "";

      if (teacherProfile.programmingLanguages && teacherProfile.programmingLanguages.length > 0) {
        // Check if the course category matches any programming language experience
        const languageExperience = teacherProfile.programmingLanguages.find(lang => {
          const courseCategoryLower = category.toLowerCase();
          const languageLower = lang.language.toLowerCase();
          
          // Check for direct matches or related categories
          if (courseCategoryLower.includes(languageLower) || languageLower.includes(courseCategoryLower)) {
            return true;
          }
          
          // Special category matching logic
          if (courseCategoryLower === 'web-development' && 
              (languageLower.includes('javascript') || languageLower.includes('html') || 
               languageLower.includes('css') || languageLower.includes('react') || 
               languageLower.includes('vue') || languageLower.includes('angular'))) {
            return true;
          }
          
          if (courseCategoryLower === 'mobile-development' && 
              (languageLower.includes('react native') || languageLower.includes('flutter') || 
               languageLower.includes('swift') || languageLower.includes('kotlin'))) {
            return true;
          }
          
          if (courseCategoryLower === 'data-science' && 
              (languageLower.includes('python') || languageLower.includes('r') || 
               languageLower.includes('sql') || languageLower.includes('scala'))) {
            return true;
          }
          
          return false;
        });

        if (languageExperience) {
          hasExperience = true;
          experienceMessage = `Validated: ${languageExperience.yearsOfExperience} years of ${languageExperience.language} experience (${languageExperience.proficiencyLevel} level)`;
        }
      }

      if (!hasExperience) {
        return res.status(400).json({ 
          message: `Course creation rejected: No matching experience found for "${category}" category. Please update your teacher profile with relevant programming language experience before creating this course.`
        });
      }

      // Create the course
      const [newCourse] = await db.insert(courses).values(courseData).returning();
      
      console.log(`✅ Course created: "${title}" by teacher ${teacherId} - ${experienceMessage}`);
      res.status(201).json({ 
        course: newCourse, 
        validationMessage: experienceMessage 
      });
    } catch (error) {
      console.error("Error creating course:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid course data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create course" });
      }
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    console.log("📊 GET /api/admin/stats - Fetching system statistics");
    try {
      const stats = await storage.getSystemStats();
      console.log(`✅ Retrieved system stats`);
      res.json(stats);
    } catch (error) {
      console.error("❌ Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch system statistics" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    console.log("👥 GET /api/admin/users - Fetching all users (admin only)");
    try {
      const users = await storage.getAllUsers();
      console.log(`✅ Found ${users.length} users`);
      res.json(users);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await storage.updateUser(id, updates);
      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/mentor-applications", async (req, res) => {
    try {
      const { status } = req.query;
      const applications = await storage.getMentorApplications(status as string);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching mentor applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.patch("/api/admin/mentor-applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;
      await storage.updateMentorApplicationStatus(id, status, feedback);
      res.json({ message: "Application status updated successfully" });
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Stripe Payment Routes
  // Non-Stripe payment processing
  app.post("/api/process-payment", async (req, res) => {
    try {
      const { courseId, courseName, amount, paymentMethod, transactionId } = req.body;
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create enrollment record
      const enrollmentData = {
        courseId,
        courseName,
        amount,
        paymentMethod,
        transactionId,
        status: "completed",
        enrolledAt: new Date()
      };
      
      console.log(`💳 Payment processed for ₹${amount} - Course: ${courseName} via ${paymentMethod}`);
      
      res.json({ 
        success: true,
        transactionId,
        message: "Payment completed successfully"
      });
    } catch (error: any) {
      console.error("❌ Payment processing failed:", error.message);
      res.status(500).json({ message: "Payment processing failed: " + error.message });
    }
  });

  // Admin Contact Features Toggle Routes
  app.get("/api/admin/contact-settings", async (req, res) => {
    try {
      // In real app, this would be stored in database
      const settings = {
        emailEnabled: false,
        chatEnabled: false,
        phoneEnabled: false,
      };
      res.json(settings);
    } catch (error: any) {
      console.error("❌ Error fetching contact settings:", error.message);
      res.status(500).json({ message: "Failed to fetch contact settings" });
    }
  });

  app.patch("/api/admin/contact-settings", async (req, res) => {
    try {
      const { emailEnabled, chatEnabled, phoneEnabled } = req.body;
      
      // In real app, save to database
      console.log(`⚙️ Contact settings updated:`, { emailEnabled, chatEnabled, phoneEnabled });
      
      const settings = { emailEnabled, chatEnabled, phoneEnabled };
      res.json(settings);
    } catch (error: any) {
      console.error("❌ Error updating contact settings:", error.message);
      res.status(500).json({ message: "Failed to update contact settings" });
    }
  });

  // Class Management API Endpoints
  app.get("/api/classes/upcoming", async (req, res) => {
    try {
      const currentTime = new Date();
      const next72Hours = new Date(currentTime.getTime() + 72 * 60 * 60 * 1000);
      
      // Sample upcoming classes data
      const upcomingClasses = [
        {
          id: '1',
          mentorName: 'Sarah Johnson',
          subject: 'Python Basics',
          scheduledAt: new Date(Date.now() + 50 * 60 * 1000), // 50 minutes from now
          duration: 60,
          videoEnabled: false,
          chatEnabled: true,
          feedbackEnabled: false,
        },
        {
          id: '2',
          mentorName: 'Mike Chen',
          subject: 'JavaScript Functions',
          scheduledAt: new Date(Date.now() + 30 * 60 * 60 * 1000), // 30 hours from now
          duration: 90,
          videoEnabled: false,
          chatEnabled: true,
          feedbackEnabled: false,
        },
      ];
      
      // Filter for next 72 hours
      const filtered = upcomingClasses.filter(cls => {
        const classTime = new Date(cls.scheduledAt);
        return classTime >= currentTime && classTime <= next72Hours;
      });
      
      res.json(filtered);
    } catch (error) {
      console.error("Error loading upcoming classes:", error);
      res.status(500).json({ error: "Failed to load upcoming classes" });
    }
  });

  app.get("/api/classes/completed", async (req, res) => {
    try {
      const currentTime = new Date();
      const last12Hours = new Date(currentTime.getTime() - 12 * 60 * 60 * 1000);
      
      // Sample completed classes data
      const completedClasses = [
        {
          id: '3',
          mentorName: 'Alex Rivera',
          subject: 'HTML & CSS Intro',
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          feedbackDeadline: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
          hasSubmittedFeedback: false,
        },
        {
          id: '4',
          mentorName: 'Lisa Wang',
          subject: 'React Components',
          completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          feedbackDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          hasSubmittedFeedback: false,
        },
      ];
      
      // Filter for last 12 hours that need feedback
      const filtered = completedClasses.filter(cls => {
        const completedTime = new Date(cls.completedAt);
        const deadlineTime = new Date(cls.feedbackDeadline);
        return completedTime >= last12Hours && 
               !cls.hasSubmittedFeedback && 
               currentTime <= deadlineTime;
      });
      
      res.json(filtered);
    } catch (error) {
      console.error("Error loading completed classes:", error);
      res.status(500).json({ error: "Failed to load completed classes" });
    }
  });

  // Teacher Schedule Management Endpoints
  app.get("/api/teacher/schedule", async (req, res) => {
    try {
      // Sample schedule data with proper API structure
      const schedule = [
        { id: '1', dayOfWeek: 'Monday', startTime: '10:00', endTime: '12:00', isAvailable: true, isRecurring: true },
        { id: '2', dayOfWeek: 'Monday', startTime: '14:00', endTime: '16:00', isAvailable: false, isRecurring: true },
        { id: '3', dayOfWeek: 'Wednesday', startTime: '10:00', endTime: '12:00', isAvailable: true, isRecurring: true },
        { id: '4', dayOfWeek: 'Friday', startTime: '15:00', endTime: '17:00', isAvailable: true, isRecurring: true },
        { id: '5', dayOfWeek: 'Saturday', startTime: '09:00', endTime: '11:00', isAvailable: false, isRecurring: false },
      ];
      
      res.json(schedule);
    } catch (error) {
      console.error("Error loading teacher schedule:", error);
      res.status(500).json({ error: "Failed to load schedule" });
    }
  });

  app.patch("/api/teacher/schedule/:slotId", async (req, res) => {
    try {
      const { slotId } = req.params;
      const { isAvailable } = req.body;
      
      console.log(`📅 Updating schedule slot ${slotId}: available = ${isAvailable}`);
      
      // In real implementation, update database
      // For now, return success
      res.json({ 
        success: true, 
        message: `Time slot ${slotId} ${isAvailable ? 'unblocked' : 'blocked'} successfully` 
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  app.delete("/api/teacher/schedule/:slotId", async (req, res) => {
    try {
      const { slotId } = req.params;
      
      console.log(`🗑️ Deleting schedule slot ${slotId}`);
      
      // In real implementation, delete from database
      res.json({ 
        success: true, 
        message: `Time slot ${slotId} deleted successfully` 
      });
    } catch (error) {
      console.error("Error deleting schedule slot:", error);
      res.status(500).json({ error: "Failed to delete schedule slot" });
    }
  });

  // Admin Configuration Endpoints
  app.get("/api/admin/contact-settings", async (req, res) => {
    try {
      // Default contact settings
      const defaultSettings = {
        emailEnabled: true,
        chatEnabled: false,
        phoneEnabled: false
      };
      
      // In production, load from adminConfig table
      const emailConfig = await db.select().from(adminConfig).where(eq(adminConfig.configKey, 'email_support_enabled'));
      const chatConfig = await db.select().from(adminConfig).where(eq(adminConfig.configKey, 'chat_support_enabled'));
      const phoneConfig = await db.select().from(adminConfig).where(eq(adminConfig.configKey, 'phone_support_enabled'));
      
      const settings = {
        emailEnabled: emailConfig[0]?.configValue === 'true' ?? defaultSettings.emailEnabled,
        chatEnabled: chatConfig[0]?.configValue === 'true' ?? defaultSettings.chatEnabled,
        phoneEnabled: phoneConfig[0]?.configValue === 'true' ?? defaultSettings.phoneEnabled
      };
      
      res.json(settings);
    } catch (error) {
      console.error("Error loading contact settings:", error);
      res.status(500).json({ error: "Failed to load contact settings" });
    }
  });

  app.patch("/api/admin/contact-settings", async (req, res) => {
    try {
      const { emailEnabled, chatEnabled, phoneEnabled } = req.body;
      
      // Update or insert contact settings in adminConfig table
      await Promise.all([
        db.insert(adminConfig).values({
          configKey: 'email_support_enabled',
          configValue: emailEnabled.toString(),
          description: 'Enable/disable email support feature'
        }).onConflictDoUpdate({
          target: adminConfig.configKey,
          set: { configValue: emailEnabled.toString(), updatedAt: new Date() }
        }),
        
        db.insert(adminConfig).values({
          configKey: 'chat_support_enabled',
          configValue: chatEnabled.toString(),
          description: 'Enable/disable chat support feature'
        }).onConflictDoUpdate({
          target: adminConfig.configKey,
          set: { configValue: chatEnabled.toString(), updatedAt: new Date() }
        }),
        
        db.insert(adminConfig).values({
          configKey: 'phone_support_enabled',
          configValue: phoneEnabled.toString(),
          description: 'Enable/disable phone support feature'
        }).onConflictDoUpdate({
          target: adminConfig.configKey,
          set: { configValue: phoneEnabled.toString(), updatedAt: new Date() }
        })
      ]);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving contact settings:", error);
      res.status(500).json({ error: "Failed to save contact settings" });
    }
  });

  app.get("/api/admin/payment-config", async (req, res) => {
    try {
      // Load payment configuration from adminConfig table
      const configs = await db.select().from(adminConfig).where(
        or(
          eq(adminConfig.configKey, 'stripe_enabled'),
          eq(adminConfig.configKey, 'stripe_publishable_key'),
          eq(adminConfig.configKey, 'stripe_secret_key'),
          eq(adminConfig.configKey, 'razorpay_enabled'),
          eq(adminConfig.configKey, 'razorpay_key_id'),
          eq(adminConfig.configKey, 'razorpay_key_secret')
        )
      );
      
      const configMap = configs.reduce((acc, config) => {
        acc[config.configKey] = config.configValue;
        return acc;
      }, {} as Record<string, string | null>);
      
      const paymentConfig = {
        stripeEnabled: configMap['stripe_enabled'] === 'true',
        stripePublishableKey: configMap['stripe_publishable_key'] || '',
        stripeSecretKey: configMap['stripe_secret_key'] || '',
        razorpayEnabled: configMap['razorpay_enabled'] === 'true',
        razorpayKeyId: configMap['razorpay_key_id'] || '',
        razorpayKeySecret: configMap['razorpay_key_secret'] || ''
      };
      
      res.json(paymentConfig);
    } catch (error) {
      console.error("Error loading payment config:", error);
      res.status(500).json({ error: "Failed to load payment configuration" });
    }
  });

  app.patch("/api/admin/payment-config", async (req, res) => {
    try {
      const { 
        stripeEnabled, stripePublishableKey, stripeSecretKey,
        razorpayEnabled, razorpayKeyId, razorpayKeySecret
      } = req.body;
      
      // Update payment configuration in adminConfig table
      const configUpdates = [
        { key: 'stripe_enabled', value: stripeEnabled.toString() },
        { key: 'stripe_publishable_key', value: stripePublishableKey },
        { key: 'stripe_secret_key', value: stripeSecretKey },
        { key: 'razorpay_enabled', value: razorpayEnabled.toString() },
        { key: 'razorpay_key_id', value: razorpayKeyId },
        { key: 'razorpay_key_secret', value: razorpayKeySecret }
      ];
      
      await Promise.all(configUpdates.map(config =>
        db.insert(adminConfig).values({
          configKey: config.key,
          configValue: config.value,
          description: `Payment configuration for ${config.key}`
        }).onConflictDoUpdate({
          target: adminConfig.configKey,
          set: { configValue: config.value, updatedAt: new Date() }
        })
      ));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving payment config:", error);
      res.status(500).json({ error: "Failed to save payment configuration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
