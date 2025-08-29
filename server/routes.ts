import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
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
} from "@shared/schema";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'NA') {
  console.warn('⚠️ Stripe not configured - payment features disabled');
}
const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'NA' 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Ensure student exists before creating booking
      const student = await storage.getStudentByUserId(bookingData.studentId);
      if (!student) {
        return res.status(400).json({ message: "Student not found. Please register as a student first." });
      }
      
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
      const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
