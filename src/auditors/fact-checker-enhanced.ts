// Enhanced Fact-Checking Service - Intelligent accuracy validation
// Version 2.0 - With source quality assessment and cross-verification

import type { LLMAdapter } from '../adapters/llm-interface.js';
import type {
  SourcedClaim,
  FactCheckResult,
  ConfidenceLevel,
  ValidationResult,
} from '../types/research-types.js';
import { WebResearchService } from '../services/web-research-service.js';
import { SourceQualityAssessor, type SourceQualityScore } from './source-quality-assessor.js';
import { CrossSourceVerifier, type DataAccuracyAssessment } from './cross-source-verifier.js';

export class EnhancedFactCheckerService {
  private llm: LLMAdapter;
  private webResearch: WebResearchService;
  private sourceAssessor: SourceQualityAssessor;
  private crossVerifier: CrossSourceVerifier;
  private systemDate: Date;

  constructor(llm: LLMAdapter) {
    this.llm = llm;
    this.webResearch = new WebResearchService();
    this.sourceAssessor = new SourceQualityAssessor(llm);
    this.crossVerifier = new CrossSourceVerifier(llm);
    this.systemDate = new Date('2025-10-10'); // System date awareness
  }

  async checkClaimWithIntelligence(
    claim: string,
    context: string,
    existingSources?: SourcedClaim[]
  ): Promise<{
    factCheck: FactCheckResult;
    sourceQuality?: SourceQualityScore[];
    dataAccuracy?: DataAccuracyAssessment;
  }> {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔬 INTELLIGENT FACT-CHECKING');
    console.log('   With source quality + cross-verification + recency checks');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📝 Claim: "${claim.substring(0, 100)}..."\n`);

    // Step 1: Detect if claim contains statistics
    const hasStatistics = this.detectStatistics(claim).length > 0;

    console.log(`   Type: ${hasStatistics ? 'Statistical' : 'Qualitative'} claim\n`);

    // Step 2: Check existing sources or find new ones
    let sources = existingSources || [];

    if (sources.length === 0 && hasStatistics) {
      console.log('📡 No existing sources - searching web for verification...\n');
      sources = await this.findVerificationSources(claim, context);
    }

    // Step 3: Assess source quality
    let sourceQuality: SourceQualityScore[] | undefined;

    if (sources.length > 0 && sources.some(s => s.sourceUrl)) {
      console.log(`📊 Assessing quality of ${sources.length} sources...\n`);

      sourceQuality = await Promise.all(
        sources
          .filter(s => s.sourceUrl)
          .map(s => this.sourceAssessor.assessSource(s.sourceUrl!))
      );

      // Sort sources by quality
      sourceQuality.sort((a, b) => b.overallScore - a.overallScore);

      console.log('   Source Quality Rankings:');
      sourceQuality.forEach((sq, i) => {
        console.log(
          `   ${i + 1}. ${sq.domain} - Score: ${sq.overallScore}/100 (${sq.tier}, ${sq.isRecent ? 'recent' : sq.isCurrent ? 'current' : 'dated'})`
        );
      });
      console.log('');
    }

    // Step 4: Cross-verify if multiple sources
    let dataAccuracy: DataAccuracyAssessment | undefined;

    if (sources.length >= 2 && sourceQuality) {
      console.log('🔍 Cross-verifying across multiple sources...\n');

      const crossVerification = await this.crossVerifier.verifyClaim(claim, sources, context);

      console.log(`   Consensus: ${crossVerification.consensus ? 'YES' : 'NO'}`);
      console.log(`   Agreement: ${crossVerification.agreementScore}%`);

      if (crossVerification.contradictions && crossVerification.contradictions.length > 0) {
        console.log(`   ⚠️  Contradictions found: ${crossVerification.contradictions.length}`);
      }
      console.log('');

      // Assess overall data accuracy
      dataAccuracy = await this.crossVerifier.assessDataAccuracy(claim, sources, sourceQuality);

      console.log('📊 Data Accuracy Assessment:');
      console.log(`   Accuracy Score: ${dataAccuracy.accuracyScore}/100`);
      console.log(`   Avg Source Quality: ${Math.round(dataAccuracy.averageSourceQuality)}/100`);
      console.log(`   Data Recency: ${dataAccuracy.dataRecency}`);
      console.log(`   Methodology: ${dataAccuracy.methodologyTransparency}`);
      console.log(`   Cross-Verified: ${dataAccuracy.crossVerified ? 'YES' : 'NO'}\n`);
    }

    // Step 5: Generate fact-check result with intelligence
    const factCheck = await this.generateIntelligentFactCheck(
      claim,
      context,
      sources,
      sourceQuality,
      dataAccuracy
    );

    console.log(`✅ Fact-check complete: ${factCheck.confidence} confidence\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      factCheck,
      sourceQuality,
      dataAccuracy,
    };
  }

  private async generateIntelligentFactCheck(
    claim: string,
    context: string,
    sources: SourcedClaim[],
    sourceQuality?: SourceQualityScore[],
    dataAccuracy?: DataAccuracyAssessment
  ): Promise<FactCheckResult> {
    // Determine confidence based on multiple factors
    let confidence: ConfidenceLevel = 'unverified';

    if (dataAccuracy) {
      // Use data accuracy score to determine confidence
      if (dataAccuracy.accuracyScore >= 80 && dataAccuracy.crossVerified) {
        confidence = 'high';
      } else if (dataAccuracy.accuracyScore >= 65) {
        confidence = 'medium';
      } else if (dataAccuracy.accuracyScore >= 40) {
        confidence = 'low';
      } else {
        confidence = 'unverified';
      }
    } else if (sourceQuality && sourceQuality.length > 0) {
      // Use source quality if no data accuracy assessment
      const avgQuality = sourceQuality.reduce((sum, s) => sum + s.overallScore, 0) / sourceQuality.length;

      if (avgQuality >= 80 && sourceQuality[0].isRecent) {
        confidence = 'high';
      } else if (avgQuality >= 65) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }
    } else if (sources.length > 0) {
      // Fall back to existing source confidence
      confidence = sources[0].confidence;
    }

    // Determine recommended action
    let recommendedAction: 'accept' | 'verify' | 'reject' | 'needs_review';

    if (confidence === 'high') {
      recommendedAction = 'accept';
    } else if (confidence === 'medium') {
      recommendedAction = 'verify';
    } else if (confidence === 'low') {
      recommendedAction = 'needs_review';
    } else {
      recommendedAction = 'reject';
    }

    // Generate comprehensive notes
    const notes = this.generateComprehensiveNotes(
      claim,
      confidence,
      sources,
      sourceQuality,
      dataAccuracy
    );

    return {
      claim,
      isVerified: confidence === 'high',
      confidence,
      sources,
      recommendedAction,
      notes,
    };
  }

  private generateComprehensiveNotes(
    claim: string,
    confidence: ConfidenceLevel,
    sources: SourcedClaim[],
    sourceQuality?: SourceQualityScore[],
    dataAccuracy?: DataAccuracyAssessment
  ): string {
    const notes: string[] = [];

    // Overall assessment
    if (confidence === 'high') {
      notes.push('✅ HIGH CONFIDENCE - Verified via multiple high-quality sources');
    } else if (confidence === 'medium') {
      notes.push('🟡 MEDIUM CONFIDENCE - Reasonable evidence, recommend verification for critical use');
    } else if (confidence === 'low') {
      notes.push('⚠️ LOW CONFIDENCE - Limited or dated sources, needs additional verification');
    } else {
      notes.push('❌ UNVERIFIED - No reliable sources found, do not use without verification');
    }

    // Source count
    notes.push(`Sources: ${sources.length} ${sources.length === 1 ? '(single source - seek additional verification)' : '(multiple sources provide cross-verification)'}`);

    // Data accuracy details
    if (dataAccuracy) {
      notes.push(`Data Accuracy: ${dataAccuracy.accuracyScore}/100`);
      notes.push(`Recency: ${dataAccuracy.dataRecency}`);

      if (dataAccuracy.dataRecency === 'outdated' || dataAccuracy.dataRecency === 'dated') {
        notes.push(`⚠️ Data is ${dataAccuracy.dataRecency} - seek more recent sources`);
      }

      if (dataAccuracy.methodologyTransparency === 'low') {
        notes.push('⚠️ Methodology not transparent - verify independently');
      }
    }

    // Source quality details
    if (sourceQuality && sourceQuality.length > 0) {
      const tier1Count = sourceQuality.filter(s => s.tier === 'tier1').length;
      const recentCount = sourceQuality.filter(s => s.isRecent).length;

      if (tier1Count > 0) {
        notes.push(`✅ ${tier1Count} Tier-1 authoritative source(s)`);
      }

      if (recentCount > 0) {
        notes.push(`✅ ${recentCount} recent source(s) (< 6 months)`);
      }

      // List top sources
      notes.push('\nTop Sources:');
      sourceQuality.slice(0, 3).forEach((s, i) => {
        notes.push(
          `  ${i + 1}. ${s.domain} (${s.overallScore}/100, ${s.tier}, ${s.type}${s.publicationDate ? ', ' + s.publicationDate : ''})`
        );
      });
    }

    // System date awareness
    notes.push(`\nVerification Date: ${this.systemDate.toISOString().split('T')[0]}`);

    return notes.join('\n');
  }

  private async findVerificationSources(claim: string, context: string): Promise<SourcedClaim[]> {
    // Use web research to find sources
    // This would use WebSearch to find verification
    // For now, return empty array (would be implemented with real WebSearch)

    console.log(`   Searching web for: "${claim.substring(0, 80)}..."`);
    console.log('   (Web search integration pending)\n');

    return [];
  }

  private detectStatistics(text: string): string[] {
    const patterns = [
      /\d+(?:\.\d+)?%/g, // Percentages
      /\d+(?:\.\d+)?\s*(?:CAGR|cagr)/gi, // CAGR
      /\$\d+(?:\.\d+)?[BMK]?/gi, // Money
      /\d+(?:\.\d+)?x/gi, // Multiples
      /\d+,\d+/g, // Numbers with commas
      /₹\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:lakh|crore|L|Cr?))?/gi, // Indian currency
    ];

    const statistics: string[] = [];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        statistics.push(...matches);
      }
    }

    return [...new Set(statistics)];
  }

  async batchCheckClaims(
    claims: Array<{ claim: string; context: string; sources?: SourcedClaim[] }>
  ): Promise<
    Array<{
      factCheck: FactCheckResult;
      sourceQuality?: SourceQualityScore[];
      dataAccuracy?: DataAccuracyAssessment;
    }>
  > {
    console.log(`\n🔄 Batch fact-checking ${claims.length} claims with intelligence...\n`);

    const results = [];

    for (const item of claims) {
      const result = await this.checkClaimWithIntelligence(
        item.claim,
        item.context,
        item.sources
      );
      results.push(result);

      // Small delay to avoid overwhelming APIs
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  generateAccuracyReport(
    results: Array<{
      factCheck: FactCheckResult;
      sourceQuality?: SourceQualityScore[];
      dataAccuracy?: DataAccuracyAssessment;
    }>
  ): {
    overallAccuracy: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    unverified: number;
    avgSourceQuality: number;
    recentDataPercentage: number;
    recommendations: string[];
  } {
    const total = results.length;

    const highConfidence = results.filter(r => r.factCheck.confidence === 'high').length;
    const mediumConfidence = results.filter(r => r.factCheck.confidence === 'medium').length;
    const lowConfidence = results.filter(r => r.factCheck.confidence === 'low').length;
    const unverified = results.filter(r => r.factCheck.confidence === 'unverified').length;

    const overallAccuracy = ((highConfidence * 100 + mediumConfidence * 75 + lowConfidence * 40) / total);

    const avgSourceQuality =
      results
        .filter(r => r.dataAccuracy)
        .reduce((sum, r) => sum + (r.dataAccuracy?.averageSourceQuality || 0), 0) /
      results.filter(r => r.dataAccuracy).length || 0;

    const recentDataCount = results.filter(
      r => r.dataAccuracy?.dataRecency === 'recent'
    ).length;
    const recentDataPercentage = (recentDataCount / total) * 100;

    const recommendations: string[] = [];

    if (overallAccuracy >= 80) {
      recommendations.push('✅ Excellent accuracy - safe for production use');
    } else if (overallAccuracy >= 65) {
      recommendations.push('✅ Good accuracy - acceptable for strategic planning');
    } else {
      recommendations.push('⚠️ Low accuracy - recommend additional verification');
    }

    if (unverified / total > 0.3) {
      recommendations.push(`⚠️ ${Math.round((unverified / total) * 100)}% of claims are unverified - increase source research`);
    }

    if (recentDataPercentage < 50) {
      recommendations.push('⚠️ Less than 50% of data is recent - seek more current sources');
    }

    return {
      overallAccuracy: Math.round(overallAccuracy),
      highConfidence,
      mediumConfidence,
      lowConfidence,
      unverified,
      avgSourceQuality: Math.round(avgSourceQuality),
      recentDataPercentage: Math.round(recentDataPercentage),
      recommendations,
    };
  }

  generateConfidenceReport(claims: SourcedClaim[]): {
    overallConfidence: ConfidenceLevel;
    breakdown: Record<ConfidenceLevel, number>;
    flaggedClaims: SourcedClaim[];
  } {
    const breakdown: Record<ConfidenceLevel, number> = {
      high: 0,
      medium: 0,
      low: 0,
      unverified: 0,
    };

    for (const claim of claims) {
      breakdown[claim.confidence] = (breakdown[claim.confidence] || 0) + 1;
    }

    // Calculate overall confidence
    const total = claims.length;
    const highPercentage = (breakdown.high / total) * 100;
    const mediumPercentage = (breakdown.medium / total) * 100;

    let overallConfidence: ConfidenceLevel;
    if (highPercentage >= 70) {
      overallConfidence = 'high';
    } else if (highPercentage + mediumPercentage >= 60) {
      overallConfidence = 'medium';
    } else {
      overallConfidence = 'low';
    }

    // Flag low confidence and unverified claims
    const flaggedClaims = claims.filter(
      c => c.confidence === 'low' || c.confidence === 'unverified'
    );

    return {
      overallConfidence,
      breakdown,
      flaggedClaims,
    };
  }
}

// Factory function
export function createEnhancedFactChecker(llm: LLMAdapter): EnhancedFactCheckerService {
  return new EnhancedFactCheckerService(llm);
}
