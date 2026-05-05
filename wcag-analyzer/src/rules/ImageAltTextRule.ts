/**
 * ImageAltTextRule - WCAG 2.1 Success Criterion 1.1.1 (Non-text Content)
 * 
 * This rule checks that all <img> elements have a non-empty alt attribute.
 * 
 * WCAG 2.1 Level A requirement:
 * All non-text content that is presented to the user has a text alternative
 * that serves the equivalent purpose.
 * 
 * Reference: https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html
 */

import { WCAGRule, ComponentInfo, Violation, JSXElementInfo } from '../types';

export class ImageAltTextRule implements WCAGRule {
  id = '1.1.1';
  name = 'Non-text Content';
  level = 'A' as const;
  description = 'All <img> elements must have a non-empty alt attribute to provide text alternatives for non-text content.';

  /**
   * Check a component for image alt text violations
   * @param component - The component to analyze
   * @returns Array of violations found
   */
  check(component: ComponentInfo): Violation[] {
    const violations: Violation[] = [];

    // Recursively check all JSX elements in the component
    this.checkJSXElements(component, component.jsxElements, violations);

    return violations;
  }

  /**
   * Recursively check JSX elements for img tags without proper alt text
   * @param component - The component being analyzed
   * @param elements - Array of JSX elements to check
   * @param violations - Array to accumulate violations
   * @private
   */
  private checkJSXElements(
    component: ComponentInfo,
    elements: JSXElementInfo[],
    violations: Violation[]
  ): void {
    for (const element of elements) {
      // Check if this is an img element
      if (element.type === 'img') {
        const altAttribute = element.attributes.find(attr => attr.name === 'alt');

        // Check if alt attribute is missing or empty
        if (!altAttribute) {
          violations.push(this.createViolation(component, element, 'missing'));
        } else if (
          altAttribute.value === '' ||
          altAttribute.value === null ||
          (typeof altAttribute.value === 'string' && altAttribute.value.trim() === '')
        ) {
          violations.push(this.createViolation(component, element, 'empty'));
        }
      }

      // Recursively check children
      if (element.children && element.children.length > 0) {
        this.checkJSXElements(component, element.children, violations);
      }
    }
  }

  /**
   * Create a violation object for an img element without proper alt text
   * @param component - The component containing the violation
   * @param element - The img element with the violation
   * @param violationType - Whether the alt is 'missing' or 'empty'
   * @returns A Violation object
   * @private
   */
  private createViolation(
    component: ComponentInfo,
    element: JSXElementInfo,
    violationType: 'missing' | 'empty'
  ): Violation {
    const message = violationType === 'missing'
      ? `Image element is missing an alt attribute. All images must have alternative text for accessibility.`
      : `Image element has an empty alt attribute. Provide descriptive alternative text or use alt="" only for decorative images.`;

    return {
      ruleId: this.id,
      ruleName: this.name,
      level: this.level,
      severity: 'high',
      message,
      location: element.location,
      element,
      recommendation: {
        description: violationType === 'missing'
          ? 'Add an alt attribute to the <img> element with descriptive text that conveys the purpose or content of the image. If the image is purely decorative, use alt="" (empty string) to indicate it should be ignored by screen readers.'
          : 'Provide meaningful alternative text in the alt attribute that describes the image content or purpose. If the image is decorative and conveys no information, you can keep alt="" (empty string), but ensure this is intentional.',
        codeExample: violationType === 'missing'
          ? `// Before (violation):\n<img src="logo.png" />\n\n// After (fixed):\n<img src="logo.png" alt="Company logo" />\n\n// For decorative images:\n<img src="decoration.png" alt="" role="presentation" />`
          : `// Before (violation):\n<img src="chart.png" alt="" />\n\n// After (fixed):\n<img src="chart.png" alt="Sales chart showing 25% growth in Q4" />\n\n// If truly decorative:\n<img src="decoration.png" alt="" role="presentation" />`,
        documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
        estimatedEffort: 'quick',
        alternatives: [
          'Use aria-label attribute if alt is not suitable for your use case',
          'Use aria-labelledby to reference another element containing the description',
          'For complex images (charts, diagrams), consider using aria-describedby to reference a detailed description',
          'For decorative images, use alt="" with role="presentation" to explicitly mark as decorative'
        ]
      }
    };
  }
}
