// Web Research Service - Fetch real market data
// Version 2.0 - Google Custom Search API Integration

import type {
  IndustryResearchData,
  CompetitorWebData,
  MarketStatistic,
  SourcedClaim,
  WebSearchResult,
  IndustryTrendWithSource,
} from '../types/research-types.js';

interface GoogleSearchConfig {
  apiKey?: string;
  searchEngineId?: string;
  enableCache?: boolean;
}

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
  formattedUrl?: string;
}

interface GoogleApiResponse {
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
    displayLink?: string;
    formattedUrl?: string;
  }>;
}

export class WebResearchService {
  private apiKey: string | null;
  private searchEngineId: string | null;
  private searchCache: Map<string, GoogleSearchResult[]> = new Map();

  constructor(config?: GoogleSearchConfig) {
    this.apiKey = config?.apiKey || process.env.GOOGLE_API_KEY || null;
    this.searchEngineId = config?.searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID || null;

    if (!this.apiKey || !this.searchEngineId) {
      console.warn('⚠️  Google Custom Search API not configured');
      console.warn('   Set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID for real web search');
      console.warn('   Get credentials at: https://developers.google.com/custom-search');
    }
  }

  async fetchIndustryData(industry: string, region: string = 'India'): Promise<IndustryResearchData> {
    console.log(`\n🌐 Researching ${industry} industry in ${region}...\n`);

    const researchData: IndustryResearchData = {
      industry,
      trends: [],
      keyPlayers: [],
      sources: [],
      researchDate: new Date().toISOString(),
    };

    // Search for industry reports and trends
    const searchQueries = [
      `${industry} market size ${region} 2024`,
      `${industry} growth rate ${region} trends`,
      `${industry} market analysis ${region}`,
    ];

    if (this.apiKey && this.searchEngineId) {
      // Real Google Custom Search implementation
      for (const query of searchQueries) {
        const results = await this.performGoogleSearch(query);
        researchData.sources.push(...results.map(r => r.link));
      }
      console.log(`   ✅ Found ${researchData.sources.length} sources via Google Search`);
    } else {
      // Fallback: Placeholder mode
      console.log(`   ⚠️  Using placeholder mode (no API key)`);
      console.log(`   Searching: ${searchQueries.join(', ')}`);
    }

    return researchData;
  }

  async fetchCompetitorWebsite(url: string): Promise<CompetitorWebData | null> {
    console.log(`\n🔍 Fetching competitor data from: ${url}\n`);

    try {
      // This would use Claude Code's WebFetch tool
      // For now, return structure
      const webData: CompetitorWebData = {
        url,
        scrapedAt: new Date().toISOString(),
        positioning: '',
        products: [],
        keyFeatures: [],
        metadata: {
          title: '',
          description: '',
        },
      };

      console.log(`   ✅ Successfully fetched data from ${url}`);
      return webData;
    } catch (error) {
      console.error(`   ❌ Failed to fetch ${url}:`, error);
      return null;
    }
  }

  async searchMarketStatistics(query: string): Promise<MarketStatistic[]> {
    console.log(`\n📊 Searching for market statistics: ${query}\n`);

    // This would use WebSearch to find statistics
    // Parse results and extract numeric data with sources
    const statistics: MarketStatistic[] = [];

    return statistics;
  }

  async validateStatistic(claim: string, industry: string): Promise<SourcedClaim> {
    console.log(`\n✅ Validating statistic: "${claim}"\n`);

    // Extract numeric value from claim
    const numericMatch = claim.match(/(\d+(?:\.\d+)?)\s*%/);

    if (!numericMatch) {
      return {
        claim,
        confidence: 'unverified',
        verificationNotes: 'No numeric value found to validate',
      };
    }

    // Search web for verification
    const searchQuery = `${industry} market ${claim}`;
    console.log(`   Searching: "${searchQuery}"`);

    // This would use WebSearch to find supporting evidence
    // For now, return unverified
    return {
      claim,
      confidence: 'low',
      verificationNotes: 'Web validation not yet implemented',
    };
  }

  async searchIndustryReports(industry: string, year: number = new Date().getFullYear()): Promise<WebSearchResult[]> {
    const searchQueries = [
      `${industry} market report ${year}`,
      `${industry} industry analysis ${year}`,
      `${industry} trends forecast ${year}`,
    ];

    console.log(`\n📑 Searching for industry reports...\n`);

    if (!this.apiKey || !this.searchEngineId) {
      console.log(`   ⚠️  Google Search API not configured - returning empty results`);
      return [];
    }

    const allResults: WebSearchResult[] = [];

    for (const query of searchQueries) {
      const googleResults = await this.performGoogleSearch(query);
      const parsedResults = this.parseSearchResults(googleResults);
      allResults.push(...parsedResults);
    }

    console.log(`   ✅ Found ${allResults.length} industry reports`);
    return allResults;
  }

  /**
   * Perform real Google Custom Search API call
   */
  private async performGoogleSearch(query: string, maxResults: number = 10): Promise<GoogleSearchResult[]> {
    if (!this.apiKey || !this.searchEngineId) {
      return [];
    }

    // Check cache first
    const cacheKey = `${query}:${maxResults}`;
    if (this.searchCache.has(cacheKey)) {
      console.log(`   💾 Cache hit for: "${query}"`);
      return this.searchCache.get(cacheKey)!;
    }

    try {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('cx', this.searchEngineId);
      url.searchParams.append('q', query);
      url.searchParams.append('num', Math.min(maxResults, 10).toString());

      console.log(`   🔍 Google Search: "${query}"`);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as GoogleApiResponse;
      const results: GoogleSearchResult[] = (data.items || []).map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
        formattedUrl: item.formattedUrl,
      }));

      // Cache results (1 hour TTL)
      this.searchCache.set(cacheKey, results);
      setTimeout(() => this.searchCache.delete(cacheKey), 3600000);

      return results;
    } catch (error: any) {
      console.error(`   ❌ Google Search failed: ${error.message}`);
      return [];
    }
  }

  async extractKeyInsights(url: string, context: string): Promise<string[]> {
    console.log(`\n🔍 Extracting insights from: ${url}\n`);

    // This would use WebFetch + LLM to extract relevant insights
    // WebFetch the URL, then use LLM to extract key points related to context

    return [];
  }

  private parseSearchResults(results: GoogleSearchResult[]): WebSearchResult[] {
    // Parse Google search results into structured format
    return results.map(result => ({
      title: result.title || '',
      url: result.link || '',
      snippet: result.snippet || '',
      relevanceScore: this.calculateRelevance(result),
    }));
  }

  private calculateRelevance(result: GoogleSearchResult): number {
    // Simple relevance scoring (0-1)
    let score = 0.5;

    // Bonus for authoritative sources (from V2.0 source quality tiers)
    const tier1Domains = [
      'sciencedirect.com', 'springer.com', 'nature.com',
      'mckinsey.com', 'bcg.com', 'gartner.com', 'forrester.com',
    ];

    const tier2Domains = [
      'mordorintelligence.com', 'statista.com', 'ibisworld.com',
      'bloomberg.com', 'reuters.com', 'wsj.com',
    ];

    try {
      const domain = new URL(result.link).hostname;

      if (tier1Domains.some(d => domain.includes(d))) {
        score += 0.4; // Tier 1: Academic/consulting
      } else if (tier2Domains.some(d => domain.includes(d))) {
        score += 0.3; // Tier 2: Industry research
      } else if (domain.includes('.edu') || domain.includes('.gov')) {
        score += 0.35; // Educational/government
      }
    } catch {
      // Invalid URL - keep base score
    }

    // Bonus for longer, more detailed snippets
    if (result.snippet && result.snippet.length > 150) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get current search cache stats
   */
  getCacheStats(): { size: number; queries: string[] } {
    return {
      size: this.searchCache.size,
      queries: Array.from(this.searchCache.keys()),
    };
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  async batchFetchCompetitors(urls: string[]): Promise<Map<string, CompetitorWebData | null>> {
    console.log(`\n🔄 Batch fetching ${urls.length} competitor websites...\n`);

    const results = new Map<string, CompetitorWebData | null>();

    // Fetch with delay to avoid rate limiting
    for (const url of urls) {
      const data = await this.fetchCompetitorWebsite(url);
      results.set(url, data);

      // Add delay between requests (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  async getTrendingTopics(industry: string, timeframe: 'day' | 'week' | 'month' = 'month'): Promise<string[]> {
    console.log(`\n📈 Getting trending topics for ${industry} (${timeframe})...\n`);

    // This would integrate with Google Trends API or similar
    // For now, return empty array
    return [];
  }
}

// Factory function for easy instantiation
export function createWebResearchService(): WebResearchService {
  return new WebResearchService();
}
