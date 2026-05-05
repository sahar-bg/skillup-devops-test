/**
 * Unit tests for ComponentScanner
 * Tests file discovery, filtering, and React component identification
 */

import * as fs from 'fs';
import * as path from 'path';
import { ComponentScanner } from '../../src/scanner/ComponentScanner';

describe('ComponentScanner', () => {
  let scanner: ComponentScanner;
  let testFixturesDir: string;

  beforeAll(() => {
    scanner = new ComponentScanner();
    testFixturesDir = path.join(__dirname, '../fixtures/components');

    // Create test fixtures directory structure
    if (!fs.existsSync(testFixturesDir)) {
      fs.mkdirSync(testFixturesDir, { recursive: true });
    }

    // Create subdirectories
    const subdirs = [
      'valid',
      'invalid',
      'nested/deep',
      'node_modules/some-package',
      'dist'
    ];

    subdirs.forEach(dir => {
      const dirPath = path.join(testFixturesDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // Create test files
    const testFiles = [
      // Valid React components
      {
        path: 'valid/Button.tsx',
        content: `
import React from 'react';

export const Button = () => {
  return <button>Click me</button>;
};
`
      },
      {
        path: 'valid/Card.jsx',
        content: `
import React from 'react';

export default function Card() {
  return <div className="card">Card content</div>;
}
`
      },
      {
        path: 'valid/ClassComponent.js',
        content: `
import React, { Component } from 'react';

class MyComponent extends Component {
  render() {
    return <div>Hello</div>;
  }
}

export default MyComponent;
`
      },
      {
        path: 'nested/deep/NestedComponent.tsx',
        content: `
import React from 'react';

export const NestedComponent = () => <div>Nested</div>;
`
      },
      // Invalid/non-React files
      {
        path: 'invalid/utils.ts',
        content: `
export function add(a: number, b: number): number {
  return a + b;
}
`
      },
      {
        path: 'invalid/config.js',
        content: `
module.exports = {
  apiUrl: 'https://api.example.com'
};
`
      },
      {
        path: 'valid/types.ts',
        content: `
export interface User {
  id: string;
  name: string;
}
`
      },
      // Files in excluded directories
      {
        path: 'node_modules/some-package/Component.jsx',
        content: `
import React from 'react';
export const Component = () => <div>Should be excluded</div>;
`
      },
      {
        path: 'dist/compiled.js',
        content: `
// Compiled code
`
      }
    ];

    testFiles.forEach(file => {
      const filePath = path.join(testFixturesDir, file.path);
      fs.writeFileSync(filePath, file.content, 'utf-8');
    });
  });

  afterAll(() => {
    // Clean up test fixtures
    if (fs.existsSync(testFixturesDir)) {
      fs.rmSync(testFixturesDir, { recursive: true, force: true });
    }
  });

  describe('scanDirectory', () => {
    it('should find all .jsx, .tsx, and .js files in a directory', () => {
      const files = scanner.scanDirectory(testFixturesDir, []);

      // Should find all files including those in subdirectories
      expect(files.length).toBeGreaterThan(0);

      // Check that it found files with correct extensions
      const extensions = files.map(f => path.extname(f));
      expect(extensions).toContain('.tsx');
      expect(extensions).toContain('.jsx');
      expect(extensions).toContain('.js');
      
      // Should NOT include .ts files (only .tsx, .jsx, .js per requirements)
      const uniqueExtensions = [...new Set(extensions)];
      uniqueExtensions.forEach(ext => {
        expect(['.tsx', '.jsx', '.js']).toContain(ext);
      });
    });

    it('should exclude specified paths', () => {
      const files = scanner.scanDirectory(testFixturesDir, ['node_modules', 'dist']);

      // Should not include files from excluded directories
      const hasNodeModules = files.some(f => f.includes('node_modules'));
      const hasDist = files.some(f => f.includes('dist'));

      expect(hasNodeModules).toBe(false);
      expect(hasDist).toBe(false);
    });

    it('should recursively scan nested directories', () => {
      const files = scanner.scanDirectory(testFixturesDir, ['node_modules', 'dist']);

      // Should find the nested component
      const hasNestedComponent = files.some(f => f.includes('nested') && f.includes('deep'));
      expect(hasNestedComponent).toBe(true);
    });

    it('should handle non-existent directories gracefully', () => {
      const files = scanner.scanDirectory('/non/existent/path', []);
      expect(files).toEqual([]);
    });

    it('should handle file path as input (not a directory)', () => {
      const filePath = path.join(testFixturesDir, 'valid/Button.tsx');
      const files = scanner.scanDirectory(filePath, []);
      expect(files).toEqual([]);
    });

    it('should return empty array for empty directory', () => {
      const emptyDir = path.join(testFixturesDir, 'empty');
      fs.mkdirSync(emptyDir, { recursive: true });

      const files = scanner.scanDirectory(emptyDir, []);
      expect(files).toEqual([]);

      fs.rmdirSync(emptyDir);
    });
  });

  describe('isReactComponent', () => {
    it('should identify functional React components with JSX', () => {
      const filePath = path.join(testFixturesDir, 'valid/Button.tsx');
      const isComponent = scanner.isReactComponent(filePath);
      expect(isComponent).toBe(true);
    });

    it('should identify class-based React components', () => {
      const filePath = path.join(testFixturesDir, 'valid/ClassComponent.js');
      const isComponent = scanner.isReactComponent(filePath);
      expect(isComponent).toBe(true);
    });

    it('should identify React components in .jsx files', () => {
      const filePath = path.join(testFixturesDir, 'valid/Card.jsx');
      const isComponent = scanner.isReactComponent(filePath);
      expect(isComponent).toBe(true);
    });

    it('should reject utility files without React', () => {
      const filePath = path.join(testFixturesDir, 'invalid/utils.ts');
      const isComponent = scanner.isReactComponent(filePath);
      expect(isComponent).toBe(false);
    });

    it('should reject config files', () => {
      const filePath = path.join(testFixturesDir, 'invalid/config.js');
      const isComponent = scanner.isReactComponent(filePath);
      expect(isComponent).toBe(false);
    });

    it('should reject TypeScript type definition files', () => {
      const filePath = path.join(testFixturesDir, 'valid/types.ts');
      const isComponent = scanner.isReactComponent(filePath);
      expect(isComponent).toBe(false);
    });

    it('should handle non-existent files gracefully', () => {
      const isComponent = scanner.isReactComponent('/non/existent/file.tsx');
      expect(isComponent).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle files with React imports but no JSX', () => {
      const tempFile = path.join(testFixturesDir, 'temp-no-jsx.ts');
      fs.writeFileSync(tempFile, `
import React from 'react';

export const config = {
  version: '1.0.0'
};
`, 'utf-8');

      const isComponent = scanner.isReactComponent(tempFile);
      expect(isComponent).toBe(false);

      fs.unlinkSync(tempFile);
    });

    it('should handle files with JSX but no React import (might be using new JSX transform)', () => {
      const tempFile = path.join(testFixturesDir, 'temp-jsx-no-import.tsx');
      fs.writeFileSync(tempFile, `
export const Button = () => {
  return <button>Click</button>;
};
`, 'utf-8');

      const isComponent = scanner.isReactComponent(tempFile);
      // Should still identify as component due to JSX and component pattern
      expect(isComponent).toBe(true);

      fs.unlinkSync(tempFile);
    });

    it('should handle files with hooks imports', () => {
      const tempFile = path.join(testFixturesDir, 'temp-hooks.tsx');
      fs.writeFileSync(tempFile, `
import { useState, useEffect } from 'react';

export const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
};
`, 'utf-8');

      const isComponent = scanner.isReactComponent(tempFile);
      expect(isComponent).toBe(true);

      fs.unlinkSync(tempFile);
    });
  });

  describe('parseComponent', () => {
    it('should parse a functional component with TypeScript props', () => {
      const filePath = path.join(testFixturesDir, 'valid/Button.tsx');
      const componentInfo = scanner.parseComponent(filePath);

      expect(componentInfo.name).toBe('Button');
      expect(componentInfo.filePath).toBe(filePath);
      expect(componentInfo.ast).toBeDefined();
      expect(Array.isArray(componentInfo.dependencies)).toBe(true);
      expect(Array.isArray(componentInfo.props)).toBe(true);
      expect(Array.isArray(componentInfo.jsxElements)).toBe(true);
    });

    it('should extract JSX elements from component', () => {
      const filePath = path.join(testFixturesDir, 'valid/Button.tsx');
      const componentInfo = scanner.parseComponent(filePath);

      expect(componentInfo.jsxElements.length).toBeGreaterThan(0);
      
      // Should find the button element
      const hasButton = componentInfo.jsxElements.some(
        el => el.type === 'button' || 
        el.children.some(child => child.type === 'button')
      );
      expect(hasButton).toBe(true);
    });

    it('should extract component name from function declaration', () => {
      const tempFile = path.join(testFixturesDir, 'temp-func-decl.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';

function MyComponent() {
  return <div>Hello</div>;
}

export default MyComponent;
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      expect(componentInfo.name).toBe('MyComponent');

      fs.unlinkSync(tempFile);
    });

    it('should extract component name from arrow function', () => {
      const tempFile = path.join(testFixturesDir, 'temp-arrow.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';

const MyArrowComponent = () => {
  return <div>Hello</div>;
};

export default MyArrowComponent;
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      expect(componentInfo.name).toBe('MyArrowComponent');

      fs.unlinkSync(tempFile);
    });

    it('should extract component name from class declaration', () => {
      const filePath = path.join(testFixturesDir, 'valid/ClassComponent.js');
      const componentInfo = scanner.parseComponent(filePath);

      expect(componentInfo.name).toBe('MyComponent');
    });

    it('should extract props from TypeScript interface', () => {
      const tempFile = path.join(testFixturesDir, 'temp-props-interface.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';

interface MyComponentProps {
  title: string;
  count: number;
  isActive?: boolean;
}

const MyComponent = (props: MyComponentProps) => {
  return <div>{props.title}</div>;
};

export default MyComponent;
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      
      expect(componentInfo.props.length).toBe(3);
      
      const titleProp = componentInfo.props.find(p => p.name === 'title');
      expect(titleProp).toBeDefined();
      expect(titleProp?.type).toBe('string');
      expect(titleProp?.required).toBe(true);

      const countProp = componentInfo.props.find(p => p.name === 'count');
      expect(countProp).toBeDefined();
      expect(countProp?.type).toBe('number');
      expect(countProp?.required).toBe(true);

      const isActiveProp = componentInfo.props.find(p => p.name === 'isActive');
      expect(isActiveProp).toBeDefined();
      expect(isActiveProp?.type).toBe('boolean');
      expect(isActiveProp?.required).toBe(false);

      fs.unlinkSync(tempFile);
    });

    it('should extract props from TypeScript type alias', () => {
      const tempFile = path.join(testFixturesDir, 'temp-props-type.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';

type MyComponentProps = {
  label: string;
  onClick: () => void;
};

const MyComponent = ({ label, onClick }: MyComponentProps) => {
  return <button onClick={onClick}>{label}</button>;
};

export default MyComponent;
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      
      expect(componentInfo.props.length).toBeGreaterThanOrEqual(2);
      
      const labelProp = componentInfo.props.find(p => p.name === 'label');
      expect(labelProp).toBeDefined();
      expect(labelProp?.type).toBe('string');

      fs.unlinkSync(tempFile);
    });

    it('should extract JSX attributes', () => {
      const tempFile = path.join(testFixturesDir, 'temp-attributes.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';

const MyComponent = () => {
  return (
    <div>
      <img src="test.jpg" alt="Test image" />
      <button disabled onClick={() => {}}>Click</button>
      <input type="text" aria-label="Username" />
    </div>
  );
};

export default MyComponent;
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      
      // Find the img element
      const findElement = (elements: any[], type: string): any => {
        for (const el of elements) {
          if (el.type === type) return el;
          const found = findElement(el.children, type);
          if (found) return found;
        }
        return null;
      };

      const imgElement = findElement(componentInfo.jsxElements, 'img');
      expect(imgElement).toBeDefined();
      expect(imgElement.attributes.length).toBeGreaterThan(0);
      
      const altAttr = imgElement.attributes.find((a: any) => a.name === 'alt');
      expect(altAttr).toBeDefined();
      expect(altAttr.value).toBe('Test image');

      const buttonElement = findElement(componentInfo.jsxElements, 'button');
      expect(buttonElement).toBeDefined();
      
      const disabledAttr = buttonElement.attributes.find((a: any) => a.name === 'disabled');
      expect(disabledAttr).toBeDefined();
      expect(disabledAttr.value).toBe(true);

      fs.unlinkSync(tempFile);
    });

    it('should extract dependencies from imports', () => {
      const tempFile = path.join(testFixturesDir, 'temp-dependencies.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';
import { Button } from './Button';
import Card from '../components/Card';
import { formatDate } from '@/utils/date';

const MyComponent = () => {
  return (
    <div>
      <Button />
      <Card />
    </div>
  );
};

export default MyComponent;
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      
      expect(componentInfo.dependencies.length).toBeGreaterThan(0);
      expect(componentInfo.dependencies).toContain('./Button');
      expect(componentInfo.dependencies).toContain('../components/Card');
      
      // Should not include external packages
      expect(componentInfo.dependencies).not.toContain('react');
      expect(componentInfo.dependencies).not.toContain('@/utils/date');

      fs.unlinkSync(tempFile);
    });

    it('should handle parse errors gracefully', () => {
      const tempFile = path.join(testFixturesDir, 'temp-invalid.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';

const MyComponent = () => {
  return <div>Unclosed div
};
`, 'utf-8');

      expect(() => scanner.parseComponent(tempFile)).toThrow(/Failed to parse component/);

      fs.unlinkSync(tempFile);
    });

    it('should handle files with no JSX', () => {
      const tempFile = path.join(testFixturesDir, 'temp-no-jsx.ts');
      fs.writeFileSync(tempFile, `
export const add = (a: number, b: number): number => {
  return a + b;
};
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      
      expect(componentInfo.jsxElements.length).toBe(0);
      expect(componentInfo.name).toBe('temp-no-jsx'); // Falls back to filename

      fs.unlinkSync(tempFile);
    });

    it('should parse JavaScript files without TypeScript', () => {
      const filePath = path.join(testFixturesDir, 'valid/Card.jsx');
      const componentInfo = scanner.parseComponent(filePath);

      expect(componentInfo.name).toBe('Card');
      expect(componentInfo.ast).toBeDefined();
      expect(componentInfo.jsxElements.length).toBeGreaterThan(0);
    });

    it('should handle nested JSX elements', () => {
      const tempFile = path.join(testFixturesDir, 'temp-nested.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';

const MyComponent = () => {
  return (
    <div>
      <header>
        <h1>Title</h1>
        <nav>
          <a href="/">Home</a>
        </nav>
      </header>
    </div>
  );
};

export default MyComponent;
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      
      expect(componentInfo.jsxElements.length).toBeGreaterThan(0);
      
      // Check for nested structure
      const hasNestedElements = componentInfo.jsxElements.some(el => 
        el.children.length > 0 && el.children.some(child => child.children.length > 0)
      );
      expect(hasNestedElements).toBe(true);

      fs.unlinkSync(tempFile);
    });

    it('should extract location information for JSX elements', () => {
      const tempFile = path.join(testFixturesDir, 'temp-location.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';

const MyComponent = () => {
  return <div>Hello</div>;
};

export default MyComponent;
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      
      expect(componentInfo.jsxElements.length).toBeGreaterThan(0);
      
      const firstElement = componentInfo.jsxElements[0];
      expect(firstElement.location).toBeDefined();
      expect(firstElement.location.filePath).toBe(tempFile);
      expect(firstElement.location.line).toBeGreaterThan(0);
      expect(firstElement.location.column).toBeGreaterThanOrEqual(0);

      fs.unlinkSync(tempFile);
    });
  });

  describe('buildDependencyGraph', () => {
    it('should return empty graph for empty component array', () => {
      const result = scanner.buildDependencyGraph([]);
      expect(result.nodes.size).toBe(0);
      expect(result.edges.size).toBe(0);
    });

    it('should build graph with single component and no dependencies', () => {
      const tempFile = path.join(testFixturesDir, 'temp-single.tsx');
      fs.writeFileSync(tempFile, `
import React from 'react';

const SingleComponent = () => {
  return <div>Single</div>;
};

export default SingleComponent;
`, 'utf-8');

      const componentInfo = scanner.parseComponent(tempFile);
      const result = scanner.buildDependencyGraph([componentInfo]);

      expect(result.nodes.size).toBe(1);
      expect(result.edges.size).toBe(1);
      expect(result.edges.get(tempFile)).toEqual([]);

      fs.unlinkSync(tempFile);
    });

    it('should build graph with multiple independent components', () => {
      const file1 = path.join(testFixturesDir, 'temp-comp1.tsx');
      const file2 = path.join(testFixturesDir, 'temp-comp2.tsx');

      fs.writeFileSync(file1, `
import React from 'react';

const Component1 = () => {
  return <div>Component 1</div>;
};

export default Component1;
`, 'utf-8');

      fs.writeFileSync(file2, `
import React from 'react';

const Component2 = () => {
  return <div>Component 2</div>;
};

export default Component2;
`, 'utf-8');

      const comp1 = scanner.parseComponent(file1);
      const comp2 = scanner.parseComponent(file2);
      const result = scanner.buildDependencyGraph([comp1, comp2]);

      expect(result.nodes.size).toBe(2);
      expect(result.edges.size).toBe(2);
      expect(result.edges.get(file1)).toEqual([]);
      expect(result.edges.get(file2)).toEqual([]);

      fs.unlinkSync(file1);
      fs.unlinkSync(file2);
    });

    it('should build graph with component dependencies', () => {
      const buttonFile = path.join(testFixturesDir, 'temp-button.tsx');
      const cardFile = path.join(testFixturesDir, 'temp-card.tsx');

      fs.writeFileSync(buttonFile, `
import React from 'react';

export const Button = () => {
  return <button>Click</button>;
};
`, 'utf-8');

      fs.writeFileSync(cardFile, `
import React from 'react';
import { Button } from './temp-button';

const Card = () => {
  return (
    <div>
      <Button />
    </div>
  );
};

export default Card;
`, 'utf-8');

      const button = scanner.parseComponent(buttonFile);
      const card = scanner.parseComponent(cardFile);
      const result = scanner.buildDependencyGraph([button, card]);

      expect(result.nodes.size).toBe(2);
      expect(result.edges.size).toBe(2);
      
      // Button has no dependencies
      expect(result.edges.get(buttonFile)).toEqual([]);
      
      // Card depends on Button
      const cardDeps = result.edges.get(cardFile);
      expect(cardDeps).toBeDefined();
      expect(cardDeps?.length).toBe(1);
      expect(cardDeps?.[0]).toBe(buttonFile);

      fs.unlinkSync(buttonFile);
      fs.unlinkSync(cardFile);
    });

    it('should handle relative imports with different path formats', () => {
      const nestedDir = path.join(testFixturesDir, 'nested-deps');
      if (!fs.existsSync(nestedDir)) {
        fs.mkdirSync(nestedDir, { recursive: true });
      }

      const utilFile = path.join(testFixturesDir, 'temp-util.tsx');
      const nestedFile = path.join(nestedDir, 'temp-nested.tsx');

      fs.writeFileSync(utilFile, `
import React from 'react';

export const Util = () => {
  return <div>Util</div>;
};
`, 'utf-8');

      fs.writeFileSync(nestedFile, `
import React from 'react';
import { Util } from '../temp-util';

const Nested = () => {
  return (
    <div>
      <Util />
    </div>
  );
};

export default Nested;
`, 'utf-8');

      const util = scanner.parseComponent(utilFile);
      const nested = scanner.parseComponent(nestedFile);
      const result = scanner.buildDependencyGraph([util, nested]);

      expect(result.nodes.size).toBe(2);
      
      // Nested depends on Util
      const nestedDeps = result.edges.get(nestedFile);
      expect(nestedDeps).toBeDefined();
      expect(nestedDeps?.length).toBe(1);
      expect(nestedDeps?.[0]).toBe(utilFile);

      fs.unlinkSync(utilFile);
      fs.unlinkSync(nestedFile);
      fs.rmdirSync(nestedDir);
    });

    it('should handle multiple dependencies in one component', () => {
      const comp1File = path.join(testFixturesDir, 'temp-dep1.tsx');
      const comp2File = path.join(testFixturesDir, 'temp-dep2.tsx');
      const parentFile = path.join(testFixturesDir, 'temp-parent.tsx');

      fs.writeFileSync(comp1File, `
import React from 'react';

export const Dep1 = () => {
  return <div>Dep1</div>;
};
`, 'utf-8');

      fs.writeFileSync(comp2File, `
import React from 'react';

export const Dep2 = () => {
  return <div>Dep2</div>;
};
`, 'utf-8');

      fs.writeFileSync(parentFile, `
import React from 'react';
import { Dep1 } from './temp-dep1';
import { Dep2 } from './temp-dep2';

const Parent = () => {
  return (
    <div>
      <Dep1 />
      <Dep2 />
    </div>
  );
};

export default Parent;
`, 'utf-8');

      const dep1 = scanner.parseComponent(comp1File);
      const dep2 = scanner.parseComponent(comp2File);
      const parent = scanner.parseComponent(parentFile);
      const result = scanner.buildDependencyGraph([dep1, dep2, parent]);

      expect(result.nodes.size).toBe(3);
      
      // Parent depends on both Dep1 and Dep2
      const parentDeps = result.edges.get(parentFile);
      expect(parentDeps).toBeDefined();
      expect(parentDeps?.length).toBe(2);
      expect(parentDeps).toContain(comp1File);
      expect(parentDeps).toContain(comp2File);

      fs.unlinkSync(comp1File);
      fs.unlinkSync(comp2File);
      fs.unlinkSync(parentFile);
    });

    it('should ignore external package imports', () => {
      const tempFile = path.join(testFixturesDir, 'temp-external.tsx');

      fs.writeFileSync(tempFile, `
import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const Component = () => {
  const [state, setState] = useState(0);
  return <div>{state}</div>;
};

export default Component;
`, 'utf-8');

      const component = scanner.parseComponent(tempFile);
      const result = scanner.buildDependencyGraph([component]);

      expect(result.nodes.size).toBe(1);
      
      // Should have no dependencies (external packages are ignored)
      const deps = result.edges.get(tempFile);
      expect(deps).toEqual([]);

      fs.unlinkSync(tempFile);
    });

    it('should handle imports with file extensions', () => {
      const comp1File = path.join(testFixturesDir, 'temp-with-ext.tsx');
      const comp2File = path.join(testFixturesDir, 'temp-imports-ext.tsx');

      fs.writeFileSync(comp1File, `
import React from 'react';

export const WithExt = () => {
  return <div>WithExt</div>;
};
`, 'utf-8');

      fs.writeFileSync(comp2File, `
import React from 'react';
import { WithExt } from './temp-with-ext.tsx';

const ImportsExt = () => {
  return <WithExt />;
};

export default ImportsExt;
`, 'utf-8');

      const comp1 = scanner.parseComponent(comp1File);
      const comp2 = scanner.parseComponent(comp2File);
      const result = scanner.buildDependencyGraph([comp1, comp2]);

      expect(result.nodes.size).toBe(2);
      
      // Should resolve the dependency even with explicit extension
      const deps = result.edges.get(comp2File);
      expect(deps).toBeDefined();
      expect(deps?.length).toBe(1);
      expect(deps?.[0]).toBe(comp1File);

      fs.unlinkSync(comp1File);
      fs.unlinkSync(comp2File);
    });

    it('should handle non-existent import paths gracefully', () => {
      const tempFile = path.join(testFixturesDir, 'temp-missing-import.tsx');

      fs.writeFileSync(tempFile, `
import React from 'react';
import { NonExistent } from './does-not-exist';

const Component = () => {
  return <div>Component</div>;
};

export default Component;
`, 'utf-8');

      const component = scanner.parseComponent(tempFile);
      const result = scanner.buildDependencyGraph([component]);

      expect(result.nodes.size).toBe(1);
      
      // Should have no dependencies (non-existent import is ignored)
      const deps = result.edges.get(tempFile);
      expect(deps).toEqual([]);

      fs.unlinkSync(tempFile);
    });

    it('should handle circular dependencies', () => {
      const comp1File = path.join(testFixturesDir, 'temp-circular1.tsx');
      const comp2File = path.join(testFixturesDir, 'temp-circular2.tsx');

      fs.writeFileSync(comp1File, `
import React from 'react';
import { Circular2 } from './temp-circular2';

export const Circular1 = () => {
  return <div><Circular2 /></div>;
};
`, 'utf-8');

      fs.writeFileSync(comp2File, `
import React from 'react';
import { Circular1 } from './temp-circular1';

export const Circular2 = () => {
  return <div><Circular1 /></div>;
};
`, 'utf-8');

      const comp1 = scanner.parseComponent(comp1File);
      const comp2 = scanner.parseComponent(comp2File);
      const result = scanner.buildDependencyGraph([comp1, comp2]);

      expect(result.nodes.size).toBe(2);
      
      // Both should have each other as dependencies
      const comp1Deps = result.edges.get(comp1File);
      const comp2Deps = result.edges.get(comp2File);
      
      expect(comp1Deps).toContain(comp2File);
      expect(comp2Deps).toContain(comp1File);

      fs.unlinkSync(comp1File);
      fs.unlinkSync(comp2File);
    });

    it('should handle index file imports', () => {
      const indexDir = path.join(testFixturesDir, 'index-test');
      if (!fs.existsSync(indexDir)) {
        fs.mkdirSync(indexDir, { recursive: true });
      }

      const indexFile = path.join(indexDir, 'index.tsx');
      const importerFile = path.join(testFixturesDir, 'temp-index-importer.tsx');

      fs.writeFileSync(indexFile, `
import React from 'react';

export const IndexComponent = () => {
  return <div>Index</div>;
};
`, 'utf-8');

      fs.writeFileSync(importerFile, `
import React from 'react';
import { IndexComponent } from './index-test';

const Importer = () => {
  return <IndexComponent />;
};

export default Importer;
`, 'utf-8');

      const indexComp = scanner.parseComponent(indexFile);
      const importer = scanner.parseComponent(importerFile);
      const result = scanner.buildDependencyGraph([indexComp, importer]);

      expect(result.nodes.size).toBe(2);
      
      // Importer should depend on index file
      const importerDeps = result.edges.get(importerFile);
      expect(importerDeps).toBeDefined();
      expect(importerDeps?.length).toBe(1);
      expect(importerDeps?.[0]).toBe(indexFile);

      fs.unlinkSync(indexFile);
      fs.unlinkSync(importerFile);
      fs.rmdirSync(indexDir);
    });
  });
});
