process.env.UV_THREADPOOL_SIZE = '32';
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import cors from "cors";
import { RecordingScheduler } from "./recordingScheduler.js";
import { RetentionScheduler } from "./retentionScheduler.js";
import { NoShowScheduler } from "./noShowScheduler.js";
import { BookingCompletionScheduler } from "./bookingCompletionScheduler.js";
import { storage } from "./storage.js";
import { initializeRedis } from "./redis.js";
const app = express();
initializeRedis().catch(console.error);
console.log('🔐 [AZURE DEBUG] Environment check:', {
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    azurePostgresPassword: !!process.env.AZURE_POSTGRES_PASSWORD,
    replitDomains: process.env.REPLIT_DOMAINS
});
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            /https:\/\/.*\.azurewebsites\.net$/,
            /https:\/\/.*\.replit\.dev$/,
            /https:\/\/.*\.worf\.replit\.dev$/,
            'http://localhost:3000',
            'http://localhost:5000',
            'https://localhost:3000',
            'https://localhost:5000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5000',
            'https://127.0.0.1:3000',
            'https://127.0.0.1:5000'
        ];
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
    let capturedJsonResponse = undefined;
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
    const recordingScheduler = new RecordingScheduler(storage);
    recordingScheduler.start();
    const retentionScheduler = new RetentionScheduler(storage);
    retentionScheduler.start();
    const noShowScheduler = new NoShowScheduler(storage);
    noShowScheduler.start();
    const bookingCompletionScheduler = new BookingCompletionScheduler(storage);
    bookingCompletionScheduler.start();
    const wss = new WebSocketServer({
        server: httpServer,
        path: '/video-signaling'
    });
    const videoSessions = new Map();
    wss.on('connection', (ws, request) => {
        log(`WebSocket connection established from ${request.socket.remoteAddress}`);
        let isAuthenticated = false;
        let authenticatedUserId = null;
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                log(`WebSocket received message type: ${data.type}`);
                if (data.type !== 'authenticate' && !isAuthenticated) {
                    log('Unauthenticated request blocked');
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Authentication required'
                    }));
                    return;
                }
                switch (data.type) {
                    case 'authenticate':
                        const { userId: authUserId, sessionToken } = data;
                        if (authUserId && typeof authUserId === 'string' && authUserId.trim()) {
                            isAuthenticated = true;
                            authenticatedUserId = authUserId;
                            ws.send(JSON.stringify({
                                type: 'authenticated',
                                userId: authUserId
                            }));
                            log(`User ${authUserId} authenticated for video signaling`);
                        }
                        else {
                            ws.send(JSON.stringify({
                                type: 'auth-failed',
                                message: 'Invalid credentials'
                            }));
                        }
                        break;
                    case 'join-video-session':
                        const { sessionId, isTeacher } = data;
                        const userId = authenticatedUserId;
                        if (!videoSessions.has(sessionId)) {
                            videoSessions.set(sessionId, new Set());
                        }
                        const participants = videoSessions.get(sessionId);
                        const participant = { ws, userId, isTeacher, sessionId };
                        participants.add(participant);
                        participants.forEach((p) => {
                            if (p.ws !== ws) {
                                p.ws.send(JSON.stringify({
                                    type: 'user-joined',
                                    userId,
                                    isTeacher,
                                    totalParticipants: participants.size
                                }));
                            }
                        });
                        const participantsList = Array.from(participants).map((p) => ({
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
                        const { targetUserId } = data;
                        const currentSessionId = data.sessionId;
                        const fromUserId = authenticatedUserId;
                        if (videoSessions.has(currentSessionId)) {
                            const sessionParticipants = videoSessions.get(currentSessionId);
                            sessionParticipants.forEach((p) => {
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
                            const sessionParticipants = videoSessions.get(leaveSessionId);
                            sessionParticipants.forEach((p) => {
                                if (p.userId === leaveUserId) {
                                    sessionParticipants.delete(p);
                                }
                            });
                            sessionParticipants.forEach((p) => {
                                p.ws.send(JSON.stringify({
                                    type: 'user-left',
                                    userId: leaveUserId,
                                    totalParticipants: sessionParticipants.size
                                }));
                            });
                            if (sessionParticipants.size === 0) {
                                videoSessions.delete(leaveSessionId);
                            }
                        }
                        break;
                    case 'join-chat-session':
                        const chatSessionId = data.sessionId;
                        const chatUserId = authenticatedUserId;
                        const chatUserName = data.userName;
                        if (!videoSessions.has(chatSessionId)) {
                            videoSessions.set(chatSessionId, new Set());
                        }
                        const chatParticipants = videoSessions.get(chatSessionId);
                        const existingParticipant = Array.from(chatParticipants).find((p) => p.userId === chatUserId);
                        if (!existingParticipant) {
                            const chatParticipant = { ws, userId: chatUserId, userName: chatUserName, sessionId: chatSessionId };
                            chatParticipants.add(chatParticipant);
                        }
                        ws.send(JSON.stringify({
                            type: 'chat-session-joined',
                            sessionId: chatSessionId,
                            messages: []
                        }));
                        log(`User ${chatUserName} joined chat session ${chatSessionId}`);
                        break;
                    case 'send-chat-message':
                        const msgSessionId = data.sessionId;
                        const msgUserId = authenticatedUserId;
                        const msgUserName = data.userName;
                        const msgText = data.message;
                        const msgId = data.messageId || `${Date.now()}-${msgUserId}`;
                        if (videoSessions.has(msgSessionId)) {
                            const sessionParticipants = videoSessions.get(msgSessionId);
                            const chatMessage = {
                                type: 'chat-message',
                                id: msgId,
                                sender: msgUserName,
                                senderId: msgUserId,
                                message: msgText,
                                timestamp: new Date().toISOString(),
                                sessionId: msgSessionId
                            };
                            sessionParticipants.forEach((p) => {
                                if (p.userId !== msgUserId) {
                                    p.ws.send(JSON.stringify(chatMessage));
                                }
                            });
                            log(`Chat message from ${msgUserName} in session ${msgSessionId}: ${msgText.substring(0, 50)}`);
                        }
                        break;
                    case 'leave-chat-session':
                        const leaveChatSessionId = data.sessionId;
                        const leaveChatUserId = authenticatedUserId;
                        if (videoSessions.has(leaveChatSessionId)) {
                            const sessionParticipants = videoSessions.get(leaveChatSessionId);
                            sessionParticipants.forEach((p) => {
                                if (p.userId === leaveChatUserId) {
                                    sessionParticipants.delete(p);
                                }
                            });
                            if (sessionParticipants.size === 0) {
                                videoSessions.delete(leaveChatSessionId);
                            }
                        }
                        break;
                }
            }
            catch (error) {
                log(`WebSocket message error: ${error}`);
            }
        });
        ws.on('close', () => {
            videoSessions.forEach((participants, sessionId) => {
                participants.forEach((p) => {
                    if (p.ws === ws) {
                        participants.delete(p);
                        participants.forEach((remaining) => {
                            remaining.ws.send(JSON.stringify({
                                type: 'user-left',
                                userId: p.userId,
                                totalParticipants: participants.size
                            }));
                        });
                    }
                });
                if (participants.size === 0) {
                    videoSessions.delete(sessionId);
                }
            });
            log('WebSocket connection closed');
        });
    });
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });
    if (app.get("env") === "development") {
        await setupVite(app, httpServer);
    }
    else {
        serveStatic(app);
    }
    const port = parseInt(process.env.PORT || '3000', 10);
    httpServer.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port} with WebSocket support`);
    });
})();
//# sourceMappingURL=index.js.map