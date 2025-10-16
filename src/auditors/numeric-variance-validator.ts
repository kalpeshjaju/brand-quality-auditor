// Numeric Variance Validator
// Validates numeric claims across multiple sources to detect inconsistencies

import type { FactTriple } from './fact-triple-extractor.js';

export interface NumericClaim {
  value: number;
  source: string;
  sourceUrl?: string;
  confidence: number;
  context: string;
  extractedFrom: string;
  date?: string;
}

export interface VarianceResult {
  claim: string;
  values: number[];
  sources: string[];
  mean: number;
  variance: number;
  standardDeviation: number;
  relativeError: number;
  isValid: boolean;
  flaggedClaims: NumericClaim[];
  recommendation: string;
}

export interface ValidationReport {
  totalClaims: number;
  validatedClaims: number;
  flaggedClaims: number;
  averageVariance: number;
  results: VarianceResult[];
  summary: string;
}

export class NumericVarianceValidator {
  private readonly VARIANCE_THRESHOLD = 0.10; // 10% relative error threshold
  private readonly MINIMUM_SOURCES = 2; // Minimum sources for cross-verification

  /**
   * Validate numeric claims across multiple sources
   */
  validateCrossSource(claimsMap: Map<string, NumericClaim[]>): ValidationReport {
    const results: VarianceResult[] = [];
    let totalClaims = 0;
    let validatedClaims = 0;
    let flaggedClaims = 0;

    for (const [claimKey, claims] of claimsMap) {
      totalClaims++;

      if (claims.length < this.MINIMUM_SOURCES) {
        // Not enough sources for cross-verification
        results.push(this.createSingleSourceResult(claimKey, claims));
        continue;
      }

      validatedClaims++;
      const result = this.analyzeVariance(claimKey, claims);

      if (!result.isValid) {
        flaggedClaims++;
      }

      results.push(result);
    }

    const averageVariance = results
      .filter(r => r.variance !== undefined)
      .reduce((sum, r) => sum + r.relativeError, 0) / (validatedClaims || 1);

    return {
      totalClaims,
      validatedClaims,
      flaggedClaims,
      averageVariance,
      results,
      summary: this.generateSummary(totalClaims, validatedClaims, flaggedClaims, averageVariance),
    };
  }

  /**
   * Analyze variance for a specific claim across sources
   */
  private analyzeVariance(claim: string, sources: NumericClaim[]): VarianceResult {
    const values = sources.map(s => s.value);
    const sourceNames = sources.map(s => s.source);

    // Calculate statistics
    const mean = this.calculateMean(values);
    const variance = this.calculateVariance(values);
    const standardDeviation = Math.sqrt(variance);
    const relativeError = mean !== 0 ? standardDeviation / Math.abs(mean) : 0;

    // Flag claims with high variance
    const isValid = relativeError <= this.VARIANCE_THRESHOLD;
    const flaggedClaims = this.identifyOutliers(sources, mean, standardDeviation);

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      relativeError,
      flaggedClaims,
      sources
    );

    return {
      claim,
      values,
      sources: sourceNames,
      mean,
      variance,
      standardDeviation,
      relativeError,
      isValid,
      flaggedClaims,
      recommendation,
    };
  }

  /**
   * Calculate mean of numeric values
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate variance of numeric values
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = this.calculateMean(values);
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    return this.calculateMean(squaredDifferences);
  }

  /**
   * Identify outlier claims using z-score method
   */
  private identifyOutliers(
    claims: NumericClaim[],
    mean: number,
    stdDev: number
  ): NumericClaim[] {
    if (stdDev === 0) return [];

    const outliers: NumericClaim[] = [];
    const Z_SCORE_THRESHOLD = 2; // Claims more than 2 std devs from mean

    for (const claim of claims) {
      const zScore = Math.abs((claim.value - mean) / stdDev);
      if (zScore > Z_SCORE_THRESHOLD) {
        outliers.push(claim);
      }
    }

    return outliers;
  }

  /**
   * Generate recommendation based on variance analysis
   */
  private generateRecommendation(
    relativeError: number,
    flaggedClaims: NumericClaim[],
    allClaims: NumericClaim[]
  ): string {
    if (relativeError < 0.05) {
      return 'Claims are highly consistent across sources. No action needed.';
    } else if (relativeError < this.VARIANCE_THRESHOLD) {
      return 'Minor variance detected but within acceptable range. Consider noting the range in documentation.';
    } else if (relativeError < 0.25) {
      return `Significant variance detected (${(relativeError * 100).toFixed(1)}%). Verify with primary sources and use the most authoritative value.`;
    } else {
      const outlierSources = flaggedClaims.map(c => c.source).join(', ');
      return `High variance detected (${(relativeError * 100).toFixed(1)}%). ` +
        `Review sources: ${outlierSources}. Consider removing outliers or investigating discrepancies.`;
    }
  }

  /**
   * Handle single-source claims
   */
  private createSingleSourceResult(claim: string, sources: NumericClaim[]): VarianceResult {
    return {
      claim,
      values: sources.map(s => s.value),
      sources: sources.map(s => s.source),
      mean: sources[0]?.value || 0,
      variance: 0,
      standardDeviation: 0,
      relativeError: 0,
      isValid: false,
      flaggedClaims: sources,
      recommendation: 'Only one source available. Seek additional sources for cross-verification.',
    };
  }

  /**
   * Generate summary of validation results
   */
  private generateSummary(
    total: number,
    validated: number,
    flagged: number,
    avgVariance: number
  ): string {
    const validationRate = total > 0 ? (validated / total * 100).toFixed(1) : '0';
    const flagRate = validated > 0 ? (flagged / validated * 100).toFixed(1) : '0';

    return `Analyzed ${total} numeric claims. ` +
      `${validated} (${validationRate}%) had multiple sources for cross-verification. ` +
      `${flagged} (${flagRate}% of validated) showed significant variance. ` +
      `Average relative error: ${(avgVariance * 100).toFixed(1)}%.`;
  }

  /**
   * Extract numeric claims from fact triples
   */
  extractNumericClaims(triples: FactTriple[]): Map<string, NumericClaim[]> {
    const claimsMap = new Map<string, NumericClaim[]>();

    for (const triple of triples) {
      if (triple.type === 'numeric' && typeof triple.value === 'number') {
        // Create claim key for grouping
        const claimKey = `${triple.subject}_${triple.predicate}`.toLowerCase();

        if (!claimsMap.has(claimKey)) {
          claimsMap.set(claimKey, []);
        }

        const claim: NumericClaim = {
          value: triple.value,
          source: 'extracted',
          confidence: triple.confidence,
          context: triple.sourceText,
          extractedFrom: triple.sourceText,
        };

        claimsMap.get(claimKey)!.push(claim);
      }
    }

    return claimsMap;
  }

  /**
   * Compare claim with external sources
   */
  async verifyWithExternalSources(
    claim: NumericClaim,
    externalSources: NumericClaim[]
  ): Promise<{
    isConsistent: boolean;
    variance: number;
    details: string;
  }> {
    const allValues = [claim.value, ...externalSources.map(s => s.value)];
    const mean = this.calculateMean(allValues);
    const variance = this.calculateVariance(allValues);
    const relativeError = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 0;

    return {
      isConsistent: relativeError <= this.VARIANCE_THRESHOLD,
      variance: relativeError,
      details: `Claim value: ${claim.value}, External average: ${mean.toFixed(2)}, Relative error: ${(relativeError * 100).toFixed(1)}%`,
    };
  }

  /**
   * Format validation report for output
   */
  formatReport(report: ValidationReport): string {
    const lines: string[] = [
      '# Numeric Variance Validation Report\n',
      report.summary,
      '\n## Flagged Claims\n',
    ];

    const flaggedResults = report.results.filter(r => !r.isValid);

    if (flaggedResults.length === 0) {
      lines.push('✅ No significant variances detected.\n');
    } else {
      for (const result of flaggedResults) {
        lines.push(`### ${result.claim}`);
        lines.push(`- **Values**: ${result.values.join(', ')}`);
        lines.push(`- **Sources**: ${result.sources.join(', ')}`);
        lines.push(`- **Mean**: ${result.mean.toFixed(2)}`);
        lines.push(`- **Relative Error**: ${(result.relativeError * 100).toFixed(1)}%`);
        lines.push(`- **Recommendation**: ${result.recommendation}\n`);
      }
    }

    lines.push('## All Claims\n');

    for (const result of report.results) {
      const status = result.isValid ? '✅' : '⚠️';
      lines.push(`${status} **${result.claim}**: ${result.values.join(', ')} (Error: ${(result.relativeError * 100).toFixed(1)}%)`);
    }

    return lines.join('\n');
  }

  /**
   * Group claims by similarity for comparison
   */
  groupSimilarClaims(claims: NumericClaim[], similarityThreshold = 0.8): NumericClaim[][] {
    const groups: NumericClaim[][] = [];

    for (const claim of claims) {
      let addedToGroup = false;

      for (const group of groups) {
        if (this.areSimilar(claim, group[0], similarityThreshold)) {
          group.push(claim);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.push([claim]);
      }
    }

    return groups;
  }

  /**
   * Check if two claims are similar enough to compare
   */
  private areSimilar(claim1: NumericClaim, claim2: NumericClaim, threshold: number): boolean {
    // Simple similarity check based on context overlap
    const words1 = new Set(claim1.context.toLowerCase().split(/\s+/));
    const words2 = new Set(claim2.context.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const similarity = intersection.size / union.size;
    return similarity >= threshold;
  }

  /**
   * Calculate confidence-weighted mean
   */
  calculateWeightedMean(claims: NumericClaim[]): number {
    if (claims.length === 0) return 0;

    const weightedSum = claims.reduce((sum, claim) =>
      sum + (claim.value * claim.confidence), 0
    );
    const totalWeight = claims.reduce((sum, claim) =>
      sum + claim.confidence, 0
    );

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
}