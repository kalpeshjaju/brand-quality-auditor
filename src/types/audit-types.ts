// Brand Quality Audit Types

export interface BrandStrategy {
  purpose?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  positioning?: string;
  personality?: string[];
  voiceAndTone?: {
    voice: string;
    toneAttributes: string[];
  };
  keyMessages?: string[];
  differentiators?: string[];
  proofPoints?: ProofPoint[];
  [key: string]: any;
}

export interface ProofPoint {
  claim: string;
  evidence?: string | string[];
  source?: string;
  sourceUrl?: string;
  confidence?: number;
}

export interface AuditResult {
  brandName: string;
  auditDate: string;
  overallScore: number;
  scoreBreakdown: {
    sourceQuality: ScoreDimension;
    factVerification: ScoreDimension;
    dataRecency: ScoreDimension;
    crossVerification: ScoreDimension;
    productionReadiness: ScoreDimension;
  };
  findings: AuditFinding[];
  recommendations: Recommendation[];
  qualityImprovement: ImprovementPlan;
}

export interface ScoreDimension {
  score: number; // 0-10
  weight: number; // 0-1
  status: 'excellent' | 'good' | 'needs-work' | 'critical';
  details: string;
}

export interface AuditFinding {
  severity: 'critical' | 'warning' | 'info' | 'success';
  category: 'sources' | 'facts' | 'recency' | 'verification' | 'quality';
  message: string;
  location?: string; // Where in the strategy
  details?: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  estimatedEffort: string; // e.g., "2-4 hours"
  impact: string;
}

export interface ImprovementPlan {
  currentScore: number;
  targetScore: number;
  steps: {
    step: number;
    action: string;
    expectedImprovement: number;
    estimatedTime: string;
  }[];
  totalEffort: string;
  requiredExpertise: string;
}

export interface AuditOptions {
  mode?: 'quick' | 'standard' | 'comprehensive';
  enableWebSearch?: boolean;
  minSourceQuality?: 'tier1' | 'tier2' | 'tier3' | 'any';
  minSources?: number;
  checkRecency?: boolean;
  maxDataAge?: number; // days
  outputFormat?: 'json' | 'markdown' | 'html' | 'pdf' | 'both';
}

export interface SourceVerification {
  claim: string;
  verified: boolean;
  sources: VerifiedSource[];
  confidence: number;
  issues?: string[];
}

export interface VerifiedSource {
  url: string;
  title: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'unknown';
  score: number;
  ageInDays?: number;
  isRecent: boolean;
  reasoning: string;
}
