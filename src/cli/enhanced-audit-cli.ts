#!/usr/bin/env node
// Enhanced Brand Quality Audit CLI
// Now with fact extraction, variance validation, and enhanced source tiering

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { EnhancedBrandStrategyAuditor } from '../auditors/enhanced-brand-strategy-auditor.js';
import { AuditReportGenerator } from '../services/report-generator.js';
import type { BrandStrategy, AuditOptions } from '../types/audit-types.js';

// CLI argument parsing
function parseArgs(): {
  inputFile: string;
  outputFile?: string;
  brandName?: string;
  mode?: 'quick' | 'standard' | 'comprehensive';
  format?: 'json' | 'markdown' | 'both';
} {
  const args = process.argv.slice(2);
  const config: any = {
    mode: 'comprehensive', // Default to comprehensive for enhanced features
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        config.inputFile = args[++i];
        break;
      case '--output':
      case '-o':
        config.outputFile = args[++i];
        break;
      case '--brand':
      case '-b':
        config.brandName = args[++i];
        break;
      case '--mode':
      case '-m':
        config.mode = args[++i];
        break;
      case '--format':
      case '-f':
        config.format = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  if (!config.inputFile) {
    console.error('Error: Input file is required');
    printHelp();
    process.exit(1);
  }

  return config;
}

function printHelp() {
  console.log(`
🏎️  ENHANCED Brand Quality Auditor CLI

Usage: enhanced-audit-cli [options]

Required:
  --input, -i <file>       Brand strategy JSON file

Optional:
  --brand, -b <name>       Brand name (extracted from file if not provided)
  --output, -o <file>      Output file path (default: enhanced-audit-report-*.md)
  --mode, -m <mode>        Audit mode: quick | standard | comprehensive
  --format, -f <format>    Output format: json | markdown | both
  --help, -h               Show this help message

Features:
  ✅ Fact Triple Extraction - Structured (subject, predicate, value)
  ✅ Variance Validation - Cross-source numeric verification
  ✅ Enhanced Source Tiering - 4-tier credibility assessment
  ✅ Statistical Analysis - Mean, variance, outlier detection

Examples:
  enhanced-audit-cli --input strategy.json
  enhanced-audit-cli -i strategy.json -o audit.md -m comprehensive
  enhanced-audit-cli --input strategy.json --format both
`);
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🚀 ENHANCED BRAND QUALITY AUDITOR v2.0.0           ║
║     With Fact Extraction & Variance Validation          ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

  try {
    // Parse command line arguments
    const config = parseArgs();

    // Load brand strategy
    console.log(`\n📂 Loading brand strategy from: ${config.inputFile}\n`);
    const strategyPath = resolve(process.cwd(), config.inputFile);
    const strategyContent = readFileSync(strategyPath, 'utf-8');
    const strategy: BrandStrategy = JSON.parse(strategyContent);

    // Extract brand name
    const brandName = config.brandName ||
                     strategy.brandName ||
                     config.inputFile.replace(/.*\//, '').replace(/\.json$/, '');

    // Configure audit options
    const options: AuditOptions = {
      mode: config.mode,
      outputFormat: config.format,
    };

    // Run enhanced audit
    const auditor = new EnhancedBrandStrategyAuditor();
    const result = await auditor.audit(strategy, brandName, options);

    // Display enhanced features
    if (result.factAnalysis) {
      console.log('\n📊 FACT ANALYSIS RESULTS:');
      console.log(`   Extracted Triples: ${result.factAnalysis.extractedTriples.length}`);
      console.log(`   Extraction Rate: ${(result.factAnalysis.extractionRate * 100).toFixed(1)}%`);
      console.log(`   High Priority Facts: ${result.factAnalysis.highPriorityFacts.length}`);
    }

    if (result.varianceAnalysis) {
      console.log('\n📈 VARIANCE ANALYSIS:');
      console.log(`   Total Claims: ${result.varianceAnalysis.totalClaims}`);
      console.log(`   Flagged for Variance: ${result.varianceAnalysis.flaggedClaims}`);
      console.log(`   Average Variance: ${(result.varianceAnalysis.averageVariance * 100).toFixed(1)}%`);
    }

    if (result.sourceAnalysis) {
      console.log('\n🔍 SOURCE TIERING:');
      console.log(`   Average Tier: ${result.sourceAnalysis.averageTier.toFixed(1)}`);
      console.log(`   Tier 1 (Highest): ${result.sourceAnalysis.tier1Count}`);
      console.log(`   Tier 2 (Good): ${result.sourceAnalysis.tier2Count}`);
      console.log(`   Tier 3 (Moderate): ${result.sourceAnalysis.tier3Count}`);
      console.log(`   Tier 4 (Low): ${result.sourceAnalysis.tier4Count}`);
    }

    // Generate reports
    const reportGenerator = new AuditReportGenerator();

    // Determine output file paths
    const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
    const defaultOutput = `enhanced-audit-report-${brandSlug}.md`;
    const outputPath = config.outputFile || defaultOutput;

    // Generate and save reports based on format
    if (!config.format || config.format === 'markdown' || config.format === 'both') {
      const markdownReport = await reportGenerator.generateMarkdownReport(result);
      const mdPath = resolve(process.cwd(), outputPath);
      writeFileSync(mdPath, markdownReport);
      console.log(`\n✅ Enhanced Markdown report saved: ${outputPath}`);
    }

    if (config.format === 'json' || config.format === 'both') {
      const jsonPath = outputPath.replace(/\.md$/, '.json');
      const fullJsonPath = resolve(process.cwd(), jsonPath);
      writeFileSync(fullJsonPath, JSON.stringify(result, null, 2));
      console.log(`✅ Enhanced JSON report saved: ${jsonPath}`);
    }

    // Display summary with enhanced metrics
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  ENHANCED AUDIT COMPLETE                                 ║
╚══════════════════════════════════════════════════════════╝

📊 Overall Score: ${result.overallScore}/10 ${getScoreEmoji(result.overallScore)}

Key Metrics:
  📝 Fact Triples Extracted: ${result.factAnalysis?.extractedTriples.length || 0}
  📊 Variance Issues: ${result.varianceAnalysis?.flaggedClaims || 0}
  🔍 Source Quality: Tier ${result.sourceAnalysis?.averageTier.toFixed(1) || 'N/A'}

Findings:
  ${result.findings.filter(f => f.severity === 'critical').length} Critical Issues
  ${result.findings.filter(f => f.severity === 'warning').length} Warnings
  ${result.findings.filter(f => f.severity === 'success').length} Strengths

Recommendations: ${result.recommendations.length} actions identified

Next Steps:
  1. Review the enhanced audit report: ${outputPath}
  2. Verify high-priority facts
  3. Address variance issues
  4. Upgrade low-tier sources

Run: enhanced-audit-cli --input ${config.inputFile} --output updated-audit.md
`);

  } catch (error) {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
  }
}

function getScoreEmoji(score: number): string {
  if (score >= 8) return '🟢';
  if (score >= 6) return '🟡';
  if (score >= 4) return '🟠';
  return '🔴';
}

// Run the CLI
main().catch(console.error);