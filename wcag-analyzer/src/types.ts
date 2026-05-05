/**
 * Core type definitions for WCAG 2.1 Compliance Testing Tool
 */

import * as babel from '@babel/types';

// ============================================================================
// Configuration Types
// ============================================================================

export type ConformanceLevel = 'A' | 'AA' | 'AAA';
export type OutputFormat = 'json' | 'html' | 'text';

export interface WCAGConfig {
  targetLevels: ConformanceLevel[];
  includePaths: string[];
  excludePaths: string[];
  componentsToAnalyze?: string[];
  enabledRules?: string[];
  disabledRules?: string[];
  outputFormats: OutputFormat[];
  outputDirectory: string;
  failureThreshold?: number;
}

// ============================================================================
// Component Scanning Types
// ============================================================================

export interface ComponentInfo {
  name: string;
  filePath: string;
  ast: babel.Node;
  dependencies: string[];
  props: PropDefinition[];
  jsxElements: JSXElementInfo[];
}

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export interface JSXElementInfo {
  type: string;
  attributes: AttributeInfo[];
  children: JSXElementInfo[];
  location: SourceLocation;
}

export interface AttributeInfo {
  name: string;
  value: string | boolean | null;
}

export interface SourceLocation {
  filePath: string;
  line: number;
  column: number;
}

export interface DependencyGraph {
  nodes: Map<string, ComponentInfo>;
  edges: Map<string, string[]>;
}

// ============================================================================
// WCAG Rule Types
// ============================================================================

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type EstimatedEffort = 'quick' | 'medium' | 'complex';

export interface WCAGRule {
  id: string;
  name: string;
  level: ConformanceLevel;
  description: string;
  check(component: ComponentInfo): Violation[];
}

export interface Violation {
  ruleId: string;
  ruleName: string;
  level: ConformanceLevel;
  severity: Severity;
  message: string;
  location: SourceLocation;
  element: JSXElementInfo;
  recommendation: Recommendation;
}

export interface Recommendation {
  description: string;
  codeExample: string;
  documentationUrl: string;
  estimatedEffort: EstimatedEffort;
  alternatives?: string[];
}

// ============================================================================
// Violation Classification Types
// ============================================================================

export interface ViolationGroup {
  ruleId: string;
  ruleName: string;
  level: ConformanceLevel;
  count: number;
  violations: Violation[];
}

export interface ComponentViolations {
  componentName: string;
  filePath: string;
  violationCount: number;
  violations: Violation[];
}

// ============================================================================
// Report Types
// ============================================================================

export interface ComplianceReport {
  timestamp: Date;
  projectPath: string;
  configuration: WCAGConfig;
  summary: ReportSummary;
  componentViolations: ComponentViolations[];
  ruleViolations: ViolationGroup[];
  comparison?: ReportComparison;
}

export interface ReportSummary {
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
    A: number;
    AA: number;
    AAA: number;
  };
}

export interface ReportComparison {
  previousReport: Date;
  newViolations: Violation[];
  resolvedViolations: Violation[];
  trend: 'improving' | 'degrading' | 'stable';
  changePercentage: number;
}

export interface ReportMetadata {
  timestamp: Date;
  reportPath: string;
  totalViolations: number;
  complianceScores: {
    A: number;
    AA: number;
    AAA: number;
  };
}

// ============================================================================
// Validation and Error Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AnalysisResult {
  success: boolean;
  componentsAnalyzed: number;
  violations: Violation[];
  errors: AnalysisError[];
}

export interface AnalysisError {
  filePath: string;
  message: string;
  stack?: string;
}
