import { Router } from 'express';
import { IStorage } from './storage';
import { userInsertSchema, classInsertSchema, feedbackInsertSchema, chatMessageInsertSchema } from '../shared/schema';

export function createRoutes(storage: IStorage) {
  const router = Router();

  // Auth routes
  router.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  router.post('/api/auth/register', async (req, res) => {
    try {
      const userData = userInsertSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ error: 'Registration failed' });
    }
  });

  // User routes
  router.get('/api/users', async (req, res) => {
    try {
      const { role } = req.query;
      const users = await storage.getAllUsers(role as string);
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  router.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  router.put('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Class routes
  router.post('/api/classes', async (req, res) => {
    try {
      const classData = classInsertSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      
      // Create chat room for the class
      await storage.createChatRoom(newClass.id, [classData.teacherId, classData.studentId]);
      
      res.json(newClass);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create class' });
    }
  });

  router.get('/api/classes', async (req, res) => {
    try {
      const { teacherId, studentId } = req.query;
      let classes;
      
      if (teacherId) {
        classes = await storage.getClassesByTeacher(teacherId as string);
      } else if (studentId) {
        classes = await storage.getClassesByStudent(studentId as string);
      } else {
        classes = await storage.getAllClasses();
      }
      
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch classes' });
    }
  });

  router.get('/api/classes/:id', async (req, res) => {
    try {
      const classItem = await storage.getClassById(req.params.id);
      if (!classItem) {
        return res.status(404).json({ error: 'Class not found' });
      }
      res.json(classItem);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch class' });
    }
  });

  router.put('/api/classes/:id', async (req, res) => {
    try {
      const updatedClass = await storage.updateClass(req.params.id, req.body);
      res.json(updatedClass);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update class' });
    }
  });

  router.get('/api/classes/upcoming/:userId', async (req, res) => {
    try {
      const classes = await storage.getUpcomingClasses(req.params.userId);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch upcoming classes' });
    }
  });

  // Feedback routes
  router.post('/api/feedback', async (req, res) => {
    try {
      const feedbackData = feedbackInsertSchema.parse(req.body);
      const feedback = await storage.createFeedback(feedbackData);
      res.json(feedback);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create feedback' });
    }
  });

  router.get('/api/feedback/class/:classId', async (req, res) => {
    try {
      const feedback = await storage.getFeedbackByClass(req.params.classId);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });

  router.get('/api/feedback/user/:userId', async (req, res) => {
    try {
      const feedback = await storage.getFeedbackByUser(req.params.userId);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });

  // Chat routes
  router.get('/api/chat/room/:roomId', async (req, res) => {
    try {
      const room = await storage.getChatRoom(req.params.roomId);
      if (!room) {
        return res.status(404).json({ error: 'Chat room not found' });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chat room' });
    }
  });

  router.get('/api/chat/messages/:roomId', async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.roomId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  router.post('/api/chat/messages', async (req, res) => {
    try {
      const messageData = chatMessageInsertSchema.parse(req.body);
      const message = await storage.addChatMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: 'Failed to send message' });
    }
  });

  // Analytics routes
  router.get('/api/analytics/teacher/:teacherId', async (req, res) => {
    try {
      const analytics = await storage.getTeacherAnalytics(req.params.teacherId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch teacher analytics' });
    }
  });

  router.get('/api/analytics/student/:studentId', async (req, res) => {
    try {
      const analytics = await storage.getStudentAnalytics(req.params.studentId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch student analytics' });
    }
  });

  router.get('/api/analytics/platform', async (req, res) => {
    try {
      const analytics = await storage.getPlatformAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch platform analytics' });
    }
  });

  // Admin routes
  router.get('/api/admin/settings', async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin settings' });
    }
  });

  router.put('/api/admin/settings', async (req, res) => {
    try {
      const settings = await storage.updateAdminSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update admin settings' });
    }
  });

  router.get('/api/admin/abuse-reports', async (req, res) => {
    try {
      const reports = await storage.getAbuseReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch abuse reports' });
    }
  });

  router.post('/api/admin/abuse-reports', async (req, res) => {
    try {
      const report = await storage.createAbuseReport(req.body);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create abuse report' });
    }
  });

  return router;
}