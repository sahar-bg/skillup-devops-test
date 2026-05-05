/**
 * Unit tests for FormLabelRule
 * Tests WCAG 2.1 Success Criterion 3.3.2 (Labels or Instructions)
 */

import { FormLabelRule } from '../../src/rules/FormLabelRule';
import { ComponentInfo, JSXElementInfo, SourceLocation } from '../../src/types';

describe('FormLabelRule', () => {
  let rule: FormLabelRule;

  beforeEach(() => {
    rule = new FormLabelRule();
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
      expect(rule.id).toBe('3.3.2');
    });

    it('should have correct rule name', () => {
      expect(rule.name).toBe('Labels or Instructions');
    });

    it('should be Level A conformance', () => {
      expect(rule.level).toBe('A');
    });
  });

  describe('Inputs with labels', () => {
    it('should not report violation for input with aria-label', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [
          { name: 'type', value: 'text' },
          { name: 'aria-label', value: 'Email address' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for input with aria-labelledby', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [
          { name: 'type', value: 'text' },
          { name: 'aria-labelledby', value: 'email-label' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for input with id (assumes label exists)', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [
          { name: 'type', value: 'text' },
          { name: 'id', value: 'email-input' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for input with placeholder', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [
          { name: 'type', value: 'text' },
          { name: 'placeholder', value: 'Enter your email' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for input with title', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [
          { name: 'type', value: 'text' },
          { name: 'title', value: 'Email address' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });
  });

  describe('Inputs without labels', () => {
    it('should report violation for input without any label', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [{ name: 'type', value: 'text' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
      expect(violations[0].ruleId).toBe('3.3.2');
      expect(violations[0].message).toContain('lacks an accessible label');
    });

    it('should report violation for input with empty aria-label', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [
          { name: 'type', value: 'text' },
          { name: 'aria-label', value: '' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
    });

    it('should report violation for input with whitespace-only aria-label', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [
          { name: 'type', value: 'text' },
          { name: 'aria-label', value: '   ' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
    });
  });

  describe('Different form element types', () => {
    it('should check textarea elements', () => {
      const textarea: JSXElementInfo = {
        type: 'textarea',
        attributes: [],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([textarea]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('textarea');
    });

    it('should check select elements', () => {
      const select: JSXElementInfo = {
        type: 'select',
        attributes: [],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([select]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('select');
    });

    it('should not report violation for textarea with aria-label', () => {
      const textarea: JSXElementInfo = {
        type: 'textarea',
        attributes: [{ name: 'aria-label', value: 'Comments' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([textarea]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });
  });

  describe('Hidden inputs', () => {
    it('should not report violation for hidden input', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [{ name: 'type', value: 'hidden' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });

    it('should not report violation for input with aria-hidden', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [
          { name: 'type', value: 'text' },
          { name: 'aria-hidden', value: 'true' }
        ],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });
  });

  describe('Non-form elements', () => {
    it('should not check non-form elements', () => {
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

    it('should not check button elements', () => {
      const button: JSXElementInfo = {
        type: 'button',
        attributes: [],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([button]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(0);
    });
  });

  describe('Nested elements', () => {
    it('should detect violations in nested form inputs', () => {
      const nestedInput: JSXElementInfo = {
        type: 'input',
        attributes: [{ name: 'type', value: 'text' }],
        children: [],
        location: createMockLocation()
      };
      const parent: JSXElementInfo = {
        type: 'div',
        attributes: [],
        children: [nestedInput],
        location: createMockLocation()
      };
      const component = createMockComponent([parent]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(1);
    });

    it('should detect multiple violations', () => {
      const input1: JSXElementInfo = {
        type: 'input',
        attributes: [{ name: 'type', value: 'text' }],
        children: [],
        location: createMockLocation()
      };
      const input2: JSXElementInfo = {
        type: 'input',
        attributes: [{ name: 'type', value: 'email' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input1, input2]);

      const violations = rule.check(component);

      expect(violations).toHaveLength(2);
    });
  });

  describe('Recommendation content', () => {
    it('should include helpful recommendations', () => {
      const input: JSXElementInfo = {
        type: 'input',
        attributes: [{ name: 'type', value: 'text' }],
        children: [],
        location: createMockLocation()
      };
      const component = createMockComponent([input]);

      const violations = rule.check(component);

      expect(violations[0].recommendation.description).toContain('Add a label');
      expect(violations[0].recommendation.codeExample).toBeTruthy();
      expect(violations[0].recommendation.documentationUrl).toContain('w3.org');
      expect(violations[0].recommendation.estimatedEffort).toBe('quick');
      expect(violations[0].recommendation.alternatives).toBeDefined();
      expect(violations[0].recommendation.alternatives!.length).toBeGreaterThan(0);
    });
  });
});
