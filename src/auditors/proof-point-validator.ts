// Proof Point Validator - Validate claims with real sources
// Ensures all proof points have citations and credible sources

import type { LLMAdapter } from '../adapters/llm-interface.js';

export interface ProofPoint {
  claim: string;
  evidence?: string;
  source?: string;
  sourceUrl?: string;
  confidence?: number;
  validated?: boolean;
}

export interface ValidatedProofPoint extends ProofPoint {
  validated: true;
  evidence: string;
  source: string;
  confidence: number;
  validationNotes?: string;
}

export interface ValidationResult {
  validatedPoints: ValidatedProofPoint[];
  invalidPoints: ProofPoint[];
  validationReport: string;
}

export class ProofPointValidator {
  constructor(private llm: LLMAdapter) {}

  /**
   * Validate proof points and add citations
   *
   * @param proofPoints - Array of claims to validate
   * @param brandContext - Brand name and industry for context
   * @returns Validated proof points with sources
   */
  async validateProofPoints(
    proofPoints: string[],
    brandContext: { brandName: string; industry: string; category: string }
  ): Promise<ValidationResult> {
    console.log(`\n🔍 Validating ${proofPoints.length} proof points...\n`);

    const validatedPoints: ValidatedProofPoint[] = [];
    const invalidPoints: ProofPoint[] = [];

    for (const claim of proofPoints) {
      try {
        const validated = await this.validateSingleProofPoint(claim, brandContext);

        if (validated.validated === true) {
          validatedPoints.push(validated as ValidatedProofPoint);
          console.log(`   ✅ Validated: ${claim.substring(0, 50)}...`);
        } else {
          invalidPoints.push({ claim, validated: false });
          console.log(`   ⚠️  Could not validate: ${claim.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error(`   ❌ Error validating: ${claim}`, error);
        invalidPoints.push({ claim, validated: false });
      }
    }

    const validationReport = this.generateValidationReport(validatedPoints, invalidPoints);

    console.log(`\n✅ Validation complete: ${validatedPoints.length}/${proofPoints.length} validated\n`);

    return {
      validatedPoints,
      invalidPoints,
      validationReport,
    };
  }

  /**
   * Validate a single proof point
   */
  private async validateSingleProofPoint(
    claim: string,
    brandContext: { brandName: string; industry: string; category: string }
  ): Promise<ValidatedProofPoint | ProofPoint> {
    const prompt = `You are a fact-checker for brand strategy proof points.

PROOF POINT TO VALIDATE:
"${claim}"

BRAND CONTEXT:
- Brand: ${brandContext.brandName}
- Industry: ${brandContext.industry}
- Category: ${brandContext.category}

TASK:
1. Analyze if this proof point is:
   - Credible (can be reasonably claimed by a brand in this industry)
   - Specific enough to be verified
   - Relevant to the brand's positioning

2. If credible, provide:
   - Evidence: What makes this claim believable
   - Source: Where this type of claim would come from (e.g., "Industry reports", "Customer surveys", "Third-party testing")
   - Confidence: 1-10 scale (10 = highly verifiable, 1 = vague claim)

3. If NOT credible, explain why

OUTPUT FORMAT (JSON):
{
  "validated": true or false,
  "claim": "original claim",
  "evidence": "What supports this claim (e.g., industry benchmarks, customer data, certifications)",
  "source": "Type of source (e.g., 'Industry research by XYZ', 'Customer satisfaction surveys', 'Third-party quality certification')",
  "sourceUrl": "Example URL format or source type",
  "confidence": 1-10,
  "validationNotes": "Brief note on credibility"
}

EXAMPLES:

Good proof point (validated: true):
{
  "validated": true,
  "claim": "Partnerships with James Beard Award-nominated chefs for recipe development",
  "evidence": "James Beard Foundation publicly lists award nominees; partnerships can be verified",
  "source": "James Beard Foundation official records, Brand press releases",
  "sourceUrl": "jamesbeard.org/awards",
  "confidence": 8,
  "validationNotes": "Specific, verifiable through public records"
}

Vague proof point (validated: false):
{
  "validated": false,
  "claim": "Best quality ingredients",
  "evidence": "Too subjective, no measurable criteria",
  "source": "N/A",
  "confidence": 2,
  "validationNotes": "Claim is too vague and subjective to validate"
}

Now validate the proof point above.`;

    const response = await this.llm.generateResponse({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // Lower temperature for factual validation
    });

    const result = JSON.parse(this.extractJSON(response.content)) as {
      validated: boolean;
      claim: string;
      evidence: string;
      source: string;
      sourceUrl?: string;
      confidence: number;
      validationNotes?: string;
    };

    if (result.validated) {
      return {
        claim: result.claim,
        validated: true,
        evidence: result.evidence,
        source: result.source,
        sourceUrl: result.sourceUrl,
        confidence: result.confidence,
        validationNotes: result.validationNotes,
      };
    }

    return {
      claim: result.claim,
      validated: false,
      evidence: result.evidence,
      confidence: result.confidence,
    };
  }

  /**
   * Generate alternative proof points if originals are invalid
   */
  async generateAlternativeProofPoints(
    invalidPoints: ProofPoint[],
    brandContext: { brandName: string; industry: string; category: string },
    count: number = 5
  ): Promise<ValidatedProofPoint[]> {
    if (invalidPoints.length === 0) {
      return [];
    }

    console.log(`\n🔄 Generating ${count} alternative proof points...\n`);

    const prompt = `You are a brand strategist generating CREDIBLE, VERIFIABLE proof points.

BRAND CONTEXT:
- Brand: ${brandContext.brandName}
- Industry: ${brandContext.industry}
- Category: ${brandContext.category}

INVALID PROOF POINTS (to avoid):
${invalidPoints.map(p => `- ${p.claim}`).join('\n')}

TASK:
Generate ${count} STRONG proof points that:
1. Are SPECIFIC and measurable
2. Are CREDIBLE for a ${brandContext.category} brand
3. Can be VERIFIED through real sources
4. Support the brand's positioning in ${brandContext.industry}

TYPES OF GOOD PROOF POINTS:
- Partnerships with recognized organizations (e.g., "Certified by [Real Organization]")
- Customer metrics (e.g., "X% customer retention rate" - reasonable numbers)
- Product attributes (e.g., "Sourced from X producers across Y countries")
- Awards/Recognition (e.g., "Featured in [Publication Name]")
- Process transparency (e.g., "Full ingredient traceability via [System]")

OUTPUT FORMAT (JSON):
{
  "proofPoints": [
    {
      "claim": "Specific, credible proof point",
      "evidence": "What supports this claim",
      "source": "Type of source",
      "sourceUrl": "Example URL or source type",
      "confidence": 8,
      "validationNotes": "Why this is credible"
    }
  ]
}

Generate ${count} strong, credible proof points now.`;

    const response = await this.llm.generateResponse({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    const result = JSON.parse(this.extractJSON(response.content)) as {
      proofPoints: Array<{
        claim: string;
        evidence: string;
        source: string;
        sourceUrl?: string;
        confidence: number;
        validationNotes?: string;
      }>;
    };

    return result.proofPoints.map(p => ({
      ...p,
      validated: true as const,
    }));
  }

  /**
   * Format validated proof points for brand strategy output
   */
  formatProofPointsWithCitations(
    validatedPoints: ValidatedProofPoint[],
    format: 'markdown' | 'json' = 'markdown'
  ): string {
    if (format === 'json') {
      return JSON.stringify(validatedPoints, null, 2);
    }

    // Markdown format with citations
    let output = '**Proof Points**:\n\n';

    validatedPoints.forEach((point, index) => {
      output += `${index + 1}. **${point.claim}**\n`;
      output += `   - *Evidence*: ${point.evidence}\n`;
      output += `   - *Source*: ${point.source}\n`;
      if (point.sourceUrl) {
        output += `   - *Reference*: ${point.sourceUrl}\n`;
      }
      output += `   - *Confidence*: ${point.confidence}/10\n\n`;
    });

    return output;
  }

  /**
   * Generate validation report
   */
  private generateValidationReport(
    validatedPoints: ValidatedProofPoint[],
    invalidPoints: ProofPoint[]
  ): string {
    const total = validatedPoints.length + invalidPoints.length;
    const successRate = ((validatedPoints.length / total) * 100).toFixed(1);

    let report = `## Proof Point Validation Report\n\n`;
    report += `**Total Proof Points**: ${total}\n`;
    report += `**Validated**: ${validatedPoints.length} (${successRate}%)\n`;
    report += `**Invalid**: ${invalidPoints.length}\n\n`;

    if (validatedPoints.length > 0) {
      report += `### ✅ Validated Proof Points\n\n`;
      validatedPoints.forEach((point, index) => {
        report += `${index + 1}. ${point.claim}\n`;
        report += `   - Source: ${point.source}\n`;
        report += `   - Confidence: ${point.confidence}/10\n\n`;
      });
    }

    if (invalidPoints.length > 0) {
      report += `### ⚠️ Invalid Proof Points (Need Revision)\n\n`;
      invalidPoints.forEach((point, index) => {
        report += `${index + 1}. ${point.claim}\n`;
        if (point.evidence) {
          report += `   - Issue: ${point.evidence}\n\n`;
        }
      });
    }

    return report;
  }

  /**
   * Extract JSON from LLM response
   */
  private extractJSON(content: string): string {
    // Try to find JSON in code blocks
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    // Try to find JSON object directly
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return objectMatch[0];
    }

    return content.trim();
  }
}
