/**
 * RuleEngine - Applies WCAG 2.1 rules to React components
 * 
 * The RuleEngine is responsible for:
 * - Loading and registering WCAG rules by conformance level
 * - Filtering rules based on enabled/disabled configuration
 * - Applying all active rules to components to detect violations
 * - Handling rule execution errors gracefully
 */

import { WCAGRule, ComponentInfo, Violation, ConformanceLevel } from '../types';
import { ImageAltTextRule } from './ImageAltTextRule';
import { KeyboardNavigationRule } from './KeyboardNavigationRule';
import { FormLabelRule } from './FormLabelRule';

export class RuleEngine {
  private rules: Map<string, WCAGRule>;
  private activeRules: Set<string>;

  constructor() {
    this.rules = new Map();
    this.activeRules = new Set();
  }

  /**
   * Load rules for the specified conformance levels
   * @param levels - Array of conformance levels to load rules for (e.g., ['A', 'AA'])
   */
  loadRules(levels: ConformanceLevel[]): void {
    // Clear existing rules
    this.rules.clear();
    this.activeRules.clear();

    // Import and register rules based on conformance levels
    // For now, we'll have a placeholder that will be populated as rules are implemented
    const allRules = this.getAllAvailableRules();

    for (const rule of allRules) {
      if (levels.includes(rule.level)) {
        this.rules.set(rule.id, rule);
        this.activeRules.add(rule.id);
      }
    }
  }

  /**
   * Filter rules based on enabled/disabled configuration
   * @param enabledRules - Optional array of rule IDs to enable (if provided, only these rules are active)
   * @param disabledRules - Optional array of rule IDs to disable
   */
  filterRules(enabledRules?: string[], disabledRules?: string[]): void {
    // If enabledRules is provided (even if empty), start with only those rules
    if (enabledRules !== undefined) {
      this.activeRules.clear();
      for (const ruleId of enabledRules) {
        if (this.rules.has(ruleId)) {
          this.activeRules.add(ruleId);
        }
      }
    }

    // Remove any disabled rules
    if (disabledRules && disabledRules.length > 0) {
      for (const ruleId of disabledRules) {
        this.activeRules.delete(ruleId);
      }
    }
  }

  /**
   * Analyze a component by applying all active rules
   * @param component - The component to analyze
   * @returns Array of violations found in the component
   */
  analyzeComponent(component: ComponentInfo): Violation[] {
    const violations: Violation[] = [];

    for (const ruleId of this.activeRules) {
      const rule = this.rules.get(ruleId);
      if (!rule) {
        continue;
      }

      try {
        const ruleViolations = rule.check(component);
        violations.push(...ruleViolations);
      } catch (error) {
        // Log error but continue with other rules (error isolation)
        console.error(
          `Error executing rule ${ruleId} (${rule.name}) on component ${component.name}:`,
          error instanceof Error ? error.message : String(error)
        );
        // In a production system, this would be logged to a proper error tracking system
      }
    }

    return violations;
  }

  /**
   * Get all loaded rules
   * @returns Map of rule ID to WCAGRule
   */
  getRules(): Map<string, WCAGRule> {
    return new Map(this.rules);
  }

  /**
   * Get all active rule IDs
   * @returns Set of active rule IDs
   */
  getActiveRuleIds(): Set<string> {
    return new Set(this.activeRules);
  }

  /**
   * Get count of active rules
   * @returns Number of active rules
   */
  getActiveRuleCount(): number {
    return this.activeRules.size;
  }

  /**
   * Check if a specific rule is active
   * @param ruleId - The rule ID to check
   * @returns True if the rule is active
   */
  isRuleActive(ruleId: string): boolean {
    return this.activeRules.has(ruleId);
  }

  /**
   * Get all available rules (to be populated as rules are implemented)
   * This is a placeholder that will import actual rule implementations
   * @private
   */
  private getAllAvailableRules(): WCAGRule[] {
    // Return all implemented WCAG rules
    // As more rules are implemented, add them to this array
    return [
      new ImageAltTextRule(),
      new KeyboardNavigationRule(),
      new FormLabelRule(),
      // Future rules will be added here:
      // new SemanticHTMLRule(),
      // new ColorContrastRule(),
      // etc.
    ];
  }
}
