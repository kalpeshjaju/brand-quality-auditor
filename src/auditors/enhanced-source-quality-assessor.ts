// Enhanced Source Quality Assessor
// Implements detailed tiering rules for source credibility assessment

export interface SourceTierRule {
  pattern?: RegExp;
  domains?: string[];
  type?: string;
  indicators?: string[];
  weight: number;
  description: string;
}

export interface SourceAssessment {
  url?: string;
  domain?: string;
  tier: number;
  score: number;
  confidence: number;
  matchedRules: string[];
  issues: string[];
  recommendation: string;
}

export interface TierConfiguration {
  tier1: SourceTierRule[];
  tier2: SourceTierRule[];
  tier3: SourceTierRule[];
  tier4: SourceTierRule[];
}

export class EnhancedSourceQualityAssessor {
  private tierRules: TierConfiguration;

  constructor() {
    this.tierRules = this.initializeTierRules();
  }

  private initializeTierRules(): TierConfiguration {
    return {
      // Tier 1: Highest credibility sources
      tier1: [
        {
          pattern: /\.gov$/i,
          weight: 1.0,
          description: 'Government domain'
        },
        {
          pattern: /\.edu$/i,
          weight: 0.95,
          description: 'Educational institution'
        },
        {
          pattern: /doi\.org/i,
          weight: 1.0,
          description: 'DOI (Digital Object Identifier) - peer-reviewed'
        },
        {
          pattern: /pubmed|ncbi\.nlm\.nih\.gov/i,
          weight: 1.0,
          description: 'PubMed/NCBI - medical research'
        },
        {
          domains: [
            'nature.com',
            'science.org',
            'ieee.org',
            'acm.org',
            'springer.com',
            'elsevier.com',
            'wiley.com'
          ],
          weight: 0.95,
          description: 'Academic publisher'
        },
        {
          type: 'peer-reviewed',
          weight: 1.0,
          description: 'Peer-reviewed publication'
        },
        {
          type: 'official-report',
          weight: 0.95,
          description: 'Official institutional report'
        },
        {
          indicators: ['ISBN', 'ISSN', 'peer review', 'journal'],
          weight: 0.9,
          description: 'Academic publication indicators'
        },
        {
          domains: [
            'who.int',
            'un.org',
            'worldbank.org',
            'imf.org',
            'oecd.org'
          ],
          weight: 0.95,
          description: 'International organization'
        }
      ],

      // Tier 2: Reputable business and news sources
      tier2: [
        {
          domains: [
            'wsj.com',
            'ft.com',
            'bloomberg.com',
            'reuters.com',
            'economist.com',
            'businessweek.com',
            'forbes.com',
            'fortune.com'
          ],
          weight: 0.75,
          description: 'Premium business publication'
        },
        {
          domains: [
            'nytimes.com',
            'washingtonpost.com',
            'theguardian.com',
            'bbc.com',
            'npr.org',
            'apnews.com',
            'cnn.com'
          ],
          weight: 0.7,
          description: 'Major news outlet'
        },
        {
          domains: [
            'mckinsey.com',
            'bcg.com',
            'bain.com',
            'deloitte.com',
            'pwc.com',
            'ey.com',
            'kpmg.com',
            'accenture.com'
          ],
          weight: 0.75,
          description: 'Top consulting firm'
        },
        {
          domains: [
            'gartner.com',
            'forrester.com',
            'idc.com',
            'statista.com',
            'emarketer.com'
          ],
          weight: 0.7,
          description: 'Research/analytics firm'
        },
        {
          type: 'industry-report',
          weight: 0.65,
          description: 'Industry research report'
        },
        {
          type: 'case-study',
          weight: 0.6,
          description: 'Documented case study'
        },
        {
          indicators: ['survey', 'study', 'research', 'analysis'],
          weight: 0.6,
          description: 'Research indicators'
        }
      ],

      // Tier 3: General business sources
      tier3: [
        {
          type: 'whitepaper',
          weight: 0.5,
          description: 'Company whitepaper'
        },
        {
          type: 'blog',
          weight: 0.4,
          description: 'Professional blog'
        },
        {
          domains: [
            'medium.com',
            'substack.com',
            'wordpress.com',
            'blogspot.com'
          ],
          weight: 0.35,
          description: 'Blog platform'
        },
        {
          type: 'press-release',
          weight: 0.45,
          description: 'Company press release'
        },
        {
          type: 'company-website',
          weight: 0.4,
          description: 'Company website'
        },
        {
          domains: [
            'wikipedia.org'
          ],
          weight: 0.45,
          description: 'Crowdsourced encyclopedia'
        },
        {
          indicators: ['opinion', 'perspective', 'thoughts', 'believe'],
          weight: 0.35,
          description: 'Opinion piece'
        },
        {
          type: 'trade-publication',
          weight: 0.5,
          description: 'Industry trade publication'
        }
      ],

      // Tier 4: Low credibility sources
      tier4: [
        {
          type: 'social-media',
          weight: 0.2,
          description: 'Social media post'
        },
        {
          domains: [
            'facebook.com',
            'twitter.com',
            'x.com',
            'instagram.com',
            'tiktok.com',
            'reddit.com'
          ],
          weight: 0.2,
          description: 'Social media platform'
        },
        {
          type: 'forum',
          weight: 0.25,
          description: 'Discussion forum'
        },
        {
          type: 'user-generated',
          weight: 0.2,
          description: 'User-generated content'
        },
        {
          indicators: ['rumor', 'allegedly', 'unconfirmed', 'speculation'],
          weight: 0.15,
          description: 'Unverified content'
        },
        {
          pattern: /\.(tk|ml|ga|cf)$/i,
          weight: 0.1,
          description: 'Free/suspicious domain'
        },
        {
          type: 'anonymous',
          weight: 0.1,
          description: 'Anonymous source'
        }
      ]
    };
  }

  /**
   * Assess the quality and tier of a source
   */
  assessSource(source: {
    url?: string;
    type?: string;
    content?: string;
    metadata?: Record<string, any>;
  }): SourceAssessment {
    const assessment: SourceAssessment = {
      url: source.url,
      domain: this.extractDomain(source.url),
      tier: 4, // Default to lowest tier
      score: 0.2,
      confidence: 0.5,
      matchedRules: [],
      issues: [],
      recommendation: ''
    };

    // Check each tier's rules
    for (let tier = 1; tier <= 4; tier++) {
      const tierKey = `tier${tier}` as keyof TierConfiguration;
      const rules = this.tierRules[tierKey];
      const matches = this.checkTierRules(source, rules);

      if (matches.length > 0) {
        assessment.tier = tier;
        assessment.score = this.calculateTierScore(matches);
        assessment.matchedRules = matches.map(m => m.description);
        assessment.confidence = this.calculateConfidence(matches, source);
        break; // Stop at first matching tier
      }
    }

    // Identify issues
    assessment.issues = this.identifySourceIssues(source, assessment);

    // Generate recommendation
    assessment.recommendation = this.generateRecommendation(assessment);

    return assessment;
  }

  /**
   * Check if source matches tier rules
   */
  private checkTierRules(
    source: any,
    rules: SourceTierRule[]
  ): SourceTierRule[] {
    const matches: SourceTierRule[] = [];

    for (const rule of rules) {
      let isMatch = false;

      // Check URL pattern
      if (rule.pattern && source.url) {
        isMatch = rule.pattern.test(source.url);
      }

      // Check domains
      if (rule.domains && source.url) {
        const domain = this.extractDomain(source.url);
        isMatch = isMatch || rule.domains.some(d =>
          domain?.includes(d)
        );
      }

      // Check type
      if (rule.type && source.type) {
        isMatch = isMatch || source.type === rule.type;
      }

      // Check content indicators
      if (rule.indicators && source.content) {
        const contentLower = source.content.toLowerCase();
        isMatch = isMatch || rule.indicators.some(indicator =>
          contentLower.includes(indicator.toLowerCase())
        );
      }

      if (isMatch) {
        matches.push(rule);
      }
    }

    return matches;
  }

  /**
   * Calculate tier score based on matched rules
   */
  private calculateTierScore(matches: SourceTierRule[]): number {
    if (matches.length === 0) return 0.2;

    // Use highest weight among matches
    const maxWeight = Math.max(...matches.map(m => m.weight));

    // Bonus for multiple rule matches
    const multiMatchBonus = Math.min(0.1, (matches.length - 1) * 0.02);

    return Math.min(1.0, maxWeight + multiMatchBonus);
  }

  /**
   * Calculate confidence in the assessment
   */
  private calculateConfidence(
    matches: SourceTierRule[],
    source: any
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence with URL
    if (source.url) confidence += 0.2;

    // Higher confidence with multiple matches
    if (matches.length > 1) confidence += 0.15;

    // Higher confidence with explicit type
    if (source.type) confidence += 0.1;

    // Lower confidence without metadata
    if (!source.metadata || Object.keys(source.metadata).length === 0) {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Identify potential issues with the source
   */
  private identifySourceIssues(
    source: any,
    assessment: SourceAssessment
  ): string[] {
    const issues: string[] = [];

    // Check for missing URL
    if (!source.url) {
      issues.push('No URL provided for verification');
    }

    // Check for low tier
    if (assessment.tier >= 3) {
      issues.push(`Low credibility tier (Tier ${assessment.tier})`);
    }

    // Check for suspicious patterns
    if (source.url) {
      if (/bit\.ly|tinyurl|short\.link/i.test(source.url)) {
        issues.push('URL shortener detected - original source unclear');
      }

      if (/\?utm_|&campaign=/i.test(source.url)) {
        issues.push('Marketing tracking parameters in URL');
      }

      if (!/^https:\/\//i.test(source.url)) {
        issues.push('Non-HTTPS URL - potential security concern');
      }
    }

    // Check for age (if metadata available)
    if (source.metadata?.publishDate) {
      const age = this.calculateSourceAge(source.metadata.publishDate);
      if (age > 730) { // More than 2 years
        issues.push(`Source is ${Math.floor(age / 365)} years old`);
      }
    }

    // Check for bias indicators
    if (source.content) {
      const biasIndicators = [
        'sponsored', 'advertisement', 'promoted',
        'affiliate', 'partner content'
      ];

      const contentLower = source.content.toLowerCase();
      for (const indicator of biasIndicators) {
        if (contentLower.includes(indicator)) {
          issues.push(`Potential bias: contains "${indicator}"`);
          break;
        }
      }
    }

    return issues;
  }

  /**
   * Generate recommendation based on assessment
   */
  private generateRecommendation(assessment: SourceAssessment): string {
    switch (assessment.tier) {
      case 1:
        return 'Excellent source. Use with high confidence.';

      case 2:
        if (assessment.issues.length === 0) {
          return 'Good source. Suitable for business documentation.';
        } else {
          return `Good source but note: ${assessment.issues[0]}`;
        }

      case 3:
        return 'Moderate credibility. Verify claims with additional sources.';

      case 4:
        return 'Low credibility. Should not be primary source. Find authoritative alternatives.';

      default:
        return 'Unable to assess. Treat with caution.';
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url?: string): string | undefined {
    if (!url) return undefined;

    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      // Try basic extraction
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\?]+)/i);
      return match ? match[1].toLowerCase() : undefined;
    }
  }

  /**
   * Calculate source age in days
   */
  private calculateSourceAge(publishDate: string): number {
    try {
      const published = new Date(publishDate);
      const now = new Date();
      const diffMs = now.getTime() - published.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  /**
   * Batch assess multiple sources
   */
  assessMultipleSources(sources: any[]): {
    assessments: SourceAssessment[];
    summary: {
      averageTier: number;
      averageScore: number;
      tier1Count: number;
      tier2Count: number;
      tier3Count: number;
      tier4Count: number;
      recommendations: string[];
    };
  } {
    const assessments = sources.map(s => this.assessSource(s));

    const tierCounts = [0, 0, 0, 0, 0]; // Index 0 unused, 1-4 for tiers
    let totalScore = 0;

    for (const assessment of assessments) {
      tierCounts[assessment.tier]++;
      totalScore += assessment.score;
    }

    const averageTier = assessments.reduce((sum, a) => sum + a.tier, 0) / assessments.length;
    const averageScore = totalScore / assessments.length;

    const recommendations: string[] = [];

    // Generate overall recommendations
    if (tierCounts[4] > assessments.length * 0.3) {
      recommendations.push('High proportion of low-credibility sources. Seek more authoritative references.');
    }

    if (tierCounts[1] < assessments.length * 0.2) {
      recommendations.push('Limited high-credibility sources. Add peer-reviewed or official sources.');
    }

    if (averageTier > 2.5) {
      recommendations.push('Overall source quality below recommended threshold. Upgrade sources.');
    }

    return {
      assessments,
      summary: {
        averageTier,
        averageScore,
        tier1Count: tierCounts[1],
        tier2Count: tierCounts[2],
        tier3Count: tierCounts[3],
        tier4Count: tierCounts[4],
        recommendations
      }
    };
  }

  /**
   * Format assessment report
   */
  formatAssessmentReport(assessment: SourceAssessment): string {
    const tierLabels = ['', 'Excellent', 'Good', 'Moderate', 'Poor'];
    const lines: string[] = [];

    lines.push(`## Source Assessment\n`);
    lines.push(`- **URL**: ${assessment.url || 'Not provided'}`);
    lines.push(`- **Domain**: ${assessment.domain || 'N/A'}`);
    lines.push(`- **Tier**: ${assessment.tier} (${tierLabels[assessment.tier]})`);
    lines.push(`- **Score**: ${(assessment.score * 100).toFixed(0)}%`);
    lines.push(`- **Confidence**: ${(assessment.confidence * 100).toFixed(0)}%\n`);

    if (assessment.matchedRules.length > 0) {
      lines.push(`### Matched Criteria`);
      for (const rule of assessment.matchedRules) {
        lines.push(`- ${rule}`);
      }
      lines.push('');
    }

    if (assessment.issues.length > 0) {
      lines.push(`### ⚠️ Issues`);
      for (const issue of assessment.issues) {
        lines.push(`- ${issue}`);
      }
      lines.push('');
    }

    lines.push(`### Recommendation`);
    lines.push(assessment.recommendation);

    return lines.join('\n');
  }
}