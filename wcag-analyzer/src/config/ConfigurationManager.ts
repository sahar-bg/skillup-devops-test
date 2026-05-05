/**
 * ConfigurationManager - Handles loading, validation, and default configuration
 * for WCAG 2.1 compliance testing.
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import * as fs from 'fs';
import { WCAGConfig, ValidationResult, ConformanceLevel, OutputFormat } from '../types';

export class ConfigurationManager {
  /**
   * Load configuration from a JSON file or return default config if no path provided.
   * Handles missing config files gracefully by returning defaults.
   * 
   * @param configPath - Optional path to configuration file
   * @returns WCAGConfig object
   */
  loadConfig(configPath?: string): WCAGConfig {
    // If no config path provided, return defaults
    if (!configPath) {
      return this.getDefaultConfig();
    }

    try {
      // Check if file exists
      if (!fs.existsSync(configPath)) {
        console.warn(`Config file not found at ${configPath}, using defaults`);
        return this.getDefaultConfig();
      }

      // Read and parse the config file
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(configContent) as Partial<WCAGConfig>;

      // Merge with defaults to ensure all required fields are present
      const config = this.mergeWithDefaults(parsedConfig);

      // Validate the configuration
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        console.error('Configuration validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        throw new Error('Invalid configuration');
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }

      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(`Failed to parse config file: ${error.message}`);
        console.warn('Using default configuration');
        return this.getDefaultConfig();
      }
      throw error;
    }
  }

  /**
   * Get default configuration with Level AA defaults.
   * 
   * @returns Default WCAGConfig object
   */
  getDefaultConfig(): WCAGConfig {
    return {
      targetLevels: ['A', 'AA'],
      includePaths: ['src'],
      excludePaths: ['node_modules', 'dist', 'build', 'coverage'],
      outputFormats: ['json', 'html', 'text'],
      outputDirectory: 'wcag-reports',
      failureThreshold: undefined, // No threshold by default
    };
  }

  /**
   * Validate configuration object against all validation rules.
   * 
   * @param config - Configuration object to validate
   * @returns ValidationResult with errors and warnings
   */
  validateConfig(config: WCAGConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate targetLevels
    if (!config.targetLevels || config.targetLevels.length === 0) {
      errors.push('targetLevels must contain at least one conformance level');
    } else {
      const validLevels: ConformanceLevel[] = ['A', 'AA', 'AAA'];
      const invalidLevels = config.targetLevels.filter(
        level => !validLevels.includes(level)
      );
      if (invalidLevels.length > 0) {
        errors.push(
          `Invalid conformance levels: ${invalidLevels.join(', ')}. ` +
          `Valid levels are: A, AA, AAA`
        );
      }
    }

    // Validate includePaths
    if (!config.includePaths || config.includePaths.length === 0) {
      errors.push('includePaths must contain at least one path');
    } else {
      // Check if paths are non-empty strings
      const emptyPaths = config.includePaths.filter(p => !p || p.trim() === '');
      if (emptyPaths.length > 0) {
        errors.push('includePaths contains empty paths');
      }
    }

    // Validate excludePaths (optional, but if provided should be valid)
    if (config.excludePaths) {
      const emptyPaths = config.excludePaths.filter(p => !p || p.trim() === '');
      if (emptyPaths.length > 0) {
        errors.push('excludePaths contains empty paths');
      }
    }

    // Validate outputFormats
    if (!config.outputFormats || config.outputFormats.length === 0) {
      errors.push('outputFormats must contain at least one format');
    } else {
      const validFormats: OutputFormat[] = ['json', 'html', 'text'];
      const invalidFormats = config.outputFormats.filter(
        format => !validFormats.includes(format)
      );
      if (invalidFormats.length > 0) {
        errors.push(
          `Invalid output formats: ${invalidFormats.join(', ')}. ` +
          `Valid formats are: json, html, text`
        );
      }
    }

    // Validate outputDirectory
    if (!config.outputDirectory || config.outputDirectory.trim() === '') {
      errors.push('outputDirectory must be a non-empty string');
    }

    // Validate failureThreshold (optional)
    if (config.failureThreshold !== undefined) {
      if (typeof config.failureThreshold !== 'number') {
        errors.push('failureThreshold must be a number');
      } else if (config.failureThreshold < 0) {
        errors.push('failureThreshold must be non-negative');
      }
    }

    // Validate componentsToAnalyze (optional)
    if (config.componentsToAnalyze) {
      if (!Array.isArray(config.componentsToAnalyze)) {
        errors.push('componentsToAnalyze must be an array');
      } else {
        const emptyComponents = config.componentsToAnalyze.filter(
          c => !c || c.trim() === ''
        );
        if (emptyComponents.length > 0) {
          errors.push('componentsToAnalyze contains empty component names');
        }
      }
    }

    // Validate enabledRules (optional)
    if (config.enabledRules) {
      if (!Array.isArray(config.enabledRules)) {
        errors.push('enabledRules must be an array');
      } else if (config.enabledRules.length === 0) {
        warnings.push('enabledRules is empty, no rules will be applied');
      }
    }

    // Validate disabledRules (optional)
    if (config.disabledRules) {
      if (!Array.isArray(config.disabledRules)) {
        errors.push('disabledRules must be an array');
      }
    }

    // Check for conflicting rules
    if (config.enabledRules && config.disabledRules) {
      const conflicts = config.enabledRules.filter(rule =>
        config.disabledRules!.includes(rule)
      );
      if (conflicts.length > 0) {
        errors.push(
          `Rules cannot be both enabled and disabled: ${conflicts.join(', ')}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Merge partial config with defaults to ensure all required fields are present.
   * 
   * @param partial - Partial configuration from user
   * @returns Complete WCAGConfig object
   */
  private mergeWithDefaults(partial: Partial<WCAGConfig>): WCAGConfig {
    const defaults = this.getDefaultConfig();

    return {
      targetLevels: partial.targetLevels ?? defaults.targetLevels,
      includePaths: partial.includePaths ?? defaults.includePaths,
      excludePaths: partial.excludePaths ?? defaults.excludePaths,
      componentsToAnalyze: partial.componentsToAnalyze,
      enabledRules: partial.enabledRules,
      disabledRules: partial.disabledRules,
      outputFormats: partial.outputFormats ?? defaults.outputFormats,
      outputDirectory: partial.outputDirectory ?? defaults.outputDirectory,
      failureThreshold: partial.failureThreshold,
    };
  }
}
