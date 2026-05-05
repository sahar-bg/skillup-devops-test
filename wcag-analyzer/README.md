# WCAG 2.1 Compliance Testing Tool

A static analysis tool for testing React/TypeScript components against WCAG 2.1 accessibility guidelines.

## Features

- 🔍 Automatic component discovery and analysis
- 📊 Comprehensive WCAG 2.1 compliance testing (Levels A, AA, AAA)
- 📝 Multiple report formats (JSON, HTML, Plain Text)
- 📈 Historical tracking and trend analysis
- 🎯 Actionable recommendations with code examples
- ⚙️ Configurable rules and thresholds
- 🚀 CI/CD integration ready

## Installation

```bash
cd wcag-analyzer
npm install
npm run build
```

## Usage

### Basic Analysis

```bash
wcag-analyzer analyze
```

### With Configuration File

```bash
wcag-analyzer analyze --config wcag.config.json
```

### Specify Conformance Level

```bash
wcag-analyzer analyze --level AA
```

### Custom Output Directory

```bash
wcag-analyzer analyze --output reports/
```

## Configuration

Create a `wcag.config.json` file:

```json
{
  "targetLevels": ["A", "AA"],
  "includePaths": ["src/components"],
  "excludePaths": ["node_modules", "dist"],
  "outputFormats": ["json", "html", "text"],
  "outputDirectory": "wcag-reports",
  "failureThreshold": 10
}
```

## Development

### Run Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Property-Based Tests Only

```bash
npm run test:property
```

### Test Coverage

```bash
npm run test:coverage
```

## Project Structure

```
wcag-analyzer/
├── src/
│   ├── types.ts              # Core type definitions
│   ├── config/               # Configuration management
│   ├── scanner/              # Component discovery and parsing
│   ├── rules/                # WCAG rule implementations
│   ├── classifier/           # Violation classification
│   ├── report/               # Report generation
│   └── cli/                  # Command-line interface
├── tests/
│   ├── unit/                 # Unit tests
│   ├── property/             # Property-based tests
│   └── fixtures/             # Test fixtures
└── bin/
    └── wcag-analyzer.js      # CLI entry point
```

## License

MIT
