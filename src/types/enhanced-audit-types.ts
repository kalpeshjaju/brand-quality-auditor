// Enhanced Audit Types - Extends base types for new features

import type { AuditResult, Recommendation, AuditFinding } from './audit-types.js';
import type { FactTriple } from '../auditors/fact-triple-extractor.js';

export interface EnhancedAuditResult extends AuditResult {
  factAnalysis?: {
    extractedTriples: FactTriple[];
    extractionRate: number;
    highPriorityFacts: FactTriple[];
  };
  varianceAnalysis?: {
    totalClaims: number;
    flaggedClaims: number;
    averageVariance: number;
  };
  sourceAnalysis?: {
    averageTier: number;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    tier4Count: number;
  };
}

export interface EnhancedRecommendation extends Recommendation {
  category?: string;
  effort?: string;
  details?: string;
}

export interface EnhancedAuditFinding extends AuditFinding {
  extendedCategory?: string;
}

export interface EnhancedScoreDimension {
  dimension: string;
  score: number;
  weight: number;
  status: 'excellent' | 'good' | 'needs-work' | 'critical';
  details: string;
}