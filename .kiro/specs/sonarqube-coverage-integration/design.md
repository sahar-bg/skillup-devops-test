# Design Document: SonarQube Coverage Integration

## Overview

This design addresses the integration gap between Vitest coverage generation and SonarQube analysis in a Jenkins CI/CD pipeline. The core issue is that coverage files generated in the Test stage are not being detected by SonarQube Scanner in the Analysis stage, despite correct configuration in both tools.

The solution involves three key changes:
1. **Path Alignment**: Ensuring SonarQube Scanner looks for coverage files relative to the working directory
2. **File Persistence**: Explicitly archiving and verifying coverage files between pipeline stages
3. **Configuration Validation**: Adding pre-flight checks to detect misconfigurations early

The design maintains the existing two-stage pipeline structure (Test → SonarQube Analysis) while adding diagnostic logging and validation steps to ensure coverage data flows correctly through the pipeline.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Jenkins Pipeline                          │
│                                                                   │
│  ┌────────────────┐         ┌──────────────────────────┐        │
│  │  Test Stage    │         │  SonarQube Analysis      │        │
│  │                │         │  Stage                   │        │
│  │  1. npm install│         │  1. Verify coverage      │        │
│  │  2. npm test:ci│────────▶│  2. Run sonar-scanner    │        │
│  │  3. Generate   │  files  │  3. Upload to SonarQube  │        │
│  │     coverage/  │  persist│  4. Quality Gate check   │        │
│  │     lcov.info  │         │                          │        │
│  └────────────────┘         └──────────────────────────┘        │
│         │                              │                         │
│         │                              │                         │
│         ▼                              ▼                         │
│  ┌────────────────┐         ┌──────────────────────────┐        │
│  │  Workspace     │         │  SonarQube Server        │        │
│  │  frontend/     │         │  http://172.17.0.3:9000  │        │
│  │  coverage/     │         │                          │        │
│  │  lcov.info     │         │  - Coverage Dashboard    │        │
│  └────────────────┘         │  - Quality Gates         │        │
│                              │  - Trend Analysis        │        │
│                              └──────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interactions

1. **Vitest Coverage Generator** (Coverage_Generator)
   - Executes during Test stage via `npm run test:ci`
   - Configured in `vite.config.ts` with v8 provider
   - Outputs: `frontend/coverage/lcov.info`, `frontend/coverage/coverage-final.json`
   - Includes: `src/**/*.{ts,tsx}` (excluding tests, node_modules, dist)

2. **Jenkins Workspace** (Working_Directory)
   - Persistent filesystem location across pipeline stages
   - Base path: `/var/jenkins_home/workspace/<job-name>/`
   - Coverage files location: `frontend/coverage/lcov.info`
   - Must maintain file permissions and structure between stages

3. **SonarQube Scanner** (SonarQube_Scanner)
   - Executes during SonarQube Analysis stage
   - Reads configuration from `frontend/sonar-project.properties`
   - Looks for coverage at: `<working-dir>/frontend/coverage/lcov.info`
   - Parses lcov format and extracts line/branch coverage metrics

4. **SonarQube Server**
   - Receives coverage data from Scanner
   - Stores historical coverage trends
   - Evaluates Quality Gates
   - Provides dashboard visualization

## Components and Interfaces

### Coverage File Path Resolution

The critical issue is path resolution between Vitest output and SonarQube input:

**Current Configuration:**
- Vitest writes to: `./coverage/lcov.info` (relative to `frontend/` directory)
- SonarQube reads from: `coverage/lcov.info` (relative to scanner execution directory)
- Jenkins executes scanner from: `frontend/` directory

**Path Resolution Strategy:**
```
Jenkins Workspace Root: /var/jenkins_home/workspace/frontend-pipeline/
├── frontend/
│   ├── src/
│   ├── coverage/
│   │   └── lcov.info          ← Generated here
│   ├── sonar-project.properties
│   ├── vite.config.ts
│   └── package.json
```

When `sonar-scanner` runs from `frontend/` directory:
- `sonar.typescript.lcov.reportPaths=coverage/lcov.info` resolves to `frontend/coverage/lcov.info` ✓

### Pipeline Stage Interface

**Test Stage Output Contract:**
```typescript
interface TestStageOutput {
  coverageDirectory: string;      // "frontend/coverage"
  lcovFile: string;                // "frontend/coverage/lcov.info"
  jsonFile: string;                // "frontend/coverage/coverage-final.json"
  testResults: {
    total: number;
    passed: number;
    failed: number;
  };
}
```

**SonarQube Analysis Stage Input Contract:**
```typescript
interface SonarQubeAnalysisInput {
  workingDirectory: string;        // "frontend"
  coverageReportPath: string;      // "coverage/lcov.info" (relative to workingDirectory)
  projectKey: string;              // "frontend-hr-system"
  sources: string;                 // "src"
  sonarHostUrl: string;            // "http://172.17.0.3:9000"
}
```

### Configuration Files

**vite.config.ts (Coverage Configuration):**
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],  // Must include 'lcov'
      reportsDirectory: './coverage',       // Relative to frontend/
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/test/**',
        '**/node_modules/**',
      ],
    },
  },
})
```

**sonar-project.properties (SonarQube Configuration):**
```properties
sonar.projectKey=frontend-hr-system
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.spec.ts,**/*.spec.tsx,**/*.test.ts,**/*.test.tsx
sonar.exclusions=**/*.spec.ts,**/*.spec.tsx,**/*.test.ts,**/*.test.tsx,node_modules/**,dist/**,build/**
sonar.typescript.lcov.reportPaths=coverage/lcov.info  # Relative to scanner execution dir
sonar.sourceEncoding=UTF-8
```

**package.json (Test Script):**
```json
{
  "scripts": {
    "test:ci": "vitest run --coverage --reporter=default --reporter=junit --outputFile.junit=reports/junit.xml"
  }
}
```

## Data Models

### Coverage Report Structure (LCOV Format)

```
TN:                                    # Test name (optional)
SF:/path/to/source/file.ts            # Source file path
FN:10,functionName                     # Function at line 10
FNDA:5,functionName                    # Function called 5 times
FNF:1                                  # Functions found: 1
FNH:1                                  # Functions hit: 1
DA:10,5                                # Line 10 executed 5 times
DA:11,5                                # Line 11 executed 5 times
DA:12,0                                # Line 12 not executed
LF:3                                   # Lines found: 3
LH:2                                   # Lines hit: 2
BRDA:10,0,0,3                          # Branch data
BRDA:10,0,1,2                          # Branch data
BRF:2                                  # Branches found: 2
BRH:2                                  # Branches hit: 2
end_of_record
```

### Pipeline Validation Model

```typescript
interface PipelineValidation {
  vitestConfigValid: boolean;
  sonarConfigValid: boolean;
  coverageFileExists: boolean;
  coverageFileSize: number;
  pathsAligned: boolean;
  errors: string[];
  warnings: string[];
}
```

### SonarQube Metrics Model

```typescript
interface CoverageMetrics {
  lineCoverage: number;           // Percentage (0-100)
  branchCoverage: number;         // Percentage (0-100)
  totalLines: number;
  coveredLines: number;
  totalBranches: number;
  coveredBranches: number;
  uncoveredFiles: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Coverage File Generation and Format Validity

*For any* test execution with coverage enabled, the Coverage_Generator should produce a valid LCOV file at the configured output path with proper LCOV format structure (TN, SF, FN, FNDA, DA, BRDA, end_of_record markers).

**Validates: Requirements 1.1, 1.2**

### Property 2: Source File Inclusion Coverage

*For any* set of source files matching the inclusion patterns (`src/**/*.{ts,tsx}`), all such files should appear in the generated coverage report with coverage data (even if 0% covered).

**Validates: Requirements 1.3**

### Property 3: Exclusion Pattern Enforcement

*For any* file matching exclusion patterns (test files, node_modules, dist, build artifacts), that file should not appear in the generated coverage report.

**Validates: Requirements 1.4**

### Property 4: LCOV Metric Extraction Accuracy

*For any* valid LCOV file with known line and branch coverage data, parsing should extract metrics that match the source data (lines found/hit, branches found/hit, coverage percentages).

**Validates: Requirements 3.2, 3.3**

### Property 5: Path Configuration Consistency

*For any* Vitest configuration specifying a coverage output directory and any SonarQube configuration specifying a coverage input path, when both are correctly configured, the absolute resolved paths should point to the same file location.

**Validates: Requirements 3.4, 4.1**

## Error Handling

### Coverage Generation Failures

**Scenario**: Vitest fails to generate coverage due to test failures or configuration errors

**Handling Strategy**:
1. Capture exit code from `npm run test:ci`
2. If non-zero, mark Jenkins stage as UNSTABLE (not FAILED)
3. Log detailed error output from Vitest
4. Continue pipeline to allow SonarQube analysis of existing code
5. Set build status to reflect test failures

**Implementation**:
```groovy
script {
    def testResult = sh(script: 'npm run test:ci', returnStatus: true)
    if (testResult != 0) {
        echo '⚠️ Tests failed, but continuing pipeline...'
        unstable(message: 'Tests failed but pipeline continues')
    }
}
```

### Coverage File Not Found

**Scenario**: SonarQube Scanner cannot locate coverage file at configured path

**Handling Strategy**:
1. Add pre-flight validation before SonarQube Scanner execution
2. Check file existence: `test -f frontend/coverage/lcov.info`
3. If missing, log error with troubleshooting steps
4. Display expected vs actual file locations
5. Fail the SonarQube Analysis stage explicitly

**Implementation**:
```groovy
script {
    def coverageExists = sh(
        script: 'test -f frontend/coverage/lcov.info && echo "true" || echo "false"',
        returnStdout: true
    ).trim()
    
    if (coverageExists == 'false') {
        error('Coverage file not found at frontend/coverage/lcov.info. ' +
              'Ensure test:ci script runs successfully and generates coverage.')
    }
    
    sh 'ls -lh frontend/coverage/lcov.info'
}
```

### Invalid LCOV Format

**Scenario**: Coverage file exists but contains invalid LCOV format

**Handling Strategy**:
1. SonarQube Scanner will log parsing errors
2. Enable verbose logging: `-Dsonar.verbose=true`
3. Scanner continues but reports 0% coverage
4. Jenkins should not fail the build (allow manual investigation)
5. Log warning about invalid format

**Detection**:
```bash
# Validate LCOV format before scanning
if ! grep -q "^SF:" frontend/coverage/lcov.info; then
    echo "⚠️ Warning: LCOV file may be invalid (no SF: entries found)"
fi
```

### Path Resolution Mismatches

**Scenario**: Paths in LCOV file don't match SonarQube's expected source structure

**Handling Strategy**:
1. Ensure SonarQube Scanner runs from correct working directory (`frontend/`)
2. Use relative paths in sonar-project.properties
3. Verify `sonar.sources=src` matches path structure in LCOV
4. Log working directory before scanner execution
5. If mismatch detected, provide corrective guidance

**Validation**:
```groovy
dir('frontend') {
    sh 'pwd'  // Log current directory
    sh 'head -20 coverage/lcov.info'  // Show sample paths from LCOV
    // Run scanner from this directory
}
```

### Docker Volume Persistence Issues

**Scenario**: Coverage files lost when switching between Docker containers in pipeline stages

**Handling Strategy**:
1. Use same Docker agent for both Test and SonarQube Analysis stages
2. If different agents required, use `stash`/`unstash` to preserve files
3. Archive coverage files as Jenkins artifacts
4. Mount persistent volumes for Jenkins workspace

**Implementation**:
```groovy
stage('Test') {
    steps {
        dir('frontend') {
            sh 'npm run test:ci'
            stash includes: 'coverage/**/*', name: 'coverage-files'
        }
    }
}

stage('SonarQube Analysis') {
    steps {
        dir('frontend') {
            unstash 'coverage-files'
            // Now coverage files are available
        }
    }
}
```

### Quality Gate Failures

**Scenario**: Coverage falls below configured threshold in SonarQube Quality Gate

**Handling Strategy**:
1. Allow Quality Gate evaluation to complete
2. Retrieve Quality Gate status via SonarQube API or webhook
3. Mark Jenkins build as FAILED if Quality Gate fails
4. Provide link to SonarQube dashboard for details
5. Send notifications to team (email, Slack, etc.)

**Implementation**:
```groovy
stage('Quality Gate') {
    steps {
        timeout(time: 5, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true
        }
    }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and integration tests to ensure correctness:

**Unit Tests**: Verify specific validation logic, configuration parsing, and error handling
- Test LCOV format validation functions
- Test path resolution logic
- Test configuration consistency checks
- Test error message formatting

**Integration Tests**: Verify end-to-end coverage flow in actual pipeline
- Run full pipeline with coverage generation
- Verify SonarQube receives and displays coverage
- Test with missing coverage files
- Test with invalid LCOV format
- Test Quality Gate enforcement

**Property-Based Tests**: Verify universal properties across all inputs
- Generate random valid LCOV content and verify parsing
- Generate random source file sets and verify inclusion/exclusion
- Generate random path configurations and verify resolution

### Property-Based Testing Configuration

**Library**: Use `fast-check` (already in frontend dependencies) for property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: sonarqube-coverage-integration, Property {N}: {description}`

**Example Property Test Structure**:
```typescript
import fc from 'fast-check';

describe('Feature: sonarqube-coverage-integration', () => {
  it('Property 1: Coverage file generation produces valid LCOV', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string()), // Random source files
        (sourceFiles) => {
          // Generate coverage, verify LCOV format
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Focus Areas

1. **Configuration Validation**
   - Test that validation scripts correctly identify missing config
   - Test that validation scripts detect path mismatches
   - Test error messages are actionable

2. **LCOV Parsing**
   - Test parsing of valid LCOV files
   - Test handling of malformed LCOV files
   - Test metric extraction accuracy

3. **Path Resolution**
   - Test relative path resolution from different working directories
   - Test absolute path conversion
   - Test path normalization across OS

4. **Error Handling**
   - Test behavior when coverage file missing
   - Test behavior when coverage generation fails
   - Test behavior when SonarQube Scanner fails

### Integration Test Scenarios

1. **Happy Path**: Full pipeline with successful coverage integration
2. **Missing Coverage**: Test stage skips coverage, SonarQube handles gracefully
3. **Invalid Format**: Corrupted LCOV file, SonarQube logs error
4. **Path Mismatch**: Incorrect sonar-project.properties path
5. **Quality Gate Failure**: Coverage below threshold, build fails

### Manual Verification Steps

Before deploying changes:
1. Run tests locally with coverage: `npm run test:ci`
2. Verify `coverage/lcov.info` exists and contains data
3. Run SonarQube Scanner locally (if possible)
4. Check SonarQube dashboard shows coverage
5. Trigger Jenkins pipeline and monitor logs
6. Verify coverage appears in SonarQube after pipeline completes

### Monitoring and Observability

**Key Metrics to Track**:
- Coverage percentage over time
- Number of builds with missing coverage files
- SonarQube Scanner success/failure rate
- Quality Gate pass/fail rate
- Time to detect coverage integration issues

**Logging Requirements**:
- Log coverage file path and size before SonarQube Analysis
- Log SonarQube Scanner command with all parameters
- Log Quality Gate evaluation results
- Log any path resolution warnings or errors

**Alerting**:
- Alert when coverage drops below threshold
- Alert when coverage file not found for multiple consecutive builds
- Alert when SonarQube Scanner fails repeatedly
