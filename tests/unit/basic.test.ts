import { describe, it, expect } from 'vitest';

describe('Brand Quality Auditor - Basic Setup', () => {
  it('should have working test infrastructure', () => {
    expect(true).toBe(true);
  });

  it('should support TypeScript imports', () => {
    const testData = {
      brand: 'Test Brand',
      score: 85,
    };

    expect(testData.brand).toBe('Test Brand');
    expect(testData.score).toBeGreaterThan(0);
  });
});
