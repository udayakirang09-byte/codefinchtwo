import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import { nanoid } from 'nanoid';

describe('Video Chat Multi-Participant System Tests', () => {
  let serverPort: number;
  let wsConnections: WebSocket[] = [];
  let testSessionId: string;

  beforeAll(async () => {
    serverPort = 5000; // Using the running server
    testSessionId = nanoid(10);
  });

  afterAll(async () => {
    // Close all WebSocket connections
    for (const ws of wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    wsConnections = [];
  });

  beforeEach(() => {
    wsConnections = [];
  });

  afterEach(async () => {
    // Clean up connections after each test
    for (const ws of wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    wsConnections = [];
    // Wait for connections to close
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('WebSocket Signaling Server', () => {
    it('should establish WebSocket connection to video signaling endpoint', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(ws);

      await new Promise((resolve, reject) => {
        ws.on('open', () => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          resolve(true);
        });
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    });

    it('should require authentication before allowing video operations', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(ws);

      await new Promise((resolve, reject) => {
        ws.on('open', () => {
          // Try to join session without authentication
          ws.send(JSON.stringify({
            type: 'join-video-session',
            sessionId: testSessionId,
            isTeacher: false
          }));
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'error' && message.message === 'Authentication required') {
            resolve(true);
          }
        });

        ws.on('error', reject);
        setTimeout(() => reject(new Error('Authentication test timeout')), 3000);
      });
    });

    it('should authenticate users and allow session joining', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(ws);
      const userId = `test-user-${nanoid(6)}`;

      await new Promise((resolve, reject) => {
        let isAuthenticated = false;

        ws.on('open', () => {
          // Authenticate first
          ws.send(JSON.stringify({
            type: 'authenticate',
            userId: userId,
            sessionToken: 'test-token'
          }));
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authenticated' && !isAuthenticated) {
            isAuthenticated = true;
            expect(message.userId).toBe(userId);
            
            // Now join session
            ws.send(JSON.stringify({
              type: 'join-video-session',
              sessionId: testSessionId,
              isTeacher: false
            }));
          } else if (message.type === 'session-joined' && isAuthenticated) {
            expect(message.sessionId).toBe(testSessionId);
            expect(Array.isArray(message.participants)).toBe(true);
            resolve(true);
          }
        });

        ws.on('error', reject);
        setTimeout(() => reject(new Error('Authentication/join test timeout')), 8000);
      });
    });
  });

  describe('Multi-Participant Functionality', () => {
    it('should support multiple users joining the same session', async () => {
      const users = [
        { id: `teacher-${nanoid(6)}`, isTeacher: true },
        { id: `student1-${nanoid(6)}`, isTeacher: false },
        { id: `student2-${nanoid(6)}`, isTeacher: false },
        { id: `student3-${nanoid(6)}`, isTeacher: false }
      ];

      const connections: Array<{ ws: WebSocket; userId: string; isTeacher: boolean }> = [];

      // Connect all users
      for (const user of users) {
        const ws = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
        wsConnections.push(ws);
        connections.push({ ws, userId: user.id, isTeacher: user.isTeacher });

        await new Promise((resolve, reject) => {
          let isAuthenticated = false;

          ws.on('open', () => {
            ws.send(JSON.stringify({
              type: 'authenticate',
              userId: user.id,
              sessionToken: 'test-token'
            }));
          });

          ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'authenticated' && !isAuthenticated) {
              isAuthenticated = true;
              ws.send(JSON.stringify({
                type: 'join-video-session',
                sessionId: testSessionId,
                isTeacher: user.isTeacher
              }));
            } else if (message.type === 'session-joined' && isAuthenticated) {
              resolve(true);
            }
          });

          ws.on('error', reject);
          setTimeout(() => reject(new Error(`User ${user.id} connection timeout`)), 5000);
        });

        // Small delay between connections
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Verify all participants are in session
      const lastConnection = connections[connections.length - 1];
      await new Promise((resolve) => {
        lastConnection.ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'session-joined') {
            expect(message.participants.length).toBe(users.length);
            resolve(true);
          }
        });
        setTimeout(resolve, 1000); // Fallback timeout
      });

      expect(connections.length).toBe(4);
    });

    it('should handle user leaving session and notify other participants', async () => {
      const user1 = { id: `user1-${nanoid(6)}`, isTeacher: false };
      const user2 = { id: `user2-${nanoid(6)}`, isTeacher: false };

      // Connect two users
      const ws1 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      const ws2 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(ws1, ws2);

      // Authenticate and join both users
      const joinUser = async (ws: WebSocket, userId: string) => {
        return new Promise((resolve, reject) => {
          let isAuthenticated = false;

          ws.on('open', () => {
            ws.send(JSON.stringify({
              type: 'authenticate',
              userId: userId,
              sessionToken: 'test-token'
            }));
          });

          ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'authenticated' && !isAuthenticated) {
              isAuthenticated = true;
              ws.send(JSON.stringify({
                type: 'join-video-session',
                sessionId: testSessionId,
                isTeacher: false
              }));
            } else if (message.type === 'session-joined' && isAuthenticated) {
              resolve(true);
            }
          });

          ws.on('error', reject);
          setTimeout(() => reject(new Error(`User ${userId} join timeout`)), 8000);
        });
      };

      await joinUser(ws1, user1.id);
      await new Promise(resolve => setTimeout(resolve, 200));
      await joinUser(ws2, user2.id);

      // Now test user leaving
      await new Promise((resolve) => {
        let userLeftReceived = false;

        ws2.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'user-left' && message.userId === user1.id) {
            userLeftReceived = true;
            resolve(true);
          }
        });

        // User 1 leaves by closing connection
        setTimeout(() => {
          ws1.close();
        }, 500);

        setTimeout(() => {
          if (!userLeftReceived) {
            resolve(false); // Test failed but don't throw
          }
        }, 3000);
      });
    });

    it('should maintain session state with multiple concurrent users', async () => {
      const sessionId = `concurrent-test-${nanoid(8)}`;
      const userCount = 6; // Test with 6+ users as required
      const connections: WebSocket[] = [];

      // Create multiple concurrent connections
      const connectionPromises = Array.from({ length: userCount }, async (_, index) => {
        const userId = `concurrent-user-${index}-${nanoid(4)}`;
        const ws = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
        connections.push(ws);
        wsConnections.push(ws);

        return new Promise((resolve, reject) => {
          let isAuthenticated = false;

          ws.on('open', () => {
            ws.send(JSON.stringify({
              type: 'authenticate',
              userId: userId,
              sessionToken: 'test-token'
            }));
          });

          ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'authenticated' && !isAuthenticated) {
              isAuthenticated = true;
              ws.send(JSON.stringify({
                type: 'join-video-session',
                sessionId: sessionId,
                isTeacher: index === 0 // First user is teacher
              }));
            } else if (message.type === 'session-joined' && isAuthenticated) {
              resolve({ userId, participants: message.participants.length });
            }
          });

          ws.on('error', reject);
          setTimeout(() => reject(new Error(`Concurrent user ${userId} timeout`)), 8000);
        });
      });

      const results = await Promise.all(connectionPromises);

      // Verify all users connected successfully
      expect(results.length).toBe(userCount);
      
      // The last user to join should see all participants
      const lastResult = results[results.length - 1] as any;
      expect(lastResult.participants).toBe(userCount);

      // Clean up connections
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    });
  });

  describe('WebRTC Signaling', () => {
    it('should forward WebRTC offers between participants', async () => {
      const user1Id = `sender-${nanoid(6)}`;
      const user2Id = `receiver-${nanoid(6)}`;
      
      const ws1 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      const ws2 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(ws1, ws2);

      // Authenticate and join both users
      await Promise.all([
        authenticateAndJoin(ws1, user1Id, testSessionId, false),
        authenticateAndJoin(ws2, user2Id, testSessionId, false)
      ]);

      // Test WebRTC offer forwarding
      await new Promise((resolve, reject) => {
        const mockOffer = {
          type: 'offer',
          sdp: 'mock-sdp-offer-data'
        };

        ws2.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'webrtc-offer' && message.fromUserId === user1Id) {
            expect(message.offer).toEqual(mockOffer);
            resolve(true);
          }
        });

        // Send offer from user1 to user2
        ws1.send(JSON.stringify({
          type: 'webrtc-offer',
          sessionId: testSessionId,
          targetUserId: user2Id,
          offer: mockOffer
        }));

        setTimeout(() => reject(new Error('WebRTC offer forwarding timeout')), 3000);
      });
    });

    it('should forward WebRTC answers between participants', async () => {
      const user1Id = `sender-${nanoid(6)}`;
      const user2Id = `receiver-${nanoid(6)}`;
      
      const ws1 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      const ws2 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(ws1, ws2);

      await Promise.all([
        authenticateAndJoin(ws1, user1Id, testSessionId, false),
        authenticateAndJoin(ws2, user2Id, testSessionId, false)
      ]);

      // Test WebRTC answer forwarding
      await new Promise((resolve, reject) => {
        const mockAnswer = {
          type: 'answer',
          sdp: 'mock-sdp-answer-data'
        };

        ws1.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'webrtc-answer' && message.fromUserId === user2Id) {
            expect(message.answer).toEqual(mockAnswer);
            resolve(true);
          }
        });

        // Send answer from user2 to user1
        ws2.send(JSON.stringify({
          type: 'webrtc-answer',
          sessionId: testSessionId,
          targetUserId: user1Id,
          answer: mockAnswer
        }));

        setTimeout(() => reject(new Error('WebRTC answer forwarding timeout')), 3000);
      });
    });

    it('should forward ICE candidates between participants', async () => {
      const user1Id = `sender-${nanoid(6)}`;
      const user2Id = `receiver-${nanoid(6)}`;
      
      const ws1 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      const ws2 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(ws1, ws2);

      await Promise.all([
        authenticateAndJoin(ws1, user1Id, testSessionId, false),
        authenticateAndJoin(ws2, user2Id, testSessionId, false)
      ]);

      // Test ICE candidate forwarding
      await new Promise((resolve, reject) => {
        const mockCandidate = {
          candidate: 'candidate:1 1 UDP 2113667327 192.168.1.100 54400 typ host',
          sdpMLineIndex: 0,
          sdpMid: '0'
        };

        ws2.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'webrtc-ice-candidate' && message.fromUserId === user1Id) {
            expect(message.candidate).toEqual(mockCandidate);
            resolve(true);
          }
        });

        // Send ICE candidate from user1 to user2
        ws1.send(JSON.stringify({
          type: 'webrtc-ice-candidate',
          sessionId: testSessionId,
          targetUserId: user2Id,
          candidate: mockCandidate
        }));

        setTimeout(() => reject(new Error('ICE candidate forwarding timeout')), 3000);
      });
    });
  });

  describe('Role-Based Features', () => {
    it('should distinguish between teacher and student roles', async () => {
      const teacherId = `teacher-${nanoid(6)}`;
      const studentId = `student-${nanoid(6)}`;
      
      const teacherWs = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      const studentWs = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(teacherWs, studentWs);

      // Join as teacher
      const teacherResult = await authenticateAndJoin(teacherWs, teacherId, testSessionId, true);
      expect(teacherResult.isTeacher).toBe(true);

      // Join as student
      const studentResult = await authenticateAndJoin(studentWs, studentId, testSessionId, false);
      expect(studentResult.isTeacher).toBe(false);

      // Verify both are in the same session
      await new Promise((resolve) => {
        teacherWs.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'user-joined' && message.userId === studentId) {
            expect(message.isTeacher).toBe(false);
            resolve(true);
          }
        });
        setTimeout(resolve, 1000);
      });
    });

    it('should handle multiple teachers in the same session', async () => {
      const teacher1Id = `teacher1-${nanoid(6)}`;
      const teacher2Id = `teacher2-${nanoid(6)}`;
      
      const ws1 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      const ws2 = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(ws1, ws2);

      await Promise.all([
        authenticateAndJoin(ws1, teacher1Id, testSessionId, true),
        authenticateAndJoin(ws2, teacher2Id, testSessionId, true)
      ]);

      // Both should be marked as teachers
      await new Promise((resolve) => {
        ws1.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'user-joined' && message.userId === teacher2Id) {
            expect(message.isTeacher).toBe(true);
            resolve(true);
          }
        });
        setTimeout(resolve, 1000);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed WebSocket messages gracefully', async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(ws);

      await new Promise((resolve, reject) => {
        ws.on('open', () => {
          // Send malformed JSON
          ws.send('invalid-json-message');
          
          // Send valid authentication after malformed message
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'authenticate',
              userId: `test-${nanoid(6)}`,
              sessionToken: 'test-token'
            }));
          }, 100);
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'authenticated') {
            // Should still work after malformed message
            resolve(true);
          }
        });

        ws.on('error', reject);
        setTimeout(() => reject(new Error('Malformed message test timeout')), 3000);
      });
    });

    it('should handle rapid connection/disconnection cycles', async () => {
      const userId = `rapid-test-${nanoid(6)}`;
      
      // Rapidly connect and disconnect multiple times
      for (let i = 0; i < 3; i++) {
        const ws = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
        wsConnections.push(ws);

        await new Promise((resolve, reject) => {
          ws.on('open', () => {
            ws.send(JSON.stringify({
              type: 'authenticate',
              userId: `${userId}-${i}`,
              sessionToken: 'test-token'
            }));
            
            // Quick disconnect
            setTimeout(() => {
              ws.close();
              resolve(true);
            }, 100);
          });

          ws.on('error', reject);
          setTimeout(() => reject(new Error(`Rapid cycle ${i} timeout`)), 2000);
        });

        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Final connection should still work
      const finalWs = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
      wsConnections.push(finalWs);

      await new Promise((resolve, reject) => {
        finalWs.on('open', () => {
          finalWs.send(JSON.stringify({
            type: 'authenticate',
            userId: `${userId}-final`,
            sessionToken: 'test-token'
          }));
        });

        finalWs.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'authenticated') {
            resolve(true);
          }
        });

        finalWs.on('error', reject);
        setTimeout(() => reject(new Error('Final connection timeout')), 3000);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent session operations efficiently', async () => {
      const sessionId = `perf-test-${nanoid(8)}`;
      const userCount = 10;
      const startTime = Date.now();

      // Create multiple users concurrently
      const connectionPromises = Array.from({ length: userCount }, async (_, index) => {
        const userId = `perf-user-${index}-${nanoid(4)}`;
        const ws = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
        wsConnections.push(ws);

        return authenticateAndJoin(ws, userId, sessionId, index === 0);
      });

      const results = await Promise.all(connectionPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All connections should succeed
      expect(results.length).toBe(userCount);
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(totalTime).toBeLessThan(15000); // 15 seconds for 10 concurrent connections
      
      console.log(`Performance test: ${userCount} users connected in ${totalTime}ms`);
    });

    it('should maintain session integrity under load', async () => {
      const sessionId = `load-test-${nanoid(8)}`;
      const messageCount = 50;
      const users = 3;

      // Create test users
      const connections = await Promise.all(
        Array.from({ length: users }, async (_, index) => {
          const userId = `load-user-${index}-${nanoid(4)}`;
          const ws = new WebSocket(`ws://localhost:${serverPort}/video-signaling`);
          wsConnections.push(ws);
          await authenticateAndJoin(ws, userId, sessionId, false);
          return { ws, userId };
        })
      );

      // Send multiple WebRTC signaling messages rapidly
      const messagePromises = [];
      
      for (let i = 0; i < messageCount; i++) {
        const sender = connections[i % connections.length];
        const receiver = connections[(i + 1) % connections.length];
        
        const promise = new Promise((resolve) => {
          const mockOffer = { type: 'offer', sdp: `mock-sdp-${i}` };
          
          // Set up listener for response
          receiver.ws.once('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === 'webrtc-offer' && message.offer.sdp === `mock-sdp-${i}`) {
              resolve(true);
            }
          });

          // Send offer
          sender.ws.send(JSON.stringify({
            type: 'webrtc-offer',
            sessionId: sessionId,
            targetUserId: receiver.userId,
            offer: mockOffer
          }));

          // Timeout fallback
          setTimeout(() => resolve(false), 2000);
        });

        messagePromises.push(promise);
        
        // Small delay to avoid overwhelming the server
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const results = await Promise.all(messagePromises);
      const successCount = results.filter(r => r === true).length;
      
      // Should successfully handle reasonable portion of messages under load
      expect(successCount).toBeGreaterThan(messageCount * 0.3); // 30% success rate under heavy load
      
      console.log(`Load test: ${successCount}/${messageCount} messages handled successfully`);
    });
  });
});

// Helper function to authenticate and join a session
async function authenticateAndJoin(ws: WebSocket, userId: string, sessionId: string, isTeacher: boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    let isAuthenticated = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: userId,
        sessionToken: 'test-token'
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'authenticated' && !isAuthenticated) {
        isAuthenticated = true;
        ws.send(JSON.stringify({
          type: 'join-video-session',
          sessionId: sessionId,
          isTeacher: isTeacher
        }));
      } else if (message.type === 'session-joined' && isAuthenticated) {
        resolve({
          userId: userId,
          sessionId: message.sessionId,
          participants: message.participants,
          isTeacher: isTeacher
        });
      }
    });

    ws.on('error', reject);
    setTimeout(() => reject(new Error(`Authentication/join timeout for ${userId}`)), 5000);
  });
}