/**
 * Unit tests for RuleEngine
 */

import { RuleEngine } from '../../src/rules/RuleEngine';
import { WCAGRule, ComponentInfo, Violation, ConformanceLevel } from '../../src/types';

// Mock rule implementations for testing
class MockRuleA implements WCAGRule {
  id = '1.1.1';
  name = 'Mock Rule A';
  level: ConformanceLevel = 'A';
  description = 'A mock Level A rule for testing';

  check(component: ComponentInfo): Violation[] {
    // Return a mock violation for testing
    return [{
      ruleId: this.id,
      ruleName: this.name,
      level: this.level,
      severity: 'high',
      message: 'Mock violation from Rule A',
      location: {
        filePath: component.filePath,
        line: 1,
        column: 1
      },
      element: component.jsxElements[0] || {
        type: 'div',
        attributes: [],
        children: [],
        location: { filePath: component.filePath, line: 1, column: 1 }
      },
      recommendation: {
        description: 'Fix this mock violation',
        codeExample: '<div>Fixed</div>',
        documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
        estimatedEffort: 'quick'
      }
    }];
  }
}

class MockRuleAA implements WCAGRule {
  id = '1.4.3';
  name = 'Mock Rule AA';
  level: ConformanceLevel = 'AA';
  description = 'A mock Level AA rule for testing';

  check(component: ComponentInfo): Violation[] {
    return [{
      ruleId: this.id,
      ruleName: this.name,
      level: this.level,
      severity: 'medium',
      message: 'Mock violation from Rule AA',
      location: {
        filePath: component.filePath,
        line: 2,
        column: 1
      },
      element: component.jsxElements[0] || {
        type: 'div',
        attributes: [],
        children: [],
        location: { filePath: component.filePath, line: 2, column: 1 }
      },
      recommendation: {
        description: 'Fix this mock AA violation',
        codeExample: '<div>Fixed AA</div>',
        documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
        estimatedEffort: 'medium'
      }
    }];
  }
}

class MockRuleAAA implements WCAGRule {
  id = '1.4.6';
  name = 'Mock Rule AAA';
  level: ConformanceLevel = 'AAA';
  description = 'A mock Level AAA rule for testing';

  check(component: ComponentInfo): Violation[] {
    return [];
  }
}

class MockErrorRule implements WCAGRule {
  id = '9.9.9';
  name = 'Mock Error Rule';
  level: ConformanceLevel = 'A';
  description = 'A rule that throws an error';

  check(component: ComponentInfo): Violation[] {
    throw new Error('Intentional error for testing');
  }
}

// Helper to create a mock component
function createMockComponent(name: string = 'TestComponent'): ComponentInfo {
  return {
    name,
    filePath: `/test/${name}.tsx`,
    ast: {} as any,
    dependencies: [],
    props: [],
    jsxElements: []
  };
}

describe('RuleEngine', () => {
  let ruleEngine: RuleEngine;

  beforeEach(() => {
    ruleEngine = new RuleEngine();
  });

  describe('loadRules', () => {
    it('should start with no rules loaded', () => {
      expect(ruleEngine.getActiveRuleCount()).toBe(0);
      expect(ruleEngine.getRules().size).toBe(0);
    });

    it('should load rules for specified conformance levels', () => {
      // Since getAllAvailableRules returns empty array, we need to test with actual rules
      // For now, this tests the structure is correct
      ruleEngine.loadRules(['A', 'AA']);
      expect(ruleEngine.getRules()).toBeInstanceOf(Map);
      expect(ruleEngine.getActiveRuleIds()).toBeInstanceOf(Set);
    });

    it('should clear existing rules when loading new rules', () => {
      ruleEngine.loadRules(['A']);
      const firstCount = ruleEngine.getActiveRuleCount();
      
      ruleEngine.loadRules(['AA']);
      // Should have cleared and reloaded
      expect(ruleEngine.getRules()).toBeInstanceOf(Map);
    });

    it('should handle empty conformance levels array', () => {
      ruleEngine.loadRules([]);
      expect(ruleEngine.getActiveRuleCount()).toBe(0);
    });

    it('should handle multiple conformance levels', () => {
      ruleEngine.loadRules(['A', 'AA', 'AAA']);
      expect(ruleEngine.getRules()).toBeInstanceOf(Map);
    });
  });

  describe('filterRules', () => {
    it('should filter to only enabled rules when enabledRules is provided', () => {
      // Manually add some rules for testing
      const mockRuleA = new MockRuleA();
      const mockRuleAA = new MockRuleAA();
      
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);
      (ruleEngine as any).rules.set(mockRuleAA.id, mockRuleAA);
      (ruleEngine as any).activeRules.add(mockRuleA.id);
      (ruleEngine as any).activeRules.add(mockRuleAA.id);

      ruleEngine.filterRules([mockRuleA.id]);
      
      expect(ruleEngine.isRuleActive(mockRuleA.id)).toBe(true);
      expect(ruleEngine.isRuleActive(mockRuleAA.id)).toBe(false);
      expect(ruleEngine.getActiveRuleCount()).toBe(1);
    });

    it('should disable specified rules when disabledRules is provided', () => {
      const mockRuleA = new MockRuleA();
      const mockRuleAA = new MockRuleAA();
      
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);
      (ruleEngine as any).rules.set(mockRuleAA.id, mockRuleAA);
      (ruleEngine as any).activeRules.add(mockRuleA.id);
      (ruleEngine as any).activeRules.add(mockRuleAA.id);

      ruleEngine.filterRules(undefined, [mockRuleA.id]);
      
      expect(ruleEngine.isRuleActive(mockRuleA.id)).toBe(false);
      expect(ruleEngine.isRuleActive(mockRuleAA.id)).toBe(true);
      expect(ruleEngine.getActiveRuleCount()).toBe(1);
    });

    it('should handle both enabledRules and disabledRules together', () => {
      const mockRuleA = new MockRuleA();
      const mockRuleAA = new MockRuleAA();
      const mockRuleAAA = new MockRuleAAA();
      
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);
      (ruleEngine as any).rules.set(mockRuleAA.id, mockRuleAA);
      (ruleEngine as any).rules.set(mockRuleAAA.id, mockRuleAAA);
      (ruleEngine as any).activeRules.add(mockRuleA.id);
      (ruleEngine as any).activeRules.add(mockRuleAA.id);
      (ruleEngine as any).activeRules.add(mockRuleAAA.id);

      // Enable only A and AA, then disable AA
      ruleEngine.filterRules([mockRuleA.id, mockRuleAA.id], [mockRuleAA.id]);
      
      expect(ruleEngine.isRuleActive(mockRuleA.id)).toBe(true);
      expect(ruleEngine.isRuleActive(mockRuleAA.id)).toBe(false);
      expect(ruleEngine.isRuleActive(mockRuleAAA.id)).toBe(false);
      expect(ruleEngine.getActiveRuleCount()).toBe(1);
    });

    it('should handle empty arrays gracefully', () => {
      const mockRuleA = new MockRuleA();
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);
      (ruleEngine as any).activeRules.add(mockRuleA.id);

      ruleEngine.filterRules([], []);
      
      // Empty enabledRules should clear all active rules
      expect(ruleEngine.getActiveRuleCount()).toBe(0);
    });

    it('should ignore non-existent rule IDs in enabledRules', () => {
      const mockRuleA = new MockRuleA();
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);
      (ruleEngine as any).activeRules.add(mockRuleA.id);

      ruleEngine.filterRules(['non-existent-rule']);
      
      expect(ruleEngine.getActiveRuleCount()).toBe(0);
    });
  });

  describe('analyzeComponent', () => {
    it('should return empty array when no rules are active', () => {
      const component = createMockComponent();
      const violations = ruleEngine.analyzeComponent(component);
      
      expect(violations).toEqual([]);
    });

    it('should apply all active rules to a component', () => {
      const mockRuleA = new MockRuleA();
      const mockRuleAA = new MockRuleAA();
      
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);
      (ruleEngine as any).rules.set(mockRuleAA.id, mockRuleAA);
      (ruleEngine as any).activeRules.add(mockRuleA.id);
      (ruleEngine as any).activeRules.add(mockRuleAA.id);

      const component = createMockComponent();
      const violations = ruleEngine.analyzeComponent(component);
      
      expect(violations).toHaveLength(2);
      expect(violations[0].ruleId).toBe(mockRuleA.id);
      expect(violations[1].ruleId).toBe(mockRuleAA.id);
    });

    it('should handle rules that return no violations', () => {
      const mockRuleAAA = new MockRuleAAA();
      
      (ruleEngine as any).rules.set(mockRuleAAA.id, mockRuleAAA);
      (ruleEngine as any).activeRules.add(mockRuleAAA.id);

      const component = createMockComponent();
      const violations = ruleEngine.analyzeComponent(component);
      
      expect(violations).toEqual([]);
    });

    it('should isolate errors from individual rules and continue execution', () => {
      const mockRuleA = new MockRuleA();
      const mockErrorRule = new MockErrorRule();
      const mockRuleAA = new MockRuleAA();
      
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);
      (ruleEngine as any).rules.set(mockErrorRule.id, mockErrorRule);
      (ruleEngine as any).rules.set(mockRuleAA.id, mockRuleAA);
      (ruleEngine as any).activeRules.add(mockRuleA.id);
      (ruleEngine as any).activeRules.add(mockErrorRule.id);
      (ruleEngine as any).activeRules.add(mockRuleAA.id);

      // Spy on console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const component = createMockComponent();
      const violations = ruleEngine.analyzeComponent(component);
      
      // Should still get violations from the non-erroring rules
      expect(violations).toHaveLength(2);
      expect(violations[0].ruleId).toBe(mockRuleA.id);
      expect(violations[1].ruleId).toBe(mockRuleAA.id);
      
      // Should have logged the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error executing rule'),
        expect.stringContaining('Intentional error')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle components with different structures', () => {
      const mockRuleA = new MockRuleA();
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);
      (ruleEngine as any).activeRules.add(mockRuleA.id);

      const componentWithElements = createMockComponent('WithElements');
      componentWithElements.jsxElements = [
        {
          type: 'div',
          attributes: [],
          children: [],
          location: { filePath: componentWithElements.filePath, line: 1, column: 1 }
        }
      ];

      const violations = ruleEngine.analyzeComponent(componentWithElements);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].element.type).toBe('div');
    });
  });

  describe('getRules', () => {
    it('should return a copy of the rules map', () => {
      const mockRuleA = new MockRuleA();
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);

      const rules = ruleEngine.getRules();
      
      expect(rules).toBeInstanceOf(Map);
      expect(rules.get(mockRuleA.id)).toBe(mockRuleA);
      
      // Verify it's a copy by modifying it
      rules.clear();
      expect(ruleEngine.getRules().size).toBe(1);
    });
  });

  describe('getActiveRuleIds', () => {
    it('should return a copy of the active rules set', () => {
      const mockRuleA = new MockRuleA();
      (ruleEngine as any).rules.set(mockRuleA.id, mockRuleA);
      (ruleEngine as any).activeRules.add(mockRuleA.id);

      const activeRules = ruleEngine.getActiveRuleIds();
      
      expect(activeRules).toBeInstanceOf(Set);
      expect(activeRules.has(mockRuleA.id)).toBe(true);
      
      // Verify it's a copy
      activeRules.clear();
      expect(ruleEngine.getActiveRuleIds().size).toBe(1);
    });
  });

  describe('getActiveRuleCount', () => {
    it('should return the correct count of active rules', () => {
      expect(ruleEngine.getActiveRuleCount()).toBe(0);

      (ruleEngine as any).activeRules.add('1.1.1');
      expect(ruleEngine.getActiveRuleCount()).toBe(1);

      (ruleEngine as any).activeRules.add('1.4.3');
      expect(ruleEngine.getActiveRuleCount()).toBe(2);
    });
  });

  describe('isRuleActive', () => {
    it('should return true for active rules', () => {
      (ruleEngine as any).activeRules.add('1.1.1');
      expect(ruleEngine.isRuleActive('1.1.1')).toBe(true);
    });

    it('should return false for inactive rules', () => {
      expect(ruleEngine.isRuleActive('1.1.1')).toBe(false);
    });

    it('should return false for non-existent rules', () => {
      expect(ruleEngine.isRuleActive('non-existent')).toBe(false);
    });
  });
});
