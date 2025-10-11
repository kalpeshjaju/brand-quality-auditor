// Main Brand Strategy Auditor
// Orchestrates all audit checks

import type {
  BrandStrategy,
  AuditResult,
  AuditOptions,
  AuditFinding,
  Recommendation,
  ScoreDimension,
} from '../types/audit-types.js';

export class BrandStrategyAuditor {
  private findings: AuditFinding[] = [];
  private recommendations: Recommendation[] = [];

  async audit(
    strategy: BrandStrategy,
    brandName: string,
    options: AuditOptions = {}
  ): Promise<AuditResult> {
    console.log('\n🔍 BRAND QUALITY AUDIT');
    console.log(`   Brand: ${brandName}`);
    console.log(`   Mode: ${options.mode || 'standard'}`);
    console.log(`   Structure: ${this.detectStructureType(strategy)}`);
    console.log('═'.repeat(60) + '\n');

    this.findings = [];
    this.recommendations = [];

    // Dimension 1: Source Quality
    const sourceQuality = await this.auditSourceQuality(strategy, options);

    // Dimension 2: Fact Verification
    const factVerification = await this.auditFactVerification(strategy, options);

    // Dimension 3: Data Recency
    const dataRecency = await this.auditDataRecency(strategy, options);

    // Dimension 4: Cross-Verification
    const crossVerification = await this.auditCrossVerification(strategy, options);

    // Dimension 5: Production Readiness
    const productionReadiness = await this.auditProductionReadiness(strategy);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      sourceQuality,
      factVerification,
      dataRecency,
      crossVerification,
      productionReadiness,
    });

    // Generate improvement plan
    const qualityImprovement = this.generateImprovementPlan(
      overallScore,
      this.recommendations
    );

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
    };
  }

  private async auditSourceQuality(
    strategy: BrandStrategy,
    options: AuditOptions
  ): Promise<ScoreDimension> {
    const claims = this.extractClaims(strategy);
    let sourcedClaims = 0;
    let totalClaims = claims.length;

    // Only count proof points and verifiable claims for source quality
    const verifiableClaims = claims.filter(c =>
      c.location.includes('proofPoints') || this.isVerifiable(c.text)
    );
    const verifiableTotal = verifiableClaims.length;

    claims.forEach((claim) => {
      const isVerifiable = claim.location.includes('proofPoints') || this.isVerifiable(claim.text);

      if (claim.source || claim.sourceUrl) {
        sourcedClaims++;
      } else if (isVerifiable) {
        // Only warn about unsourced verifiable claims
        this.findings.push({
          severity: 'warning',
          category: 'sources',
          message: `Unsourced verifiable claim: "${claim.text.substring(0, 60)}..."`,
          location: claim.location,
        });
      }
    });

    const score = verifiableTotal > 0 ? (sourcedClaims / verifiableTotal) * 10 : 8;

    if (score < 5) {
      this.findings.push({
        severity: 'critical',
        category: 'sources',
        message: `Only ${sourcedClaims}/${verifiableTotal} verifiable claims have sources`,
        details: 'Critical issue: Factual claims lack source attribution',
      });

      this.recommendations.push({
        priority: 'high',
        action: 'Add source citations for all factual/verifiable claims',
        estimatedEffort: '2-4 hours',
        impact: 'Increases credibility and reduces hallucination risk',
      });
    }

    return {
      score,
      weight: 0.3,
      status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'needs-work' : 'critical',
      details: `${sourcedClaims}/${verifiableTotal} verifiable claims have sources (${Math.round((sourcedClaims / verifiableTotal) * 100)}%)`,
    };
  }

  private async auditFactVerification(
    strategy: BrandStrategy,
    options: AuditOptions
  ): Promise<ScoreDimension> {
    // For now, basic check - in full version, use fact-checker-enhanced.ts
    const claims = this.extractClaims(strategy);
    const verifiableClaims = claims.filter(c => this.isVerifiable(c.text));

    const score = verifiableClaims.length > 0 ? 6 : 8; // Lower if has unverifiable claims

    if (verifiableClaims.length > 0) {
      this.findings.push({
        severity: 'warning',
        category: 'facts',
        message: `${verifiableClaims.length} claims need fact-checking`,
        details: 'Statistical or specific claims should be verified with sources',
      });
    }

    return {
      score,
      weight: 0.25,
      status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : 'needs-work',
      details: `${verifiableClaims.length} claims require verification`,
    };
  }

  private async auditDataRecency(
    strategy: BrandStrategy,
    options: AuditOptions
  ): Promise<ScoreDimension> {
    // Check if sources have dates
    const claims = this.extractClaims(strategy);
    const datedSources = claims.filter(c => c.date).length;

    if (datedSources === 0 && claims.length > 0) {
      this.findings.push({
        severity: 'info',
        category: 'recency',
        message: 'No source dates found - cannot assess data recency',
      });
    }

    return {
      score: datedSources > 0 ? 7 : 5,
      weight: 0.15,
      status: datedSources > 0 ? 'good' : 'needs-work',
      details: `${datedSources} sources have publication dates`,
    };
  }

  private async auditCrossVerification(
    strategy: BrandStrategy,
    options: AuditOptions
  ): Promise<ScoreDimension> {
    // Check if claims have multiple sources
    const claims = this.extractClaims(strategy);
    const multiSourceClaims = claims.filter(c => {
      if (Array.isArray(c.source)) return c.source.length >= 2;
      return false;
    }).length;

    if (multiSourceClaims < claims.length * 0.3) {
      this.recommendations.push({
        priority: 'medium',
        action: 'Add multiple sources for key claims (cross-verification)',
        estimatedEffort: '3-5 hours',
        impact: 'Reduces hallucination risk and increases confidence',
      });
    }

    const score = claims.length > 0 ? (multiSourceClaims / claims.length) * 10 : 5;

    return {
      score,
      weight: 0.15,
      status: score >= 7 ? 'good' : score >= 4 ? 'needs-work' : 'critical',
      details: `${multiSourceClaims}/${claims.length} claims cross-verified`,
    };
  }

  private async auditProductionReadiness(strategy: BrandStrategy): Promise<ScoreDimension> {
    const issues: string[] = [];

    // Check completeness (support both flat and nested structures)
    const purpose = strategy.purpose || (strategy as any).foundation?.purpose;
    const mission = strategy.mission || (strategy as any).foundation?.mission;
    const vision = strategy.vision || (strategy as any).foundation?.vision;
    const values = strategy.values || (strategy as any).foundation?.values;
    const positioning = strategy.positioning ||
                       (strategy as any).positioning?.marketPosition ||
                       (strategy as any).positioning?.targetAudience;

    if (!purpose) issues.push('Missing purpose statement');
    if (!mission) issues.push('Missing mission statement');
    if (!vision) issues.push('Missing vision statement');
    if (!values || (Array.isArray(values) && values.length === 0)) {
      issues.push('Missing core values');
    }
    if (!positioning) issues.push('Missing positioning statement');

    const completeness = (5 - issues.length) / 5;
    const score = completeness * 10;

    if (issues.length > 0) {
      this.findings.push({
        severity: issues.length > 2 ? 'critical' : 'warning',
        category: 'quality',
        message: `Incomplete strategy: ${issues.join(', ')}`,
      });
    }

    return {
      score,
      weight: 0.15,
      status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : 'needs-work',
      details: `${5 - issues.length}/5 core components present`,
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

  private extractClaims(strategy: BrandStrategy): Array<{
    text: string;
    source?: string | string[];
    sourceUrl?: string;
    date?: string;
    location: string;
  }> {
    const claims: any[] = [];

    // Extract from proof points (support both flat and nested structures)
    const proofPoints = strategy.proofPoints ||
                        (strategy as any).positioning?.proofPoints ||
                        [];

    if (proofPoints.length > 0) {
      proofPoints.forEach((pp: any, i: number) => {
        // Handle both object format and string format
        if (typeof pp === 'string') {
          // Parse string format: "claim text (Source: source info, Confidence: X/10)"
          const sourceMatch = pp.match(/\(Source:\s*(.+?)(?:,\s*Confidence:\s*\d+\/10)?\)/i);
          const text = sourceMatch ? pp.substring(0, sourceMatch.index).trim() : pp;
          let source = sourceMatch ? sourceMatch[1].trim() : undefined;

          // Check if source contains multiple sources (comma-separated)
          if (source && source.includes(',')) {
            const sources = source.split(',').map(s => s.trim()).filter(s => s.length > 0);
            source = sources.length > 1 ? sources as any : sources[0];
          }

          claims.push({
            text,
            source,
            sourceUrl: undefined,
            location: `proofPoints[${i}]`,
          });
        } else {
          // Handle object format
          claims.push({
            text: pp.claim || pp,
            source: pp.source,
            sourceUrl: pp.sourceUrl,
            location: `proofPoints[${i}]`,
          });
        }
      });
    }

    // Extract from differentiators (support both flat and nested structures)
    const differentiators = strategy.differentiators ||
                           (strategy as any).positioning?.differentiation ||
                           (strategy as any).positioning?.differentiators ||
                           [];

    if (differentiators.length > 0) {
      differentiators.forEach((diff: any, i: number) => {
        claims.push({
          text: typeof diff === 'string' ? diff : diff.claim || diff.text,
          source: typeof diff === 'object' ? diff.source : undefined,
          location: `differentiators[${i}]`,
        });
      });
    }

    // Extract from key messages (support both flat and nested structures)
    const keyMessages = strategy.keyMessages ||
                       (strategy as any).messagingFramework?.keyMessages ||
                       [];

    if (keyMessages.length > 0) {
      keyMessages.forEach((msg: any, i: number) => {
        claims.push({
          text: typeof msg === 'string' ? msg : msg.message || msg.text,
          source: typeof msg === 'object' ? msg.source : undefined,
          location: `keyMessages[${i}]`,
        });
      });
    }

    return claims;
  }

  private isVerifiable(text: string): boolean {
    // Check if text contains numbers, percentages, or specific claims
    return /\d+%|\$\d+|#\d+|\d+x|CAGR|market size|revenue/i.test(text);
  }

  private generateImprovementPlan(
    currentScore: number,
    recommendations: Recommendation[]
  ) {
    const targetScore = Math.min(10, currentScore + 2);
    const highPriority = recommendations.filter(r => r.priority === 'high');
    const mediumPriority = recommendations.filter(r => r.priority === 'medium');

    const steps = [
      ...highPriority.map((r, i) => ({
        step: i + 1,
        action: r.action,
        expectedImprovement: 0.5,
        estimatedTime: r.estimatedEffort,
      })),
      ...mediumPriority.slice(0, 2).map((r, i) => ({
        step: highPriority.length + i + 1,
        action: r.action,
        expectedImprovement: 0.3,
        estimatedTime: r.estimatedEffort,
      })),
    ];

    return {
      currentScore,
      targetScore,
      steps,
      totalEffort: '8-14 hours',
      requiredExpertise: currentScore < 6 ? 'Senior strategist' : 'Mid-level analyst',
    };
  }

  private detectStructureType(strategy: BrandStrategy): string {
    // Check for nested structure indicators
    const hasFoundation = !!(strategy as any).foundation;
    const hasMessagingFramework = !!(strategy as any).messagingFramework;
    const hasNestedPositioning = !!(strategy as any).positioning?.proofPoints ||
                                 !!(strategy as any).positioning?.differentiation;

    if (hasFoundation || hasMessagingFramework || hasNestedPositioning) {
      return 'nested (Horizon format)';
    }

    // Check for flat structure indicators
    const hasDirectFields = !!strategy.purpose || !!strategy.mission || !!strategy.vision;
    if (hasDirectFields) {
      return 'flat (legacy format)';
    }

    return 'unknown';
  }
}
