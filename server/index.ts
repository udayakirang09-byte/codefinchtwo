import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

const app = express();

// Azure-specific debugging
console.log('🔐 [AZURE DEBUG] Environment check:', {
  nodeEnv: process.env.NODE_ENV,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  azurePostgresPassword: !!process.env.AZURE_POSTGRES_PASSWORD,
  replitDomains: process.env.REPLIT_DOMAINS
});

// Enhanced CORS configuration for Azure and Replit
const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Azure-specific domains and Replit domains
    const allowedOrigins = [
      /https:\/\/.*\.azurewebsites\.net$/,
      /https:\/\/.*\.replit\.dev$/,
      /https:\/\/.*\.worf\.replit\.dev$/,
      'http://localhost:3000',
      'http://localhost:5000',
      'https://localhost:3000',
      'https://localhost:5000'
    ];
    
    // Check if origin matches any pattern
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });
    
    console.log('🌐 [AZURE DEBUG] CORS check:', { origin, isAllowed });
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const httpServer = createServer(app);
  const server = await registerRoutes(app);
  
  // Setup WebSocket server for video chat signaling on specific path
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/video-signaling'
  });
  
  // Store active video sessions and their participants
  const videoSessions = new Map<string, Set<any>>();
  
  wss.on('connection', (ws: any, request: any) => {
    log('WebSocket connection established');
    
    // Track authentication status
    let isAuthenticated = false;
    let authenticatedUserId: string | null = null;
    
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Require authentication for all operations except auth
        if (data.type !== 'authenticate' && !isAuthenticated) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication required'
          }));
          return;
        }
        
        switch (data.type) {
          case 'authenticate':
            // Basic authentication - in production, validate JWT/session token
            const { userId: authUserId, sessionToken } = data;
            
            // For now, accept any non-empty userId (in production: validate session)
            if (authUserId && typeof authUserId === 'string' && authUserId.trim()) {
              isAuthenticated = true;
              authenticatedUserId = authUserId;
              
              ws.send(JSON.stringify({
                type: 'authenticated',
                userId: authUserId
              }));
              
              log(`User ${authUserId} authenticated for video signaling`);
            } else {
              ws.send(JSON.stringify({
                type: 'auth-failed',
                message: 'Invalid credentials'
              }));
            }
            break;
            
          case 'join-video-session':
            // Use authenticated userId to prevent spoofing
            const { sessionId, isTeacher } = data;
            const userId = authenticatedUserId;
            
            if (!videoSessions.has(sessionId)) {
              videoSessions.set(sessionId, new Set());
            }
            
            const participants = videoSessions.get(sessionId)!;
            
            // Add participant with connection info
            const participant = { ws, userId, isTeacher, sessionId };
            participants.add(participant);
            
            // Notify all participants about new join
            participants.forEach((p: any) => {
              if (p.ws !== ws) {
                p.ws.send(JSON.stringify({
                  type: 'user-joined',
                  userId,
                  isTeacher,
                  totalParticipants: participants.size
                }));
              }
            });
            
            // Send current participants list to new user
            const participantsList = Array.from(participants).map((p: any) => ({
              userId: p.userId,
              isTeacher: p.isTeacher
            }));
            
            ws.send(JSON.stringify({
              type: 'session-joined',
              participants: participantsList,
              totalParticipants: participants.size
            }));
            
            log(`User ${userId} joined video session ${sessionId} as ${isTeacher ? 'teacher' : 'student'}`);
            break;
            
          case 'webrtc-offer':
          case 'webrtc-answer':
          case 'webrtc-ice-candidate':
            // Forward WebRTC signaling messages to target peer
            const { targetUserId } = data;
            const currentSessionId = data.sessionId;
            const fromUserId = authenticatedUserId;
            
            if (videoSessions.has(currentSessionId)) {
              const sessionParticipants = videoSessions.get(currentSessionId)!;
              
              sessionParticipants.forEach((p: any) => {
                if (p.userId === targetUserId && p.ws !== ws) {
                  p.ws.send(JSON.stringify({
                    ...data,
                    fromUserId: fromUserId
                  }));
                }
              });
            }
            break;
            
          case 'leave-video-session':
            const leaveSessionId = data.sessionId;
            const leaveUserId = authenticatedUserId;
            
            if (videoSessions.has(leaveSessionId)) {
              const sessionParticipants = videoSessions.get(leaveSessionId)!;
              
              // Remove participant
              sessionParticipants.forEach((p: any) => {
                if (p.userId === leaveUserId) {
                  sessionParticipants.delete(p);
                }
              });
              
              // Notify remaining participants
              sessionParticipants.forEach((p: any) => {
                p.ws.send(JSON.stringify({
                  type: 'user-left',
                  userId: leaveUserId,
                  totalParticipants: sessionParticipants.size
                }));
              });
              
              // Clean up empty sessions
              if (sessionParticipants.size === 0) {
                videoSessions.delete(leaveSessionId);
              }
            }
            break;
            
          case 'join-chat-session':
            // Handle chat session join (reuse video sessions for now)
            const chatSessionId = data.sessionId;
            const chatUserId = authenticatedUserId;
            const chatUserName = data.userName;
            
            if (!videoSessions.has(chatSessionId)) {
              videoSessions.set(chatSessionId, new Set());
            }
            
            const chatParticipants = videoSessions.get(chatSessionId)!;
            
            // Add participant if not already in session
            const existingParticipant = Array.from(chatParticipants).find((p: any) => p.userId === chatUserId);
            if (!existingParticipant) {
              const chatParticipant = { ws, userId: chatUserId, userName: chatUserName, sessionId: chatSessionId };
              chatParticipants.add(chatParticipant);
            }
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'chat-session-joined',
              sessionId: chatSessionId,
              messages: [] // Could load message history here
            }));
            
            log(`User ${chatUserName} joined chat session ${chatSessionId}`);
            break;
            
          case 'send-chat-message':
            // Broadcast chat message to all participants in the session
            const msgSessionId = data.sessionId;
            const msgUserId = authenticatedUserId;
            const msgUserName = data.userName;
            const msgText = data.message;
            const msgId = data.messageId || `${Date.now()}-${msgUserId}`;
            
            if (videoSessions.has(msgSessionId)) {
              const sessionParticipants = videoSessions.get(msgSessionId)!;
              
              const chatMessage = {
                type: 'chat-message',
                id: msgId,
                sender: msgUserName,
                senderId: msgUserId,
                message: msgText,
                timestamp: new Date().toISOString(),
                sessionId: msgSessionId
              };
              
              // Broadcast to all participants except sender
              sessionParticipants.forEach((p: any) => {
                if (p.userId !== msgUserId) {
                  p.ws.send(JSON.stringify(chatMessage));
                }
              });
              
              log(`Chat message from ${msgUserName} in session ${msgSessionId}: ${msgText.substring(0, 50)}`);
            }
            break;
            
          case 'leave-chat-session':
            // Handle chat session leave
            const leaveChatSessionId = data.sessionId;
            const leaveChatUserId = authenticatedUserId;
            
            if (videoSessions.has(leaveChatSessionId)) {
              const sessionParticipants = videoSessions.get(leaveChatSessionId)!;
              
              // Remove participant
              sessionParticipants.forEach((p: any) => {
                if (p.userId === leaveChatUserId) {
                  sessionParticipants.delete(p);
                }
              });
              
              // Clean up empty sessions
              if (sessionParticipants.size === 0) {
                videoSessions.delete(leaveChatSessionId);
              }
            }
            break;
        }
      } catch (error) {
        log(`WebSocket message error: ${error}`);
      }
    });
    
    ws.on('close', () => {
      // Clean up disconnected participants
      videoSessions.forEach((participants, sessionId) => {
        participants.forEach((p: any) => {
          if (p.ws === ws) {
            participants.delete(p);
            
            // Notify other participants
            participants.forEach((remaining: any) => {
              remaining.ws.send(JSON.stringify({
                type: 'user-left',
                userId: p.userId,
                totalParticipants: participants.size
              }));
            });
          }
        });
        
        // Clean up empty sessions
        if (participants.size === 0) {
          videoSessions.delete(sessionId);
        }
      });
      
      log('WebSocket connection closed');
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port} with WebSocket support`);
  });
})();
