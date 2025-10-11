// Source Quality Assessment - Intelligent source ranking and credibility analysis
// Version 2.0 - Enhanced

import type { LLMAdapter } from '../adapters/llm-interface.js';

export type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'unknown';
export type SourceType = 'academic' | 'industry_report' | 'government' | 'news' | 'company' | 'blog' | 'social_media' | 'unknown';

export interface SourceQualityScore {
  url: string;
  domain: string;
  overallScore: number; // 0-100
  tier: SourceTier;
  type: SourceType;
  credibilityFactors: {
    authorityScore: number; // 0-100
    recencyScore: number; // 0-100
    methodologyScore: number; // 0-100
    reputationScore: number; // 0-100
    relevanceScore: number; // 0-100
  };
  publicationDate?: string;
  ageInDays?: number;
  isRecent: boolean; // < 6 months
  isCurrent: boolean; // < 1 year
  author?: string;
  methodology?: string;
  limitations?: string[];
  recommendedUse: 'primary' | 'supporting' | 'context' | 'avoid';
  reasoning: string;
}

export class SourceQualityAssessor {
  private llm: LLMAdapter;
  private systemDate: Date;

  // Authoritative domains by category
  private tier1Domains = [
    // Academic & Research
    'sciencedirect.com', 'springer.com', 'nature.com', 'ieee.org', 'acm.org',
    'jstor.org', 'researchgate.net', 'scholar.google.com',
    // Top Industry Research
    'mckinsey.com', 'bcg.com', 'bain.com', 'deloitte.com', 'pwc.com',
    'gartner.com', 'forrester.com', 'idc.com',
    // Government & Official Stats
    'gov.in', 'worldbank.org', 'imf.org', 'oecd.org', 'un.org',
  ];

  private tier2Domains = [
    // Reputable Market Research
    'statista.com', 'mordorintelligence.com', 'grandviewresearch.com',
    'marketsandmarkets.com', 'researchandmarkets.com',
    // Business News
    'bloomberg.com', 'reuters.com', 'wsj.com', 'ft.com', 'economist.com',
    // Industry Publications
    'techcrunch.com', 'theverge.com', 'wired.com',
    // Financial
    'morningstar.com', 'seekingalpha.com',
  ];

  private tier3Domains = [
    // General News
    'nytimes.com', 'washingtonpost.com', 'theguardian.com', 'bbc.com',
    // Business Media
    'forbes.com', 'businessinsider.com', 'inc.com', 'fastcompany.com',
    // Industry Blogs (reputable)
    'hbr.org', 'sloanreview.mit.edu',
  ];

  constructor(llm: LLMAdapter) {
    this.llm = llm;
    this.systemDate = new Date('2025-10-10'); // System date awareness
  }

  async assessSource(url: string, content?: string): Promise<SourceQualityScore> {
    console.log(`\n📊 Assessing source quality: ${url}\n`);

    const domain = this.extractDomain(url);
    const tier = this.determineSourceTier(domain);
    const type = this.determineSourceType(url, content);

    // Extract publication date if available
    const publicationDate = content ? await this.extractPublicationDate(content) : undefined;
    const ageInDays = publicationDate ? this.calculateAgeInDays(publicationDate) : undefined;

    // Calculate individual factor scores
    const authorityScore = this.calculateAuthorityScore(tier, type);
    const recencyScore = this.calculateRecencyScore(ageInDays);
    const reputationScore = this.calculateReputationScore(domain, tier);

    // Use LLM to assess methodology and relevance if content available
    let methodologyScore = 50; // Default
    let relevanceScore = 50; // Default
    let methodology: string | undefined;
    let limitations: string[] | undefined;

    if (content) {
      const llmAssessment = await this.assessContentQuality(url, content);
      methodologyScore = llmAssessment.methodologyScore;
      relevanceScore = llmAssessment.relevanceScore;
      methodology = llmAssessment.methodology;
      limitations = llmAssessment.limitations;
    }

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore({
      authorityScore,
      recencyScore,
      methodologyScore,
      reputationScore,
      relevanceScore,
    });

    // Determine recommended use
    const recommendedUse = this.determineRecommendedUse(overallScore, tier, ageInDays);

    // Generate reasoning
    const reasoning = this.generateReasoning({
      tier,
      type,
      overallScore,
      ageInDays,
      domain,
    });

    return {
      url,
      domain,
      overallScore,
      tier,
      type,
      credibilityFactors: {
        authorityScore,
        recencyScore,
        methodologyScore,
        reputationScore,
        relevanceScore,
      },
      publicationDate,
      ageInDays,
      isRecent: ageInDays ? ageInDays < 180 : false, // < 6 months
      isCurrent: ageInDays ? ageInDays < 365 : false, // < 1 year
      methodology,
      limitations,
      recommendedUse,
      reasoning,
    };
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  private determineSourceTier(domain: string): SourceTier {
    if (this.tier1Domains.some(d => domain.includes(d))) return 'tier1';
    if (this.tier2Domains.some(d => domain.includes(d))) return 'tier2';
    if (this.tier3Domains.some(d => domain.includes(d))) return 'tier3';

    // Check for known low-quality patterns
    if (domain.includes('blog') || domain.includes('medium.com')) return 'tier4';

    return 'unknown';
  }

  private determineSourceType(url: string, content?: string): SourceType {
    const domain = this.extractDomain(url);

    // Academic
    if (domain.includes('edu') || domain.includes('scholar') || domain.includes('research')) {
      return 'academic';
    }

    // Government
    if (domain.includes('gov')) {
      return 'government';
    }

    // Industry reports
    if (domain.includes('intelligence') || domain.includes('markets') ||
        domain.includes('gartner') || domain.includes('forrester')) {
      return 'industry_report';
    }

    // News
    if (domain.includes('news') || this.tier2Domains.some(d => d.includes(domain) &&
        (d.includes('bloomberg') || d.includes('reuters') || d.includes('wsj')))) {
      return 'news';
    }

    // Blog/Social
    if (domain.includes('blog') || domain.includes('medium') ||
        domain.includes('twitter') || domain.includes('linkedin')) {
      return domain.includes('linkedin') || domain.includes('twitter') ? 'social_media' : 'blog';
    }

    // Company website
    if (url.includes('/about') || url.includes('/company')) {
      return 'company';
    }

    return 'unknown';
  }

  private async extractPublicationDate(content: string): Promise<string | undefined> {
    // Try to extract publication date from content
    // Look for common date patterns

    const datePatterns = [
      /published[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /(\d{4}-\d{2}-\d{2})/,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i,
    ];

    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return undefined;
  }

  private calculateAgeInDays(publicationDate: string): number {
    try {
      const pubDate = new Date(publicationDate);
      const diffTime = this.systemDate.getTime() - pubDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays : 0;
    } catch {
      return 9999; // Very old/unknown
    }
  }

  private calculateAuthorityScore(tier: SourceTier, type: SourceType): number {
    const tierScores: Record<SourceTier, number> = {
      tier1: 95,
      tier2: 80,
      tier3: 65,
      tier4: 40,
      unknown: 30,
    };

    const typeBonus: Record<SourceType, number> = {
      academic: 10,
      government: 10,
      industry_report: 5,
      news: 0,
      company: -5,
      blog: -15,
      social_media: -20,
      unknown: -10,
    };

    return Math.min(100, Math.max(0, tierScores[tier] + typeBonus[type]));
  }

  private calculateRecencyScore(ageInDays?: number): number {
    if (!ageInDays) return 30; // Unknown date = low score

    // Scoring based on age
    if (ageInDays < 90) return 100; // < 3 months = perfect
    if (ageInDays < 180) return 90; // < 6 months = excellent
    if (ageInDays < 365) return 75; // < 1 year = good
    if (ageInDays < 730) return 50; // < 2 years = moderate
    if (ageInDays < 1095) return 30; // < 3 years = low
    return 10; // > 3 years = very low
  }

  private calculateReputationScore(domain: string, tier: SourceTier): number {
    // Base score from tier
    const tierScores: Record<SourceTier, number> = {
      tier1: 95,
      tier2: 80,
      tier3: 65,
      tier4: 40,
      unknown: 50, // Neutral for unknown
    };

    let score = tierScores[tier];

    // Bonus for specific high-reputation domains
    if (domain.includes('mckinsey') || domain.includes('bcg') ||
        domain.includes('gartner') || domain.includes('forrester')) {
      score += 5;
    }

    return Math.min(100, score);
  }

  private async assessContentQuality(url: string, content: string): Promise<{
    methodologyScore: number;
    relevanceScore: number;
    methodology?: string;
    limitations?: string[];
  }> {
    const prompt = `Assess the quality of this research content from: ${url}

Content snippet:
${content.substring(0, 2000)}

Evaluate:
1. **Methodology Transparency** (0-100): How clear is the research methodology?
   - Are data sources cited?
   - Is sample size mentioned?
   - Is the approach explained?
   - Primary vs secondary research?

2. **Relevance** (0-100): How relevant is this to market research?
   - Is it data-driven or opinion?
   - Does it provide actionable insights?
   - Is the context appropriate?

3. **Limitations**: Any methodological limitations or biases?

Provide analysis in JSON:
{
  "methodologyScore": <number 0-100>,
  "relevanceScore": <number 0-100>,
  "methodology": "<brief description of methodology>",
  "limitations": ["<limitation 1>", "<limitation 2>"]
}`;

    try {
      const response = await this.llm.generateResponse({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Low temperature for analytical task
      });

      const analysis = JSON.parse(this.extractJSON(response.content));
      return analysis;
    } catch (error) {
      console.warn('LLM content assessment failed, using defaults');
      return {
        methodologyScore: 50,
        relevanceScore: 50,
      };
    }
  }

  private calculateOverallScore(factors: {
    authorityScore: number;
    recencyScore: number;
    methodologyScore: number;
    reputationScore: number;
    relevanceScore: number;
  }): number {
    // Weighted average
    const weights = {
      authority: 0.25,
      recency: 0.20,
      methodology: 0.20,
      reputation: 0.20,
      relevance: 0.15,
    };

    const weighted =
      factors.authorityScore * weights.authority +
      factors.recencyScore * weights.recency +
      factors.methodologyScore * weights.methodology +
      factors.reputationScore * weights.reputation +
      factors.relevanceScore * weights.relevance;

    return Math.round(weighted);
  }

  private determineRecommendedUse(
    overallScore: number,
    tier: SourceTier,
    ageInDays?: number
  ): 'primary' | 'supporting' | 'context' | 'avoid' {
    // Primary use criteria
    if (overallScore >= 80 && tier === 'tier1' && (!ageInDays || ageInDays < 365)) {
      return 'primary';
    }

    // Supporting use criteria
    if (overallScore >= 65 && (tier === 'tier1' || tier === 'tier2')) {
      return 'supporting';
    }

    // Context only
    if (overallScore >= 50) {
      return 'context';
    }

    // Avoid
    return 'avoid';
  }

  private generateReasoning(params: {
    tier: SourceTier;
    type: SourceType;
    overallScore: number;
    ageInDays?: number;
    domain: string;
  }): string {
    const reasons: string[] = [];

    // Tier reasoning
    if (params.tier === 'tier1') {
      reasons.push('✅ Tier 1 authoritative source (academic/top industry research)');
    } else if (params.tier === 'tier2') {
      reasons.push('✅ Tier 2 reputable source (market research/business news)');
    } else if (params.tier === 'tier3') {
      reasons.push('🟡 Tier 3 general source (acceptable but verify)');
    } else {
      reasons.push('⚠️ Unknown or lower-tier source (use with caution)');
    }

    // Recency reasoning
    if (params.ageInDays !== undefined) {
      if (params.ageInDays < 180) {
        reasons.push('✅ Recent data (< 6 months old)');
      } else if (params.ageInDays < 365) {
        reasons.push('✅ Current data (< 1 year old)');
      } else if (params.ageInDays < 730) {
        reasons.push('🟡 Moderately dated (1-2 years old)');
      } else {
        reasons.push(`⚠️ Outdated data (${Math.floor(params.ageInDays / 365)} years old)`);
      }
    } else {
      reasons.push('⚠️ Publication date unknown');
    }

    // Type reasoning
    if (params.type === 'academic' || params.type === 'government') {
      reasons.push('✅ High-credibility source type');
    } else if (params.type === 'industry_report') {
      reasons.push('✅ Professional market research');
    } else if (params.type === 'blog' || params.type === 'social_media') {
      reasons.push('⚠️ Informal source type - verify independently');
    }

    // Overall assessment
    if (params.overallScore >= 80) {
      reasons.push('✅ HIGH QUALITY - Safe for primary use');
    } else if (params.overallScore >= 65) {
      reasons.push('✅ GOOD QUALITY - Use for supporting evidence');
    } else if (params.overallScore >= 50) {
      reasons.push('🟡 MODERATE QUALITY - Context only, verify critical claims');
    } else {
      reasons.push('❌ LOW QUALITY - Avoid or verify thoroughly');
    }

    return reasons.join(' | ');
  }

  private extractJSON(content: string): string {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : content;
  }

  async rankSources(sources: string[]): Promise<SourceQualityScore[]> {
    console.log(`\n📊 Ranking ${sources.length} sources by quality...\n`);

    const assessments: SourceQualityScore[] = [];

    for (const url of sources) {
      const assessment = await this.assessSource(url);
      assessments.push(assessment);
    }

    // Sort by overall score (descending)
    return assessments.sort((a, b) => b.overallScore - a.overallScore);
  }
}

// Factory function
export function createSourceQualityAssessor(llm: LLMAdapter): SourceQualityAssessor {
  return new SourceQualityAssessor(llm);
}
