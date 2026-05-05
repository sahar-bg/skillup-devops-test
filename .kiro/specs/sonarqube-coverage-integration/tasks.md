# Implementation Plan: SonarQube Coverage Integration

## Overview

This implementation plan addresses the integration gap between Vitest coverage generation and SonarQube analysis in the Jenkins CI/CD pipeline. The solution involves three key areas:

1. **Jenkins Pipeline Enhancements**: Add validation, logging, and file persistence mechanisms
2. **Validation Scripts**: Create pre-flight checks to detect configuration issues early
3. **Property-Based Testing**: Implement tests to verify coverage file generation and parsing
4. **Documentation**: Update guides with troubleshooting steps and configuration examples

The implementation follows an incremental approach, validating each component before moving to integration.

## Tasks

- [ ] 1. Create validation utilities for coverage configuration
  - [ ] 1.1 Create validation script for Vitest configuration
    - Write Node.js script to parse vite.config.ts
    - Verify coverage.provider is 'v8'
    - Verify coverage.reporter includes 'lcov'
    - Verify coverage.reportsDirectory is set
    - Return validation result with specific errors
    - _Requirements: 9.1, 9.4_

  - [ ] 1.2 Create validation script for SonarQube configuration
    - Write Node.js script to parse sonar-project.properties
    - Verify sonar.typescript.lcov.reportPaths is set
    - Extract coverage path value
    - Return validation result with specific errors
    - _Requirements: 9.2, 9.5_

  - [ ] 1.3 Create path consistency validator
    - Write function to resolve Vitest output path to absolute path
    - Write function to resolve SonarQube input path to absolute path
    - Compare resolved paths for consistency
    - Return detailed mismatch information if paths differ
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 1.4 Write property test for path resolution consistency
    - **Property 5: Path Configuration Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.5**
    - Generate random relative paths and working directories
    - Verify path resolution produces consistent absolute paths
    - Test with 100+ iterations using fast-check

- [ ] 2. Create LCOV file validation utilities
  - [ ] 2.1 Implement LCOV format validator
    - Write function to check for required LCOV markers (SF:, FN:, DA:, end_of_record)
    - Validate line number format and data structure
    - Return validation errors with line numbers
    - Handle empty or malformed files gracefully
    - _Requirements: 1.1, 1.2, 3.2_

  - [ ] 2.2 Implement LCOV metrics extractor
    - Write function to parse LCOV file and extract metrics
    - Calculate total lines found/hit
    - Calculate total branches found/hit
    - Calculate coverage percentages
    - Return structured metrics object
    - _Requirements: 3.3, 5.1, 5.2_

  - [ ]* 2.3 Write property test for LCOV format validation
    - **Property 1: Coverage File Generation and Format Validity**
    - **Validates: Requirements 1.1, 1.2**
    - Generate random valid LCOV content with fast-check
    - Verify validator accepts all valid formats
    - Verify validator rejects invalid formats
    - Test with 100+ iterations

  - [ ]* 2.4 Write property test for metrics extraction accuracy
    - **Property 4: LCOV Metric Extraction Accuracy**
    - **Validates: Requirements 3.2, 3.3**
    - Generate LCOV files with known coverage values
    - Parse and extract metrics
    - Verify extracted values match source data
    - Test with 100+ iterations using fast-check

- [ ] 3. Enhance Jenkins pipeline with pre-flight validation
  - [ ] 3.1 Add configuration validation stage
    - Create new pipeline stage before Test stage
    - Run Vitest configuration validator
    - Run SonarQube configuration validator
    - Run path consistency validator
    - Fail fast with clear error messages if validation fails
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [ ] 3.2 Add coverage file verification before SonarQube Analysis
    - Add script block before SonarQube Scanner execution
    - Check if coverage/lcov.info exists
    - Log file size and first 20 lines
    - Run LCOV format validator
    - Fail with actionable error if file missing or invalid
    - _Requirements: 2.2, 2.5, 7.3_

  - [ ] 3.3 Enhance Test stage logging
    - Log npm test:ci command before execution
    - Capture and log test execution output
    - Log coverage directory contents after test completion
    - Log coverage file path and size
    - Mark stage as UNSTABLE (not FAILED) on test failures
    - _Requirements: 1.5, 7.1, 7.2_

  - [ ] 3.4 Add verbose logging to SonarQube Analysis stage
    - Add -Dsonar.verbose=true to scanner command
    - Log working directory before scanner execution
    - Log full scanner command with all parameters
    - Capture and display scanner output
    - Log any coverage-related warnings or errors
    - _Requirements: 7.4, 7.5_

- [ ] 4. Checkpoint - Validate pipeline enhancements
  - Run validation scripts locally to verify they work
  - Test Jenkins pipeline with validation stages
  - Verify error messages are clear and actionable
  - Ensure pipeline fails fast on configuration issues
  - Ensure all tests pass, ask the user if questions arise

- [ ] 5. Implement coverage file persistence mechanisms
  - [ ] 5.1 Add coverage file archiving in Test stage
    - Use Jenkins archiveArtifacts to preserve coverage files
    - Archive coverage/lcov.info and coverage/coverage-final.json
    - Add post-action to Test stage for archiving
    - Ensure archiving happens even if tests fail
    - _Requirements: 2.1, 2.2_

  - [ ] 5.2 Add stash/unstash for coverage files (Docker compatibility)
    - Add stash step after Test stage completion
    - Stash coverage/** directory with name 'coverage-files'
    - Add unstash step at start of SonarQube Analysis stage
    - Verify files are restored correctly
    - _Requirements: 2.3, 2.4, 8.1, 8.2_

  - [ ] 5.3 Add workspace persistence verification
    - Log workspace path at start of each stage
    - Verify working directory structure is maintained
    - Check file permissions on coverage files
    - Document any Docker-specific volume mount requirements
    - _Requirements: 2.3, 8.3, 8.4_

- [ ] 6. Create property-based tests for source file coverage
  - [ ]* 6.1 Write property test for source file inclusion
    - **Property 2: Source File Inclusion Coverage**
    - **Validates: Requirements 1.3**
    - Generate random sets of TypeScript source files
    - Run coverage generation
    - Verify all matching files appear in coverage report
    - Test with 100+ iterations using fast-check

  - [ ]* 6.2 Write property test for exclusion pattern enforcement
    - **Property 3: Exclusion Pattern Enforcement**
    - **Validates: Requirements 1.4**
    - Generate random files including test files and node_modules
    - Run coverage generation
    - Verify excluded files do not appear in coverage report
    - Test with 100+ iterations using fast-check

- [ ] 7. Implement error handling improvements
  - [ ] 7.1 Add error handling for missing coverage files
    - Implement pre-flight check in SonarQube Analysis stage
    - Display expected vs actual file locations on error
    - Provide troubleshooting steps in error message
    - Fail stage explicitly with clear error
    - _Requirements: 3.5, 7.5_

  - [ ] 7.2 Add error handling for invalid LCOV format
    - Run LCOV validator before SonarQube Scanner
    - Log specific format errors with line numbers
    - Display warning but allow scanner to continue
    - Document common format issues in error message
    - _Requirements: 3.2, 7.5_

  - [ ] 7.3 Improve Quality Gate failure handling
    - Add timeout to Quality Gate stage (5 minutes)
    - Capture Quality Gate status
    - Log link to SonarQube dashboard on failure
    - Provide coverage improvement suggestions
    - _Requirements: 6.1, 6.3_

- [ ] 8. Create integration tests for end-to-end coverage flow
  - [ ]* 8.1 Write integration test for successful coverage flow
    - Create test that runs full pipeline locally
    - Verify coverage files are generated
    - Verify SonarQube Scanner can read files
    - Verify coverage metrics are extracted
    - Mock SonarQube server responses
    - _Requirements: 1.1, 2.1, 3.1, 5.1_

  - [ ]* 8.2 Write integration test for missing coverage file scenario
    - Create test that skips coverage generation
    - Verify pipeline detects missing file
    - Verify error message is actionable
    - Verify pipeline fails at correct stage
    - _Requirements: 2.2, 3.5, 7.3_

  - [ ]* 8.3 Write integration test for invalid LCOV format scenario
    - Create test with corrupted LCOV file
    - Verify validator detects format errors
    - Verify warning is logged
    - Verify pipeline continues with warning
    - _Requirements: 3.2, 7.4_

- [ ] 9. Checkpoint - Validate error handling and integration
  - Test all error scenarios manually
  - Verify error messages are helpful
  - Ensure pipeline handles failures gracefully
  - Verify integration tests cover key scenarios
  - Ensure all tests pass, ask the user if questions arise

- [ ] 10. Create documentation and troubleshooting guides
  - [ ] 10.1 Create coverage integration flow documentation
    - Document the complete flow from test generation to SonarQube
    - Include architecture diagram showing component interactions
    - Explain path resolution between Vitest and SonarQube
    - Document file persistence mechanisms
    - _Requirements: 10.1_

  - [ ] 10.2 Create troubleshooting guide
    - Document common issues and solutions
    - Add section for "Coverage file not found" errors
    - Add section for "Invalid LCOV format" errors
    - Add section for path mismatch issues
    - Add section for Docker-specific issues
    - Include diagnostic commands for each issue
    - _Requirements: 10.2, 10.5_

  - [ ] 10.3 Document configuration requirements
    - List required versions of Vitest, SonarQube Scanner, Jenkins plugins
    - Provide example vite.config.ts with coverage configuration
    - Provide example sonar-project.properties
    - Provide example Jenkinsfile with all enhancements
    - Document Docker volume mount requirements
    - _Requirements: 10.3, 10.4, 8.5_

  - [ ] 10.4 Create local verification guide
    - Document how to test coverage generation locally
    - Document how to validate LCOV files locally
    - Document how to run SonarQube Scanner locally (if possible)
    - Provide checklist before committing changes
    - _Requirements: 10.5_

- [ ] 11. Final integration and validation
  - [ ] 11.1 Update main Jenkinsfile with all enhancements
    - Integrate configuration validation stage
    - Integrate coverage file verification
    - Integrate enhanced logging
    - Integrate file persistence mechanisms
    - Integrate error handling improvements
    - _Requirements: All_

  - [ ] 11.2 Create monitoring and alerting configuration
    - Document key metrics to track (coverage %, file detection rate)
    - Set up alerts for missing coverage files
    - Set up alerts for SonarQube Scanner failures
    - Set up alerts for Quality Gate failures
    - _Requirements: 6.1, 6.3, 7.5_

  - [ ]* 11.3 Write unit tests for validation utilities
    - Test Vitest config validator with valid/invalid configs
    - Test SonarQube config validator with valid/invalid configs
    - Test path consistency validator with various scenarios
    - Test LCOV format validator with valid/invalid files
    - Test metrics extractor with known coverage data
    - _Requirements: 9.1, 9.2, 9.5_

- [ ] 12. Final checkpoint - Complete validation
  - Run full pipeline end-to-end in Jenkins
  - Verify coverage appears in SonarQube dashboard
  - Test all error scenarios
  - Verify documentation is complete and accurate
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end coverage flow
- The implementation prioritizes early detection of configuration issues through validation
- All validation scripts should be written in Node.js/TypeScript for consistency with the frontend stack
- Docker compatibility is critical - use stash/unstash for file persistence between stages
