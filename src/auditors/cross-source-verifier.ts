// Cross-Source Verification - Validate claims across multiple sources
// Version 2.0 - Enhanced Data Accuracy

import type { LLMAdapter } from '../adapters/llm-interface.js';
import type { SourcedClaim, ConfidenceLevel } from '../types/research-types.js';
import type { SourceQualityScore } from './source-quality-assessor.js';

export interface CrossVerificationResult {
  claim: string;
  consensus: boolean; // Multiple sources agree
  agreementScore: number; // 0-100 (% of sources that agree)
  conflictingClaims: string[];
  verifiedSources: SourcedClaim[];
  contradictions?: Contradiction[];
  finalConfidence: ConfidenceLevel;
  recommendation: 'accept' | 'accept_with_caveats' | 'needs_review' | 'reject';
  reasoning: string;
}

export interface Contradiction {
  claim1: string;
  claim2: string;
  source1: string;
  source2: string;
  severity: 'major' | 'minor' | 'contextual';
  explanation: string;
}

export interface DataAccuracyAssessment {
  claim: string;
  sources: SourcedClaim[];
  sourceQuality: SourceQualityScore[];
  averageSourceQuality: number;
  dataRecency: 'recent' | 'current' | 'dated' | 'outdated';
  methodologyTransparency: 'high' | 'medium' | 'low' | 'unknown';
  crossVerified: boolean;
  accuracyScore: number; // 0-100
  recommendedAction: string;
}

export class CrossSourceVerifier {
  private llm: LLMAdapter;
  private systemDate: Date;

  constructor(llm: LLMAdapter) {
    this.llm = llm;
    this.systemDate = new Date('2025-10-10'); // System date awareness
  }

  async verifyClaim(
    claim: string,
    sources: SourcedClaim[],
    context: string
  ): Promise<CrossVerificationResult> {
    console.log(`\n🔍 Cross-verifying claim across ${sources.length} sources...\n`);
    console.log(`   Claim: "${claim.substring(0, 100)}..."\n`);

    if (sources.length === 0) {
      return this.createUnverifiedResult(claim);
    }

    if (sources.length === 1) {
      return this.createSingleSourceResult(claim, sources[0]);
    }

    // Multiple sources - perform cross-verification
    return this.performCrossVerification(claim, sources, context);
  }

  private async performCrossVerification(
    claim: string,
    sources: SourcedClaim[],
    context: string
  ): Promise<CrossVerificationResult> {
    // Use LLM to analyze agreement/disagreement across sources
    const prompt = `Cross-verify this claim across multiple sources:

**Claim:** ${claim}

**Context:** ${context}

**Sources:**
${sources.map((s, i) => `
${i + 1}. ${s.claim}
   Source: ${s.source || 'Unknown'}
   URL: ${s.sourceUrl || 'N/A'}
   Confidence: ${s.confidence}
   Date: ${s.dateAccessed || 'Unknown'}
`).join('\n')}

**Analysis Tasks:**

1. **Agreement Assessment**
   - Do all sources agree on the core claim?
   - What is the % agreement (0-100)?
   - Are there any contradictions?

2. **Contradiction Detection**
   - Identify any conflicting information
   - Classify severity: major, minor, or contextual
   - Explain the contradictions

3. **Data Quality Analysis**
   - Which sources are most recent?
   - Which sources are most authoritative?
   - Are there any outliers?

4. **Final Recommendation**
   - Should we accept, accept with caveats, review, or reject?
   - What confidence level (high/medium/low/unverified)?

**System Date:** ${this.systemDate.toISOString().split('T')[0]}

Provide analysis in JSON:
{
  "consensus": <boolean>,
  "agreementScore": <number 0-100>,
  "conflictingClaims": ["<claim 1>", "<claim 2>"],
  "contradictions": [
    {
      "claim1": "<version 1>",
      "claim2": "<version 2>",
      "source1": "<source 1>",
      "source2": "<source 2>",
      "severity": "major|minor|contextual",
      "explanation": "<why they conflict>"
    }
  ],
  "finalConfidence": "high|medium|low|unverified",
  "recommendation": "accept|accept_with_caveats|needs_review|reject",
  "reasoning": "<detailed explanation>"
}`;

    try {
      const response = await this.llm.generateResponse({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Low temperature for analytical task
      });

      const analysis = JSON.parse(this.extractJSON(response.content));

      return {
        claim,
        consensus: analysis.consensus,
        agreementScore: analysis.agreementScore || 0,
        conflictingClaims: analysis.conflictingClaims || [],
        verifiedSources: sources,
        contradictions: analysis.contradictions || [],
        finalConfidence: analysis.finalConfidence || 'unverified',
        recommendation: analysis.recommendation || 'needs_review',
        reasoning: analysis.reasoning || 'Analysis completed',
      };
    } catch (error) {
      console.error('Cross-verification failed:', error);
      return this.createFallbackResult(claim, sources);
    }
  }

  async assessDataAccuracy(
    claim: string,
    sources: SourcedClaim[],
    sourceQualityScores: SourceQualityScore[]
  ): Promise<DataAccuracyAssessment> {
    console.log(`\n📊 Assessing data accuracy for claim...\n`);

    // Calculate average source quality
    const avgQuality = sourceQualityScores.length > 0
      ? sourceQualityScores.reduce((sum, s) => sum + s.overallScore, 0) / sourceQualityScores.length
      : 0;

    // Determine data recency
    const recency = this.assessDataRecency(sourceQualityScores);

    // Check methodology transparency
    const methodologyTransparency = this.assessMethodologyTransparency(sourceQualityScores);

    // Cross-verification status
    const crossVerified = sources.length >= 2;

    // Calculate accuracy score
    const accuracyScore = this.calculateAccuracyScore({
      avgSourceQuality: avgQuality,
      recency,
      methodologyTransparency,
      sourceCount: sources.length,
      crossVerified,
    });

    // Generate recommendation
    const recommendedAction = this.generateAccuracyRecommendation(
      accuracyScore,
      sources.length,
      recency
    );

    return {
      claim,
      sources,
      sourceQuality: sourceQualityScores,
      averageSourceQuality: avgQuality,
      dataRecency: recency,
      methodologyTransparency,
      crossVerified,
      accuracyScore,
      recommendedAction,
    };
  }

  private assessDataRecency(sourceQualityScores: SourceQualityScore[]): 'recent' | 'current' | 'dated' | 'outdated' {
    if (sourceQualityScores.length === 0) return 'outdated';

    const avgAge = sourceQualityScores
      .filter(s => s.ageInDays !== undefined)
      .reduce((sum, s) => sum + (s.ageInDays || 9999), 0) / sourceQualityScores.length;

    if (avgAge < 180) return 'recent'; // < 6 months
    if (avgAge < 365) return 'current'; // < 1 year
    if (avgAge < 730) return 'dated'; // < 2 years
    return 'outdated'; // > 2 years
  }

  private assessMethodologyTransparency(
    sourceQualityScores: SourceQualityScore[]
  ): 'high' | 'medium' | 'low' | 'unknown' {
    if (sourceQualityScores.length === 0) return 'unknown';

    const avgMethodologyScore = sourceQualityScores.reduce(
      (sum, s) => sum + s.credibilityFactors.methodologyScore,
      0
    ) / sourceQualityScores.length;

    if (avgMethodologyScore >= 75) return 'high';
    if (avgMethodologyScore >= 50) return 'medium';
    if (avgMethodologyScore >= 25) return 'low';
    return 'unknown';
  }

  private calculateAccuracyScore(params: {
    avgSourceQuality: number;
    recency: 'recent' | 'current' | 'dated' | 'outdated';
    methodologyTransparency: 'high' | 'medium' | 'low' | 'unknown';
    sourceCount: number;
    crossVerified: boolean;
  }): number {
    let score = 0;

    // Source quality (40% weight)
    score += params.avgSourceQuality * 0.4;

    // Recency (25% weight)
    const recencyScores = { recent: 100, current: 75, dated: 50, outdated: 25 };
    score += recencyScores[params.recency] * 0.25;

    // Methodology (20% weight)
    const methodologyScores = { high: 100, medium: 65, low: 35, unknown: 20 };
    score += methodologyScores[params.methodologyTransparency] * 0.2;

    // Cross-verification bonus (15% weight)
    const crossVerificationScore = params.crossVerified
      ? Math.min(100, 50 + params.sourceCount * 10) // More sources = better
      : 0;
    score += crossVerificationScore * 0.15;

    return Math.round(score);
  }

  private generateAccuracyRecommendation(
    accuracyScore: number,
    sourceCount: number,
    recency: string
  ): string {
    const recommendations: string[] = [];

    if (accuracyScore >= 80) {
      recommendations.push('✅ HIGH ACCURACY - Safe to use in production');
    } else if (accuracyScore >= 65) {
      recommendations.push('✅ GOOD ACCURACY - Acceptable for strategic planning');
    } else if (accuracyScore >= 50) {
      recommendations.push('🟡 MODERATE ACCURACY - Use with caution, verify critical claims');
    } else {
      recommendations.push('⚠️ LOW ACCURACY - Recommend additional verification');
    }

    if (sourceCount < 2) {
      recommendations.push('⚠️ Single source - seek additional verification');
    } else if (sourceCount >= 3) {
      recommendations.push('✅ Multiple sources provide cross-verification');
    }

    if (recency === 'outdated' || recency === 'dated') {
      recommendations.push(`⚠️ Data is ${recency} - seek more recent sources`);
    }

    return recommendations.join(' | ');
  }

  private createUnverifiedResult(claim: string): CrossVerificationResult {
    return {
      claim,
      consensus: false,
      agreementScore: 0,
      conflictingClaims: [],
      verifiedSources: [],
      finalConfidence: 'unverified',
      recommendation: 'needs_review',
      reasoning: 'No sources available for verification',
    };
  }

  private createSingleSourceResult(claim: string, source: SourcedClaim): CrossVerificationResult {
    return {
      claim,
      consensus: false, // Cannot establish consensus with single source
      agreementScore: 100, // Single source agrees with itself
      conflictingClaims: [],
      verifiedSources: [source],
      finalConfidence: source.confidence,
      recommendation: source.confidence === 'high' ? 'accept_with_caveats' : 'needs_review',
      reasoning: 'Single source - recommend seeking additional verification for critical claims',
    };
  }

  private createFallbackResult(claim: string, sources: SourcedClaim[]): CrossVerificationResult {
    return {
      claim,
      consensus: false,
      agreementScore: 50,
      conflictingClaims: [],
      verifiedSources: sources,
      finalConfidence: 'low',
      recommendation: 'needs_review',
      reasoning: 'Cross-verification analysis failed - manual review recommended',
    };
  }

  private extractJSON(content: string): string {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : content;
  }

  async detectContradictions(claims: SourcedClaim[]): Promise<Contradiction[]> {
    if (claims.length < 2) return [];

    console.log(`\n🔍 Detecting contradictions among ${claims.length} claims...\n`);

    const prompt = `Analyze these claims for contradictions:

${claims.map((c, i) => `
${i + 1}. ${c.claim}
   Source: ${c.source || 'Unknown'}
`).join('\n')}

Identify any contradictions:
- Major: Direct conflict on facts or numbers
- Minor: Different emphasis but not contradictory
- Contextual: Appears contradictory but context explains difference

Output JSON array of contradictions:
[
  {
    "claim1": "<first claim>",
    "claim2": "<second claim>",
    "source1": "<source 1>",
    "source2": "<source 2>",
    "severity": "major|minor|contextual",
    "explanation": "<why they conflict and which is more reliable>"
  }
]`;

    try {
      const response = await this.llm.generateResponse({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const contradictions = JSON.parse(this.extractJSON(response.content));
      return Array.isArray(contradictions) ? contradictions : [];
    } catch (error) {
      console.error('Contradiction detection failed:', error);
      return [];
    }
  }
}

// Factory function
export function createCrossSourceVerifier(llm: LLMAdapter): CrossSourceVerifier {
  return new CrossSourceVerifier(llm);
}
