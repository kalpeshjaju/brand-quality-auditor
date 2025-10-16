# Brand Quality Auditor - Codex Agent Guide

> Ferrari-grade brand strategy quality verification tool - Deep source verification, fact-checking, and quality assessment

## Repository Overview

This tool verifies brand strategy quality through deep source verification, fact-checking, and evidence-based quality assessment.

**Purpose**: Ensure brand strategies are backed by verifiable sources and accurate data

**Tech Stack**: TypeScript, Node.js, Claude AI, Google Search API, Anthropic SDK

## Project Context

### What This Tool Does

1. **Source Verification** - Validates all claims have credible sources
2. **Fact-Checking** - Cross-references data points for accuracy
3. **Quality Assessment** - Scores strategy documents on evidence quality
4. **Citation Tracking** - Ensures proper attribution and sourcing
5. **Hallucination Detection** - Identifies unsupported or invented claims

### Key Features

- **Deep source analysis** - Crawls cited sources to verify accuracy
- **Competitive data verification** - Validates competitor information
- **Market research validation** - Cross-checks market statistics
- **Brand claim verification** - Ensures brand assertions are supported
- **Quality scoring** - Provides quantitative quality metrics

## Architecture

### Entry Points

- **`src/cli/audit-cli.ts`** - Basic audit CLI
- **`src/cli/enhanced-audit-cli.ts`** - Enhanced audit with deep verification

### Key Directories

```
src/
├── cli/              # Command-line interfaces
├── auditors/         # Verification auditors
├── verifiers/        # Source verification logic
├── analyzers/        # Content analyzers
├── reporters/        # Report generators
└── utils/           # Shared utilities
```

### Critical Files

- `src/cli/enhanced-audit-cli.ts` - Main entry point
- `src/auditors/quality-auditor.ts` - Core quality verification
- `src/verifiers/source-verifier.ts` - Source validation
- `src/reporters/audit-reporter.ts` - Report generation

## Code Standards

### TypeScript Conventions

- **Strict mode**: Always enabled
- **No `any` types**: Use `unknown` or proper types
- **camelCase**: For variables/functions
- **Specific imports**: No wildcard imports
- **Error context**: All errors must explain what failed and why

### File Size Limits

- **Files**: <400 lines (excellent), <600 (acceptable), >800 (MUST split)
- **Functions**: <75 lines (excellent), <120 (acceptable), >150 (MUST refactor)

### Error Handling

```typescript
// Good
throw new Error(
  `Failed to verify source at ${url}: ` +
  `HTTP ${status}. Check URL validity and network connection.`
);
```

## Common Patterns

### Audit Pattern

```typescript
export class QualityAuditor {
  async audit(strategy: BrandStrategy): Promise<AuditResult> {
    const findings: Finding[] = [];

    // Verify sources
    for (const claim of strategy.claims) {
      const verification = await this.verifySource(claim.source);
      if (!verification.valid) {
        findings.push({
          type: 'source-invalid',
          severity: 'error',
          claim: claim.text,
          source: claim.source,
          reason: verification.reason,
        });
      }
    }

    return {
      score: this.calculateScore(findings),
      findings,
      summary: this.generateSummary(findings),
    };
  }
}
```

### Verification Pattern

```typescript
export class SourceVerifier {
  async verify(url: string): Promise<VerificationResult> {
    // Fetch source
    const response = await fetch(url);

    if (!response.ok) {
      return {
        valid: false,
        reason: `HTTP ${response.status}: Source unavailable`,
      };
    }

    // Analyze content
    const content = await response.text();
    const credibility = this.assessCredibility(content, url);

    return {
      valid: credibility.score >= 0.7,
      score: credibility.score,
      reason: credibility.reason,
    };
  }
}
```

## Testing

### Running Tests

```bash
npm test                # Run all tests
npm run type-check     # TypeScript type checking
npm run lint           # ESLint
```

### Quality Gates

Before committing:

```bash
npm run type-check  # MUST pass
npm run lint       # MUST pass
npm test           # For significant changes
```

## Common Tasks

### Running an Audit

```bash
# Basic audit
npm run audit -- --input strategy.json

# Enhanced audit with deep verification
npm run audit:enhanced -- --input strategy.json

# With custom output
npm run audit:enhanced -- --input strategy.json --output report.json
```

### Input Format

Brand strategy JSON:

```json
{
  "brand": "Example Brand",
  "claims": [
    {
      "text": "Market leader with 45% share",
      "source": "https://example.com/research",
      "context": "Market analysis section"
    }
  ],
  "sources": [
    {
      "url": "https://example.com/research",
      "title": "Industry Report 2025",
      "accessed": "2025-10-16"
    }
  ]
}
```

## Environment Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Environment Variables

Create `.env` file:

```bash
# Required
ANTHROPIC_API_KEY=your_key_here

# Optional
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id
```

### First Time Setup

```bash
npm install
npm run build
npm run audit:enhanced -- --input test-strategy.json
```

## Focus Areas for Code Review

### High Priority

1. **Source verification accuracy** - Ensure all sources are properly validated
2. **Error handling** - All errors must have context
3. **Type safety** - No `any` types
4. **API rate limiting** - Respect API quotas

### Medium Priority

5. **Test coverage** - Ensure verification logic has tests
6. **Caching** - Cache verified sources to avoid duplicate requests
7. **Documentation** - JSDoc for public APIs
8. **Performance** - Optimize parallel verification

### Watch For

- ❌ Unverified sources marked as valid
- ❌ Generic error messages
- ❌ Missing API rate limiting
- ❌ Hardcoded URLs or API keys
- ❌ Synchronous blocking operations

## Common Issues

### API Rate Limits

**Problem**: Google Search API has quota limits
**Solution**: Implement caching and rate limiting

```typescript
const cache = new Map<string, VerificationResult>();

async verify(url: string): Promise<VerificationResult> {
  if (cache.has(url)) {
    return cache.get(url)!;
  }

  const result = await this.doVerify(url);
  cache.set(url, result);
  return result;
}
```

### Source Timeout

**Problem**: Some sources are slow to respond
**Solution**: Implement timeout handling

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(url, { signal: controller.signal });
  // ... process response
} finally {
  clearTimeout(timeout);
}
```

## Dependencies

### Key Dependencies

- `@anthropic-ai/sdk` - Claude AI for content analysis
- `googleapis` - Google Search API for fact-checking
- `axios` - HTTP client for source fetching
- `dotenv` - Environment configuration

### Dev Dependencies

- `typescript` - TypeScript compiler
- `vitest` - Testing framework
- `eslint` - Linting
- `tsx` - TypeScript execution

## Git Workflow

### Commit Conventions

Use standard types:
- `feat` - New features
- `fix` - Bug fixes
- `refactor` - Code refactoring
- `docs` - Documentation
- `test` - Tests
- `chore` - Maintenance

Examples:
```
feat: add source credibility scoring
fix: handle 404 sources gracefully
refactor: extract verification logic to separate module
```

## Project Status

- **Current Version**: 1.0.0
- **Production Ready**: Yes
- **Test Coverage**: In progress
- **Maintained By**: Kalpesh + Claude Code

## When Reviewing Pull Requests

### Check For

- ✅ Type-check passes (`npm run type-check`)
- ✅ Linting passes (`npm run lint`)
- ✅ Tests pass (`npm test`)
- ✅ Source verification accuracy
- ✅ Error messages have context
- ✅ No hardcoded secrets
- ✅ Proper API rate limiting
- ✅ No console.log statements

### Security Checks

- ✅ No API keys in code
- ✅ Environment variables properly used
- ✅ URLs properly validated before fetching
- ✅ User input sanitized

## Questions or Issues?

- Check documentation in `README.md`
- Review existing auditors for patterns
- Ask for clarification if requirements unclear

---

**Last Updated**: 2025-10-16
**Maintained By**: Kalpesh Jaju
**Project**: Brand Quality Auditor
