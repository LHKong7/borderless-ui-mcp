import dedent from 'dedent';

export interface PaginationResult<T> {
  items: T[];
  totalCount: number;
  offset?: number;
  hasMore: boolean;
}

export interface FormatSearchOptions {
  query?: string;
  registries?: string[];
}

export interface RegistryItem {
  id?: number;
  slug: string;
  name: string;
  description?: string;
  framework: string;
  npmPackage?: string;
  installCommand?: string;
  homepageUrl?: string;
  repoUrl?: string;
  docsUrl?: string;
  license?: string;
  isOfficial?: boolean;
  componentCount?: number;
  components?: ComponentItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ComponentItem {
  id?: number;
  registryId?: number;
  slug: string;
  registrySlug: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  registryName?: string;
  dependencies?: string[];
  addCommandArgument?: string;
  introducedVersion?: string;
  deprecatedVersion?: string;
  exampleCount?: number;
  examples?: ComponentExample[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ComponentExample {
  id?: number;
  componentId?: number;
  name: string;
  description?: string;
  language: string;
  code: string;
  isPrimary?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface McpConfig {
  registries: Record<string, {
    style: string;
    tailwind: {
      config: string;
      css: string;
      baseColor: string;
      cssVariables: boolean;
    };
    rsc: boolean;
    tsx: boolean;
  }>;
}

/**
 * Format search results with pagination info
 */
export function formatSearchResultsWithPagination(
  results: PaginationResult<RegistryItem | ComponentItem>,
  options?: {
    query?: string;
    registries?: string[];
  }
): string {
  const { query, registries } = options || {};

  let output = '';

  if (query) {
    output += `Search results for "${query}"`;
    if (registries && registries.length > 0) {
      output += ` in registries: ${registries.join(', ')}`;
    }
    output += '\n\n';
  } else if (registries && registries.length > 0) {
    output += `Items in registries: ${registries.join(', ')}\n\n`;
  }

  if (results.items.length === 0) {
    return output + 'No items found.';
  }

  // Format each item
  const formattedItems = results.items.map(item => {
    if ('registrySlug' in item && item.registrySlug) {
      return formatComponentItem(item as ComponentItem);
    } else {
      return formatRegistryItem(item as RegistryItem);
    }
  });

  output += formattedItems.join('\n\n---\n\n');

  // Add pagination info
  const showingFrom = (results.offset || 0) + 1;
  const showingTo = (results.offset || 0) + results.items.length;
  output += dedent`

    Showing ${showingFrom}-${showingTo} of ${results.totalCount} items${results.hasMore ? ' (more available)' : ''}
  `;

  return output;
}

/**
 * Format a registry item
 */
export function formatRegistryItem(registry: RegistryItem): string {
  const lines = [
    `**${registry.name}** (\`${registry.slug}\`)`,
    '',
    `Framework: ${registry.framework}`,
    ''
  ];

  if (registry.description) {
    lines.push(registry.description);
    lines.push('');
  }

  if (registry.npmPackage) {
    lines.push(`📦 Package: \`${registry.npmPackage}\``);
    if (registry.installCommand) {
      lines.push(`🚀 Install: \`${registry.installCommand}\``);
    }
    lines.push('');
  }

  if (registry.componentCount && registry.componentCount > 0) {
    lines.push(`📊 Components: ${registry.componentCount}`);
    lines.push('');
  }

  if (registry.homepageUrl) {
    lines.push(`🌐 Homepage: ${registry.homepageUrl}`);
  }

  if (registry.isOfficial) {
    lines.push('✅ Official Registry');
  }

  // Format all components if they exist
  if (registry.components && registry.components.length > 0) {
    lines.push('');
    lines.push('═'.repeat(60));
    lines.push('## UI COMPONENTS');
    lines.push('═'.repeat(60));
    lines.push('');
    
    registry.components.forEach((component, index) => {
      if (index > 0) {
        lines.push('');
        lines.push('─'.repeat(60));
        lines.push('');
      }
      lines.push(formatComponentItemNested(component, 0));
    });
  }

  return lines.join('\n');
}

/**
 * Format a component item (standalone)
 */
export function formatComponentItem(component: ComponentItem): string {
  const lines = [
    `**${component.name}** (\`${component.addCommandArgument}\`)`,
    ''
  ];

  if (component.description) {
    lines.push(component.description);
    lines.push('');
  }

  // Metadata line
  const metadata = [
    `Type: ${component.type}`,
    `Framework: ${component.registryName || component.registrySlug}`,
    `Status: ${component.status}`
  ];

  lines.push(metadata.join(' | '));
  lines.push('');

  // Dependencies
  if (component.dependencies && component.dependencies.length > 0) {
    lines.push(`📦 Dependencies: ${component.dependencies.map(dep => `\`${dep}\``).join(', ')}`);
    lines.push('');
  }

  // Example count
  if (component.exampleCount && component.exampleCount > 0) {
    lines.push(`📝 ${component.exampleCount} example${component.exampleCount > 1 ? 's' : ''} available`);
  }

  return lines.join('\n');
}

/**
 * Format a component item nested within a registry
 */
export function formatComponentItemNested(component: ComponentItem, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);
  const lines = [
    `${indentStr}### ${component.name}`,
    ''
  ];

  if (component.description) {
    lines.push(`${indentStr}${component.description}`);
    lines.push('');
  }

  // Metadata
  const metadata = [
    `Type: ${component.type}`,
    `Status: ${component.status}`,
  ];

  lines.push(`${indentStr}${metadata.join(' | ')}`);
  lines.push('');

  // Dependencies
  if (component.dependencies && component.dependencies.length > 0) {
    lines.push(`${indentStr}📦 Dependencies: ${component.dependencies.map(dep => `\`${dep}\``).join(', ')}`);
    lines.push('');
  }

  // Format examples if they exist
  if (component.examples && component.examples.length > 0) {
    lines.push(`${indentStr}📝 **Examples (${component.examples.length}):**`);
    lines.push('');
    
    component.examples.forEach((example, index) => {
      if (index > 0) {
        lines.push('');
      }
      lines.push(formatComponentExample(example, indent + 1));
    });
  }

  return lines.join('\n');
}

/**
 * Format a component example
 */
export function formatComponentExample(example: ComponentExample, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);
  const lines = [
    `${indentStr}**${example.name}**${example.isPrimary ? ' 🌟' : ''}`,
  ];

  if (example.description) {
    lines.push(`${indentStr}${example.description}`);
    lines.push('');
  }

  // Code block
  lines.push(`${indentStr}\`\`\`${example.language}`);
  // Add indentation to each line of code
  const codeLines = example.code.split('\n');
  codeLines.forEach(line => {
    lines.push(`${indentStr}${line}`);
  });
  lines.push(`${indentStr}\`\`\``);

  return lines.join('\n');
}

/**
 * Format detailed component information
 */
export function formatRegistryItems(items: (RegistryItem | ComponentItem)[]): string[] {
  return items.map(item => {
    if ('registrySlug' in item && item.registrySlug) {
      // Component detail view
      const component = item as ComponentItem;
      const lines = [
        `## ${component.name} (\`${component.addCommandArgument}\`)`,
        ''
      ];

      if (component.description) {
        lines.push(component.description);
        lines.push('');
      }

      // Basic info
      lines.push('### Basic Information');
      lines.push(`- **Registry:** ${component.registryName} (\`${component.registrySlug}\`)`);
      lines.push(`- **Type:** ${component.type}`);
      lines.push(`- **Status:** ${component.status}`);

      if (component.introducedVersion) {
        lines.push(`- **Introduced:** Version ${component.introducedVersion}`);
      }

      if (component.deprecatedVersion) {
        lines.push(`- **Deprecated:** Version ${component.deprecatedVersion}`);
      }

      lines.push('');

      // Dependencies
      if (component.dependencies && component.dependencies.length > 0) {
        lines.push('### Dependencies');
        lines.push(`${component.dependencies.map(dep => `\`${dep}\``).join(', ')}`);
        lines.push('');
      }

      return lines.join('\n');
    } else {
      // Registry detail view
      return formatRegistryItem(item as RegistryItem);
    }
  });
}

/**
 * Format component examples
 */
export function formatItemExamples(items: ComponentItem[], query = ''): string {
  if (items.length === 0) {
    return dedent`No examples found for query "${query}".

    Try searching with patterns like:
    - "button-demo" for button examples
    - "card example" for card examples
    - Component name followed by "-demo" or "example"

    You can also:
    1. Use search_items_in_registries to find all items matching your query
    2. View the main component with view_items_in_registries for inline usage documentation`;
  }

  let output = '';

  if (query) {
    output += `Examples for "${query}":\n\n`;
  }

  const examplesByComponent = items.reduce((acc, item) => {
    const key = item.addCommandArgument || item.slug;
    if (!acc[key]) {
      acc[key] = {
        component: item,
        examples: [] as ComponentExample[]
      };
    }

    // Collect examples from component.examples array
    if (item.examples && item.examples.length > 0) {
      acc[key]!.examples.push(...item.examples);
    }

    return acc;
  }, {} as Record<string, { component: ComponentItem; examples: ComponentExample[] }>);

  Object.entries(examplesByComponent).forEach(([componentKey, data], index) => {
    if (index > 0) {
      output += '\n---\n\n';
    }

    output += `## ${data.component.name} (\`${componentKey}\`)\n\n`;

    if (data.component.description) {
      output += `${data.component.description}\n\n`;
    }

    if (data.examples.length === 0) {
      output += 'No examples available for this component.\n\n';
    } else {
      data.examples.forEach((example, exampleIndex) => {
        output += `### ${example.name}${example.isPrimary ? ' (Primary)' : ''}\n\n`;

        if (example.description) {
          output += `${example.description}\n\n`;
        }

        output += `**Language:** ${example.language}\n\n`;

        output += '```' + example.language + '\n';
        output += example.code;
        output += '\n```\n\n';
      });
    }
  });

  return output;
}

/**
 * Get MCP configuration (placeholder - could read from components.json in future)
 */
export async function getMcpConfig(cwd: string): Promise<McpConfig> {
  // For now, return a default config
  // In a real implementation, this would read from components.json
  return {
    registries: {
      '@shadcn': {
        style: 'default',
        tailwind: {
          config: 'tailwind.config.ts',
          css: 'src/app/globals.css',
          baseColor: 'slate',
          cssVariables: true
        },
        rsc: true,
        tsx: true
      }
    }
  };
}
