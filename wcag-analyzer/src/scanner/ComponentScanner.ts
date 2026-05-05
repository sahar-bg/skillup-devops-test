/**
 * ComponentScanner - Discovers and parses React components in a project
 * 
 * Validates: Requirements 1.1, 1.4
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ComponentInfo, PropDefinition, JSXElementInfo, AttributeInfo, SourceLocation } from '../types';

export class ComponentScanner {
  /**
   * Recursively scan a directory for React component files (.jsx, .tsx, .js)
   * 
   * @param dirPath - Directory path to scan
   * @param excludePaths - Array of paths to exclude from scanning
   * @returns Array of file paths that are potential React components
   */
  scanDirectory(dirPath: string, excludePaths: string[] = []): string[] {
    const componentFiles: string[] = [];

    // Normalize the directory path
    const normalizedDirPath = path.resolve(dirPath);

    // Check if directory exists
    if (!fs.existsSync(normalizedDirPath)) {
      console.warn(`Directory not found: ${normalizedDirPath}`);
      return componentFiles;
    }

    // Check if it's actually a directory
    const stats = fs.statSync(normalizedDirPath);
    if (!stats.isDirectory()) {
      console.warn(`Path is not a directory: ${normalizedDirPath}`);
      return componentFiles;
    }

    // Recursively scan the directory
    this.scanDirectoryRecursive(normalizedDirPath, excludePaths, componentFiles);

    return componentFiles;
  }

  /**
   * Internal recursive helper for directory scanning
   * 
   * @param currentPath - Current directory being scanned
   * @param excludePaths - Paths to exclude
   * @param results - Accumulator for found files
   */
  private scanDirectoryRecursive(
    currentPath: string,
    excludePaths: string[],
    results: string[]
  ): void {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Check if this path should be excluded
        if (this.shouldExclude(fullPath, excludePaths)) {
          continue;
        }

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          this.scanDirectoryRecursive(fullPath, excludePaths, results);
        } else if (entry.isFile()) {
          // Check if this is a potential React component file
          if (this.isReactComponentFile(fullPath)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentPath}:`, error);
    }
  }

  /**
   * Check if a path should be excluded from scanning
   * 
   * @param filePath - Path to check
   * @param excludePaths - Array of exclude patterns
   * @returns true if path should be excluded
   */
  private shouldExclude(filePath: string, excludePaths: string[]): boolean {
    const normalizedPath = path.normalize(filePath);

    for (const excludePattern of excludePaths) {
      // Check if the path contains the exclude pattern
      if (normalizedPath.includes(path.normalize(excludePattern))) {
        return true;
      }

      // Also check just the basename for common excludes like 'node_modules'
      const basename = path.basename(normalizedPath);
      if (basename === excludePattern) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a file is a potential React component based on extension
   * 
   * @param filePath - File path to check
   * @returns true if file has .jsx, .tsx, or .js extension
   */
  private isReactComponentFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.jsx' || ext === '.tsx' || ext === '.js';
  }

  /**
   * Determine if a file contains a React component by checking for React patterns
   * This is a basic implementation that checks for common React patterns in the code.
   * 
   * @param filePath - Path to the file to check
   * @returns true if file appears to contain a React component
   */
  isReactComponent(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for common React patterns:
      // 1. Import React or React hooks
      const hasReactImport = /import\s+(?:React|.*\{[^}]*(?:useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|Component)[^}]*\})\s+from\s+['"]react['"]/i.test(content);

      // 2. JSX syntax (opening tags with capital letters or self-closing tags)
      const hasJSX = /<[A-Z][a-zA-Z0-9]*[\s>]|<[a-z]+[^>]*\/>/i.test(content);

      // 3. React component patterns (function components or class components)
      const hasFunctionComponent = /(?:export\s+(?:default\s+)?)?(?:const|let|var|function)\s+[A-Z][a-zA-Z0-9]*\s*[=:]/i.test(content);
      const hasClassComponent = /class\s+[A-Z][a-zA-Z0-9]*\s+extends\s+(?:React\.)?(?:Component|PureComponent)/i.test(content);

      // A file is considered a React component if it has:
      // - React imports AND JSX syntax
      // OR
      // - JSX syntax AND component patterns (function or class)
      return (hasReactImport && hasJSX) || (hasJSX && (hasFunctionComponent || hasClassComponent));
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Parse a component file and extract component information
   * Uses @babel/parser to parse React/TypeScript components and extract:
   * - Component name
   * - Props and their TypeScript types
   * - JSX elements and their attributes
   * 
   * Validates: Requirements 1.2, 1.3, 10.1
   * 
   * @param filePath - Path to component file
   * @returns ComponentInfo object
   * @throws Error if file cannot be parsed
   */
  parseComponent(filePath: string): ComponentInfo {
    try {
      // Read the file content
      const content = fs.readFileSync(filePath, 'utf-8');

      // Determine if this is TypeScript based on extension
      const isTypeScript = filePath.endsWith('.tsx') || filePath.endsWith('.ts');

      // Parse the file with Babel
      const ast = parse(content, {
        sourceType: 'module',
        plugins: [
          'jsx',
          ...(isTypeScript ? [('typescript' as const)] : []),
        ],
      });

      // Extract component information
      const componentName = this.extractComponentName(ast, filePath);
      const props = this.extractProps(ast, componentName);
      const jsxElements = this.extractJSXElements(ast, filePath);
      const dependencies = this.extractDependencies(ast);

      return {
        name: componentName,
        filePath,
        ast,
        dependencies,
        props,
        jsxElements,
      };
    } catch (error) {
      // Handle parse errors gracefully (Requirement 10.1)
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse component at ${filePath}: ${errorMessage}`);
    }
  }

  /**
   * Extract the component name from the AST
   * Looks for:
   * - Function declarations: function MyComponent() {}
   * - Arrow functions: const MyComponent = () => {}
   * - Class declarations: class MyComponent extends Component {}
   * 
   * @param ast - Babel AST
   * @param filePath - File path (used as fallback)
   * @returns Component name
   */
  private extractComponentName(ast: t.File, filePath: string): string {
    let componentName: string | null = null;
    const self = this;

    traverse(ast, {
      // Function declarations: function MyComponent() {}
      FunctionDeclaration(path) {
        if (path.node.id && self.isComponentName(path.node.id.name)) {
          componentName = path.node.id.name;
          path.stop();
        }
      },

      // Variable declarations with arrow functions or function expressions
      // const MyComponent = () => {} or const MyComponent = function() {}
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id) &&
          self.isComponentName(path.node.id.name) &&
          (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))
        ) {
          componentName = path.node.id.name;
          path.stop();
        }
      },

      // Class declarations: class MyComponent extends Component {}
      ClassDeclaration(path) {
        if (path.node.id && self.isComponentName(path.node.id.name)) {
          componentName = path.node.id.name;
          path.stop();
        }
      },

      // Export default declarations
      ExportDefaultDeclaration(path) {
        if (t.isIdentifier(path.node.declaration)) {
          componentName = path.node.declaration.name;
          path.stop();
        } else if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
          componentName = path.node.declaration.id.name;
          path.stop();
        } else if (t.isClassDeclaration(path.node.declaration) && path.node.declaration.id) {
          componentName = path.node.declaration.id.name;
          path.stop();
        }
      },
    });

    // Fallback to filename if no component name found
    if (!componentName) {
      const basename = path.basename(filePath, path.extname(filePath));
      componentName = basename;
    }

    return componentName;
  }

  /**
   * Check if a name follows React component naming convention (PascalCase)
   * 
   * @param name - Name to check
   * @returns true if name starts with uppercase letter
   */
  private isComponentName(name: string): boolean {
    return /^[A-Z]/.test(name);
  }

  /**
   * Extract props from the component's TypeScript type definitions
   * Looks for:
   * - Interface definitions: interface MyComponentProps {}
   * - Type aliases: type MyComponentProps = {}
   * - Function parameters with type annotations
   * 
   * @param ast - Babel AST
   * @param componentName - Name of the component
   * @returns Array of PropDefinition objects
   */
  private extractProps(ast: t.File, componentName: string): PropDefinition[] {
    const props: PropDefinition[] = [];
    const propsInterfaceName = `${componentName}Props`;
    const self = this;

    traverse(ast, {
      // TypeScript interface declarations
      TSInterfaceDeclaration(path) {
        if (path.node.id.name === propsInterfaceName || path.node.id.name === 'Props') {
          path.node.body.body.forEach((member) => {
            if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
              const propName = member.key.name;
              const propType = member.typeAnnotation
                ? self.typeAnnotationToString(member.typeAnnotation.typeAnnotation)
                : 'any';
              const required = !member.optional;

              props.push({
                name: propName,
                type: propType,
                required,
              });
            }
          });
        }
      },

      // TypeScript type alias declarations
      TSTypeAliasDeclaration(path) {
        if (
          (path.node.id.name === propsInterfaceName || path.node.id.name === 'Props') &&
          t.isTSTypeLiteral(path.node.typeAnnotation)
        ) {
          path.node.typeAnnotation.members.forEach((member) => {
            if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
              const propName = member.key.name;
              const propType = member.typeAnnotation
                ? self.typeAnnotationToString(member.typeAnnotation.typeAnnotation)
                : 'any';
              const required = !member.optional;

              props.push({
                name: propName,
                type: propType,
                required,
              });
            }
          });
        }
      },

      // Function parameters with destructured props
      FunctionDeclaration(path) {
        if (path.node.id && path.node.id.name === componentName) {
          self.extractPropsFromFunctionParams(path.node.params, props);
        }
      },

      ArrowFunctionExpression(path) {
        // Check if this is the component's arrow function
        const parent = path.parent;
        if (
          t.isVariableDeclarator(parent) &&
          t.isIdentifier(parent.id) &&
          parent.id.name === componentName
        ) {
          self.extractPropsFromFunctionParams(path.node.params, props);
        }
      },
    });

    return props;
  }

  /**
   * Extract props from function parameters (for inline prop definitions)
   * 
   * @param params - Function parameters
   * @param props - Array to populate with prop definitions
   */
  private extractPropsFromFunctionParams(
    params: Array<t.Identifier | t.Pattern | t.RestElement | t.TSParameterProperty>,
    props: PropDefinition[]
  ): void {
    params.forEach((param) => {
      if (t.isObjectPattern(param)) {
        param.properties.forEach((prop) => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            const propName = prop.key.name;
            let propType = 'any';
            
            // Check if the value has a type annotation
            if (t.isIdentifier(prop.value) && prop.value.typeAnnotation && t.isTSTypeAnnotation(prop.value.typeAnnotation)) {
              propType = this.typeAnnotationToString(prop.value.typeAnnotation.typeAnnotation);
            }

            props.push({
              name: propName,
              type: propType,
              required: true, // Destructured props are typically required unless they have defaults
            });
          }
        });
      } else if (t.isIdentifier(param) && param.typeAnnotation) {
        // Single props parameter: function MyComponent(props: MyComponentProps)
        // We'll skip this case as it's handled by interface/type extraction
      }
    });
  }

  /**
   * Convert TypeScript type annotation to string representation
   * 
   * @param typeAnnotation - TypeScript type annotation node
   * @returns String representation of the type
   */
  private typeAnnotationToString(typeAnnotation: t.TSType): string {
    if (t.isTSStringKeyword(typeAnnotation)) return 'string';
    if (t.isTSNumberKeyword(typeAnnotation)) return 'number';
    if (t.isTSBooleanKeyword(typeAnnotation)) return 'boolean';
    if (t.isTSAnyKeyword(typeAnnotation)) return 'any';
    if (t.isTSVoidKeyword(typeAnnotation)) return 'void';
    if (t.isTSNullKeyword(typeAnnotation)) return 'null';
    if (t.isTSUndefinedKeyword(typeAnnotation)) return 'undefined';

    if (t.isTSArrayType(typeAnnotation)) {
      return `${this.typeAnnotationToString(typeAnnotation.elementType)}[]`;
    }

    if (t.isTSUnionType(typeAnnotation)) {
      return typeAnnotation.types.map((t) => this.typeAnnotationToString(t)).join(' | ');
    }

    if (t.isTSTypeReference(typeAnnotation) && t.isIdentifier(typeAnnotation.typeName)) {
      return typeAnnotation.typeName.name;
    }

    if (t.isTSLiteralType(typeAnnotation)) {
      if (t.isStringLiteral(typeAnnotation.literal)) {
        return `"${typeAnnotation.literal.value}"`;
      }
      if (t.isNumericLiteral(typeAnnotation.literal)) {
        return String(typeAnnotation.literal.value);
      }
      if (t.isBooleanLiteral(typeAnnotation.literal)) {
        return String(typeAnnotation.literal.value);
      }
    }

    // Fallback for complex types
    return 'unknown';
  }

  /**
   * Extract all JSX elements from the component
   * 
   * @param ast - Babel AST
   * @param filePath - File path for location information
   * @returns Array of JSXElementInfo objects
   */
  private extractJSXElements(ast: t.File, filePath: string): JSXElementInfo[] {
    const jsxElements: JSXElementInfo[] = [];
    const self = this;

    traverse(ast, {
      JSXElement(path) {
        const element = self.parseJSXElement(path.node, filePath);
        if (element) {
          jsxElements.push(element);
        }
      },

      JSXFragment(path) {
        // Handle JSX fragments: <>...</>
        const element: JSXElementInfo = {
          type: 'Fragment',
          attributes: [],
          children: [],
          location: self.getSourceLocation(path.node, filePath),
        };

        // Parse children
        path.node.children.forEach((child) => {
          if (t.isJSXElement(child)) {
            const childElement = self.parseJSXElement(child, filePath);
            if (childElement) {
              element.children.push(childElement);
            }
          }
        });

        jsxElements.push(element);
      },
    });

    return jsxElements;
  }

  /**
   * Parse a single JSX element and its children
   * 
   * @param node - JSX element node
   * @param filePath - File path for location information
   * @returns JSXElementInfo object or null
   */
  private parseJSXElement(node: t.JSXElement, filePath: string): JSXElementInfo | null {
    const opening = node.openingElement;

    // Get element type (tag name)
    let elementType: string;
    if (t.isJSXIdentifier(opening.name)) {
      elementType = opening.name.name;
    } else if (t.isJSXMemberExpression(opening.name)) {
      // Handle member expressions like <React.Fragment>
      elementType = this.jsxMemberExpressionToString(opening.name);
    } else {
      elementType = 'unknown';
    }

    // Extract attributes
    const attributes: AttributeInfo[] = opening.attributes.map((attr) => {
      if (t.isJSXAttribute(attr)) {
        const name = t.isJSXIdentifier(attr.name) ? attr.name.name : 'unknown';
        let value: string | boolean | null = null;

        if (attr.value === null) {
          // Boolean attribute: <button disabled />
          value = true;
        } else if (t.isStringLiteral(attr.value)) {
          value = attr.value.value;
        } else if (t.isJSXExpressionContainer(attr.value)) {
          // Expression: <button onClick={handler} />
          value = this.expressionToString(attr.value.expression);
        }

        return { name, value };
      }

      // JSXSpreadAttribute: <Component {...props} />
      return { name: 'spread', value: '...' };
    });

    // Parse children recursively
    const children: JSXElementInfo[] = [];
    node.children.forEach((child) => {
      if (t.isJSXElement(child)) {
        const childElement = this.parseJSXElement(child, filePath);
        if (childElement) {
          children.push(childElement);
        }
      }
    });

    return {
      type: elementType,
      attributes,
      children,
      location: this.getSourceLocation(node, filePath),
    };
  }

  /**
   * Convert JSX member expression to string (e.g., React.Fragment -> "React.Fragment")
   * 
   * @param node - JSX member expression node
   * @returns String representation
   */
  private jsxMemberExpressionToString(node: t.JSXMemberExpression): string {
    const parts: string[] = [];

    let current: t.JSXMemberExpression | t.JSXIdentifier = node;
    while (t.isJSXMemberExpression(current)) {
      if (t.isJSXIdentifier(current.property)) {
        parts.unshift(current.property.name);
      }
      current = current.object;
    }

    if (t.isJSXIdentifier(current)) {
      parts.unshift(current.name);
    }

    return parts.join('.');
  }

  /**
   * Convert expression to string representation
   * 
   * @param expression - Expression node
   * @returns String representation
   */
  private expressionToString(expression: t.Expression | t.JSXEmptyExpression): string {
    if (t.isStringLiteral(expression)) return expression.value;
    if (t.isNumericLiteral(expression)) return String(expression.value);
    if (t.isBooleanLiteral(expression)) return String(expression.value);
    if (t.isNullLiteral(expression)) return 'null';
    if (t.isIdentifier(expression)) return expression.name;
    if (t.isJSXEmptyExpression(expression)) return '';

    // For complex expressions, return a placeholder
    return '{expression}';
  }

  /**
   * Get source location from a node
   * 
   * @param node - AST node
   * @param filePath - File path
   * @returns SourceLocation object
   */
  private getSourceLocation(node: t.Node, filePath: string): SourceLocation {
    return {
      filePath,
      line: node.loc?.start.line ?? 0,
      column: node.loc?.start.column ?? 0,
    };
  }

  /**
   * Extract import dependencies from the component
   * 
   * @param ast - Babel AST
   * @returns Array of imported module names
   */
  private extractDependencies(ast: t.File): string[] {
    const dependencies: string[] = [];

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        // Only include relative imports (other components in the project)
        if (source.startsWith('.') || source.startsWith('/')) {
          dependencies.push(source);
        }
      },
    });

    return dependencies;
  }

  /**
   * Build a dependency graph from a set of components
   * Creates a graph structure showing which components import which other components
   * 
   * Validates: Requirements 1.5
   * 
   * @param components - Array of ComponentInfo objects
   * @returns DependencyGraph with nodes (components) and edges (import relationships)
   */
  buildDependencyGraph(components: ComponentInfo[]): {
    nodes: Map<string, ComponentInfo>;
    edges: Map<string, string[]>;
  } {
    // Create a map of file paths to components for quick lookup
    const nodesByPath = new Map<string, ComponentInfo>();
    const nodesByName = new Map<string, ComponentInfo>();
    
    // Populate the nodes map
    components.forEach((component) => {
      const normalizedPath = path.normalize(component.filePath);
      nodesByPath.set(normalizedPath, component);
      nodesByName.set(component.name, component);
    });

    // Build the edges map (component -> dependencies)
    const edges = new Map<string, string[]>();

    components.forEach((component) => {
      const dependencies: string[] = [];

      // Process each import dependency
      component.dependencies.forEach((importPath) => {
        // Resolve the import path relative to the component's directory
        const componentDir = path.dirname(component.filePath);
        const resolvedPath = this.resolveImportPath(importPath, componentDir);

        if (resolvedPath) {
          // Check if this resolved path matches any component in our graph
          const normalizedResolved = path.normalize(resolvedPath);
          
          // Try to find the component by exact path match
          let dependencyComponent = nodesByPath.get(normalizedResolved);
          
          // If not found by exact path, try with common extensions
          if (!dependencyComponent) {
            const extensions = ['.tsx', '.ts', '.jsx', '.js'];
            for (const ext of extensions) {
              const pathWithExt = normalizedResolved + ext;
              dependencyComponent = nodesByPath.get(pathWithExt);
              if (dependencyComponent) break;
            }
          }

          // If we found a matching component, add it as a dependency
          if (dependencyComponent) {
            dependencies.push(dependencyComponent.filePath);
          }
        }
      });

      // Store the dependencies for this component
      edges.set(component.filePath, dependencies);
    });

    return {
      nodes: nodesByPath,
      edges,
    };
  }

  /**
   * Resolve an import path relative to a component's directory
   * Handles relative imports like './Button', '../shared/Icon', etc.
   * 
   * @param importPath - The import path from the import statement
   * @param componentDir - The directory containing the importing component
   * @returns Resolved absolute path or null if cannot be resolved
   */
  private resolveImportPath(importPath: string, componentDir: string): string | null {
    try {
      // Only process relative imports (starting with . or /)
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        return null;
      }

      // Resolve the path relative to the component's directory
      const resolvedPath = path.resolve(componentDir, importPath);

      // Check if the resolved path exists as a directory (for index file imports)
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
        const extensions = ['.tsx', '.ts', '.jsx', '.js'];
        for (const ext of extensions) {
          const indexPath = path.join(resolvedPath, `index${ext}`);
          if (fs.existsSync(indexPath)) {
            return indexPath;
          }
        }
      }

      // Check if the resolved path exists as a file (with or without extension)
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        return resolvedPath;
      }

      // Try common extensions if the path doesn't exist as-is
      const extensions = ['.tsx', '.ts', '.jsx', '.js'];
      for (const ext of extensions) {
        const pathWithExt = resolvedPath + ext;
        if (fs.existsSync(pathWithExt)) {
          return pathWithExt;
        }
      }

      // If we can't resolve it, return null
      return null;
    } catch (error) {
      console.warn(`Failed to resolve import path ${importPath} from ${componentDir}:`, error);
      return null;
    }
  }
}
