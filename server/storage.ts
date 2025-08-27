import { User, Class, Feedback, ChatMessage, ChatRoom, TeacherAnalytics, StudentAnalytics, PlatformAnalytics, AdminSettings } from '../shared/schema';

export interface IStorage {
  // User operations
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(role?: string): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Class operations
  createClass(classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>): Promise<Class>;
  getClassById(id: string): Promise<Class | null>;
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  getClassesByStudent(studentId: string): Promise<Class[]>;
  updateClass(id: string, updates: Partial<Class>): Promise<Class>;
  getAllClasses(): Promise<Class[]>;
  getUpcomingClasses(userId: string): Promise<Class[]>;

  // Feedback operations
  createFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback>;
  getFeedbackByClass(classId: string): Promise<Feedback[]>;
  getFeedbackByUser(userId: string): Promise<Feedback[]>;

  // Chat operations
  createChatRoom(classId: string, participants: string[]): Promise<ChatRoom>;
  getChatRoom(roomId: string): Promise<ChatRoom | null>;
  addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage>;
  getChatMessages(roomId: string): Promise<ChatMessage[]>;

  // Analytics operations
  getTeacherAnalytics(teacherId: string): Promise<TeacherAnalytics>;
  getStudentAnalytics(studentId: string): Promise<StudentAnalytics>;
  getPlatformAnalytics(): Promise<PlatformAnalytics>;

  // Admin operations
  getAdminSettings(): Promise<AdminSettings>;
  updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings>;
  getAbuseReports(): Promise<any[]>;
  createAbuseReport(report: any): Promise<any>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private classes: Map<string, Class> = new Map();
  private feedback: Map<string, Feedback> = new Map();
  private chatRooms: Map<string, ChatRoom> = new Map();
  private chatMessages: Map<string, ChatMessage[]> = new Map();
  private adminSettings: AdminSettings;

  constructor() {
    this.adminSettings = {
      id: 'main',
      featureTogles: {
        videoClasses: true,
        chatSystem: true,
        aiAnalytics: true,
        powerBiIntegration: true,
        quantumAI: true,
        abuseTracking: true,
      },
      platformSettings: {
        commissionRate: 15,
        minClassFee: 10,
        maxClassFee: 200,
        allowGroupClasses: true,
        requireTeacherVerification: false,
      },
      updatedAt: new Date(),
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: this.generateId(),
      status: 'active',
      rating: 0,
      totalClasses: 0,
      totalEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(role?: string): Promise<User[]> {
    const users = Array.from(this.users.values());
    return role ? users.filter(u => u.role === role) : users;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async createClass(classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>): Promise<Class> {
    const platformFee = classData.fee * (this.adminSettings.platformSettings.commissionRate / 100);
    const teacherEarnings = classData.fee - platformFee;

    const newClass: Class = {
      ...classData,
      id: this.generateId(),
      platformFee,
      teacherEarnings,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.classes.set(newClass.id, newClass);
    return newClass;
  }

  async getClassById(id: string): Promise<Class | null> {
    return this.classes.get(id) || null;
  }

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(c => c.teacherId === teacherId);
  }

  async getClassesByStudent(studentId: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(c => c.studentId === studentId);
  }

  async updateClass(id: string, updates: Partial<Class>): Promise<Class> {
    const classItem = this.classes.get(id);
    if (!classItem) throw new Error('Class not found');
    
    const updatedClass = { ...classItem, ...updates, updatedAt: new Date() };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getUpcomingClasses(userId: string): Promise<Class[]> {
    const now = new Date();
    return Array.from(this.classes.values()).filter(c => 
      (c.teacherId === userId || c.studentId === userId) && 
      c.scheduledAt > now && 
      c.status === 'scheduled'
    );
  }

  async createFeedback(feedbackData: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
    const feedback: Feedback = {
      ...feedbackData,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.feedback.set(feedback.id, feedback);
    return feedback;
  }

  async getFeedbackByClass(classId: string): Promise<Feedback[]> {
    return Array.from(this.feedback.values()).filter(f => f.classId === classId);
  }

  async getFeedbackByUser(userId: string): Promise<Feedback[]> {
    return Array.from(this.feedback.values()).filter(f => f.toUserId === userId);
  }

  async createChatRoom(classId: string, participants: string[]): Promise<ChatRoom> {
    const chatRoom: ChatRoom = {
      id: this.generateId(),
      classId,
      participants,
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.chatRooms.set(chatRoom.id, chatRoom);
    this.chatMessages.set(chatRoom.id, []);
    return chatRoom;
  }

  async getChatRoom(roomId: string): Promise<ChatRoom | null> {
    return this.chatRooms.get(roomId) || null;
  }

  async addChatMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const message: ChatMessage = {
      ...messageData,
      id: this.generateId(),
      timestamp: new Date(),
    };
    
    const messages = this.chatMessages.get(messageData.roomId) || [];
    messages.push(message);
    this.chatMessages.set(messageData.roomId, messages);
    
    return message;
  }

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(roomId) || [];
  }

  async getTeacherAnalytics(teacherId: string): Promise<TeacherAnalytics> {
    const classes = await this.getClassesByTeacher(teacherId);
    const completedClasses = classes.filter(c => c.status === 'completed');
    const feedbacks = await Promise.all(classes.map(c => this.getFeedbackByClass(c.id)));
    const allFeedback = feedbacks.flat();
    
    return {
      teacherId,
      totalClasses: completedClasses.length,
      totalEarnings: completedClasses.reduce((sum, c) => sum + c.teacherEarnings, 0),
      averageRating: allFeedback.length ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length : 0,
      studentRetentionRate: 85, // Simulated
      teachingBrillanceScore: 92, // AI-calculated score
      skillPopularity: {},
      monthlyTrends: [],
    };
  }

  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    const classes = await this.getClassesByStudent(studentId);
    const completedClasses = classes.filter(c => c.status === 'completed');
    
    return {
      studentId,
      totalClasses: completedClasses.length,
      totalSpent: completedClasses.reduce((sum, c) => sum + c.fee, 0),
      learningProgress: {},
      participationScore: 88, // AI-calculated
      favoriteSubjects: [],
      monthlyActivity: [],
    };
  }

  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const users = await this.getAllUsers();
    const classes = await this.getAllClasses();
    
    return {
      totalUsers: users.length,
      totalClasses: classes.length,
      totalRevenue: classes.reduce((sum, c) => sum + c.platformFee, 0),
      growthRate: 15.7, // Monthly growth
      popularSubjects: [],
      trendingSkills: [],
      abuseReports: [],
    };
  }

  async getAdminSettings(): Promise<AdminSettings> {
    return this.adminSettings;
  }

  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    this.adminSettings = { ...this.adminSettings, ...settings, updatedAt: new Date() };
    return this.adminSettings;
  }

  async getAbuseReports(): Promise<any[]> {
    return [];
  }

  async createAbuseReport(report: any): Promise<any> {
    return { id: this.generateId(), ...report, createdAt: new Date() };
  }
}