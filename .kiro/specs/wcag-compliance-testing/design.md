# Design Document - WCAG 2.1 Compliance Testing

## Overview

Le système de test de conformité WCAG 2.1 est un outil d'analyse statique qui scanne les composants React/TypeScript d'un projet, applique les règles WCAG 2.1, et génère des rapports détaillés avec des recommandations de correction. L'architecture suit une approche modulaire avec séparation claire des responsabilités: découverte de composants, analyse de règles, et génération de rapports.

Le système fonctionne en trois phases principales:
1. **Découverte**: Scanner le projet pour identifier tous les composants React
2. **Analyse**: Appliquer les règles WCAG 2.1 à chaque composant
3. **Rapport**: Générer des rapports comparatifs dans plusieurs formats

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLI Interface                            │
│                  (wcag-analyzer CLI)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Configuration Manager                       │
│         (Load config, set defaults, validate)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Component Scanner                          │
│    (Discover React components, parse AST, build graph)       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Rule Engine                             │
│         (Apply WCAG rules, detect violations)                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Level A     │  │  Level AA    │  │  Level AAA   │     │
│  │  Rules       │  │  Rules       │  │  Rules       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Violation Classifier                        │
│      (Classify by level, severity, group violations)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Report Generator                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  JSON        │  │  HTML        │  │  Plain Text  │     │
│  │  Formatter   │  │  Formatter   │  │  Formatter   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Report Persistence                         │
│         (Save reports, maintain history, compare)            │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Language**: TypeScript (pour cohérence avec le projet React/TypeScript)
- **Parser**: @babel/parser pour analyser React/JSX/TypeScript
- **AST Traversal**: @babel/traverse pour parcourir l'AST
- **WCAG Rules**: axe-core (bibliothèque de référence pour tests d'accessibilité)
- **CLI**: commander pour l'interface en ligne de commande
- **Report Generation**: 
  - JSON: natif
  - HTML: handlebars pour templating
  - Text: formatage personnalisé
- **Testing**: Jest pour tests unitaires, fast-check pour property-based testing

## Components and Interfaces

### 1. Configuration Manager

**Responsabilité**: Charger et valider la configuration de l'analyse.

```typescript
interface WCAGConfig {
  targetLevels: ConformanceLevel[];  // ['A', 'AA', 'AAA']
  includePaths: string[];            // Directories to scan
  excludePaths: string[];            // Directories to ignore
  componentsToAnalyze?: string[];    // Specific components (optional)
  enabledRules?: string[];           // Specific WCAG rules (optional)
  disabledRules?: string[];          // Rules to skip (optional)
  outputFormats: OutputFormat[];     // ['json', 'html', 'text']
  outputDirectory: string;           // Where to save reports
  failureThreshold?: number;         // Max violations before failing
}

type ConformanceLevel = 'A' | 'AA' | 'AAA';
type OutputFormat = 'json' | 'html' | 'text';

class ConfigurationManager {
  loadConfig(configPath?: string): WCAGConfig;
  validateConfig(config: WCAGConfig): ValidationResult;
  getDefaultConfig(): WCAGConfig;
}
```

### 2. Component Scanner

**Responsabilité**: Découvrir et parser les composants React du projet.

```typescript
interface ComponentInfo {
  name: string;
  filePath: string;
  ast: babel.Node;
  dependencies: string[];          // Other components it imports
  props: PropDefinition[];
  jsxElements: JSXElementInfo[];
}

interface JSXElementInfo {
  type: string;                    // 'div', 'button', 'img', etc.
  attributes: AttributeInfo[];
  children: JSXElementInfo[];
  location: SourceLocation;
}

interface AttributeInfo {
  name: string;
  value: string | boolean | null;
}

interface SourceLocation {
  filePath: string;
  line: number;
  column: number;
}

class ComponentScanner {
  scanDirectory(path: string, excludePaths: string[]): ComponentInfo[];
  parseComponent(filePath: string): ComponentInfo;
  buildDependencyGraph(components: ComponentInfo[]): DependencyGraph;
  isReactComponent(ast: babel.Node): boolean;
}
```

### 3. Rule Engine

**Responsabilité**: Appliquer les règles WCAG 2.1 aux composants.

```typescript
interface WCAGRule {
  id: string;                      // e.g., "1.1.1", "2.1.1"
  name: string;                    // e.g., "Non-text Content"
  level: ConformanceLevel;
  description: string;
  check(component: ComponentInfo): Violation[];
}

interface Violation {
  ruleId: string;
  ruleName: string;
  level: ConformanceLevel;
  severity: Severity;
  message: string;
  location: SourceLocation;
  element: JSXElementInfo;
  recommendation: Recommendation;
}

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface Recommendation {
  description: string;
  codeExample: string;
  documentationUrl: string;
  estimatedEffort: 'quick' | 'medium' | 'complex';
  alternatives?: string[];
}

class RuleEngine {
  private rules: Map<string, WCAGRule>;
  
  loadRules(levels: ConformanceLevel[]): void;
  analyzeComponent(component: ComponentInfo): Violation[];
  filterRules(enabledRules?: string[], disabledRules?: string[]): void;
}

// Example rules
class ImageAltTextRule implements WCAGRule {
  id = "1.1.1";
  name = "Non-text Content";
  level = "A";
  
  check(component: ComponentInfo): Violation[] {
    // Find all <img> elements without alt attribute
  }
}

class KeyboardNavigationRule implements WCAGRule {
  id = "2.1.1";
  name = "Keyboard";
  level = "A";
  
  check(component: ComponentInfo): Violation[] {
    // Find interactive elements without keyboard support
  }
}

class ColorContrastRule implements WCAGRule {
  id = "1.4.3";
  name = "Contrast (Minimum)";
  level = "AA";
  
  check(component: ComponentInfo): Violation[] {
    // Check color contrast ratios
  }
}
```

### 4. Violation Classifier

**Responsabilité**: Classifier et grouper les violations détectées.

```typescript
interface ViolationGroup {
  ruleId: string;
  ruleName: string;
  level: ConformanceLevel;
  count: number;
  violations: Violation[];
}

interface ComponentViolations {
  componentName: string;
  filePath: string;
  violationCount: number;
  violations: Violation[];
}

class ViolationClassifier {
  groupByRule(violations: Violation[]): ViolationGroup[];
  groupByComponent(violations: Violation[]): ComponentViolations[];
  groupBySeverity(violations: Violation[]): Map<Severity, Violation[]>;
  groupByLevel(violations: Violation[]): Map<ConformanceLevel, Violation[]>;
}
```

### 5. Report Generator

**Responsabilité**: Générer des rapports dans différents formats.

```typescript
interface ComplianceReport {
  timestamp: Date;
  projectPath: string;
  configuration: WCAGConfig;
  summary: ReportSummary;
  componentViolations: ComponentViolations[];
  ruleViolations: ViolationGroup[];
  comparison?: ReportComparison;
}

interface ReportSummary {
  totalComponents: number;
  totalViolations: number;
  violationsByLevel: {
    A: number;
    AA: number;
    AAA: number;
  };
  violationsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  complianceScores: {
    A: number;      // Percentage (0-100)
    AA: number;
    AAA: number;
  };
}

interface ReportComparison {
  previousReport: Date;
  newViolations: Violation[];
  resolvedViolations: Violation[];
  trend: 'improving' | 'degrading' | 'stable';
  changePercentage: number;
}

class ReportGenerator {
  generateReport(violations: Violation[], config: WCAGConfig): ComplianceReport;
  formatAsJSON(report: ComplianceReport): string;
  formatAsHTML(report: ComplianceReport): string;
  formatAsText(report: ComplianceReport): string;
}

class JSONFormatter {
  format(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }
}

class HTMLFormatter {
  private template: HandlebarsTemplate;
  
  format(report: ComplianceReport): string {
    // Use Handlebars template to generate HTML
  }
}

class TextFormatter {
  format(report: ComplianceReport): string {
    // Format as plain text with sections:
    // 1. Summary
    // 2. Violations by Component
    // 3. Violations by Rule
    // 4. Recommendations
  }
}
```

### 6. Report Persistence

**Responsabilité**: Sauvegarder les rapports et maintenir l'historique.

```typescript
interface ReportMetadata {
  timestamp: Date;
  reportPath: string;
  totalViolations: number;
  complianceScores: {
    A: number;
    AA: number;
    AAA: number;
  };
}

class ReportPersistence {
  saveReport(report: ComplianceReport, format: OutputFormat): string;
  loadReport(reportPath: string): ComplianceReport;
  getReportHistory(): ReportMetadata[];
  getMostRecentReport(): ComplianceReport | null;
  compareReports(current: ComplianceReport, previous: ComplianceReport): ReportComparison;
}
```

### 7. CLI Interface

**Responsabilité**: Interface en ligne de commande pour exécuter l'analyse.

```typescript
class WCAGAnalyzerCLI {
  run(args: string[]): Promise<number> {
    // Parse command line arguments
    // Load configuration
    // Run analysis
    // Generate reports
    // Return exit code
  }
}

// Usage:
// wcag-analyzer analyze --config wcag.config.json
// wcag-analyzer analyze --level AA --output reports/
// wcag-analyzer analyze --components src/components/Chatbot.tsx
```

## Data Models

### Core Data Structures

```typescript
// AST Node representation (from @babel/parser)
type ASTNode = babel.Node;

// Dependency graph
interface DependencyGraph {
  nodes: Map<string, ComponentInfo>;
  edges: Map<string, string[]>;  // component -> dependencies
}

// Validation result
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Analysis result
interface AnalysisResult {
  success: boolean;
  componentsAnalyzed: number;
  violations: Violation[];
  errors: AnalysisError[];
}

interface AnalysisError {
  filePath: string;
  message: string;
  stack?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated:

**Consolidations:**
- Properties 2.4-2.10 (individual WCAG rule checks) can be generalized into a single property about rule application
- Properties 3.1-3.4 (violation metadata) can be combined into one comprehensive property about violation structure
- Properties 4.3-4.4 (grouping by component/criterion) can be combined as they test the same grouping invariant
- Properties 5.1-5.4 (recommendation metadata) can be combined into one property about recommendation completeness
- Properties 6.1-6.4 (config parsing) can be combined into one property about config validation
- Properties 8.4-8.5 (new/resolved violations) can be combined as they're both part of diff logic
- Properties 9.3-9.5 (serialization formats) are covered by 9.6 (round-trip) and format-specific validation

**Redundancies to remove:**
- Property 4.3 is subsumed by the general grouping invariant
- Properties 5.1-5.3 are all checking violation metadata completeness - can be one property
- Properties 9.3-9.5 are redundant with 9.6 (round-trip covers serialization correctness)

### Core Properties

**Property 1: Component Discovery Completeness**
*For any* directory structure containing React component files (.jsx, .tsx, .js with JSX), the Component_Scanner should discover all valid component files and none of the non-component files.
**Validates: Requirements 1.1, 1.4**

**Property 2: Component Parsing Preserves Structure**
*For any* valid React/TypeScript component, parsing the component should extract all props, JSX elements, and their attributes without loss of information.
**Validates: Requirements 1.2, 1.3**

**Property 3: Dependency Graph Accuracy**
*For any* set of components with import statements, the dependency graph should accurately reflect all import relationships, with each edge representing an actual import.
**Validates: Requirements 1.5**

**Property 4: WCAG Rule Application Consistency**
*For any* component and any enabled WCAG rule, applying the rule should produce consistent results regardless of the order of rule application.
**Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10**

**Property 5: Violation Structure Completeness**
*For any* detected violation, it should contain all required metadata: conformance level (A/AA/AAA), severity (critical/high/medium/low), success criterion ID, and valid source location.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Property 6: Violation Grouping Preserves Count**
*For any* set of violations, grouping them by any criterion (rule, component, severity, level) should preserve the total count of violations.
**Validates: Requirements 3.5, 4.3, 4.4**

**Property 7: Compliance Score Bounds**
*For any* analysis result, compliance scores for each level (A, AA, AAA) should be between 0 and 100 inclusive, and should decrease or stay equal as more violations are added.
**Validates: Requirements 4.2**

**Property 8: Report Summary Accuracy**
*For any* set of violations, the report summary should accurately count violations by level and severity, with the sum of all categories equaling the total violation count.
**Validates: Requirements 4.1**

**Property 9: Report Comparison Symmetry**
*For any* two reports R1 and R2, violations marked as "new" when comparing R1→R2 should be marked as "resolved" when comparing R2→R1.
**Validates: Requirements 8.4, 8.5**

**Property 10: Trend Calculation Correctness**
*For any* two reports, if the new report has fewer violations than the previous, trend should be "improving"; if more, "degrading"; if equal, "stable".
**Validates: Requirements 8.6**

**Property 11: JSON Serialization Round-Trip**
*For any* valid ComplianceReport object, serializing to JSON then deserializing should produce an equivalent object with all fields preserved.
**Validates: Requirements 4.6, 9.3, 9.6**

**Property 12: Component AST Round-Trip**
*For any* valid React component AST, pretty-printing then parsing should produce an equivalent AST structure.
**Validates: Requirements 9.1, 9.2, 9.7**

**Property 13: HTML Report Validity**
*For any* compliance report, the generated HTML output should be valid HTML5 and contain all violations from the report.
**Validates: Requirements 4.7, 4.9, 9.4**

**Property 14: Text Report Completeness**
*For any* compliance report, the plain text output should contain all key sections (summary, violations by component, violations by rule) and all violation information.
**Validates: Requirements 4.8, 4.10, 9.5**

**Property 15: Recommendation Completeness**
*For any* violation, its recommendation should include a non-empty description, code example, valid WCAG documentation URL, and effort estimate.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

**Property 16: Configuration Validation**
*For any* configuration object, if it passes validation, all required fields should have valid values (conformance levels in [A, AA, AAA], paths exist, output formats valid).
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

**Property 17: Exit Code Consistency**
*For any* analysis execution, if violations exceed the configured threshold or errors occur, exit code should be non-zero; otherwise zero.
**Validates: Requirements 7.2, 7.3**

**Property 18: Report Timestamp Uniqueness**
*For any* two reports saved in sequence, their timestamps should be different and the later report should have a later timestamp.
**Validates: Requirements 8.1**

**Property 19: Report History Persistence**
*For any* sequence of N reports saved, retrieving the report history should return exactly N reports in chronological order.
**Validates: Requirements 8.2, 8.3**

**Property 20: Error Isolation in Rule Engine**
*For any* set of rules where one rule throws an exception, the Rule_Engine should still execute all other rules and return their results.
**Validates: Requirements 10.5**

**Property 21: Parse Error Recovery**
*For any* set of component files where some cannot be parsed, the Component_Scanner should successfully parse all valid files and report errors for invalid ones without crashing.
**Validates: Requirements 10.1, 10.2**

## Error Handling

### Error Categories

1. **Parse Errors**: Invalid React/TypeScript syntax
   - Strategy: Log error, skip component, continue analysis
   - User feedback: Include in report summary with file path and error message

2. **File System Errors**: Permission denied, file not found
   - Strategy: Return clear error message, exit with non-zero code
   - User feedback: Specific error message with path and reason

3. **Configuration Errors**: Invalid config values
   - Strategy: Validate config early, provide detailed validation errors
   - User feedback: List all validation errors with suggestions

4. **Rule Execution Errors**: Exception in WCAG rule check
   - Strategy: Catch exception, log error, continue with other rules
   - User feedback: Include in report with rule ID and error message

5. **Report Generation Errors**: Template errors, serialization failures
   - Strategy: Attempt all formats, report which succeeded/failed
   - User feedback: Clear message about which formats failed and why

### Error Recovery Strategies

```typescript
class ErrorHandler {
  handleParseError(filePath: string, error: Error): void {
    logger.warn(`Failed to parse ${filePath}: ${error.message}`);
    this.parseErrors.push({ filePath, error: error.message });
  }
  
  handleRuleError(ruleId: string, component: string, error: Error): void {
    logger.error(`Rule ${ruleId} failed on ${component}: ${error.message}`);
    this.ruleErrors.push({ ruleId, component, error: error.message });
  }
  
  handleFileSystemError(operation: string, path: string, error: Error): never {
    throw new FileSystemError(
      `Cannot ${operation} ${path}: ${error.message}. ` +
      `Please check permissions and path.`
    );
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using randomized testing

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

We will use **fast-check** (TypeScript property-based testing library) for all property tests:

- Each property test must run **minimum 100 iterations** to ensure thorough randomized coverage
- Each test must be tagged with a comment referencing its design property
- Tag format: `// Feature: wcag-compliance-testing, Property N: [property text]`
- Each correctness property from the design must be implemented by exactly ONE property-based test

### Testing Tools

- **Unit Testing**: Jest
- **Property-Based Testing**: fast-check
- **AST Testing**: @babel/parser test utilities
- **HTML Validation**: html-validator
- **Coverage**: Jest coverage reports (target: >80% coverage)

### Test Organization

```
tests/
├── unit/
│   ├── component-scanner.test.ts
│   ├── rule-engine.test.ts
│   ├── violation-classifier.test.ts
│   ├── report-generator.test.ts
│   ├── report-persistence.test.ts
│   └── cli.test.ts
├── property/
│   ├── component-discovery.property.test.ts
│   ├── parsing.property.test.ts
│   ├── rule-application.property.test.ts
│   ├── violation-handling.property.test.ts
│   ├── report-generation.property.test.ts
│   └── serialization.property.test.ts
├── integration/
│   └── end-to-end.test.ts
└── fixtures/
    ├── components/
    ├── configs/
    └── reports/
```

### Key Test Scenarios

**Unit Tests Focus:**
- Specific WCAG rule implementations (e.g., alt text detection)
- Edge cases (empty components, no violations, all violations)
- Error conditions (invalid config, parse errors, permission errors)
- Report formatting (JSON structure, HTML validity, text readability)
- CLI argument parsing

**Property Tests Focus:**
- Component discovery completeness (Property 1)
- Parsing preservation (Property 2)
- Grouping invariants (Property 6)
- Score calculations (Property 7)
- Round-trip properties (Properties 11, 12)
- Error isolation (Properties 20, 21)

### Example Property Test

```typescript
import fc from 'fast-check';

// Feature: wcag-compliance-testing, Property 11: JSON Serialization Round-Trip
describe('Report Serialization', () => {
  it('should preserve all data through JSON round-trip', () => {
    fc.assert(
      fc.property(
        arbitraryComplianceReport(),
        (report) => {
          const json = JSON.stringify(report);
          const deserialized = JSON.parse(json);
          expect(deserialized).toEqual(report);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Implementation Notes

### WCAG Rule Implementation Priority

Implement rules in this order for maximum impact:

**Phase 1 - Critical (Level A):**
1. Image alt text (1.1.1)
2. Keyboard navigation (2.1.1)
3. Form labels (3.3.2)
4. Semantic HTML structure (1.3.1)

**Phase 2 - Important (Level AA):**
1. Color contrast (1.4.3)
2. Focus visible (2.4.7)
3. ARIA usage (4.1.2)
4. Link purpose (2.4.4)

**Phase 3 - Enhanced (Level AAA):**
1. Enhanced contrast (1.4.6)
2. Section headings (2.4.10)
3. Link context (2.4.9)

### Performance Considerations

- Use worker threads for parallel component analysis
- Cache parsed ASTs to avoid re-parsing
- Stream large reports instead of loading entirely in memory
- Implement incremental analysis (only changed files)

### Integration with axe-core

Leverage axe-core for WCAG rule implementations:
- Use axe-core's rule definitions as reference
- Adapt rules for static analysis (axe-core is runtime-focused)
- Map axe-core rule IDs to WCAG success criteria

### Future Enhancements

- Visual regression testing for UI components
- Automated fix suggestions with code modifications
- IDE integration (VS Code extension)
- Real-time analysis during development
- Custom rule definitions for project-specific requirements
