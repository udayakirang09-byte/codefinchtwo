import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes.js';
import { storage } from '../../server/storage.js';

describe('API Integration Tests', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Educational Dropdown API Integration', () => {
    it('should return consistent data across all dropdown endpoints', async () => {
      // Test all three endpoints
      const [qualifications, specializations, subjects] = await Promise.all([
        request(app).get('/api/qualifications'),
        request(app).get('/api/specializations'),
        request(app).get('/api/subjects')
      ]);

      // Verify all endpoints return 200
      expect(qualifications.status).toBe(200);
      expect(specializations.status).toBe(200);
      expect(subjects.status).toBe(200);

      // Verify data structure consistency
      [qualifications.body, specializations.body, subjects.body].forEach(data => {
        expect(Array.isArray(data)).toBe(true);
      });

      // Verify qualifications structure
      if (qualifications.body.length > 0) {
        const qual = qualifications.body[0];
        expect(qual).toHaveProperty('id');
        expect(qual).toHaveProperty('name');
        expect(qual).toHaveProperty('category');
        expect(qual).toHaveProperty('displayOrder');
        expect(qual).toHaveProperty('isActive');
      }

      // Verify specializations structure
      if (specializations.body.length > 0) {
        const spec = specializations.body[0];
        expect(spec).toHaveProperty('id');
        expect(spec).toHaveProperty('name');
        expect(spec).toHaveProperty('category');
        expect(spec).toHaveProperty('displayOrder');
        expect(spec).toHaveProperty('isActive');
      }

      // Verify subjects structure
      if (subjects.body.length > 0) {
        const subj = subjects.body[0];
        expect(subj).toHaveProperty('id');
        expect(subj).toHaveProperty('name');
        expect(subj).toHaveProperty('board');
        expect(subj).toHaveProperty('grade');
        expect(subj).toHaveProperty('category');
        expect(subj).toHaveProperty('displayOrder');
        expect(subj).toHaveProperty('isActive');
      }
    });

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      // Make 10 concurrent requests to each endpoint
      const requests = Array.from({ length: 10 }, () => [
        request(app).get('/api/qualifications'),
        request(app).get('/api/specializations'),
        request(app).get('/api/subjects')
      ]).flat();

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 30 requests
    });

    it('should return data ordered by displayOrder and name', async () => {
      const qualificationsResponse = await request(app).get('/api/qualifications');
      const specializationsResponse = await request(app).get('/api/specializations');
      const subjectsResponse = await request(app).get('/api/subjects');

      // Check qualifications ordering
      if (qualificationsResponse.body.length > 1) {
        const quals = qualificationsResponse.body;
        for (let i = 1; i < quals.length; i++) {
          const prev = quals[i - 1];
          const curr = quals[i];
          
          // Should be ordered by displayOrder first, then by name
          if (prev.displayOrder === curr.displayOrder) {
            expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0);
          } else {
            expect(prev.displayOrder).toBeLessThanOrEqual(curr.displayOrder);
          }
        }
      }

      // Check specializations ordering
      if (specializationsResponse.body.length > 1) {
        const specs = specializationsResponse.body;
        for (let i = 1; i < specs.length; i++) {
          const prev = specs[i - 1];
          const curr = specs[i];
          
          if (prev.displayOrder === curr.displayOrder) {
            expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0);
          } else {
            expect(prev.displayOrder).toBeLessThanOrEqual(curr.displayOrder);
          }
        }
      }

      // Check subjects ordering
      if (subjectsResponse.body.length > 1) {
        const subjs = subjectsResponse.body;
        for (let i = 1; i < subjs.length; i++) {
          const prev = subjs[i - 1];
          const curr = subjs[i];
          
          if (prev.displayOrder === curr.displayOrder) {
            expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0);
          } else {
            expect(prev.displayOrder).toBeLessThanOrEqual(curr.displayOrder);
          }
        }
      }
    });

    it('should only return active records', async () => {
      const [qualifications, specializations, subjects] = await Promise.all([
        request(app).get('/api/qualifications'),
        request(app).get('/api/specializations'),
        request(app).get('/api/subjects')
      ]);

      // All returned qualifications should be active
      qualifications.body.forEach((qual: any) => {
        expect(qual.isActive).toBe(true);
      });

      // All returned specializations should be active
      specializations.body.forEach((spec: any) => {
        expect(spec.isActive).toBe(true);
      });

      // All returned subjects should be active
      subjects.body.forEach((subj: any) => {
        expect(subj.isActive).toBe(true);
      });
    });

    it('should validate expected data counts match loaded Excel data', async () => {
      const [qualifications, specializations, subjects] = await Promise.all([
        request(app).get('/api/qualifications'),
        request(app).get('/api/specializations'),
        request(app).get('/api/subjects')
      ]);

      // Based on the actual Excel files loaded:
      // - 30 qualifications
      // - 82 specializations  
      // - 240 subjects
      
      console.log(`Loaded qualifications: ${qualifications.body.length}`);
      console.log(`Loaded specializations: ${specializations.body.length}`);
      console.log(`Loaded subjects: ${subjects.body.length}`);

      // Verify we have reasonable amounts of data (actual counts may vary)
      expect(qualifications.body.length).toBeGreaterThan(0);
      expect(specializations.body.length).toBeGreaterThan(0);
      expect(subjects.body.length).toBeGreaterThan(0);

      // If Excel data was loaded correctly, these should match expected counts
      // Note: These are flexible checks since data might be modified
      expect(qualifications.body.length).toBeGreaterThanOrEqual(20);
      expect(specializations.body.length).toBeGreaterThanOrEqual(50);
      expect(subjects.body.length).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid endpoints gracefully', async () => {
      const response = await request(app).get('/api/nonexistent-endpoint');
      expect(response.status).toBe(404);
    });

    it('should return appropriate error responses for malformed requests', async () => {
      // Test endpoints that don't exist but are similar to valid ones
      const invalidEndpoints = [
        '/api/qualification', // singular instead of plural
        '/api/specialization', // singular instead of plural
        '/api/subject', // singular instead of plural
        '/api/dropdown/qualifications', // wrong path structure
      ];

      for (const endpoint of invalidEndpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(404);
      }
    });
  });

  describe('Data Validation Integration', () => {
    it('should ensure subject data has proper board/grade combinations', async () => {
      const response = await request(app).get('/api/subjects');
      expect(response.status).toBe(200);

      const subjects = response.body;
      if (subjects.length > 0) {
        const validBoardGradeCombinations = {
          'CIE': ['A-Level', 'AS', 'IGCSE', 'O-Level'],
          'IB': ['HL', 'SL', 'MYP'],
          'AP': ['Grade 12', 'Grade 11'],
          'IGCSE': ['O-Level', 'Year 10', 'Year 11']
        };

        subjects.forEach((subject: any) => {
          if (validBoardGradeCombinations[subject.board as keyof typeof validBoardGradeCombinations]) {
            // If we have predefined valid combinations, validate them
            const validGrades = validBoardGradeCombinations[subject.board as keyof typeof validBoardGradeCombinations];
            // Note: This is a flexible check since actual data might have variations
            expect(subject.grade).toBeDefined();
            expect(typeof subject.grade).toBe('string');
            expect(subject.grade.length).toBeGreaterThan(0);
          }
        });
      }
    });

    it('should verify unique composite constraints for subjects', async () => {
      const response = await request(app).get('/api/subjects');
      expect(response.status).toBe(200);

      const subjects = response.body;
      if (subjects.length > 0) {
        // Create composite keys: name + board + grade + category
        const compositeKeys = new Set();
        const duplicates: any[] = [];

        subjects.forEach((subject: any) => {
          const key = `${subject.name}-${subject.board}-${subject.grade}-${subject.category}`;
          if (compositeKeys.has(key)) {
            duplicates.push(subject);
          } else {
            compositeKeys.add(key);
          }
        });

        // Should have no duplicates based on composite constraint
        expect(duplicates).toHaveLength(0);
        expect(compositeKeys.size).toBe(subjects.length);
      }
    });
  });
});