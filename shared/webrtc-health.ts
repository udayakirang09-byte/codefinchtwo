/**
 * WebRTC Health Scoring Engine
 * 
 * Calculates 0-100 health scores based on network metrics to drive auto-repair decisions.
 * Used across client and server for consistent quality assessment.
 */

export interface NetworkMetrics {
  packetLoss: number;      // Percentage (0-100)
  rtt: number;             // Round-trip time in milliseconds
  jitter: number;          // Jitter in milliseconds
  freezeCount?: number;    // Optional: number of video freezes
  videoBitrate?: number;   // Optional: R2.6 - Video bitrate in kbps
  audioBitrate?: number;   // Optional: R2.6 - Audio bitrate in kbps
}

export interface HealthScore {
  score: number;           // 0-100, where 100 is perfect
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  shouldRepair: boolean;   // Triggers auto-repair mechanisms
  details: {
    packetLossScore: number;
    rttScore: number;
    jitterScore: number;
    freezePenalty?: number;
  };
}

/**
 * Calculate health score from network metrics
 * 
 * Scoring Algorithm:
 * - Start at 100 (perfect)
 * - Packet Loss: 0% = no penalty, 1% = -10, 2% = -20, 5%+ = -50 to -100
 * - RTT: <100ms = no penalty, 100-200ms = -5 to -15, 200-300ms = -15 to -30, >300ms = -30 to -50
 * - Jitter: <30ms = no penalty, 30-50ms = -5, 50-100ms = -10 to -20, >100ms = -20 to -40
 * - Freeze Count: Each freeze = -5 points (max -20)
 * 
 * Quality Bands:
 * - 80-100: Excellent (no action needed)
 * - 60-79: Good (monitor)
 * - 40-59: Fair (prepare for repair)
 * - 20-39: Poor (trigger auto-repair)
 * - 0-19: Critical (immediate action required)
 */
export function calculateHealthScore(metrics: NetworkMetrics): HealthScore {
  let score = 100;
  const details = {
    packetLossScore: 100,
    rttScore: 100,
    jitterScore: 100,
    freezePenalty: 0,
  };

  // Packet Loss Penalty (most critical factor)
  const packetLoss = Math.max(0, Math.min(100, metrics.packetLoss));
  if (packetLoss > 0) {
    if (packetLoss >= 10) {
      details.packetLossScore = 0;
    } else if (packetLoss >= 5) {
      details.packetLossScore = 10 - (packetLoss - 5) * 2; // 5% = 10, 10% = 0
    } else if (packetLoss >= 2) {
      details.packetLossScore = 40 - (packetLoss - 2) * 10; // 2% = 40, 5% = 10
    } else if (packetLoss >= 1) {
      details.packetLossScore = 60 - (packetLoss - 1) * 20; // 1% = 60, 2% = 40
    } else if (packetLoss >= 0.5) {
      details.packetLossScore = 80 - (packetLoss - 0.5) * 40; // 0.5% = 80, 1% = 60
    } else {
      details.packetLossScore = 100 - packetLoss * 40; // 0-0.5% = 100-80
    }
  }

  // RTT Penalty (round-trip time) - Aggressive penalty curve
  const rtt = Math.max(0, metrics.rtt);
  if (rtt >= 400) {
    details.rttScore = 0; // 400ms+ = unusable for real-time video
  } else if (rtt >= 300) {
    details.rttScore = 20 - ((rtt - 300) / 100) * 20; // 300ms = 20, 400ms = 0
  } else if (rtt >= 200) {
    details.rttScore = 50 - ((rtt - 200) / 100) * 30; // 200ms = 50, 300ms = 20
  } else if (rtt >= 120) {
    details.rttScore = 80 - ((rtt - 120) / 80) * 30; // 120ms = 80, 200ms = 50
  } else {
    details.rttScore = 100 - (rtt / 120) * 20; // 0ms = 100, 120ms = 80
  }

  // Jitter Penalty (variance in latency)
  const jitter = Math.max(0, metrics.jitter);
  if (jitter >= 150) {
    details.jitterScore = 0;
  } else if (jitter >= 120) {
    details.jitterScore = 0; // 120ms+ = 0
  } else if (jitter >= 100) {
    details.jitterScore = 20 - ((jitter - 100) / 20) * 20; // 100ms = 20, 120ms = 0
  } else if (jitter >= 80) {
    details.jitterScore = 40 - ((jitter - 80) / 20) * 20; // 80ms = 40, 100ms = 20
  } else if (jitter >= 50) {
    details.jitterScore = 60 - ((jitter - 50) / 30) * 20; // 50ms = 60, 80ms = 40
  } else if (jitter >= 30) {
    details.jitterScore = 80 - ((jitter - 30) / 20) * 20; // 30ms = 80, 50ms = 60
  } else {
    details.jitterScore = 100 - (jitter / 30) * 20; // 0ms = 100, 30ms = 80
  }

  // Freeze Penalty (optional)
  if (metrics.freezeCount !== undefined && metrics.freezeCount > 0) {
    details.freezePenalty = Math.min(20, metrics.freezeCount * 5);
  }

  // Calculate weighted final score
  // Packet loss is most critical (60%), RTT (25%), Jitter (15%)
  // Packet loss heavily weighted as it directly impacts video quality
  score = Math.round(
    details.packetLossScore * 0.6 +
    details.rttScore * 0.25 +
    details.jitterScore * 0.15 -
    (details.freezePenalty || 0)
  );

  // Hard cap for critically high RTT (>350ms is unusable for video calls)
  // Even with perfect packet loss, high latency makes real-time video impractical
  if (rtt >= 350) {
    score = Math.min(score, 59); // Cap at Fair quality to trigger auto-repair
  }

  // Ensure score stays in 0-100 range
  score = Math.max(0, Math.min(100, score));

  // Determine quality band
  let quality: HealthScore['quality'];
  if (score >= 80) {
    quality = 'excellent';
  } else if (score >= 60) {
    quality = 'good';
  } else if (score >= 40) {
    quality = 'fair';
  } else if (score >= 20) {
    quality = 'poor';
  } else {
    quality = 'critical';
  }

  // Determine if auto-repair should trigger
  // Trigger on Fair or worse (score < 60)
  const shouldRepair = score < 60;

  return {
    score,
    quality,
    shouldRepair,
    details,
  };
}

/**
 * Get average health score from multiple readings
 */
export function getAverageHealthScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}

/**
 * Determine connection quality text for UI display
 */
export function getQualityText(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

/**
 * Get color indicator for UI (CSS class or hex color)
 */
export function getQualityColor(score: number): {
  className: string;
  hex: string;
} {
  if (score >= 80) {
    return { className: 'text-green-600', hex: '#16a34a' };
  }
  if (score >= 60) {
    return { className: 'text-blue-600', hex: '#2563eb' };
  }
  if (score >= 40) {
    return { className: 'text-yellow-600', hex: '#ca8a04' };
  }
  if (score >= 20) {
    return { className: 'text-orange-600', hex: '#ea580c' };
  }
  return { className: 'text-red-600', hex: '#dc2626' };
}

/**
 * Determine if region switch is recommended
 * Switch when health is poor/critical for sustained period
 */
export function shouldSwitchRegion(
  recentScores: number[],
  minSampleSize: number = 5,
  threshold: number = 40
): boolean {
  if (recentScores.length < minSampleSize) return false;
  
  // Take the last N samples
  const samples = recentScores.slice(-minSampleSize);
  const avgScore = getAverageHealthScore(samples);
  
  // Switch if average is below threshold
  return avgScore < threshold;
}

/**
 * Determine if external fallback (Teams/Zoom) should trigger
 * Fallback when health is critical for sustained period
 */
export function shouldTriggerExternalFallback(
  recentScores: number[],
  minSampleSize: number = 6,
  criticalThreshold: number = 20
): boolean {
  if (recentScores.length < minSampleSize) return false;
  
  // Take the last N samples
  const samples = recentScores.slice(-minSampleSize);
  const avgScore = getAverageHealthScore(samples);
  
  // Trigger external fallback if critically poor
  return avgScore < criticalThreshold;
}

/**
 * Sample metrics for testing/validation
 */
export const SAMPLE_METRICS = {
  excellent: {
    packetLoss: 0,
    rtt: 50,
    jitter: 10,
  },
  good: {
    packetLoss: 0.8,
    rtt: 150,
    jitter: 35,
  },
  fair: {
    packetLoss: 2,
    rtt: 220,
    jitter: 50,
  },
  poor: {
    packetLoss: 4.5,
    rtt: 320,
    jitter: 75,
  },
  critical: {
    packetLoss: 10,
    rtt: 500,
    jitter: 130,
  },
};
