import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes.js';
import { storage } from '../../server/storage.js';

describe('Dropdown API Endpoints', () => {
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

  describe('GET /api/qualifications', () => {
    it('should return all active qualifications', async () => {
      // Mock the storage method
      const mockQualifications = [
        {
          id: 'qual1',
          name: 'Computer Science Bachelor',
          description: 'Undergraduate degree in CS',
          category: 'undergraduate',
          displayOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'qual2', 
          name: 'Master of Science',
          description: 'Graduate degree',
          category: 'graduate',
          displayOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.spyOn(storage, 'getQualifications').mockResolvedValue(mockQualifications);

      const response = await request(app)
        .get('/api/qualifications')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: 'qual1',
        name: 'Computer Science Bachelor',
        category: 'undergraduate',
        displayOrder: 1,
        isActive: true
      });
      expect(response.body[1]).toMatchObject({
        id: 'qual2',
        name: 'Master of Science',
        category: 'graduate',
        displayOrder: 2,
        isActive: true
      });
      expect(storage.getQualifications).toHaveBeenCalledOnce();
    });

    it('should handle errors gracefully', async () => {
      // Mock console.error to suppress noisy logs during testing
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.spyOn(storage, 'getQualifications').mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/qualifications')
        .expect(500);

      expect(response.body).toEqual({ message: 'Failed to fetch qualifications' });
      
      consoleErrorSpy.mockRestore();
    });

    it('should return empty array when no qualifications exist', async () => {
      vi.spyOn(storage, 'getQualifications').mockResolvedValue([]);

      const response = await request(app)
        .get('/api/qualifications')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/specializations', () => {
    it('should return all active specializations', async () => {
      const mockSpecializations = [
        {
          id: 'spec1',
          name: 'Machine Learning',
          description: 'AI and ML specialization',
          category: 'technology',
          displayOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'spec2',
          name: 'Web Development',
          description: 'Frontend and backend development',
          category: 'technology',
          displayOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.spyOn(storage, 'getSpecializations').mockResolvedValue(mockSpecializations);

      const response = await request(app)
        .get('/api/specializations')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: 'spec1',
        name: 'Machine Learning',
        category: 'technology',
        displayOrder: 1,
        isActive: true
      });
      expect(response.body[1]).toMatchObject({
        id: 'spec2',
        name: 'Web Development',
        category: 'technology',
        displayOrder: 2,
        isActive: true
      });
      expect(storage.getSpecializations).toHaveBeenCalledOnce();
    });

    it('should handle database errors', async () => {
      // Mock console.error to suppress noisy logs during testing
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.spyOn(storage, 'getSpecializations').mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app)
        .get('/api/specializations')
        .expect(500);

      expect(response.body).toEqual({ message: 'Failed to fetch specializations' });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /api/subjects', () => {
    it('should return all active subjects', async () => {
      const mockSubjects = [
        {
          id: 'subj1',
          name: 'Mathematics',
          description: 'Core mathematics curriculum',
          board: 'CIE',
          grade: 'A-Level',
          category: 'core',
          displayOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'subj2',
          name: 'Computer Science',
          description: 'Programming and CS concepts',
          board: 'IB',
          grade: 'HL',
          category: 'technology',
          displayOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.spyOn(storage, 'getSubjects').mockResolvedValue(mockSubjects);

      const response = await request(app)
        .get('/api/subjects')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: 'subj1',
        name: 'Mathematics',
        board: 'CIE',
        grade: 'A-Level',
        category: 'core',
        displayOrder: 1,
        isActive: true
      });
      expect(response.body[1]).toMatchObject({
        id: 'subj2',
        name: 'Computer Science',
        board: 'IB',
        grade: 'HL',
        category: 'technology',
        displayOrder: 2,
        isActive: true
      });
      expect(storage.getSubjects).toHaveBeenCalledOnce();
    });

    it('should validate subject data structure', async () => {
      const mockSubjects = [
        {
          id: 'subj1',
          name: 'Physics',
          description: 'Physics curriculum',
          board: 'AP',
          grade: 'Grade 12',
          category: 'science',
          displayOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.spyOn(storage, 'getSubjects').mockResolvedValue(mockSubjects);

      const response = await request(app)
        .get('/api/subjects')
        .expect(200);

      const subject = response.body[0];
      expect(subject).toHaveProperty('id');
      expect(subject).toHaveProperty('name');
      expect(subject).toHaveProperty('board');
      expect(subject).toHaveProperty('grade');
      expect(subject).toHaveProperty('category');
      expect(subject).toHaveProperty('displayOrder');
      expect(subject).toHaveProperty('isActive');
      expect(typeof subject.displayOrder).toBe('number');
      expect(typeof subject.isActive).toBe('boolean');
    });

    it('should handle subjects fetch errors', async () => {
      // Mock console.error to suppress noisy logs during testing
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.spyOn(storage, 'getSubjects').mockRejectedValue(new Error('Query failed'));

      const response = await request(app)
        .get('/api/subjects')
        .expect(500);

      expect(response.body).toEqual({ message: 'Failed to fetch subjects' });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('API Response Format Validation', () => {
    it('should ensure all dropdown APIs return consistent structure', async () => {
      const mockData = {
        id: 'test1',
        name: 'Test Item',
        description: 'Test description',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test qualifications format
      vi.spyOn(storage, 'getQualifications').mockResolvedValue([{ ...mockData, category: 'test' }]);
      const qualResponse = await request(app).get('/api/qualifications').expect(200);
      expect(qualResponse.body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        isActive: expect.any(Boolean),
        displayOrder: expect.any(Number)
      });

      // Test specializations format
      vi.spyOn(storage, 'getSpecializations').mockResolvedValue([{ ...mockData, category: 'test' }]);
      const specResponse = await request(app).get('/api/specializations').expect(200);
      expect(specResponse.body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        isActive: expect.any(Boolean),
        displayOrder: expect.any(Number)
      });

      // Test subjects format
      vi.spyOn(storage, 'getSubjects').mockResolvedValue([{ ...mockData, board: 'CIE', grade: 'A-Level', category: 'test' }]);
      const subjResponse = await request(app).get('/api/subjects').expect(200);
      expect(subjResponse.body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        board: expect.any(String),
        grade: expect.any(String),
        isActive: expect.any(Boolean),
        displayOrder: expect.any(Number)
      });
    });
  });
});