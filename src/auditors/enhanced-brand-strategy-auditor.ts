// Enhanced Brand Strategy Auditor
// Integrates fact extraction, variance validation, and enhanced source assessment

import type {
  BrandStrategy,
  AuditResult,
  AuditOptions,
  AuditFinding,
  Recommendation,
  ScoreDimension,
} from '../types/audit-types.js';

import { FactTripleExtractor, type FactTriple } from './fact-triple-extractor.js';
import { NumericVarianceValidator, type NumericClaim } from './numeric-variance-validator.js';
import { EnhancedSourceQualityAssessor } from './enhanced-source-quality-assessor.js';

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

export class EnhancedBrandStrategyAuditor {
  private findings: AuditFinding[] = [];
  private recommendations: Recommendation[] = [];
  private factExtractor: FactTripleExtractor;
  private varianceValidator: NumericVarianceValidator;
  private sourceAssessor: EnhancedSourceQualityAssessor;

  constructor() {
    this.factExtractor = new FactTripleExtractor();
    this.varianceValidator = new NumericVarianceValidator();
    this.sourceAssessor = new EnhancedSourceQualityAssessor();
  }

  async audit(
    strategy: BrandStrategy,
    brandName: string,
    options: AuditOptions = {}
  ): Promise<EnhancedAuditResult> {
    console.log('\n🔍 ENHANCED BRAND QUALITY AUDIT');
    console.log(`   Brand: ${brandName}`);
    console.log(`   Mode: ${options.mode || 'standard'}`);
    console.log(`   Structure: ${this.detectStructureType(strategy)}`);
    console.log(`   Features: Fact Extraction + Variance Validation + Source Tiering`);
    console.log('═'.repeat(60) + '\n');

    this.findings = [];
    this.recommendations = [];

    // Extract facts for structured analysis
    const factAnalysis = await this.extractAndAnalyzeFacts(strategy);

    // Dimension 1: Enhanced Source Quality
    const sourceQuality = await this.auditEnhancedSourceQuality(strategy, options);

    // Dimension 2: Fact Verification with Triple Extraction
    const factVerification = await this.auditEnhancedFactVerification(strategy, factAnalysis, options);

    // Dimension 3: Data Recency
    const dataRecency = await this.auditDataRecency(strategy, options);

    // Dimension 4: Cross-Verification with Variance Analysis
    const crossVerification = await this.auditEnhancedCrossVerification(strategy, factAnalysis, options);

    // Dimension 5: Production Readiness
    const productionReadiness = await this.auditProductionReadiness(strategy);

    // Calculate overall score with composable formula
    const overallScore = this.calculateOverallScore({
      sourceQuality,
      factVerification,
      dataRecency,
      crossVerification,
      productionReadiness,
    });

    // Generate enhanced improvement plan
    const qualityImprovement = this.generateEnhancedImprovementPlan(
      overallScore,
      this.recommendations,
      factAnalysis
    );

    // Prepare variance analysis summary
    const varianceAnalysis = this.getVarianceAnalysisSummary(factAnalysis);

    // Prepare source analysis summary
    const sourceAnalysis = await this.getSourceAnalysisSummary(strategy);

    return {
      brandName,
      auditDate: new Date().toISOString(),
      overallScore,
      scoreBreakdown: {
        sourceQuality,
        factVerification,
        dataRecency,
        crossVerification,
        productionReadiness,
      },
      findings: this.findings,
      recommendations: this.recommendations,
      qualityImprovement,
      factAnalysis: {
        extractedTriples: factAnalysis.triples,
        extractionRate: factAnalysis.extractionRate,
        highPriorityFacts: factAnalysis.highPriority,
      },
      varianceAnalysis,
      sourceAnalysis,
    };
  }

  private async extractAndAnalyzeFacts(strategy: BrandStrategy): Promise<any> {
    console.log('📊 Extracting structured facts...');

    // Combine all text content for fact extraction
    const allText = this.combineStrategyText(strategy);

    // Extract fact triples
    const extraction = this.factExtractor.extractTriples(allText);
    console.log(`   ✓ Extracted ${extraction.triples.length} fact triples`);
    console.log(`   ✓ Extraction rate: ${(extraction.extractionRate * 100).toFixed(1)}%`);

    // Analyze for verification priority
    const { highPriority, mediumPriority, lowPriority } =
      this.factExtractor.analyzeForVerification(extraction.triples);

    console.log(`   ✓ High priority facts: ${highPriority.length}`);
    console.log(`   ✓ Medium priority facts: ${mediumPriority.length}`);
    console.log(`   ✓ Low priority facts: ${lowPriority.length}`);

    return {
      ...extraction,
      highPriority,
      mediumPriority,
      lowPriority,
    };
  }

  private async auditEnhancedSourceQuality(
    strategy: BrandStrategy,
    options: AuditOptions
  ): Promise<ScoreDimension> {
    console.log('\n1️⃣  ENHANCED SOURCE QUALITY ASSESSMENT');

    const sources = this.extractSources(strategy);
    const assessments = await Promise.all(
      sources.map(source => this.sourceAssessor.assessSource({
        url: source.url,
        type: source.type,
        content: source.content,
      }))
    );

    // Calculate tier distribution
    const tierCounts = [0, 0, 0, 0, 0];
    let totalScore = 0;

    for (const assessment of assessments) {
      tierCounts[assessment.tier]++;
      totalScore += assessment.score;
    }

    const averageScore = sources.length > 0 ? totalScore / sources.length : 0.2;
    const score = averageScore * 10;

    // Add findings based on tier distribution
    if (tierCounts[4] > sources.length * 0.3) {
      this.findings.push({
        severity: 'critical',
        category: 'sources',
        message: 'High proportion of Tier 4 (low credibility) sources',
        details: `${tierCounts[4]}/${sources.length} sources are social media or unverified`,
      });
    }

    if (tierCounts[1] < sources.length * 0.2) {
      this.findings.push({
        severity: 'warning',
        category: 'sources',
        message: 'Limited Tier 1 (highest credibility) sources',
        details: 'Add peer-reviewed, government, or academic sources',
      });
    }

    // Add recommendations
    if (score < 6) {
      this.recommendations.push({
        priority: 'high',
        action: 'Upgrade source quality',
        impact: 'Increases credibility and trust',
        estimatedEffort: '2-4 hours',
      });
    }

    console.log(`   Source Quality Score: ${score.toFixed(1)}/10`);
    console.log(`   Tier distribution: T1:${tierCounts[1]} T2:${tierCounts[2]} T3:${tierCounts[3]} T4:${tierCounts[4]}`);

    return {
      score,
      weight: 0.3,
      status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'needs-work' : 'critical',
      details: `${sources.length} sources assessed. Average tier: ${this.calculateAverageTier(tierCounts).toFixed(1)}`,
    };
  }

  private async auditEnhancedFactVerification(
    strategy: BrandStrategy,
    factAnalysis: any,
    options: AuditOptions
  ): Promise<ScoreDimension> {
    console.log('\n2️⃣  ENHANCED FACT VERIFICATION');

    const { triples, highPriority } = factAnalysis;
    const numericTriples = triples.filter((t: FactTriple) => t.type === 'numeric');

    // Calculate verification score based on extracted facts
    const verifiedFacts = numericTriples.filter((t: FactTriple) => t.confidence > 0.7);
    const verificationRate = numericTriples.length > 0
      ? verifiedFacts.length / numericTriples.length
      : 0.5;

    const score = 5 + (verificationRate * 5); // 5-10 scale

    // Add findings for high-priority unverified facts
    const unverifiedHighPriority = highPriority.filter((t: FactTriple) => t.confidence < 0.7);
    if (unverifiedHighPriority.length > 0) {
      this.findings.push({
        severity: 'warning',
        category: 'facts',
        message: `${unverifiedHighPriority.length} high-priority facts need verification`,
        details: unverifiedHighPriority.slice(0, 3).map((t: FactTriple) =>
          `${t.subject} ${t.predicate} ${t.value}`).join('; '),
      });
    }

    // Add recommendations
    if (highPriority.length > 0) {
      this.recommendations.push({
        priority: 'high',
        action: 'Verify high-priority numeric claims',
        impact: 'Ensures accuracy of key metrics',
        estimatedEffort: '1-2 hours',
      });
    }

    console.log(`   Fact Verification Score: ${score.toFixed(1)}/10`);
    console.log(`   Numeric facts: ${numericTriples.length}`);
    console.log(`   Verified: ${verifiedFacts.length}`);

    return {
      score,
      weight: 0.25,
      status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : 'needs-work',
      details: `${verifiedFacts.length}/${numericTriples.length} numeric facts verified`,
    };
  }

  private async auditEnhancedCrossVerification(
    strategy: BrandStrategy,
    factAnalysis: any,
    options: AuditOptions
  ): Promise<ScoreDimension> {
    console.log('\n4️⃣  ENHANCED CROSS-VERIFICATION WITH VARIANCE ANALYSIS');

    const numericTriples = factAnalysis.triples.filter((t: FactTriple) => t.type === 'numeric');

    // Group similar claims for variance analysis
    const claimsMap = this.varianceValidator.extractNumericClaims(numericTriples);
    const validationReport = this.varianceValidator.validateCrossSource(claimsMap);

    // Calculate score based on variance results
    const validationRate = validationReport.totalClaims > 0
      ? (validationReport.totalClaims - validationReport.flaggedClaims) / validationReport.totalClaims
      : 0.5;

    const score = 4 + (validationRate * 6); // 4-10 scale

    // Add findings for high variance claims
    if (validationReport.flaggedClaims > 0) {
      this.findings.push({
        severity: 'warning',
        category: 'verification',
        message: `${validationReport.flaggedClaims} claims show significant variance`,
        details: `Average variance: ${(validationReport.averageVariance * 100).toFixed(1)}%`,
      });
    }

    // Add recommendations
    if (validationReport.averageVariance > 0.1) {
      this.recommendations.push({
        priority: 'high',
        action: 'Reconcile conflicting numeric claims',
        impact: 'Improves consistency and accuracy',
        estimatedEffort: '2-3 hours',
      });
    }

    console.log(`   Cross-Verification Score: ${score.toFixed(1)}/10`);
    console.log(`   Claims analyzed: ${validationReport.totalClaims}`);
    console.log(`   Flagged for variance: ${validationReport.flaggedClaims}`);
    console.log(`   Average variance: ${(validationReport.averageVariance * 100).toFixed(1)}%`);

    return {
      score,
      weight: 0.15,
      status: score >= 7 ? 'good' : score >= 4 ? 'needs-work' : 'critical',
      details: `${validationReport.flaggedClaims}/${validationReport.totalClaims} claims flagged for variance`,
    };
  }

  private async auditDataRecency(strategy: BrandStrategy, options: AuditOptions): Promise<ScoreDimension> {
    console.log('\n3️⃣  DATA RECENCY');

    const currentYear = new Date().getFullYear();
    const sources = this.extractSources(strategy);
    let datedSources = 0;
    let recentSources = 0;

    for (const source of sources) {
      const year = this.extractYear(source.content || source.url || '');
      if (year) {
        datedSources++;
        if (currentYear - year <= 2) {
          recentSources++;
        }
      }
    }

    const recencyRate = datedSources > 0 ? recentSources / datedSources : 0;
    const score = datedSources > 0 ? 5 + (recencyRate * 5) : 5;

    console.log(`   Data Recency Score: ${score.toFixed(1)}/10`);
    console.log(`   Dated sources: ${datedSources}/${sources.length}`);
    console.log(`   Recent (<2 years): ${recentSources}`);

    return {
      score,
      weight: 0.15,
      status: score >= 7 ? 'good' : 'needs-work',
      details: `${recentSources}/${datedSources} sources are recent`,
    };
  }

  private async auditProductionReadiness(strategy: BrandStrategy): Promise<ScoreDimension> {
    console.log('\n5️⃣  PRODUCTION READINESS');

    const components = this.checkComponents(strategy);
    const completeness = components.present / components.total;
    const score = 3 + (completeness * 7); // 3-10 scale

    if (components.missing.length > 0) {
      this.findings.push({
        severity: 'info',
        category: 'quality',
        message: `Missing ${components.missing.length} components`,
        details: components.missing.join(', '),
      });
    }

    console.log(`   Production Readiness Score: ${score.toFixed(1)}/10`);
    console.log(`   Components: ${components.present}/${components.total}`);

    return {
      score,
      weight: 0.15,
      status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : 'needs-work',
      details: `${components.present}/${components.total} components present`,
    };
  }

  private calculateOverallScore(dimensions: Record<string, ScoreDimension>): number {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.values(dimensions).forEach((dim) => {
      weightedSum += dim.score * dim.weight;
      totalWeight += dim.weight;
    });

    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  private generateEnhancedImprovementPlan(
    currentScore: number,
    recommendations: Recommendation[],
    factAnalysis: any
  ): any {
    const targetScore = Math.min(9.5, currentScore + 1.5);

    // Prioritize based on fact analysis
    const prioritizedRecs = recommendations.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return 0;
    });

    const totalEffort = prioritizedRecs.reduce((sum, rec) => {
      const hours = parseInt(rec.estimatedEffort.split('-')[0]) || 0;
      return sum + hours;
    }, 0);

    return {
      currentScore,
      targetScore,
      totalEffort: `${totalEffort}-${totalEffort * 1.5} hours`,
      requiredExpertise: 'Mid-level analyst with fact-checking experience',
      steps: prioritizedRecs.slice(0, 5).map((rec, index) => ({
        step: index + 1,
        action: rec.action,
        expectedImprovement: 0.3,
        estimatedTime: rec.estimatedEffort,
      })),
    };
  }

  private getVarianceAnalysisSummary(factAnalysis: any): any {
    const numericTriples = factAnalysis.triples.filter((t: FactTriple) => t.type === 'numeric');
    const claimsMap = this.varianceValidator.extractNumericClaims(numericTriples);
    const report = this.varianceValidator.validateCrossSource(claimsMap);

    return {
      totalClaims: report.totalClaims,
      flaggedClaims: report.flaggedClaims,
      averageVariance: report.averageVariance,
    };
  }

  private async getSourceAnalysisSummary(strategy: BrandStrategy): Promise<any> {
    const sources = this.extractSources(strategy);
    const assessments = await Promise.all(
      sources.map(source => this.sourceAssessor.assessSource({
        url: source.url,
        type: source.type,
        content: source.content,
      }))
    );

    const tierCounts = [0, 0, 0, 0, 0];
    let totalTier = 0;

    for (const assessment of assessments) {
      tierCounts[assessment.tier]++;
      totalTier += assessment.tier;
    }

    return {
      averageTier: sources.length > 0 ? totalTier / sources.length : 4,
      tier1Count: tierCounts[1],
      tier2Count: tierCounts[2],
      tier3Count: tierCounts[3],
      tier4Count: tierCounts[4],
    };
  }

  // Helper methods
  private detectStructureType(strategy: BrandStrategy): string {
    if (strategy.acts) return 'Act-based';
    if (strategy.sections) return 'Section-based';
    return 'Standard';
  }

  private combineStrategyText(strategy: BrandStrategy): string {
    const texts: string[] = [];

    // Add all text fields
    if (strategy.purpose) texts.push(strategy.purpose);
    if (strategy.mission) texts.push(strategy.mission);
    if (strategy.vision) texts.push(strategy.vision);
    if (strategy.values) texts.push(...strategy.values);
    if (strategy.positioning) texts.push(strategy.positioning);

    // Add proof points
    if (strategy.proofPoints) {
      strategy.proofPoints.forEach(pp => {
        if (pp.claim) texts.push(pp.claim);
        if (pp.evidence) {
          if (Array.isArray(pp.evidence)) {
            texts.push(...pp.evidence);
          } else {
            texts.push(pp.evidence);
          }
        }
      });
    }

    // Add any other text content
    if (strategy.differentiators) texts.push(...strategy.differentiators);
    if (strategy.keyMessages) texts.push(...strategy.keyMessages);

    return texts.join(' ');
  }

  private extractSources(strategy: BrandStrategy): any[] {
    const sources: any[] = [];

    if (strategy.proofPoints) {
      strategy.proofPoints.forEach(pp => {
        if (pp.source || pp.sourceUrl) {
          sources.push({
            url: pp.sourceUrl,
            type: 'proof-point',
            content: Array.isArray(pp.evidence) ? pp.evidence.join(' ') : (pp.evidence || pp.claim),
          });
        }
      });
    }

    // Extract from other fields if they have source information
    // This is extensible based on strategy structure

    return sources;
  }

  private calculateAverageTier(tierCounts: number[]): number {
    let total = 0;
    let count = 0;

    for (let tier = 1; tier <= 4; tier++) {
      total += tier * tierCounts[tier];
      count += tierCounts[tier];
    }

    return count > 0 ? total / count : 4;
  }

  private extractYear(text: string | string[]): number | null {
    const textStr = Array.isArray(text) ? text.join(' ') : text;
    const yearMatch = textStr.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }

  private checkComponents(strategy: BrandStrategy): any {
    const requiredComponents = [
      'purpose', 'mission', 'vision', 'values',
      'positioning', 'proofPoints', 'differentiators'
    ];

    const present: string[] = [];
    const missing: string[] = [];

    for (const component of requiredComponents) {
      if ((strategy as any)[component]) {
        present.push(component);
      } else {
        missing.push(component);
      }
    }

    return {
      total: requiredComponents.length,
      present: present.length,
      missing,
    };
  }

  private isVerifiable(text: string): boolean {
    // Check if text contains verifiable claims
    return /\d+/.test(text) ||
           /first|best|leading|top|only/i.test(text) ||
           /increased|decreased|grew/i.test(text);
  }
}