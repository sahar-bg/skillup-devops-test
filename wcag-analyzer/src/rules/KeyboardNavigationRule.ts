/**
 * KeyboardNavigationRule - WCAG 2.1 Success Criterion 2.1.1 (Keyboard)
 * 
 * This rule checks that all interactive elements are keyboard accessible.
 * 
 * WCAG 2.1 Level A requirement:
 * All functionality of the content is operable through a keyboard interface
 * without requiring specific timings for individual keystrokes.
 * 
 * Reference: https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html
 */

import { WCAGRule, ComponentInfo, Violation, JSXElementInfo } from '../types';

export class KeyboardNavigationRule implements WCAGRule {
  id = '2.1.1';
  name = 'Keyboard';
  level = 'A' as const;
  description = 'All interactive elements must be keyboard accessible without negative tabIndex values.';

  // Interactive elements that should be keyboard accessible
  private readonly interactiveElements = new Set([
    'button',
    'a',
    'input',
    'select',
    'textarea',
    'details',
    'summary'
  ]);

  // Elements with interactive ARIA roles
  private readonly interactiveRoles = new Set([
    'button',
    'link',
    'checkbox',
    'radio',
    'textbox',
    'combobox',
    'listbox',
    'option',
    'tab',
    'tabpanel',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'switch',
    'slider',
    'spinbutton'
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
      // Check if element is interactive
      const isInteractive = this.isInteractiveElement(element);
      
      if (isInteractive) {
        // Check for negative tabIndex
        const tabIndexAttr = element.attributes.find(attr => 
          attr.name === 'tabIndex' || attr.name === 'tabindex'
        );
        
        if (tabIndexAttr) {
          const tabIndexValue = this.parseTabIndex(tabIndexAttr.value);
          
          if (tabIndexValue !== null && tabIndexValue < 0) {
            violations.push(this.createViolation(component, element, 'negative-tabindex'));
          }
        }
        
        // Check for onClick without keyboard support (for divs and spans with onClick)
        if (this.hasOnClickWithoutKeyboard(element)) {
          violations.push(this.createViolation(component, element, 'onclick-no-keyboard'));
        }
      }

      // Recursively check children
      if (element.children && element.children.length > 0) {
        this.checkJSXElements(component, element.children, violations);
      }
    }
  }

  private isInteractiveElement(element: JSXElementInfo): boolean {
    // Check if it's a native interactive element
    if (this.interactiveElements.has(element.type)) {
      return true;
    }

    // Check if it has an interactive ARIA role
    const roleAttr = element.attributes.find(attr => attr.name === 'role');
    if (roleAttr && typeof roleAttr.value === 'string') {
      return this.interactiveRoles.has(roleAttr.value);
    }

    // Check if it has onClick handler (making it interactive)
    const hasOnClick = element.attributes.some(attr => 
      attr.name === 'onClick' || attr.name === 'onclick'
    );

    return hasOnClick;
  }

  private hasOnClickWithoutKeyboard(element: JSXElementInfo): boolean {
    // Only check non-native interactive elements
    if (this.interactiveElements.has(element.type)) {
      return false;
    }

    const hasOnClick = element.attributes.some(attr => 
      attr.name === 'onClick' || attr.name === 'onclick'
    );

    if (!hasOnClick) {
      return false;
    }

    // Check if it has keyboard event handlers
    const hasKeyboardHandler = element.attributes.some(attr => 
      attr.name === 'onKeyDown' || 
      attr.name === 'onKeyPress' || 
      attr.name === 'onKeyUp' ||
      attr.name === 'onkeydown' ||
      attr.name === 'onkeypress' ||
      attr.name === 'onkeyup'
    );

    // Check if it has tabIndex (making it focusable)
    const hasTabIndex = element.attributes.some(attr => 
      attr.name === 'tabIndex' || attr.name === 'tabindex'
    );

    // Check if it has an interactive role
    const roleAttr = element.attributes.find(attr => attr.name === 'role');
    const hasInteractiveRole = roleAttr && 
      typeof roleAttr.value === 'string' && 
      this.interactiveRoles.has(roleAttr.value);

    // Violation if onClick exists but no keyboard support
    return !hasKeyboardHandler && !hasTabIndex && !hasInteractiveRole;
  }

  private parseTabIndex(value: string | boolean | null): number | null {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    }
    if (typeof value === 'number') {
      return value;
    }
    return null;
  }

  private createViolation(
    component: ComponentInfo,
    element: JSXElementInfo,
    violationType: 'negative-tabindex' | 'onclick-no-keyboard'
  ): Violation {
    let message: string;
    let description: string;
    let codeExample: string;

    if (violationType === 'negative-tabindex') {
      message = `Interactive element has negative tabIndex, making it inaccessible via keyboard navigation.`;
      description = 'Remove the negative tabIndex value. Interactive elements should be keyboard accessible. Use tabIndex={0} to add an element to the tab order, or remove tabIndex entirely for native interactive elements.';
      codeExample = `// Before (violation):\n<button tabIndex={-1}>Click me</button>\n\n// After (fixed):\n<button>Click me</button>\n// or\n<button tabIndex={0}>Click me</button>`;
    } else {
      message = `Element with onClick handler lacks keyboard support. Users who cannot use a mouse will be unable to interact with this element.`;
      description = 'Add keyboard event handlers (onKeyDown, onKeyPress) or use a native interactive element like <button>. Alternatively, add role="button" and tabIndex={0} to make the element keyboard accessible.';
      codeExample = `// Before (violation):\n<div onClick={handleClick}>Click me</div>\n\n// After (fixed - Option 1: Use button):\n<button onClick={handleClick}>Click me</button>\n\n// After (fixed - Option 2: Add keyboard support):\n<div \n  onClick={handleClick}\n  onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}\n  role="button"\n  tabIndex={0}\n>\n  Click me\n</div>`;
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      level: this.level,
      severity: 'high',
      message,
      location: element.location,
      element,
      recommendation: {
        description,
        codeExample,
        documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
        estimatedEffort: 'quick',
        alternatives: [
          'Use native interactive elements (button, a, input) instead of div/span',
          'Add role="button" and tabIndex={0} for custom interactive elements',
          'Implement onKeyDown handler to respond to Enter and Space keys',
          'Ensure all interactive functionality is available via keyboard'
        ]
      }
    };
  }
}
