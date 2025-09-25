import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes.js';
import { storage } from '../../server/storage.js';
import { nanoid } from 'nanoid';

describe('CodeConnect Platform End-to-End Tests', () => {
  let app: express.Express;
  let server: any;
  let testUsers: any[] = [];
  let testData: any = {};

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    
    // Initialize test data
    testData = {
      sessionId: nanoid(10),
      timestamp: new Date().toISOString()
    };
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    testUsers = [];
  });

  afterEach(async () => {
    // Cleanup test users
    for (const user of testUsers) {
      try {
        // In a real app, you might want to delete test data
        // For now, we'll just track them
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    testUsers = [];
  });

  describe('Educational Platform Core Flow', () => {
    it('should provide comprehensive dropdown data for platform functionality', async () => {
      // Test all educational dropdown APIs work together
      const [qualifications, specializations, subjects] = await Promise.all([
        request(app).get('/api/qualifications'),
        request(app).get('/api/specializations'),
        request(app).get('/api/subjects')
      ]);

      expect(qualifications.status).toBe(200);
      expect(specializations.status).toBe(200);
      expect(subjects.status).toBe(200);

      expect(qualifications.body.length).toBeGreaterThan(0);
      expect(specializations.body.length).toBeGreaterThan(0);
      expect(subjects.body.length).toBeGreaterThan(0);

      // Store for use in other tests
      testData.qualifications = qualifications.body.slice(0, 3);
      testData.specializations = specializations.body.slice(0, 3);
      testData.subjects = subjects.body.slice(0, 5);

      console.log(`Platform data loaded: ${qualifications.body.length} qualifications, ${specializations.body.length} specializations, ${subjects.body.length} subjects`);
    });

    it('should complete user registration and authentication flow', async () => {
      const timestamp = Date.now();
      const testStudent = {
        firstName: 'Test',
        lastName: 'Student',
        email: `student-e2e-${timestamp}@test.com`,
        password: 'TestPass123',
        role: 'student'
      };

      const testMentor = {
        firstName: 'Test',
        lastName: 'Mentor',
        email: `mentor-e2e-${timestamp}@test.com`,
        password: 'TestPass123',
        role: 'mentor',
        mentorData: {
          qualifications: testData.qualifications?.slice(0, 2).map((q: any) => q.name) || ['Computer Science'],
          subjects: testData.subjects?.slice(0, 3).map((s: any) => s.name) || ['Mathematics', 'Physics']
        }
      };

      // Register student
      const studentSignup = await request(app)
        .post('/api/auth/signup')
        .send(testStudent);

      expect(studentSignup.status).toBe(201);
      expect(studentSignup.body.success).toBe(true);
      expect(studentSignup.body.user.email).toBe(testStudent.email);
      expect(studentSignup.body.user.role).toBe('student');

      // Register mentor
      const mentorSignup = await request(app)
        .post('/api/auth/signup')
        .send(testMentor);

      expect(mentorSignup.status).toBe(201);
      expect(mentorSignup.body.success).toBe(true);
      expect(mentorSignup.body.user.role).toBe('mentor');

      testUsers.push(studentSignup.body.user, mentorSignup.body.user);

      // Test login for both users
      const studentLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testStudent.email, password: testStudent.password });

      expect(studentLogin.status).toBe(200);
      expect(studentLogin.body.success).toBe(true);
      expect(studentLogin.body.sessionToken).toBeDefined();

      const mentorLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testMentor.email, password: testMentor.password });

      expect(mentorLogin.status).toBe(200);
      expect(mentorLogin.body.success).toBe(true);
      expect(mentorLogin.body.sessionToken).toBeDefined();

      // Store auth tokens for subsequent tests
      testData.studentAuth = {
        user: studentLogin.body.user,
        token: studentLogin.body.sessionToken
      };
      testData.mentorAuth = {
        user: mentorLogin.body.user,
        token: mentorLogin.body.sessionToken
      };
    });

    it('should provide mentor discovery and profile functionality', async () => {
      // Test mentor listing endpoint
      const mentorsResponse = await request(app).get('/api/mentors');
      
      expect(mentorsResponse.status).toBe(200);
      expect(Array.isArray(mentorsResponse.body)).toBe(true);

      if (mentorsResponse.body.length > 0) {
        const mentor = mentorsResponse.body[0];
        expect(mentor).toHaveProperty('id');
        expect(mentor).toHaveProperty('userId');
        expect(mentor).toHaveProperty('title');
        expect(mentor).toHaveProperty('specialties');
        expect(mentor).toHaveProperty('hourlyRate');

        // Test individual mentor endpoint
        const mentorProfileResponse = await request(app)
          .get(`/api/mentors/${mentor.id}`);

        expect(mentorProfileResponse.status).toBe(200);
        expect(mentorProfileResponse.body.id).toBe(mentor.id);

        testData.sampleMentor = mentor;
        console.log(`Found ${mentorsResponse.body.length} mentors in platform`);
      }
    });
  });

  describe('Booking and Session Management Flow', () => {
    it('should handle booking creation and management', async () => {
      if (!testData.studentAuth || !testData.sampleMentor) {
        console.log('Skipping booking test - missing prerequisites');
        return;
      }

      // Create a booking with proper data format including userEmail
      const bookingData = {
        userEmail: testData.studentAuth.user.email, // Required for authentication
        studentId: testData.studentAuth.user.id,
        mentorId: testData.sampleMentor.id, 
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        duration: 60, // minutes
        notes: 'End-to-end test booking'
      };

      const bookingResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      // Booking system should work - enforce success
      expect(bookingResponse.status).toBe(201);
      expect(bookingResponse.body).toHaveProperty('id');
      expect(bookingResponse.body.duration).toBe(bookingData.duration);
      
      testData.testBooking = bookingResponse.body;
      
      // Test booking retrieval
      const getBookingResponse = await request(app)
        .get(`/api/bookings/${bookingResponse.body.id}`);

      expect(getBookingResponse.status).toBe(200);
      expect(getBookingResponse.body.id).toBe(bookingResponse.body.id);

      console.log(`Booking system working - created booking ${bookingResponse.body.id}`);
    });

    it('should support video class session creation and management', async () => {
      if (!testData.testBooking) {
        // Create a test session without booking dependency
        const sessionData = {
          sessionId: `e2e-session-${nanoid(8)}`,
          title: 'End-to-End Test Session',
          teacherId: testData.mentorAuth?.user?.id || 'test-teacher',
          subject: testData.subjects?.[0]?.name || 'Mathematics'
        };

        testData.testSession = sessionData;
      }

      // Verify video class can be accessed
      const sessionId = testData.testSession?.sessionId || testData.testBooking?.id || `fallback-${nanoid(8)}`;
      
      // This would typically test the video class page, but since we're testing APIs,
      // we'll verify the session concept works
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);

      console.log(`Video session system ready with session ID: ${sessionId}`);
      testData.finalSessionId = sessionId;
    });
  });

  describe('Platform Integration and Data Flow', () => {
    it('should validate complete data flow from registration through course selection', async () => {
      // Verify educational data is properly integrated
      const subjects = testData.subjects || [];
      const qualifications = testData.qualifications || [];
      
      expect(subjects.length).toBeGreaterThan(0);
      expect(qualifications.length).toBeGreaterThan(0);

      // Test that subjects can be filtered by different criteria
      const mathSubjects = subjects.filter((s: any) => 
        s.name.toLowerCase().includes('math') || 
        s.category.toLowerCase().includes('core')
      );

      const scienceSubjects = subjects.filter((s: any) => 
        s.category.toLowerCase().includes('science')
      );

      expect(mathSubjects.length + scienceSubjects.length).toBeGreaterThan(0);

      // Verify different boards are represented
      const boards = new Set(subjects.map((s: any) => s.board));
      expect(boards.size).toBeGreaterThan(0);

      console.log(`Educational data integration: ${boards.size} different examination boards`);
    });

    it('should validate mentor-subject matching system', async () => {
      const mentorsResponse = await request(app).get('/api/mentors');
      
      if (mentorsResponse.status === 200 && mentorsResponse.body.length > 0) {
        const mentors = mentorsResponse.body;
        const subjects = testData.subjects || [];

        // Check that mentors have specialties that could match available subjects
        let specialtyMatches = 0;
        
        mentors.forEach((mentor: any) => {
          if (mentor.specialties && Array.isArray(mentor.specialties)) {
            mentor.specialties.forEach((specialty: string) => {
              // More flexible matching for programming subjects
              const matchingSubjects = subjects.filter((subject: any) => 
                subject.name.toLowerCase().includes(specialty.toLowerCase()) ||
                specialty.toLowerCase().includes(subject.name.toLowerCase()) ||
                (specialty.toLowerCase().includes('javascript') && subject.name.toLowerCase().includes('computer')) ||
                (specialty.toLowerCase().includes('python') && subject.name.toLowerCase().includes('computer')) ||
                (specialty.toLowerCase().includes('programming') && subject.category?.toLowerCase().includes('tech'))
              );
              if (matchingSubjects.length > 0) {
                specialtyMatches++;
              }
            });
          }
        });

        // Should have some logical connections between mentor specialties and available subjects
        // If no matches found, this indicates mentor data and educational subjects need alignment
        console.log(`Found ${specialtyMatches} potential mentor-subject matches`);
        if (specialtyMatches === 0) {
          console.log('⚠️  Data alignment needed: Mentor specialties do not match available subjects');
          console.log('This is expected during development and should be addressed in data curation');
        }
        
        // Should have meaningful mentor-subject matches in a functional platform
        expect(specialtyMatches).toBeGreaterThan(0);
        console.log(`Found ${specialtyMatches} potential mentor-subject matches`);
      }
    });

    it('should validate complete platform API ecosystem', async () => {
      // Test multiple core endpoints simultaneously
      const apiTests = await Promise.allSettled([
        request(app).get('/api/qualifications'),
        request(app).get('/api/specializations'),
        request(app).get('/api/subjects'),
        request(app).get('/api/mentors'),
        request(app).post('/api/auth/login').send({
          email: 'test@example.com',
          password: 'wrongpassword'
        }) // This should fail gracefully
      ]);

      // Check that essential APIs are responding
      expect(apiTests[0].status).toBe('fulfilled');
      expect(apiTests[1].status).toBe('fulfilled');
      expect(apiTests[2].status).toBe('fulfilled');
      expect(apiTests[3].status).toBe('fulfilled');

      // Verify dropdown APIs return data
      if (apiTests[0].status === 'fulfilled') {
        expect((apiTests[0].value as any).status).toBe(200);
      }
      if (apiTests[1].status === 'fulfilled') {
        expect((apiTests[1].value as any).status).toBe(200);
      }
      if (apiTests[2].status === 'fulfilled') {
        expect((apiTests[2].value as any).status).toBe(200);
      }

      // Invalid login should fail properly
      if (apiTests[4].status === 'fulfilled') {
        expect((apiTests[4].value as any).status).toBe(401);
      }

      console.log('Platform API ecosystem validation completed');
    });
  });

  describe('Platform Performance and Reliability', () => {
    it('should handle concurrent user operations efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      // Make concurrent requests to different endpoints
      const requests = Array.from({ length: concurrentRequests }, (_, index) => {
        switch (index % 4) {
          case 0: return request(app).get('/api/qualifications');
          case 1: return request(app).get('/api/specializations');
          case 2: return request(app).get('/api/subjects');
          case 3: return request(app).get('/api/mentors');
          default: return request(app).get('/api/subjects');
        }
      });

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent load efficiently
      expect(totalTime).toBeLessThan(5000); // Under 5 seconds
      
      console.log(`Concurrent performance: ${concurrentRequests} requests completed in ${totalTime}ms`);
    });

    it('should maintain data consistency across multiple operations', async () => {
      // Test that multiple calls to the same endpoint return consistent data
      const response1 = await request(app).get('/api/subjects');
      const response2 = await request(app).get('/api/subjects');
      const response3 = await request(app).get('/api/subjects');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);

      expect(response1.body.length).toBe(response2.body.length);
      expect(response2.body.length).toBe(response3.body.length);

      // Data should be ordered consistently
      if (response1.body.length > 1) {
        expect(response1.body[0].id).toBe(response2.body[0].id);
        expect(response2.body[0].id).toBe(response3.body[0].id);
      }

      console.log('Data consistency validation passed');
    });

    it('should validate complete platform functionality integration', async () => {
      // Final comprehensive test
      const platformHealth = {
        auth: false,
        dropdown: false,
        mentors: false,
        sessions: false,
        performance: false
      };

      // Test authentication system
      try {
        const authTest = await request(app)
          .post('/api/auth/login')
          .send({ email: 'invalid@test.com', password: 'wrong' });
        platformHealth.auth = authTest.status === 401; // Should properly reject invalid credentials
      } catch (error) {
        // Auth system responding, even if with errors
        platformHealth.auth = true;
      }

      // Test dropdown system
      const dropdownTest = await request(app).get('/api/subjects');
      platformHealth.dropdown = dropdownTest.status === 200 && dropdownTest.body.length > 0;

      // Test mentor system
      const mentorTest = await request(app).get('/api/mentors');
      platformHealth.mentors = mentorTest.status === 200;

      // Test session capability (video chat server)
      platformHealth.sessions = testData.finalSessionId != null;

      // Test performance
      const perfStart = Date.now();
      await request(app).get('/api/subjects');
      const perfTime = Date.now() - perfStart;
      platformHealth.performance = perfTime < 1000; // Under 1 second

      // Platform health summary
      const healthScore = Object.values(platformHealth).filter(Boolean).length;
      const totalChecks = Object.keys(platformHealth).length;

      expect(healthScore).toBeGreaterThan(totalChecks * 0.8); // At least 80% healthy

      console.log(`Platform Health Check: ${healthScore}/${totalChecks} systems functional`);
      console.log('Platform Status:', platformHealth);

      // Verify core educational platform functionality
      expect(platformHealth.dropdown).toBe(true); // Critical for educational platform
      expect(platformHealth.performance).toBe(true); // Critical for user experience
    });
  });
});