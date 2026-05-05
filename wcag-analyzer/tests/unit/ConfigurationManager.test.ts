/**
 * Unit tests for ConfigurationManager
 * Tests: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { WCAGConfig } from '../../src/types';

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;
  const testConfigDir = path.join(__dirname, '../fixtures/configs');

  beforeEach(() => {
    configManager = new ConfigurationManager();
  });

  describe('getDefaultConfig', () => {
    it('should return Level AA defaults', () => {
      const config = configManager.getDefaultConfig();

      expect(config.targetLevels).toEqual(['A', 'AA']);
      expect(config.includePaths).toEqual(['src']);
      expect(config.excludePaths).toContain('node_modules');
      expect(config.excludePaths).toContain('dist');
      expect(config.outputFormats).toEqual(['json', 'html', 'text']);
      expect(config.outputDirectory).toBe('wcag-reports');
      expect(config.failureThreshold).toBeUndefined();
    });

    it('should return all required fields', () => {
      const config = configManager.getDefaultConfig();

      expect(config).toHaveProperty('targetLevels');
      expect(config).toHaveProperty('includePaths');
      expect(config).toHaveProperty('excludePaths');
      expect(config).toHaveProperty('outputFormats');
      expect(config).toHaveProperty('outputDirectory');
    });
  });

  describe('validateConfig', () => {
    it('should validate a correct configuration', () => {
      const config: WCAGConfig = {
        targetLevels: ['A', 'AA'],
        includePaths: ['src'],
        excludePaths: ['node_modules'],
        outputFormats: ['json'],
        outputDirectory: 'reports',
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty targetLevels', () => {
      const config: WCAGConfig = {
        targetLevels: [],
        includePaths: ['src'],
        excludePaths: [],
        outputFormats: ['json'],
        outputDirectory: 'reports',
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'targetLevels must contain at least one conformance level'
      );
    });

    it('should reject invalid conformance levels', () => {
      const config: WCAGConfig = {
        targetLevels: ['A', 'BB' as any, 'AAA'],
        includePaths: ['src'],
        excludePaths: [],
        outputFormats: ['json'],
        outputDirectory: 'reports',
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid conformance levels'))).toBe(true);
      expect(result.errors.some(e => e.includes('BB'))).toBe(true);
    });

    it('should reject empty includePaths', () => {
      const config: WCAGConfig = {
        targetLevels: ['A'],
        includePaths: [],
        excludePaths: [],
        outputFormats: ['json'],
        outputDirectory: 'reports',
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('includePaths must contain at least one path');
    });

    it('should reject empty strings in includePaths', () => {
      const config: WCAGConfig = {
        targetLevels: ['A'],
        includePaths: ['src', '', '  '],
        excludePaths: [],
        outputFormats: ['json'],
        outputDirectory: 'reports',
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('includePaths contains empty paths');
    });

    it('should reject empty strings in excludePaths', () => {
      const config: WCAGConfig = {
        targetLevels: ['A'],
        includePaths: ['src'],
        excludePaths: ['node_modules', ''],
        outputFormats: ['json'],
        outputDirectory: 'reports',
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('excludePaths contains empty paths');
    });

    it('should reject invalid output formats', () => {
      const config: WCAGConfig = {
        targetLevels: ['A'],
        includePaths: ['src'],
        excludePaths: [],
        outputFormats: ['json', 'pdf' as any],
        outputDirectory: 'reports',
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid output formats'))).toBe(true);
      expect(result.errors.some(e => e.includes('pdf'))).toBe(true);
    });

    it('should reject empty outputDirectory', () => {
      const config: WCAGConfig = {
        targetLevels: ['A'],
        includePaths: ['src'],
        excludePaths: [],
        outputFormats: ['json'],
        outputDirectory: '',
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('outputDirectory must be a non-empty string');
    });

    it('should reject negative failureThreshold', () => {
      const config: WCAGConfig = {
        targetLevels: ['A'],
        includePaths: ['src'],
        excludePaths: [],
        outputFormats: ['json'],
        outputDirectory: 'reports',
        failureThreshold: -5,
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('failureThreshold must be non-negative');
    });

    it('should accept valid failureThreshold', () => {
      const config: WCAGConfig = {
        targetLevels: ['A'],
        includePaths: ['src'],
        excludePaths: [],
        outputFormats: ['json'],
        outputDirectory: 'reports',
        failureThreshold: 10,
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should reject conflicting enabled and disabled rules', () => {
      const config: WCAGConfig = {
        targetLevels: ['A'],
        includePaths: ['src'],
        excludePaths: [],
        outputFormats: ['json'],
        outputDirectory: 'reports',
        enabledRules: ['1.1.1', '2.1.1'],
        disabledRules: ['2.1.1', '3.3.2'],
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be both enabled and disabled'))).toBe(true);
      expect(result.errors.some(e => e.includes('2.1.1'))).toBe(true);
    });

    it('should warn about empty enabledRules', () => {
      const config: WCAGConfig = {
        targetLevels: ['A'],
        includePaths: ['src'],
        excludePaths: [],
        outputFormats: ['json'],
        outputDirectory: 'reports',
        enabledRules: [],
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('enabledRules is empty, no rules will be applied');
    });

    it('should accept valid optional fields', () => {
      const config: WCAGConfig = {
        targetLevels: ['A', 'AA', 'AAA'],
        includePaths: ['src', 'lib'],
        excludePaths: ['node_modules', 'dist'],
        componentsToAnalyze: ['Button.tsx', 'Input.tsx'],
        enabledRules: ['1.1.1', '2.1.1'],
        disabledRules: ['3.3.2'],
        outputFormats: ['json', 'html', 'text'],
        outputDirectory: 'custom-reports',
        failureThreshold: 5,
      };

      const result = configManager.validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('loadConfig', () => {
    it('should return default config when no path provided', () => {
      const config = configManager.loadConfig();

      expect(config).toEqual(configManager.getDefaultConfig());
    });

    it('should return default config when file does not exist', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const config = configManager.loadConfig('/nonexistent/config.json');

      expect(config).toEqual(configManager.getDefaultConfig());
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Config file not found')
      );
      
      consoleSpy.mockRestore();
    });

    it('should load and parse valid config file', () => {
      // Create a temporary config file
      const tempConfigPath = path.join(testConfigDir, 'temp-valid-config.json');
      const validConfig: WCAGConfig = {
        targetLevels: ['A', 'AA'],
        includePaths: ['src', 'components'],
        excludePaths: ['node_modules'],
        outputFormats: ['json', 'html'],
        outputDirectory: 'test-reports',
        failureThreshold: 10,
      };

      // Ensure directory exists
      if (!fs.existsSync(testConfigDir)) {
        fs.mkdirSync(testConfigDir, { recursive: true });
      }

      fs.writeFileSync(tempConfigPath, JSON.stringify(validConfig, null, 2));

      try {
        const config = configManager.loadConfig(tempConfigPath);

        expect(config.targetLevels).toEqual(['A', 'AA']);
        expect(config.includePaths).toEqual(['src', 'components']);
        expect(config.outputDirectory).toBe('test-reports');
        expect(config.failureThreshold).toBe(10);
      } finally {
        // Cleanup
        if (fs.existsSync(tempConfigPath)) {
          fs.unlinkSync(tempConfigPath);
        }
      }
    });

    it('should merge partial config with defaults', () => {
      // Create a temporary config file with only some fields
      const tempConfigPath = path.join(testConfigDir, 'temp-partial-config.json');
      const partialConfig = {
        targetLevels: ['AAA'],
        includePaths: ['lib'],
      };

      // Ensure directory exists
      if (!fs.existsSync(testConfigDir)) {
        fs.mkdirSync(testConfigDir, { recursive: true });
      }

      fs.writeFileSync(tempConfigPath, JSON.stringify(partialConfig, null, 2));

      try {
        const config = configManager.loadConfig(tempConfigPath);

        // Should have user-provided values
        expect(config.targetLevels).toEqual(['AAA']);
        expect(config.includePaths).toEqual(['lib']);

        // Should have default values for missing fields
        expect(config.outputFormats).toEqual(['json', 'html', 'text']);
        expect(config.outputDirectory).toBe('wcag-reports');
        expect(config.excludePaths).toContain('node_modules');
      } finally {
        // Cleanup
        if (fs.existsSync(tempConfigPath)) {
          fs.unlinkSync(tempConfigPath);
        }
      }
    });

    it('should handle invalid JSON gracefully', () => {
      const tempConfigPath = path.join(testConfigDir, 'temp-invalid-json.json');
      const invalidJson = '{ targetLevels: [A, AA] }'; // Invalid JSON

      // Ensure directory exists
      if (!fs.existsSync(testConfigDir)) {
        fs.mkdirSync(testConfigDir, { recursive: true });
      }

      fs.writeFileSync(tempConfigPath, invalidJson);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      try {
        const config = configManager.loadConfig(tempConfigPath);

        // Should return default config
        expect(config).toEqual(configManager.getDefaultConfig());
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to parse config file')
        );
        expect(warnSpy).toHaveBeenCalledWith('Using default configuration');
      } finally {
        // Cleanup
        if (fs.existsSync(tempConfigPath)) {
          fs.unlinkSync(tempConfigPath);
        }
        consoleSpy.mockRestore();
        warnSpy.mockRestore();
      }
    });

    it('should throw error for invalid config values', () => {
      const tempConfigPath = path.join(testConfigDir, 'temp-invalid-values.json');
      const invalidConfig = {
        targetLevels: ['INVALID'],
        includePaths: [],
        outputFormats: ['json'],
        outputDirectory: 'reports',
      };

      // Ensure directory exists
      if (!fs.existsSync(testConfigDir)) {
        fs.mkdirSync(testConfigDir, { recursive: true });
      }

      fs.writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        expect(() => {
          configManager.loadConfig(tempConfigPath);
        }).toThrow('Invalid configuration');

        expect(consoleSpy).toHaveBeenCalledWith('Configuration validation failed:');
      } finally {
        // Cleanup
        if (fs.existsSync(tempConfigPath)) {
          fs.unlinkSync(tempConfigPath);
        }
        consoleSpy.mockRestore();
      }
    });
  });
});
