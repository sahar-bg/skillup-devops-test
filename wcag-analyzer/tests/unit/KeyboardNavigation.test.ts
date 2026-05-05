/**
 * Unit tests for KeyboardNavigationRule
 * Tests WCAG 2.1 Success Criterion 2.1.1 (Keyboard)
 */

import { KeyboardNavigationRule } from '../../src/rules/KeyboardNavigationRule';
import { ComponentInfo, JSXElementInfo, SourceLocation } from '../../src/types';

describe('KeyboardNavigationRule', () => {
  let rule: KeyboardNavigationRule;

  beforeEach(() => {
    rule = new KeyboardNavigationRule();
  });

  const createMockComponent = (jsxElements: JSXElementInfo[]): ComponentInfo => ({
    name: 'TestComponent',
    filePath: '/test/TestComponent.tsx',
    ast: {} as any,
    dependencies: [],
    props: [],
    jsxElements
  });

  const createMockLocation = (): SourceLocation => ({
    filePath: '/test/TestComponent.tsx',
    line: 10,
    column: 5
  });

  describe('Rule metadata', () => {
    it('should have correct rule ID', () => {
      expect(rule.id).toBe('2.1.1');
    });

    it('should have correct rule name', () => {
      expect(rule.name).toBe('Keyboard');
    });

    it('should be Level A conformance', () => {
      expect(rule.level).toBe('A');
    });
  });

  describe('Native interactive elements', () => {
    it('should not report violation for button without tabIndex', () => {
      const button: JSXElementInfo = {
        type: 'button',
        attributes: [{ name: 'onClick', value: 'handleClick' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([button]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for button with tabIndex 0', () => {
      const button: JSXElementInfo = {
        type: 'button',
        attributes: [
          { name: 'onClick', value: 'handleClick' },
          { name: 'tabIndex', value: '0' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([button]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should report violation for button with negative tabIndex', () => {
      const button: JSXElementInfo = {
        type: 'button',
        attributes: [
          { name: 'onClick', value: 'handleClick' },
          { name: 'tabIndex', value: '-1' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([button]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
      expect(violations[0].ruleId).toBe('2.1.1');
      expect(violations[0].message).toContain('negative tabIndex');
    });

    it('should not report violation for link element', () => {
      const link: JSXElementInfo = {
        type: 'a',
        attributes: [{ name: 'href', value: '#' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([link]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for input element', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [{ name: 'type', value: 'text' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });
  });

  describe('Custom interactive elements with onClick', () => {
    it('should report violation for div with onClick but no keyboard support', () => {
      const div: JSXElementInfo = {
        type: 'div',
        attributes: [{ name: 'onClick', value: 'handleClick' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([div]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
      expect(violations[0].ruleId).toBe('2.1.1');
      expect(violations[0].message).toContain('onClick handler lacks keyboard support');
    });

    it('should not report violation for div with onClick and onKeyDown', () => {
      const div: JSXElementInfo = {
        type: 'div',
        attributes: [
          { name: 'onClick', value: 'handleClick' },
          { name: 'onKeyDown', value: 'handleKeyDown' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([div]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for div with onClick and tabIndex', () => {
      const div: JSXElementInfo = {
        type: 'div',
        attributes: [
          { name: 'onClick', value: 'handleClick' },
          { name: 'tabIndex', value: '0' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([div]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for div with onClick and role="button"', () => {
      const div: JSXElementInfo = {
        type: 'div',
        attributes: [
          { name: 'onClick', value: 'handleClick' },
          { name: 'role', value: 'button' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([div]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should report violation for span with onClick but no keyboard support', () => {
      const span: JSXElementInfo = {
        type: 'span',
        attributes: [{ name: 'onClick', value: 'handleClick' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([span]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
    });
  });

  describe('Elements with ARIA roles', () => {
    it('should report violation for element with role="button" and negative tabIndex', () => {
      const div: JSXElementInfo = {
        type: 'div',
        attributes: [
          { name: 'role', value: 'button' },
          { name: 'tabIndex', value: '-1' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([div]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('negative tabIndex');
    });

    it('should not report violation for element with role="button" and tabIndex 0', () => {
      const div: JSXElementInfo = {
        type: 'div',
        attributes: [
          { name: 'role', value: 'button' },
          { name: 'tabIndex', value: '0' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([div]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });
  });

  describe('Non-interactive elements', () => {
    it('should not report violation for div without onClick', () => {
      const div: JSXElementInfo = {
        type: 'div',
        attributes: [],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([div]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for span without onClick', () => {
      const span: JSXElementInfo = {
        type: 'span',
        attributes: [{ name: 'className', value: 'text' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([span]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });
  });

  describe('Nested elements', () => {
    it('should detect violations in nested children', () => {
      const nestedDiv: JSXElementInfo = {
        type: 'div',
        attributes: [{ name: 'onClick', value: 'handleClick' }],
        children: [],
        location: createMockLocation()
      };
      const parent: JSXElementInfo = {
        type: 'div',
        attributes: [],
        children: [nestedDiv],
        location: createMockLocation()
      };
      const component = createMockComponent([parent]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
    });
  });

  describe('Recommendation content', () => {
    it('should include helpful recommendation for negative tabIndex', () => {
      const button: JSXElementInfo = {
        type: 'button',
        attributes: [{ name: 'tabIndex', value: '-1' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([button]);

      const violations = rule.check(component);

      expect(violations[0].recommendation.description).toContain('Remove the negative tabIndex');
      expect(violations[0].recommendation.codeExample).toBeTruthy();
      expect(violations[0].recommendation.documentationUrl).toContain('w3.org');
      expect(violations[0].recommendation.estimatedEffort).toBe('quick');
    });

    it('should include helpful recommendation for onClick without keyboard', () => {
      const div: JSXElementInfo = {
        type: 'div',
        attributes: [{ name: 'onClick', value: 'handleClick' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([div]);

      const violations = rule.check(component);

      expect(violations[0].recommendation.description).toContain('keyboard event handlers');
      expect(violations[0].recommendation.alternatives).toBeDefined();
      expect(violations[0].recommendation.alternatives!.length).toBeGreaterThan(0);
    });
  });
});
