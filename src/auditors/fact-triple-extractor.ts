// Fact Triple Extractor
// Extracts structured (subject, predicate, value) triples from text claims

export interface FactTriple {
  subject: string;
  predicate: string;
  value: string | number;
  confidence: number;
  sourceText: string;
  type: 'numeric' | 'categorical' | 'comparative' | 'temporal';
}

export interface ExtractionResult {
  triples: FactTriple[];
  unstructuredClaims: string[];
  totalClaims: number;
  extractionRate: number;
}

export class FactTripleExtractor {
  private patterns: RegExp[];

  constructor() {
    this.patterns = this.initializePatterns();
  }

  private initializePatterns(): RegExp[] {
    return [
      // Numeric claims: "X has/serves/owns Y [units]"
      /(\w[\w\s]*?)\s+(has|have|serves?|owns?|operates?|manages?|delivers?|produces?|generates?)\s+(\d+[\d,\.]*)\s*(\w+)?/gi,

      // Percentage claims: "X% of Y"
      /(\d+(?:\.\d+)?%?)\s+of\s+([\w\s]+?)(?:\.|,|$)/gi,

      // Comparative claims: "X is [comparative] than Y"
      /([\w\s]+?)\s+is\s+(better|worse|higher|lower|faster|slower|more|less|greater|smaller)\s+than\s+([\w\s]+?)(?:\.|,|$)/gi,

      // Market position: "X is #N in Y"
      /([\w\s]+?)\s+is\s+#?(\d+)\s+in\s+([\w\s]+?)(?:\.|,|$)/gi,

      // Growth claims: "X grew/increased/decreased by Y%"
      /([\w\s]+?)\s+(grew|increased|decreased|expanded|reduced)\s+by\s+(\d+(?:\.\d+)?%?)/gi,

      // Temporal claims: "X since/in YYYY"
      /([\w\s]+?)\s+(since|in|from|after|before)\s+(\d{4})/gi,

      // Revenue/value claims: "$X [million/billion]"
      /\$(\d+(?:[\d,\.]*)?)\s*(million|billion|thousand|M|B|K)?/gi,

      // Rating claims: "X rated/scored Y [out of Z]"
      /([\w\s]+?)\s+(rated|scored|achieved|received)\s+(\d+(?:\.\d+)?)\s*(?:out of\s+(\d+))?/gi,

      // Customer/user base: "X customers/users/clients"
      /(\d+[\d,\.]*)\s+(customers?|users?|clients?|members?|subscribers?|partners?)/gi,

      // Time-based claims: "X years/months of Y"
      /(\d+)\s+(years?|months?|days?|hours?)\s+of\s+([\w\s]+?)(?:\.|,|$)/gi,
    ];
  }

  extractTriples(text: string): ExtractionResult {
    const triples: FactTriple[] = [];
    const processedClaims = new Set<string>();
    const sentences = this.splitIntoSentences(text);
    const unstructuredClaims: string[] = [];

    for (const sentence of sentences) {
      let extracted = false;

      // Try each pattern
      for (const pattern of this.patterns) {
        const matches = [...sentence.matchAll(pattern)];

        for (const match of matches) {
          const triple = this.parseMatch(match, sentence, pattern);
          if (triple && !this.isDuplicate(triple, triples)) {
            triples.push(triple);
            processedClaims.add(sentence);
            extracted = true;
          }
        }
      }

      // Track unstructured claims that might need manual review
      if (!extracted && this.looksLikeClaim(sentence)) {
        unstructuredClaims.push(sentence);
      }
    }

    const totalClaims = sentences.filter(s => this.looksLikeClaim(s)).length;
    const extractionRate = totalClaims > 0 ? triples.length / totalClaims : 0;

    return {
      triples,
      unstructuredClaims,
      totalClaims,
      extractionRate,
    };
  }

  private parseMatch(match: RegExpMatchArray, sourceText: string, pattern: RegExp): FactTriple | null {
    try {
      // Determine pattern type and extract accordingly
      const patternStr = pattern.source;
      let triple: Partial<FactTriple> = {
        sourceText,
        confidence: 0.8, // Default confidence
      };

      if (patternStr.includes('has|have|serves')) {
        // Numeric possession/service pattern
        triple.subject = this.cleanText(match[1]);
        triple.predicate = match[2];
        triple.value = this.parseNumericValue(match[3]);
        triple.type = 'numeric';
        if (match[4]) {
          triple.predicate += ' ' + match[4]; // Add units
        }
      } else if (patternStr.includes('%')) {
        // Percentage pattern
        triple.subject = this.cleanText(match[2]);
        triple.predicate = 'percentage';
        triple.value = this.parseNumericValue(match[1]);
        triple.type = 'numeric';
      } else if (patternStr.includes('better|worse')) {
        // Comparative pattern
        triple.subject = this.cleanText(match[1]);
        triple.predicate = 'is ' + match[2] + ' than';
        triple.value = this.cleanText(match[3]);
        triple.type = 'comparative';
      } else if (patternStr.includes('#')) {
        // Market position pattern
        triple.subject = this.cleanText(match[1]);
        triple.predicate = 'rank in ' + this.cleanText(match[3]);
        triple.value = parseInt(match[2]);
        triple.type = 'numeric';
      } else if (patternStr.includes('grew|increased')) {
        // Growth pattern
        triple.subject = this.cleanText(match[1]);
        triple.predicate = match[2];
        triple.value = this.parseNumericValue(match[3]);
        triple.type = 'numeric';
      } else if (patternStr.includes('since|in|from')) {
        // Temporal pattern
        triple.subject = this.cleanText(match[1]);
        triple.predicate = match[2];
        triple.value = parseInt(match[3]);
        triple.type = 'temporal';
      } else if (patternStr.includes('\\$')) {
        // Revenue/value pattern
        triple.subject = 'value';
        triple.predicate = 'equals';
        triple.value = this.parseCurrencyValue(match[1], match[2]);
        triple.type = 'numeric';
      } else if (patternStr.includes('rated|scored')) {
        // Rating pattern
        triple.subject = this.cleanText(match[1]);
        triple.predicate = match[2];
        triple.value = parseFloat(match[3]);
        triple.type = 'numeric';
        if (match[4]) {
          triple.predicate += ' out of ' + match[4];
        }
      } else if (patternStr.includes('customers?|users?')) {
        // Customer base pattern
        triple.subject = 'company';
        triple.predicate = 'has';
        triple.value = this.parseNumericValue(match[1]);
        triple.type = 'numeric';
      } else if (patternStr.includes('years?|months?')) {
        // Time-based pattern
        triple.subject = this.cleanText(match[3]);
        triple.predicate = 'duration';
        triple.value = parseInt(match[1]) + ' ' + match[2];
        triple.type = 'temporal';
      }

      // Validate triple has all required fields
      if (triple.subject && triple.predicate && triple.value !== undefined) {
        // Adjust confidence based on pattern specificity
        triple.confidence = this.calculateConfidence(triple as FactTriple);
        return triple as FactTriple;
      }
    } catch (error) {
      console.error('Error parsing match:', error);
    }

    return null;
  }

  private cleanText(text: string): string {
    return text.trim()
      .replace(/\s+/g, ' ')
      .replace(/^(the|a|an)\s+/i, '');
  }

  private parseNumericValue(text: string): number {
    // Remove commas and parse
    const cleaned = text.replace(/,/g, '').replace(/%$/, '');
    return parseFloat(cleaned);
  }

  private parseCurrencyValue(amount: string, multiplier?: string): number {
    const base = this.parseNumericValue(amount);

    if (!multiplier) return base;

    const multipliers: Record<string, number> = {
      'thousand': 1000,
      'K': 1000,
      'million': 1000000,
      'M': 1000000,
      'billion': 1000000000,
      'B': 1000000000,
    };

    return base * (multipliers[multiplier] || 1);
  }

  private calculateConfidence(triple: FactTriple): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for numeric facts
    if (triple.type === 'numeric' && typeof triple.value === 'number') {
      confidence += 0.1;
    }

    // Lower confidence for vague subjects
    if (triple.subject.length < 3 || triple.subject === 'company' || triple.subject === 'we') {
      confidence -= 0.1;
    }

    // Higher confidence for specific predicates
    if (['serves', 'has', 'owns', 'equals'].includes(triple.predicate)) {
      confidence += 0.05;
    }

    // Cap between 0 and 1
    return Math.max(0.3, Math.min(1.0, confidence));
  }

  private isDuplicate(triple: FactTriple, existing: FactTriple[]): boolean {
    return existing.some(t =>
      t.subject === triple.subject &&
      t.predicate === triple.predicate &&
      t.value === triple.value
    );
  }

  private splitIntoSentences(text: string): string[] {
    // Split on sentence boundaries
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private looksLikeClaim(sentence: string): boolean {
    // Heuristics to determine if a sentence contains a claim
    const claimIndicators = [
      /\d+/,  // Contains numbers
      /first|best|leading|top|only/i,  // Superlatives
      /has|have|serves|owns/i,  // Possession verbs
      /more|less|better|worse/i,  // Comparatives
      /since|from|in \d{4}/i,  // Temporal markers
      /customers|revenue|growth|market/i,  // Business terms
    ];

    return claimIndicators.some(pattern => pattern.test(sentence));
  }

  // Analyze triples for verification priority
  analyzeForVerification(triples: FactTriple[]): {
    highPriority: FactTriple[];
    mediumPriority: FactTriple[];
    lowPriority: FactTriple[];
  } {
    const highPriority: FactTriple[] = [];
    const mediumPriority: FactTriple[] = [];
    const lowPriority: FactTriple[] = [];

    for (const triple of triples) {
      // High priority: Numeric claims that can be fact-checked
      if (triple.type === 'numeric' && typeof triple.value === 'number') {
        if (triple.value > 1000000 || // Large numbers
            triple.predicate.includes('revenue') ||
            triple.predicate.includes('customers') ||
            triple.predicate.includes('rank')) {
          highPriority.push(triple);
        } else {
          mediumPriority.push(triple);
        }
      }
      // Medium priority: Comparative and temporal claims
      else if (triple.type === 'comparative' || triple.type === 'temporal') {
        mediumPriority.push(triple);
      }
      // Low priority: Categorical claims
      else {
        lowPriority.push(triple);
      }
    }

    return { highPriority, mediumPriority, lowPriority };
  }

  // Group related triples for cross-verification
  groupRelatedTriples(triples: FactTriple[]): Map<string, FactTriple[]> {
    const groups = new Map<string, FactTriple[]>();

    for (const triple of triples) {
      // Group by subject
      const key = triple.subject.toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(triple);
    }

    return groups;
  }

  // Export triples to verification format
  exportForVerification(triples: FactTriple[]): string {
    const lines: string[] = ['# Facts to Verify\n'];

    const { highPriority, mediumPriority, lowPriority } = this.analyzeForVerification(triples);

    if (highPriority.length > 0) {
      lines.push('## High Priority\n');
      for (const triple of highPriority) {
        lines.push(`- **${triple.subject}** ${triple.predicate} **${triple.value}**`);
        lines.push(`  - Source: "${triple.sourceText}"`);
        lines.push(`  - Confidence: ${(triple.confidence * 100).toFixed(0)}%\n`);
      }
    }

    if (mediumPriority.length > 0) {
      lines.push('## Medium Priority\n');
      for (const triple of mediumPriority) {
        lines.push(`- ${triple.subject} ${triple.predicate} ${triple.value}`);
        lines.push(`  - Confidence: ${(triple.confidence * 100).toFixed(0)}%\n`);
      }
    }

    if (lowPriority.length > 0) {
      lines.push('## Low Priority\n');
      for (const triple of lowPriority) {
        lines.push(`- ${triple.subject} ${triple.predicate} ${triple.value}\n`);
      }
    }

    return lines.join('\n');
  }
}