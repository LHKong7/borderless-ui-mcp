import 'reflect-metadata';
import express, { Request, Response, Application } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { zodToJsonSchema } from "zod-to-json-schema"
import dedent from 'dedent';

import { In } from 'typeorm';
import { AppDataSource } from './config/database';
import { registryService } from './services/registryService';
import {
  formatSearchResultsWithPagination,
  formatItemExamples,
  ComponentItem,
} from './mcp/utils';
import { UIRegistry, UIComponent, UIComponentExample } from './entities';

const app: Application = express();
const PORT = process.env.HTTP_PORT || 3000;
const MCP_PORT = process.env.MCP_PORT || 3001;

// Middleware for JSON parsing
app.use(express.json());

// Repository instances
let UIRegistryRepository: any;
let UIComponentRepository: any;
let UIComponentExampleRepository: any;

// Initialize database and repositories
async function initializeDatabase(): Promise<boolean> {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');

    UIRegistryRepository = AppDataSource.getRepository(UIRegistry);
    UIComponentRepository = AppDataSource.getRepository(UIComponent);
    UIComponentExampleRepository = AppDataSource.getRepository(UIComponentExample);

    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Create MCP Server
const server = new McpServer({
  name: 'borderless-components-mcp',
  version: '0.0.1'
});

// Register MCP Tools
server.registerTool(
  'get_available_registries',
  {
    title: 'Get all available Registries',
    description: 'Get all available registries and their description',
    inputSchema: {
      registries: z.array(z.string()).describe("Array of registry names/slugs to search (e.g., ['shadcn', 'antd']). If not provided, searches all available registries.")
    }
  },
  async ({ registries }) => {
    const results = await registryService.searchAllRegistries(registries);

    if (results.items.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'Please register your UI library'
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: formatSearchResultsWithPagination(results)
      }]
    };
  }
)


server.registerTool(
  'get_available_ui_components_from_registries',
  {
    title: 'Get Available UI Components from Registries',
    description: 'Get all available UI component from registries',
    inputSchema: {
      registries: z.array(z.string()).describe("Array of UI library name/registry names to search (e.g., ['antd', 'mui', '@shadcn'])"),
      limit: z.number().optional().describe("Maximum number of items to return"),
      offset: z.number().optional().describe("Number of items to skip for pagination"),
    },
  },
  async ({ registries, limit, offset }) => {
    const results = await registryService.searchRegistries(registries, limit, offset);

    if (results.items.length === 0) {
      return {
        content: [{
          type: 'text',
          text: dedent`No registries found in this project.

          Registries are collections of UI components that can be added to your project.
          Common registries include: antd, mui, element-ui, @shadcn, etc.`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: formatSearchResultsWithPagination(results)
      }]
    };
  }
);

server.registerTool(
  'search_items_in_registries',
  {
    title: 'Search Items in Registries',
    description: 'Search for UI components across all available registries or within specific registries. Supports fuzzy matching on component name, description, and slug. If no registries are specified, searches all available UI components. After finding items, use get_item_examples_from_registries to see usage examples.',
    inputSchema: {
      registries: z
        .array(z.string())
        .optional()
        .describe("Optional array of registry names/slugs to filter by (e.g., ['shadcn', 'antd']). If not provided, searches all available registries."),
      query: z
        .string()
        .optional()
        .describe("Optional search query for fuzzy matching against component name, description, and slug. Searches across all available UI components when no registries specified."),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of items to return"),
      offset: z
        .number()
        .optional()
        .describe("Number of items to skip for pagination"),
    }
  },
  async ({ registries, query, limit, offset }) => {
    // Search for components across all registries or within specified registries
    // Examples:
    // - No registries, query='button' => searches all registries for "button" components
    // - registries=['antd'], query='button' => searches for "button" components in Ant Design only
    // - registries=['antd', 'shadcn'], query='input' => searches for "input" components in both registries
    const results = await registryService.searchComponents(
      registries,
      query,
      limit,
      offset
    );

    // Build context message for better user feedback
    const searchContext = [];
    if (registries && registries.length > 0) {
      searchContext.push(`in registries: ${registries.join(', ')}`);
    } else {
      searchContext.push('across all available registries');
    }
    if (query) {
      searchContext.push(`matching "${query}"`);
    }

    if (results.items.length === 0) {
      return {
        content: [{
          type: 'text',
          text: dedent`No UI components found ${searchContext.join(' ')}.

          ${query ? `The search term "${query}" did not match any component names, descriptions, or slugs.` : 'No components available.'}
          
          Try:
          1. Use broader search terms (e.g., "button" instead of "primary-button")
          2. Check registry slug spelling if filtering (e.g., 'antd', 'shadcn', not '@antd')
          3. Use get_project_registries to see available registries
          4. Search without registries filter to see all components
          5. Search without query to see all components in specified registries`
        }]
      };
    }

    // Format results with context
    let resultText = '';
    
    if (searchContext.length > 0) {
      resultText += `Found ${results.totalCount} component${results.totalCount > 1 ? 's' : ''} ${searchContext.join(' ')}\n\n`;
    }

    resultText += formatSearchResultsWithPagination(results, {
      query,
      registries,
    });

    return {
      content: [{
        type: 'text',
        text: resultText
      }]
    };
  }
);

server.registerTool(
  'get_item_examples_from_registries',
  {
    title: 'Get Item Examples from Registries',
    description: 'Fuzzy search for component examples by example name and slug. Searches all examples in the specified registries and returns matching examples grouped by component.',
    inputSchema: {
      registries: z
        .array(z.string())
        .describe(
          "Array of registry names/slugs to search in (e.g., ['antd', 'shadcn']). If not provided, searches all registries."
        )
        .optional(),
      query: z
        .string()
        .describe(
          "Search query to find examples by example name or slug (e.g., 'button', 'button-demo', 'primary-button'). Uses fuzzy matching on example.name and example.slug fields."
        ),
    }
  },
  async ({ registries, query }) => {
    console.log(`Searching examples - registries: ${registries}, query: ${query}`);
    
    // Clean registry names (remove @ prefix if present)
    const cleanRegistrySlugs = registries?.map(name => name.replace(/^@/, ''));

    // Search examples directly by name and slug, filtered by registry
    const examples = await registryService.searchExamples(
      cleanRegistrySlugs,
      query,
      { limit: 100 }
    );

    console.log(`Found ${examples.length} examples matching query "${query}"`);

    if (examples.length === 0) {
      return {
        content: [{
          type: 'text',
          text: dedent`No examples found for query "${query}" ${registries && registries.length > 0 ? `in registries: ${registries.join(', ')}` : ''}.

          The search looks for examples matching the query in:
          - Example name (e.g., "button-demo", "primary-button")
          - Example slug (e.g., "button_demo", "primary_button")

          Try searching with patterns like:
          - "button" to find examples with "button" in name or slug
          - "demo" to find all demo examples
          - "primary" to find primary examples

          You can also:
          1. Use search_items_in_registries to find components first
          2. Check if the registry name is correct (e.g., 'antd', 'shadcn', not '@antd')
          3. Try a broader search term`
        }]
      };
    }

    // Group examples by component for better formatting
    // Get unique component IDs from the examples
    const componentIds = [...new Set(examples.map(e => e.componentId).filter((id): id is number => id !== undefined))];
    
    if (componentIds.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'Examples found but missing component information.'
        }]
      };
    }

    // Get full component information for the examples
    const fullComponents = await UIComponentRepository.find({
      where: { id: In(componentIds) },
      relations: ['registry', 'examples']
    });

    // Create ComponentItem objects from the components, filtering to only include the matched examples
    const componentItems: ComponentItem[] = fullComponents.map((comp: UIComponent) => {
      const examplesForComponent = examples.filter(e => e.componentId === comp.id);
      return {
        id: comp.id,
        registryId: comp.registryId,
        registrySlug: comp.registry?.slug || '',
        registryName: comp.registry?.name || '',
        slug: comp.slug,
        name: comp.name,
        type: comp.type,
        description: comp.description || undefined,
        dependencies: comp.dependencies || [],
        status: comp.status,
        metadata: comp.metadata,
        exampleCount: examplesForComponent.length,
        addCommandArgument: comp.registry?.slug ? `@${comp.registry.slug}/${comp.slug}` : comp.slug,
        createdAt: comp.createdAt,
        updatedAt: comp.updatedAt,
        examples: examplesForComponent
      };
    });

    return {
      content: [{
        type: 'text',
        text: formatItemExamples(componentItems, query)
      }]
    };
  }
);


// HTTP Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Borderless Components MCP Server with PostgreSQL',
    endpoints: {
      http: {
        root: '/',
        health: '/health',
        api: '/api',
        registries: '/api/registries',
        components: '/api/components',
        examples: '/api/examples'
      },
      mcp: {
        port: MCP_PORT,
        transport: 'http',
        endpoint: '/mcp'
      }
    }
  });
});

app.get('/health', async (req: Request, res: Response) => {
  const dbConnected = AppDataSource.isInitialized;
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Registry Routes
app.get('/api/registries', async (req: Request, res: Response) => {
  try {
    const registries = await UIRegistryRepository.find({
      relations: ['components'],
    });
    res.json(registries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/registries/:id', async (req: Request, res: Response) => {
  try {
    const registry = await UIRegistryRepository.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['components'],
    });

    if (registry) {
      res.json(registry);
    } else {
      res.status(404).json({ error: 'Registry not found' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/registries', async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      framework,
      npmPackage,
      installCommand,
      docsUrl,
      isActive = true,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!name || !slug || !framework) {
      return res.status(400).json({
        error: 'name, slug, and framework are required'
      });
    }

    const registry = UIRegistryRepository.create({
      name,
      slug,
      description,
      framework,
      npmPackage,
      installCommand,
      docsUrl,
      isActive,
      metadata
    });

    const savedRegistry = await UIRegistryRepository.save(registry);
    res.status(201).json(savedRegistry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Component Routes with pagination support
app.get('/api/components', async (req: Request, res: Response) => {
  try {
    const {
      registryId,
      registrySlug,
      type,
      status,
      query,
      limit = 20,
      offset = 0
    } = req.query;

    // Build registries array from registrySlug if provided
    let registrySlugs: string[] | undefined = undefined;
    if (registrySlug) {
      registrySlugs = Array.isArray(registrySlug) ? registrySlug as string[] : [registrySlug as string];
    } else if (registryId) {
      // Get registry slug from ID
      const registry = await UIRegistryRepository.findOne({
        where: { id: parseInt(registryId as string) }
      });
      if (registry) {
        registrySlugs = [registry.slug];
      }
    }

    const results = await registryService.searchComponents(
      registrySlugs,
      query as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      items: results.items,
      pagination: {
        totalCount: results.totalCount,
        limit: results.limit,
        offset: results.offset,
        hasMore: results.hasMore
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/components', async (req: Request, res: Response) => {
  try {
    const {
      registryId,
      registrySlug,
      name,
      slug,
      type,
      description,
      dependencies = [],
      status = 'stable',
      introducedVersion,
      deprecatedVersion,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!name || !slug || !type) {
      return res.status(400).json({
        error: 'name, slug, and type are required'
      });
    }

    // Get registry ID from slug or use provided ID
    let finalRegistryId: number;
    if (registryId) {
      finalRegistryId = parseInt(registryId as string);
    } else if (registrySlug) {
      const registry = await UIRegistryRepository.findOne({
        where: { slug: registrySlug }
      });
      if (!registry) {
        return res.status(404).json({ error: `Registry with slug "${registrySlug}" not found` });
      }
      finalRegistryId = registry.id;
    } else {
      return res.status(400).json({
        error: 'Either registryId or registrySlug is required'
      });
    }

    const component = UIComponentRepository.create({
      registryId: finalRegistryId,
      name,
      slug,
      type,
      description,
      dependencies,
      status,
      introducedVersion,
      deprecatedVersion,
      metadata
    });

    const savedComponent = await UIComponentRepository.save(component);
    const componentWithRelations = await UIComponentRepository.findOne({
      where: { id: savedComponent.id },
      relations: ['registry', 'examples']
    });

    res.status(201).json(componentWithRelations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/components/:id', async (req: Request, res: Response) => {
  try {
    const component = await UIComponentRepository.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['registry', 'examples']
    });

    if (component) {
      res.json(component);
    } else {
      res.status(404).json({ error: 'Component not found' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/components/:id', async (req: Request, res: Response) => {
  try {
    const component = await UIComponentRepository.findOne({
      where: { id: parseInt(req.params.id) }
    });

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const {
      name,
      slug,
      type,
      description,
      dependencies,
      status,
      introducedVersion,
      deprecatedVersion,
      metadata
    } = req.body;

    // Update only provided fields
    if (name !== undefined) component.name = name;
    if (slug !== undefined) component.slug = slug;
    if (type !== undefined) component.type = type;
    if (description !== undefined) component.description = description;
    if (dependencies !== undefined) component.dependencies = dependencies;
    if (status !== undefined) component.status = status;
    if (introducedVersion !== undefined) component.introducedVersion = introducedVersion;
    if (deprecatedVersion !== undefined) component.deprecatedVersion = deprecatedVersion;
    if (metadata !== undefined) component.metadata = metadata;

    const updatedComponent = await UIComponentRepository.save(component);
    const componentWithRelations = await UIComponentRepository.findOne({
      where: { id: updatedComponent.id },
      relations: ['registry', 'examples']
    });

    res.json(componentWithRelations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/components/:id', async (req: Request, res: Response) => {
  try {
    const component = await UIComponentRepository.findOne({
      where: { id: parseInt(req.params.id) }
    });

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    await UIComponentRepository.remove(component);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Example Routes
app.get('/api/components/:componentId/examples', async (req: Request, res: Response) => {
  try {
    const examples = await UIComponentExampleRepository.find({
      where: { componentId: parseInt(req.params.componentId) },
      relations: ['component']
    });
    res.json(examples);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/components/:componentId/examples', async (req: Request, res: Response) => {
  try {
    const component = await UIComponentRepository.findOne({
      where: { id: parseInt(req.params.componentId) }
    });

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const {
      name,
      slug,
      description,
      language,
      code,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!name || !slug || !language || !code) {
      return res.status(400).json({
        error: 'name, slug, language, and code are required'
      });
    }

    const example = UIComponentExampleRepository.create({
      componentId: component.id,
      name,
      slug,
      description,
      language,
      code,
      metadata
    });

    const savedExample = await UIComponentExampleRepository.save(example);
    const exampleWithRelations = await UIComponentExampleRepository.findOne({
      where: { id: savedExample.id },
      relations: ['component']
    });

    res.status(201).json(exampleWithRelations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/examples/:id', async (req: Request, res: Response) => {
  try {
    const example = await UIComponentExampleRepository.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['component']
    });

    if (example) {
      res.json(example);
    } else {
      res.status(404).json({ error: 'Example not found' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/examples/:id', async (req: Request, res: Response) => {
  try {
    const example = await UIComponentExampleRepository.findOne({
      where: { id: parseInt(req.params.id) }
    });

    if (!example) {
      return res.status(404).json({ error: 'Example not found' });
    }

    const {
      name,
      slug,
      description,
      language,
      code,
      metadata
    } = req.body;

    // Update only provided fields
    if (name !== undefined) example.name = name;
    if (slug !== undefined) example.slug = slug;
    if (description !== undefined) example.description = description;
    if (language !== undefined) example.language = language;
    if (code !== undefined) example.code = code;
    if (metadata !== undefined) example.metadata = metadata;

    const updatedExample = await UIComponentExampleRepository.save(example);
    const exampleWithRelations = await UIComponentExampleRepository.findOne({
      where: { id: updatedExample.id },
      relations: ['component']
    });

    res.json(exampleWithRelations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/examples/:id', async (req: Request, res: Response) => {
  try {
    const example = await UIComponentExampleRepository.findOne({
      where: { id: parseInt(req.params.id) }
    });

    if (!example) {
      return res.status(404).json({ error: 'Example not found' });
    }

    await UIComponentExampleRepository.remove(example);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// MCP endpoint
app.post('/mcp', async (req, res) => {
  // Create a new transport for each request to prevent request ID collisions
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on('close', () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Start server function
async function startServer(): Promise<void> {
  const dbInitialized = await initializeDatabase();
  if (!dbInitialized) {
    console.error('Failed to initialize database. Exiting...');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`HTTP Server running on http://localhost:${PORT}`);
    console.log(`MCP Server available on http://localhost:${PORT}/mcp`);
    console.log(`Database connected: ${AppDataSource.isInitialized}`);
  });
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
  process.exit(0);
});

// Start server if this is being run directly
if (require.main === module) {
  startServer();
}

export { app, startServer };