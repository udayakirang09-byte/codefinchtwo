/**
 * Health Scoring Engine Tests
 * 
 * Validates the WebRTC health scoring algorithm across all quality bands
 */

import { describe, it, expect } from 'vitest';
import {
  calculateHealthScore,
  getAverageHealthScore,
  getQualityText,
  getQualityColor,
  shouldSwitchRegion,
  shouldTriggerExternalFallback,
  SAMPLE_METRICS,
  type NetworkMetrics,
} from './webrtc-health';

describe('WebRTC Health Scoring Engine', () => {
  describe('calculateHealthScore', () => {
    it('should return perfect score (100) for ideal conditions', () => {
      const metrics: NetworkMetrics = {
        packetLoss: 0,
        rtt: 0,
        jitter: 0,
      };
      
      const result = calculateHealthScore(metrics);
      
      expect(result.score).toBe(100);
      expect(result.quality).toBe('excellent');
      expect(result.shouldRepair).toBe(false);
    });

    it('should score EXCELLENT quality correctly (80-100)', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.excellent);
      
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.quality).toBe('excellent');
      expect(result.shouldRepair).toBe(false);
    });

    it('should score GOOD quality correctly (60-79)', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.good);
      
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.score).toBeLessThan(80);
      expect(result.quality).toBe('good');
      expect(result.shouldRepair).toBe(false);
    });

    it('should score FAIR quality correctly (40-59) and trigger repair', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.fair);
      
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThan(60);
      expect(result.quality).toBe('fair');
      expect(result.shouldRepair).toBe(true);
    });

    it('should score POOR quality correctly (20-39) and trigger repair', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.poor);
      
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThan(40);
      expect(result.quality).toBe('poor');
      expect(result.shouldRepair).toBe(true);
    });

    it('should score CRITICAL quality correctly (0-19) and trigger repair', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.critical);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThan(20);
      expect(result.quality).toBe('critical');
      expect(result.shouldRepair).toBe(true);
    });

    it('should heavily penalize high packet loss (most critical metric)', () => {
      const highPacketLoss: NetworkMetrics = {
        packetLoss: 10,
        rtt: 50,
        jitter: 10,
      };
      
      const result = calculateHealthScore(highPacketLoss);
      
      // Even with good RTT and jitter, high packet loss should tank the score
      expect(result.score).toBeLessThan(40);
      expect(result.shouldRepair).toBe(true);
    });

    it('should penalize high RTT appropriately', () => {
      const highRTT: NetworkMetrics = {
        packetLoss: 0,
        rtt: 400,
        jitter: 10,
      };
      
      const result = calculateHealthScore(highRTT);
      
      // High RTT (400ms) should trigger auto-repair
      expect(result.score).toBeLessThan(60);
      expect(result.shouldRepair).toBe(true);
      expect(result.details.rttScore).toBe(0); // 400ms+ is unusable
    });

    it('should penalize high jitter appropriately', () => {
      const highJitter: NetworkMetrics = {
        packetLoss: 0,
        rtt: 50,
        jitter: 120,
      };
      
      const result = calculateHealthScore(highJitter);
      
      expect(result.score).toBeLessThan(90);
      expect(result.details.jitterScore).toBe(0);
    });

    it('should apply freeze penalty when freezes occur', () => {
      const withFreezes: NetworkMetrics = {
        packetLoss: 1,
        rtt: 100,
        jitter: 30,
        freezeCount: 3,
      };
      
      const withoutFreezes: NetworkMetrics = {
        packetLoss: 1,
        rtt: 100,
        jitter: 30,
        freezeCount: 0,
      };
      
      const resultWith = calculateHealthScore(withFreezes);
      const resultWithout = calculateHealthScore(withoutFreezes);
      
      expect(resultWith.score).toBeLessThan(resultWithout.score);
      expect(resultWith.details.freezePenalty).toBe(15); // 3 freezes * 5
    });

    it('should cap freeze penalty at 20 points max', () => {
      const manyFreezes: NetworkMetrics = {
        packetLoss: 0,
        rtt: 50,
        jitter: 10,
        freezeCount: 10,
      };
      
      const result = calculateHealthScore(manyFreezes);
      
      expect(result.details.freezePenalty).toBe(20); // Capped at 20
    });

    it('should never return score below 0', () => {
      const worstCase: NetworkMetrics = {
        packetLoss: 100,
        rtt: 10000,
        jitter: 1000,
        freezeCount: 100,
      };
      
      const result = calculateHealthScore(worstCase);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should never return score above 100', () => {
      const result = calculateHealthScore({
        packetLoss: 0,
        rtt: 0,
        jitter: 0,
      });
      
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should provide detailed breakdown of scores', () => {
      const metrics: NetworkMetrics = {
        packetLoss: 2,
        rtt: 150,
        jitter: 40,
      };
      
      const result = calculateHealthScore(metrics);
      
      expect(result.details).toHaveProperty('packetLossScore');
      expect(result.details).toHaveProperty('rttScore');
      expect(result.details).toHaveProperty('jitterScore');
      expect(result.details.packetLossScore).toBeGreaterThan(0);
      expect(result.details.rttScore).toBeGreaterThan(0);
      expect(result.details.jitterScore).toBeGreaterThan(0);
    });
  });

  describe('getAverageHealthScore', () => {
    it('should calculate average correctly', () => {
      const scores = [80, 90, 70, 85];
      const avg = getAverageHealthScore(scores);
      
      expect(avg).toBe(81); // (80+90+70+85)/4 = 81.25 → 81
    });

    it('should return 0 for empty array', () => {
      const avg = getAverageHealthScore([]);
      expect(avg).toBe(0);
    });

    it('should round to nearest integer', () => {
      const scores = [75, 76]; // Average = 75.5
      const avg = getAverageHealthScore(scores);
      
      expect(avg).toBe(76); // Rounded up
    });
  });

  describe('getQualityText', () => {
    it('should return correct text for each quality band', () => {
      expect(getQualityText(100)).toBe('Excellent');
      expect(getQualityText(85)).toBe('Excellent');
      expect(getQualityText(75)).toBe('Good');
      expect(getQualityText(65)).toBe('Good');
      expect(getQualityText(55)).toBe('Fair');
      expect(getQualityText(45)).toBe('Fair');
      expect(getQualityText(35)).toBe('Poor');
      expect(getQualityText(25)).toBe('Poor');
      expect(getQualityText(15)).toBe('Critical');
      expect(getQualityText(5)).toBe('Critical');
    });

    it('should handle boundary values correctly', () => {
      expect(getQualityText(80)).toBe('Excellent');
      expect(getQualityText(79)).toBe('Good');
      expect(getQualityText(60)).toBe('Good');
      expect(getQualityText(59)).toBe('Fair');
      expect(getQualityText(40)).toBe('Fair');
      expect(getQualityText(39)).toBe('Poor');
      expect(getQualityText(20)).toBe('Poor');
      expect(getQualityText(19)).toBe('Critical');
    });
  });

  describe('getQualityColor', () => {
    it('should return green for excellent quality', () => {
      const color = getQualityColor(85);
      expect(color.className).toContain('green');
      expect(color.hex).toBe('#16a34a');
    });

    it('should return blue for good quality', () => {
      const color = getQualityColor(70);
      expect(color.className).toContain('blue');
      expect(color.hex).toBe('#2563eb');
    });

    it('should return yellow for fair quality', () => {
      const color = getQualityColor(50);
      expect(color.className).toContain('yellow');
      expect(color.hex).toBe('#ca8a04');
    });

    it('should return orange for poor quality', () => {
      const color = getQualityColor(30);
      expect(color.className).toContain('orange');
      expect(color.hex).toBe('#ea580c');
    });

    it('should return red for critical quality', () => {
      const color = getQualityColor(10);
      expect(color.className).toContain('red');
      expect(color.hex).toBe('#dc2626');
    });
  });

  describe('shouldSwitchRegion', () => {
    it('should recommend region switch when sustained poor quality', () => {
      const poorScores = [35, 38, 32, 36, 34]; // Average = 35
      const result = shouldSwitchRegion(poorScores);
      
      expect(result).toBe(true);
    });

    it('should not recommend switch for good quality', () => {
      const goodScores = [75, 80, 78, 76, 82];
      const result = shouldSwitchRegion(goodScores);
      
      expect(result).toBe(false);
    });

    it('should not recommend switch with insufficient samples', () => {
      const fewScores = [20, 25, 30]; // Only 3 samples, need 5
      const result = shouldSwitchRegion(fewScores);
      
      expect(result).toBe(false);
    });

    it('should use only recent samples', () => {
      // Started bad, now good
      const scores = [20, 25, 30, 85, 90, 88, 92, 86];
      const result = shouldSwitchRegion(scores);
      
      expect(result).toBe(false); // Last 5 samples are good
    });

    it('should respect custom threshold', () => {
      const scores = [55, 58, 52, 56, 54]; // Average = 55
      
      expect(shouldSwitchRegion(scores, 5, 60)).toBe(true); // Below 60 threshold
      expect(shouldSwitchRegion(scores, 5, 50)).toBe(false); // Above 50 threshold
    });
  });

  describe('shouldTriggerExternalFallback', () => {
    it('should trigger fallback for sustained critical quality', () => {
      const criticalScores = [15, 12, 18, 14, 16, 13];
      const result = shouldTriggerExternalFallback(criticalScores);
      
      expect(result).toBe(true);
    });

    it('should not trigger fallback for poor but not critical quality', () => {
      const poorScores = [35, 38, 32, 36, 34, 30]; // Average = 34
      const result = shouldTriggerExternalFallback(poorScores);
      
      expect(result).toBe(false); // Above 20 threshold
    });

    it('should not trigger with insufficient samples', () => {
      const fewScores = [10, 12, 15]; // Only 3 samples, need 6
      const result = shouldTriggerExternalFallback(fewScores);
      
      expect(result).toBe(false);
    });

    it('should use only recent samples', () => {
      // Started critical, recovered
      const scores = [10, 12, 8, 15, 75, 80, 85, 78, 82, 88];
      const result = shouldTriggerExternalFallback(scores);
      
      expect(result).toBe(false); // Last 6 samples are good
    });

    it('should respect custom parameters', () => {
      const scores = [25, 28, 22, 26, 24, 23]; // Average = 24.67
      
      expect(shouldTriggerExternalFallback(scores, 6, 30)).toBe(true);
      expect(shouldTriggerExternalFallback(scores, 6, 20)).toBe(false);
    });
  });

  describe('Sample Metrics Validation', () => {
    it('should have valid excellent sample metrics', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.excellent);
      expect(result.quality).toBe('excellent');
    });

    it('should have valid good sample metrics', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.good);
      expect(result.quality).toBe('good');
    });

    it('should have valid fair sample metrics', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.fair);
      expect(result.quality).toBe('fair');
    });

    it('should have valid poor sample metrics', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.poor);
      expect(result.quality).toBe('poor');
    });

    it('should have valid critical sample metrics', () => {
      const result = calculateHealthScore(SAMPLE_METRICS.critical);
      expect(result.quality).toBe('critical');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical home WiFi (good quality)', () => {
      const homeWifi: NetworkMetrics = {
        packetLoss: 0.3,
        rtt: 45,
        jitter: 8,
      };
      
      const result = calculateHealthScore(homeWifi);
      
      expect(result.quality).toMatch(/excellent|good/);
      expect(result.shouldRepair).toBe(false);
    });

    it('should handle congested network (fair quality)', () => {
      const congested: NetworkMetrics = {
        packetLoss: 2.5,
        rtt: 220,
        jitter: 55,
      };
      
      const result = calculateHealthScore(congested);
      
      expect(result.quality).toBe('fair');
      expect(result.shouldRepair).toBe(true);
    });

    it('should handle mobile 4G (good to fair)', () => {
      const mobile4G: NetworkMetrics = {
        packetLoss: 1.2,
        rtt: 95,
        jitter: 35,
      };
      
      const result = calculateHealthScore(mobile4G);
      
      expect(result.score).toBeGreaterThan(50);
    });

    it('should handle poor mobile connection', () => {
      const poorMobile: NetworkMetrics = {
        packetLoss: 8,
        rtt: 350,
        jitter: 110,
      };
      
      const result = calculateHealthScore(poorMobile);
      
      expect(result.quality).toMatch(/poor|critical/);
      expect(result.shouldRepair).toBe(true);
    });

    it('should handle satellite internet (high latency)', () => {
      const satellite: NetworkMetrics = {
        packetLoss: 0.5,
        rtt: 600, // High RTT typical for satellite
        jitter: 40,
      };
      
      const result = calculateHealthScore(satellite);
      
      // Should be penalized for high RTT but not critical
      expect(result.score).toBeLessThan(70);
      expect(result.details.rttScore).toBe(0); // RTT 600 > 500
    });
  });
});
