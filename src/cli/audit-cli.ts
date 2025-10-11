#!/usr/bin/env node
// Brand Quality Auditor CLI

import fs from 'fs/promises';
import path from 'path';
import { BrandStrategyAuditor } from '../auditors/brand-strategy-auditor.js';
import { AuditReportGenerator } from '../services/report-generator.js';
import type { BrandStrategy, AuditOptions } from '../types/audit-types.js';

interface CLIArgs {
  input?: string;
  brand?: string;
  mode?: 'quick' | 'standard' | 'comprehensive';
  output?: string;
  format?: 'json' | 'markdown' | 'both';
  webSearch?: boolean;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║         🏎️  BRAND QUALITY AUDITOR v1.0.0               ║
║         Ferrari-grade brand strategy verification       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

  // Validate inputs
  if (!args.input) {
    showUsage();
    process.exit(1);
  }

  try {
    // Load brand strategy
    console.log(`📂 Loading brand strategy from: ${args.input}\n`);
    const strategy = await loadStrategy(args.input);

    const brandName = args.brand || strategy.brandName || 'Unknown Brand';

    // Configure audit options
    const options: AuditOptions = {
      mode: args.mode || 'standard',
      enableWebSearch: args.webSearch || false,
      outputFormat: args.format || 'markdown',
    };

    // Run audit
    const auditor = new BrandStrategyAuditor();
    const result = await auditor.audit(strategy, brandName, options);

    // Generate report
    const reportGen = new AuditReportGenerator();

    if (args.format === 'json' || args.format === 'both') {
      const jsonPath = args.output?.replace('.md', '.json') || `audit-report-${brandName.toLowerCase().replace(/\s+/g, '-')}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
      console.log(`\n✅ JSON report saved: ${jsonPath}`);
    }

    if (args.format === 'markdown' || args.format === 'both' || !args.format) {
      const mdPath = args.output || `audit-report-${brandName.toLowerCase().replace(/\s+/g, '-')}.md`;
      await reportGen.generateMarkdownReport(result, mdPath);
      console.log(`\n✅ Markdown report saved: ${mdPath}`);
    }

    // Summary
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  AUDIT COMPLETE                                          ║
╚══════════════════════════════════════════════════════════╝

📊 Overall Score: ${result.overallScore}/10 ${getScoreEmoji(result.overallScore)}

Findings:
  ${result.findings.filter(f => f.severity === 'critical').length} Critical Issues
  ${result.findings.filter(f => f.severity === 'warning').length} Warnings
  ${result.findings.filter(f => f.severity === 'success').length} Strengths

Recommendations: ${result.recommendations.length} actions identified

Next Steps:
  1. Review the audit report: ${args.output || 'audit-report-*.md'}
  2. Address critical issues first
  3. Re-run audit after fixes

Run: audit-brand --input ${args.input} --output updated-audit.md
`);

  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function parseArgs(argv: string[]): CLIArgs {
  const args: CLIArgs = {};

  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];

    if (key && value) {
      switch (key) {
        case 'input':
        case 'i':
          args.input = value;
          break;
        case 'brand':
        case 'b':
          args.brand = value;
          break;
        case 'output':
        case 'o':
          args.output = value;
          break;
        case 'mode':
        case 'm':
          args.mode = value as any;
          break;
        case 'format':
        case 'f':
          args.format = value as any;
          break;
        case 'web-search':
        case 'w':
          args.webSearch = value === 'true' || value === '1';
          break;
      }
    }
  }

  return args;
}

async function loadStrategy(inputPath: string): Promise<BrandStrategy> {
  const content = await fs.readFile(inputPath, 'utf-8');
  return JSON.parse(content);
}

function getScoreEmoji(score: number): string {
  if (score >= 9) return '🌟';
  if (score >= 8) return '✅';
  if (score >= 7) return '👍';
  if (score >= 6) return '🟡';
  if (score >= 5) return '⚠️';
  return '❌';
}

function showUsage() {
  console.log(`
Usage: audit-brand --input <strategy-file> [options]

Options:
  --input, -i <file>       Path to brand strategy JSON file (required)
  --brand, -b <name>       Brand name (optional, read from file if not provided)
  --output, -o <file>      Output file path (default: audit-report-*.md)
  --mode, -m <mode>        Audit mode: quick | standard | comprehensive (default: standard)
  --format, -f <format>    Output format: json | markdown | both (default: markdown)
  --web-search, -w <bool>  Enable web search verification (default: false)

Examples:
  # Basic audit
  audit-brand --input strategy.json

  # Comprehensive audit with custom output
  audit-brand --input strategy.json --mode comprehensive --output audit.md

  # Audit with web verification (requires API keys)
  audit-brand --input strategy.json --web-search true --format both

  # Quick audit
  audit-brand -i strategy.json -m quick -o quick-audit.md
`);
}

// Run CLI
if (import.meta.url.startsWith('file://')) {
  const modulePath = decodeURIComponent(new URL(import.meta.url).pathname);
  if (process.argv[1] && modulePath === process.argv[1]) {
    main().catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
  }
}

export { main };
