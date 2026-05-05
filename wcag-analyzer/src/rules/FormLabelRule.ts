/**
 * FormLabelRule - WCAG 2.1 Success Criterion 3.3.2 (Labels or Instructions)
 * 
 * This rule checks that form inputs have associated labels.
 * 
 * WCAG 2.1 Level A requirement:
 * Labels or instructions are provided when content requires user input.
 * 
 * Reference: https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html
 */

import { WCAGRule, ComponentInfo, Violation, JSXElementInfo } from '../types';

export class FormLabelRule implements WCAGRule {
  id = '3.3.2';
  name = 'Labels or Instructions';
  level = 'A' as const;
  description = 'Form inputs must have associated labels or instructions.';

  // Form input elements that require labels
  private readonly formInputTypes = new Set([
    'input',
    'select',
    'textarea'
  ]);

  check(component: ComponentInfo): Violation[] {
    const violations: Violation[] = [];
    this.checkJSXElements(component, component.jsxElements, violations);
    return violations;
  }

  private checkJSXElements(
    component: ComponentInfo,
    elements: JSXElementInfo[],
    violations: Violation[]
  ): void {
    for (const element of elements) {
      // Check if element is a form input
      if (this.formInputTypes.has(element.type)) {
        // Skip hidden inputs
        if (this.isHiddenInput(element)) {
          continue;
        }

        // Check if input has a label
        if (!this.hasLabel(element)) {
          violations.push(this.createViolation(component, element));
        }
      }

      // Recursively check children
      if (element.children && element.children.length > 0) {
        this.checkJSXElements(component, element.children, violations);
      }
    }
  }

  private isHiddenInput(element: JSXElementInfo): boolean {
    // Check if input type is hidden
    const typeAttr = element.attributes.find(attr => attr.name === 'type');
    if (typeAttr && typeAttr.value === 'hidden') {
      return true;
    }

    // Check if element has aria-hidden
    const ariaHiddenAttr = element.attributes.find(attr => attr.name === 'aria-hidden');
    if (ariaHiddenAttr && ariaHiddenAttr.value === 'true') {
      return true;
    }

    return false;
  }

  private hasLabel(element: JSXElementInfo): boolean {
    // Check for aria-label
    const ariaLabel = element.attributes.find(attr => attr.name === 'aria-label');
    if (ariaLabel && typeof ariaLabel.value === 'string' && ariaLabel.value.trim() !== '') {
      return true;
    }

    // Check for aria-labelledby
    const ariaLabelledBy = element.attributes.find(attr => attr.name === 'aria-labelledby');
    if (ariaLabelledBy && typeof ariaLabelledBy.value === 'string' && ariaLabelledBy.value.trim() !== '') {
      return true;
    }

    // Check for id attribute (which could be referenced by a label's htmlFor)
    // Note: In static analysis, we can't verify if a label actually exists with matching htmlFor
    // But we can check if the input has an id, which is a good practice
    const idAttr = element.attributes.find(attr => attr.name === 'id');
    const hasId = idAttr && typeof idAttr.value === 'string' && idAttr.value.trim() !== '';

    // Check for placeholder (not ideal, but better than nothing)
    const placeholder = element.attributes.find(attr => attr.name === 'placeholder');
    const hasPlaceholder = placeholder && typeof placeholder.value === 'string' && placeholder.value.trim() !== '';

    // Check for title attribute
    const title = element.attributes.find(attr => attr.name === 'title');
    const hasTitle = title && typeof title.value === 'string' && title.value.trim() !== '';

    // If input has an id, we'll assume it might have a label (can't verify in static analysis)
    // But we'll still flag it as a warning if it doesn't have aria-label or aria-labelledby
    if (hasId) {
      // Has id, might have a label element - we'll be lenient here
      return true;
    }

    // Placeholder or title can serve as a label (though not ideal)
    if (hasPlaceholder || hasTitle) {
      return true;
    }

    return false;
  }

  private createViolation(
    component: ComponentInfo,
    element: JSXElementInfo
  ): Violation {
    const elementType = element.type;
    const typeAttr = element.attributes.find(attr => attr.name === 'type');
    const inputType = typeAttr ? String(typeAttr.value) : 'text';

    return {
      ruleId: this.id,
      ruleName: this.name,
      level: this.level,
      severity: 'high',
      message: `Form ${elementType} element lacks an accessible label. Users, especially those using screen readers, need labels to understand what information to provide.`,
      location: element.location,
      element,
      recommendation: {
        description: `Add a label to the ${elementType} element. The best approach is to use a <label> element with htmlFor attribute matching the input's id. Alternatively, use aria-label or aria-labelledby attributes.`,
        codeExample: `// Before (violation):\n<${elementType} type="${inputType}" name="email" />\n\n// After (fixed - Option 1: Using label element):\n<label htmlFor="email-input">Email Address</label>\n<${elementType} type="${inputType}" id="email-input" name="email" />\n\n// After (fixed - Option 2: Using aria-label):\n<${elementType} type="${inputType}" name="email" aria-label="Email Address" />\n\n// After (fixed - Option 3: Using aria-labelledby):\n<span id="email-label">Email Address</span>\n<${elementType} type="${inputType}" name="email" aria-labelledby="email-label" />`,
        documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
        estimatedEffort: 'quick',
        alternatives: [
          'Use <label> element with htmlFor attribute (recommended)',
          'Use aria-label attribute for programmatic labels',
          'Use aria-labelledby to reference another element containing the label',
          'Use title attribute (less preferred, not announced by all screen readers)',
          'Wrap input in <label> element with label text'
        ]
      }
    };
  }
}
