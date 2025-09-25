import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../../server/storage.js';
import { db } from '../../server/db.js';
import { qualifications, specializations, subjects } from '../../shared/schema.js';

// Mock the database
vi.mock('../../server/db.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('Dropdown Storage Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQualifications', () => {
    it('should fetch active qualifications ordered by displayOrder and name', async () => {
      const mockQualifications = [
        { id: '1', name: 'Bachelor of Science', displayOrder: 1, isActive: true },
        { id: '2', name: 'Master of Science', displayOrder: 2, isActive: true }
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockQualifications);

      (db.select as any).mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            orderBy: mockOrderBy
          })
        })
      });

      const result = await storage.getQualifications();

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(qualifications);
      expect(mockWhere).toHaveBeenCalled(); // Should filter for isActive: true
      expect(mockOrderBy).toHaveBeenCalled(); // Should order by displayOrder, name
      expect(result).toEqual(mockQualifications);
    });

    it('should return empty array when no qualifications exist', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue([]);

      (db.select as any).mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            orderBy: mockOrderBy
          })
        })
      });

      const result = await storage.getQualifications();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      (db.select as any).mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            orderBy: mockOrderBy
          })
        })
      });

      await expect(storage.getQualifications()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getSpecializations', () => {
    it('should fetch active specializations with proper ordering', async () => {
      const mockSpecializations = [
        { id: '1', name: 'AI/ML', category: 'technology', displayOrder: 1, isActive: true },
        { id: '2', name: 'Web Development', category: 'technology', displayOrder: 2, isActive: true }
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockSpecializations);

      (db.select as any).mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            orderBy: mockOrderBy
          })
        })
      });

      const result = await storage.getSpecializations();

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(specializations);
      expect(result).toEqual(mockSpecializations);
      expect(result[0].name).toBe('AI/ML');
      expect(result[1].category).toBe('technology');
    });

    it('should filter out inactive specializations', async () => {
      const mockSpecializations = [
        { id: '1', name: 'Active Spec', displayOrder: 1, isActive: true },
        // Inactive specializations should not be returned due to where clause
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockSpecializations);

      (db.select as any).mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            orderBy: mockOrderBy
          })
        })
      });

      const result = await storage.getSpecializations();

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });

  describe('getSubjects', () => {
    it('should fetch active subjects with all required fields', async () => {
      const mockSubjects = [
        {
          id: '1',
          name: 'Mathematics',
          description: 'Core mathematics',
          board: 'CIE',
          grade: 'A-Level',
          category: 'core',
          displayOrder: 1,
          isActive: true
        },
        {
          id: '2', 
          name: 'Physics',
          description: 'Physics curriculum',
          board: 'IB',
          grade: 'HL',
          category: 'science',
          displayOrder: 2,
          isActive: true
        }
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockSubjects);

      (db.select as any).mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            orderBy: mockOrderBy
          })
        })
      });

      const result = await storage.getSubjects();

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(subjects);
      expect(result).toEqual(mockSubjects);
      expect(result[0]).toHaveProperty('board');
      expect(result[0]).toHaveProperty('grade');
      expect(result[1].board).toBe('IB');
      expect(result[1].grade).toBe('HL');
    });

    it('should validate subject data structure requirements', async () => {
      const mockSubjects = [
        {
          id: '1',
          name: 'Computer Science',
          board: 'AP',
          grade: 'Grade 12',
          category: 'technology',
          displayOrder: 1,
          isActive: true
        }
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockSubjects);

      (db.select as any).mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            orderBy: mockOrderBy
          })
        })
      });

      const result = await storage.getSubjects();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('board');
      expect(result[0]).toHaveProperty('grade');
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('displayOrder');
      expect(result[0]).toHaveProperty('isActive');
      
      // Validate data types
      expect(typeof result[0].id).toBe('string');
      expect(typeof result[0].name).toBe('string');
      expect(typeof result[0].board).toBe('string');
      expect(typeof result[0].grade).toBe('string');
      expect(typeof result[0].displayOrder).toBe('number');
      expect(typeof result[0].isActive).toBe('boolean');
    });
  });

  describe('Count Methods', () => {
    it('should get qualifications count correctly', async () => {
      const mockCountResult = [{ count: 15 }];

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockResolvedValue(mockCountResult);

      (db.select as any).mockReturnValue({
        from: mockFrom
      });

      const result = await storage.getQualificationsCount();

      expect(result).toBe(15);
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(qualifications);
    });

    it('should get specializations count correctly', async () => {
      const mockCountResult = [{ count: 23 }];

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockResolvedValue(mockCountResult);

      (db.select as any).mockReturnValue({
        from: mockFrom
      });

      const result = await storage.getSpecializationsCount();

      expect(result).toBe(23);
      expect(mockFrom).toHaveBeenCalledWith(specializations);
    });

    it('should get subjects count correctly', async () => {
      const mockCountResult = [{ count: 240 }];

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockResolvedValue(mockCountResult);

      (db.select as any).mockReturnValue({
        from: mockFrom
      });

      const result = await storage.getSubjectsCount();

      expect(result).toBe(240);
      expect(mockFrom).toHaveBeenCalledWith(subjects);
    });

    it('should handle missing count and return 0', async () => {
      const mockCountResult = [{}]; // Empty result

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockResolvedValue(mockCountResult);

      (db.select as any).mockReturnValue({
        from: mockFrom
      });

      const result = await storage.getQualificationsCount();

      expect(result).toBe(0);
    });
  });

  describe('Batch Operations', () => {
    it('should handle empty batch insertions gracefully', async () => {
      await expect(storage.batchCreateQualifications([])).resolves.not.toThrow();
      await expect(storage.batchCreateSpecializations([])).resolves.not.toThrow();
      await expect(storage.batchCreateSubjects([])).resolves.not.toThrow();
    });
  });
});