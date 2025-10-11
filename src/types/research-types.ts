// Research types (minimal version for auditor)

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unverified';
export type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'unknown';

export interface SourcedClaim {
  claim: string;
  source?: string;
  sourceUrl?: string;
  confidence: ConfidenceLevel;
  dateAccessed?: string;
  verificationNotes?: string;
}

export interface ResearchSource {
  url: string;
  title: string;
  tier?: number;
  accessedDate?: string;
}

export interface IndustryResearchData {
  industry: string;
  marketSize?: any;
  growthRate?: any;
  trends: any[];
  keyPlayers: string[];
  sources: string[];
  researchDate: string;
}

export interface MarketStatistic {
  statistic: string;
  value: string | number;
  source: SourcedClaim;
  context: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
}

export interface FactCheckResult {
  claim: string;
  isVerified: boolean;
  confidence: ConfidenceLevel;
  sources: SourcedClaim[];
  contradictions?: string[];
  recommendedAction: 'accept' | 'verify' | 'reject' | 'needs_review';
  notes: string;
}

export interface ValidationResult {
  validatedPoints: any[];
  invalidPoints: any[];
  validationReport: string;
}

export interface CompetitorWebData {
  url: string;
  scrapedAt: string;
  positioning: string;
  products: string[];
  keyFeatures: string[];
  pricingInfo?: string;
  metadata: Record<string, any>;
}

export interface IndustryTrendWithSource {
  trend: string;
  description: string;
  evidence: string[];
  sources: SourcedClaim[];
  confidence: ConfidenceLevel;
}
