# 🏎️ Brand Quality Auditor

> Ferrari-grade brand strategy verification tool
> Deep source verification, fact-checking, and quality assessment

---

## 🎯 What Is This?

**Brand Quality Auditor** is a standalone tool that performs comprehensive quality audits on brand strategies. It verifies sources, checks facts, assesses data recency, and provides detailed improvement recommendations.

### Use It For:
- ✅ Before presenting strategies to CEO/Board
- ✅ Client deliverables (ensure consulting-grade quality)
- ✅ High-stakes brand launches
- ✅ Periodic quality audits
- ✅ Verifying ANY brand strategy (not just from Horizon Brand Builder)

---

## 🚀 Quick Start

### Installation

```bash
cd ~/Development/brand-quality-auditor
npm install
```

### Basic Usage

```bash
# Audit a brand strategy
npm run audit -- --input path/to/brand-strategy.json

# Comprehensive audit
npm run audit -- --input strategy.json --mode comprehensive

# With custom output
npm run audit -- --input strategy.json --output my-audit-report.md
```

---

## 📋 Features

### 🔍 **5-Dimension Quality Assessment**

1. **Source Quality** (30% weight)
   - Checks if claims have sources
   - Assesses source credibility (Tier 1-4)
   - Identifies unsourced claims

2. **Fact Verification** (25% weight)
   - Detects verifiable claims (stats, numbers)
   - Flags claims needing verification
   - Optional web search for fact-checking

3. **Data Recency** (15% weight)
   - Checks source publication dates
   - Flags outdated information (>2 years)
   - Assesses data currency

4. **Cross-Verification** (15% weight)
   - Checks if claims have multiple sources
   - Reduces hallucination risk
   - Identifies single-source claims

5. **Production Readiness** (15% weight)
   - Assesses completeness
   - Checks for missing components
   - Validates structure

### 📊 **Detailed Reports**

- Overall quality score (0-10)
- Dimension breakdown with scores
- Critical issues, warnings, and strengths
- Prioritized recommendations
- Quality improvement plan with time estimates

---

## 📖 Usage Examples

### Example 1: Basic Audit

```bash
npm run audit -- --input ../horizon-brand-builder/output/flyberry/strategy/brand-strategy.json
```

**Output**: `audit-report-flyberry.md`

### Example 2: Comprehensive Audit

```bash
npm run audit -- \
  --input strategy.json \
  --mode comprehensive \
  --output comprehensive-audit.md \
  --format both
```

**Output**:
- `comprehensive-audit.md` (Markdown report)
- `comprehensive-audit.json` (JSON data)

### Example 3: Quick Audit

```bash
npm run audit -- -i strategy.json -m quick -o quick-audit.md
```

---

## 📁 Input Format

The auditor expects a JSON file with brand strategy structure:

```json
{
  "brandName": "Your Brand",
  "purpose": "Why the brand exists...",
  "mission": "What the brand does...",
  "vision": "Where the brand is going...",
  "values": ["Value 1", "Value 2"],
  "positioning": "Unique market position...",
  "proofPoints": [
    {
      "claim": "We are #1 in market",
      "evidence": "Market report 2024",
      "source": "McKinsey",
      "sourceUrl": "https://mckinsey.com/report"
    }
  ],
  "differentiators": ["Differentiator 1"],
  "keyMessages": ["Message 1"]
}
```

---

## 📊 Sample Output

```markdown
# Brand Quality Audit Report: Flyberry

**Generated**: 2025-10-11
**Overall Score**: 7.8/10 👍 Good - Minor improvements needed

### Dimension Scores:

| Dimension | Score | Status | Details |
|-----------|-------|--------|---------|
| Source Quality | 6.2/10 | 🟡 needs-work | 0/23 claims have sources |
| Fact Verification | 6.5/10 | 👍 good | 5 claims need verification |
| Data Recency | 5.0/10 | 🟡 needs-work | No source dates found |
| Cross-Verification | 4.0/10 | 🟡 needs-work | 0/23 claims cross-verified |
| Production Readiness | 8.0/10 | ✅ excellent | 5/5 components present |

## 🔍 Key Findings

### ⚠️ Critical Issues:
1. Only 0/23 claims have sources
   - Critical issue: Most claims lack source attribution

### 🟡 Warnings:
1. 5 claims need fact-checking
2. No source dates - cannot assess recency

## 🚀 Recommendations

### High Priority:
1. **Add source citations** (2-4 hours)
   - Impact: Increases credibility, reduces hallucination risk

2. **Verify statistical claims** (1-2 hours)
   - Impact: Ensures accuracy of market data

### Medium Priority:
3. **Add multiple sources for key claims** (3-5 hours)
   - Impact: Reduces hallucination risk

## 📈 Quality Improvement Plan

**Current**: 7.8/10 → **Target**: 9.0/10

**Steps**:
1. Add sources (7.8 → 8.3)
2. Verify claims (8.3 → 8.7)
3. Cross-verify (8.7 → 9.0)

**Effort**: 8-14 hours | **Expertise**: Mid-level analyst
```

---

## 🔧 CLI Options

```bash
audit-brand [options]

Required:
  --input, -i <file>       Brand strategy JSON file

Optional:
  --brand, -b <name>       Brand name (read from file if not provided)
  --output, -o <file>      Output path (default: audit-report-*.md)
  --mode, -m <mode>        quick | standard | comprehensive
  --format, -f <format>    json | markdown | both
  --web-search, -w <bool>  Enable web verification (requires API keys)
```

---

## 🔐 Environment Variables

For advanced features (web search, LLM evaluation):

```bash
# .env file
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_google_key
GOOGLE_SEARCH_ENGINE_ID=your_cse_id
```

---

## 🏗️ Architecture

```
brand-quality-auditor/
├── src/
│   ├── auditors/
│   │   ├── brand-strategy-auditor.ts    # Main auditor
│   │   ├── source-quality-assessor.ts   # Source quality (Tier 1-4)
│   │   ├── fact-checker-enhanced.ts     # Fact verification
│   │   ├── cross-source-verifier.ts     # Cross-verification
│   │   └── proof-point-validator.ts     # Proof point validation
│   ├── services/
│   │   ├── report-generator.ts          # Markdown/JSON reports
│   │   └── web-research-service.ts      # Google CSE integration
│   ├── cli/
│   │   └── audit-cli.ts                 # CLI interface
│   └── types/
│       └── audit-types.ts               # TypeScript types
└── package.json
```

---

## 💡 Integration with Horizon Brand Builder

### Workflow

```bash
# Step 1: Generate strategy with Horizon Brand Builder
cd ~/Development/horizon-brand-builder
npm run professional -- --brand "Enterprise Client"

# Step 2: Audit quality
cd ~/Development/brand-quality-auditor
npm run audit -- --input ../horizon-brand-builder/output/enterprise-client/strategy.json

# Step 3: Review report, fix issues

# Step 4: Re-audit after improvements
npm run audit -- --input ../horizon-brand-builder/output/enterprise-client/strategy-v2.json
```

---

## 🎯 When to Use

| Scenario | Audit Mode | Estimated Time |
|----------|-----------|----------------|
| Quick sanity check | `quick` | 30 sec |
| Standard quality check | `standard` | 1-2 min |
| Client deliverable | `comprehensive` | 3-5 min |
| Board presentation | `comprehensive` + web search | 5-10 min |

---

## 📦 Installation (Global)

```bash
npm run build
npm link

# Now use anywhere:
audit-brand --input /path/to/strategy.json
```

---

## 🚧 Roadmap

- [x] Basic 5-dimension auditing
- [x] Markdown report generation
- [x] JSON output
- [ ] Real web search integration (Google CSE)
- [ ] LLM² self-evaluation
- [ ] PDF export
- [ ] HTML dashboard
- [ ] Continuous monitoring

---

## 🤝 Contributing

This tool is designed to work with ANY brand strategy, not just from Horizon Brand Builder.

---

## 📝 License

MIT License - See LICENSE file

---

**Ready to verify your brand strategy?** 🏎️✨

```bash
npm install
npm run audit -- --input your-strategy.json
```
