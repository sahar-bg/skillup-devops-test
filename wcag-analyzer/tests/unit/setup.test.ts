/**
 * Basic setup test to verify Jest configuration
 */

describe('WCAG Analyzer Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should be able to import from types module', () => {
    const types = require('../../src/types');
    expect(types).toBeDefined();
  });
});
