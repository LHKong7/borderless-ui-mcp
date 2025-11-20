import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { UIRegistry, UIComponent, UIComponentExample, ComponentStatus } from '../entities';
import { ComponentItem, RegistryItem, ComponentExample } from '../mcp/utils';

export interface SearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
  type?: string;
  status?: ComponentStatus;
}

export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  limit: number;
  offset?: number;
}

export class RegistryService {
  private UIRegistryRepository: Repository<UIRegistry>;
  private UIComponentRepository: Repository<UIComponent>;
  private UIComponentExampleRepository: Repository<UIComponentExample>;

  constructor() {
    this.UIRegistryRepository = AppDataSource.getRepository(UIRegistry);
    this.UIComponentRepository = AppDataSource.getRepository(UIComponent);
    this.UIComponentExampleRepository = AppDataSource.getRepository(UIComponentExample);
  }

  /**
   * Get all available registries
   */
  async searchAllRegistries(
    registries?: string[],
  ) {
    try {
      const registryQueryBuilder = this.UIRegistryRepository
        .createQueryBuilder('registry');

      if (registries && registries.length > 0) {
        const cleanNames = registries.map(name => name.replace(/^@/, ''));
        registryQueryBuilder.andWhere('registry.name IN (:...cleanNames) OR registry.slug IN (:...cleanNames)', { cleanNames });
        registryQueryBuilder.andWhere('registry.is_Active = true');
      }
      registryQueryBuilder
        .orderBy('registry.name', 'ASC')

      const availableRegistries = await registryQueryBuilder.getMany();

      return {
        items: availableRegistries.map(registry => this.formatRegistry(registry, true)),
        totalCount: availableRegistries.length,
        hasMore: false,
        limit: availableRegistries.length,
        offset: 0
      };
    } catch (err) {
      throw new Error(`Registry search failed: ${(err as Error).message}`);
    }
  }

  /**
   * Search registries by name or slug with optional filters
   * Returns registries with all their UI components and examples
   * 
   * Logic:
   * 1. Search for registries by name or slug to find registry_id(s)
   * 2. Load all UI components with their examples for found registries
   * 3. Return formatted results with full component details
   */
  async searchRegistries(
    registryNames?: string[],
    limit: number = 50,
    offset: number = 0,
  ): Promise<SearchResult<RegistryItem>> {
    try {
      // Step 1: First, get the registries with pagination (without joins to avoid pagination issues)
      const registryQueryBuilder = this.UIRegistryRepository
        .createQueryBuilder('registry');

      // Filter by registry names/slugs if provided
      if (registryNames && registryNames.length > 0) {
        // Clean registry names (remove @ prefix if present)
        const cleanNames = registryNames.map(name => name.replace(/^@/, ''));
        
        registryQueryBuilder.andWhere(
          '(registry.name IN (:...cleanNames) OR registry.slug IN (:...cleanNames))',
          { cleanNames }
        );
      }

      // Add ordering and pagination for registries only
      registryQueryBuilder
        .orderBy('registry.name', 'ASC')
        .take(limit)
        .skip(offset);

      // Execute query to get registries (without components yet)
      const registries = await registryQueryBuilder.getMany();
      
      if (registries.length === 0) {
        return {
          items: [],
          totalCount: 0,
          hasMore: false,
          limit: limit,
          offset: offset
        };
      }

      // Step 2: Get registry IDs to load ALL their components
      const registryIds = registries.map(r => r.id);
      console.log(`Found ${registries.length} registries with IDs: [${registryIds.join(', ')}]`);

      // Step 3: Load ALL components for these registries with their examples
      const componentsWithExamples = await this.UIComponentRepository
        .createQueryBuilder('component')
        .leftJoinAndSelect('component.examples', 'examples')
        .where('component.registryId IN (:...registryIds)', { registryIds })
        .orderBy('component.name', 'ASC')
        .addOrderBy('examples.name', 'ASC')
        .getMany();

      console.log(`Loaded ${componentsWithExamples.length} total components across all registries`);

      // Step 4: Map components back to their registries
      const componentsByRegistryId = new Map<number, typeof componentsWithExamples>();
      for (const component of componentsWithExamples) {
        if (!componentsByRegistryId.has(component.registryId)) {
          componentsByRegistryId.set(component.registryId, []);
        }
        componentsByRegistryId.get(component.registryId)!.push(component);
      }

      // Attach components to registries
      for (const registry of registries) {
        registry.components = componentsByRegistryId.get(registry.id) || [];
        console.log(`  - "${registry.name}" (${registry.slug}): ${registry.components.length} components`);
      }

      // Get total count for pagination
      const countQuery = this.UIRegistryRepository
        .createQueryBuilder('registry');

      if (registryNames && registryNames.length > 0) {
        const cleanNames = registryNames.map(name => name.replace(/^@/, ''));
        countQuery.andWhere(
          '(registry.name IN (:...cleanNames) OR registry.slug IN (:...cleanNames))',
          { cleanNames }
        );
      }

      const totalCount = await countQuery.getCount();
      console.log(`Total registries count: ${totalCount}`);

      return {
        items: registries.map(registry => this.formatRegistry(registry, true)),
        totalCount,
        hasMore: offset + limit < totalCount,
        limit: limit,
        offset: offset
      };
    } catch (error) {
      throw new Error(`Registry search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Search components across all registries or specific registries with fuzzy matching
   * 
   * @param registryNames - Optional array of registry names/slugs to filter by. If not provided, searches all registries.
   * @param query - Optional search query for fuzzy matching against component name, description, and slug
   * @param limit - Maximum number of results to return
   * @param offset - Number of results to skip for pagination
   * @returns SearchResult with matching components
   */
  async searchComponents(
    registryNames?: string[],
    query?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<SearchResult<ComponentItem>> {
    try {
      // Normalize registry names: treat undefined or empty array as "search all registries"
      const hasRegistryFilter = registryNames && registryNames.length > 0;
      
      // Clean registry names (remove @ prefix if present) only if we have registries to filter
      const cleanNames = hasRegistryFilter 
        ? registryNames.map(name => name.replace(/^@/, ''))
        : undefined;

      // If filtering by registries, first get the registry IDs
      let registryIds: number[] | undefined = undefined;
      if (hasRegistryFilter && cleanNames && cleanNames.length > 0) {
        // Find registries matching by name or slug
        const matchingRegistries = await this.UIRegistryRepository
          .createQueryBuilder('registry')
          .where('registry.name IN (:...cleanNames) OR registry.slug IN (:...cleanNames)', { cleanNames })
          .getMany();
        
        registryIds = matchingRegistries.map(r => r.id);
        console.log(`Found ${matchingRegistries.length} registries matching: ${cleanNames.join(', ')}`);
        console.log(`Registry IDs: [${registryIds.join(', ')}]`);
        
        if (registryIds.length === 0) {
          // No registries found, return empty result
          return {
            items: [],
            totalCount: 0,
            hasMore: false,
            limit,
            offset
          };
        }
      }

      // Build query builder for complex search
      // Use relation path to join registry - this ensures TypeORM properly maps the relation
      const queryBuilder = this.UIComponentRepository
        .createQueryBuilder('ui_component')
        .leftJoinAndSelect('ui_component.registry', 'registry')
        .leftJoinAndSelect('ui_component.examples', 'examples');

      // Filter by registry IDs if provided
      if (registryIds && registryIds.length > 0) {
        queryBuilder.andWhere('ui_component.registryId IN (:...registryIds)', { registryIds });
        console.log(`Filtering components by registry IDs: [${registryIds.join(', ')}]`);
      } else {
        console.log('Searching components across all available registries');
      }

      // Fuzzy search on name, description, and slug
      if (query) {
        queryBuilder.andWhere(
          '(ui_component.name ILIKE :query OR ' +
          'ui_component.description ILIKE :query OR ' +
          'ui_component.slug ILIKE :query)',
          { query: `%${query}%` }
        );
        console.log(`Fuzzy search query: "${query}" (matching name, description, or slug)`);
      }

      // Add ordering and pagination
      queryBuilder
        .orderBy('ui_component.name', 'ASC')
        .addOrderBy('examples.name', 'ASC')
        .take(limit)
        .skip(offset);

      let components = await queryBuilder.getMany();
      console.log(`Found ${components.length} components (limit: ${limit}, offset: ${offset})`);
      
      // Ensure registry is loaded for all components
      // If registry relation wasn't loaded, fetch it separately
      const componentsWithoutRegistry = components.filter(c => !c.registry && c.registryId);
      if (componentsWithoutRegistry.length > 0) {
        console.log(`Loading registry for ${componentsWithoutRegistry.length} components that are missing registry relation`);
        const registryIds = [...new Set(componentsWithoutRegistry.map(c => c.registryId))];
        const registries = await this.UIRegistryRepository.find({
          where: { id: In(registryIds) }
        });
        const registryMap = new Map(registries.map(r => [r.id, r]));
        
        // Attach registries to components
        components = components.map(component => {
          if (!component.registry && component.registryId) {
            component.registry = registryMap.get(component.registryId) || null as any;
          }
          return component;
        });
      }
      
      // Debug: Check if registry is loaded
      if (components.length > 0) {
        const firstComponent = components[0];
        console.log(`Sample component registry loaded:`, {
          hasRegistry: !!firstComponent.registry,
          registryId: firstComponent.registryId,
          registryName: firstComponent.registry?.name,
          registrySlug: firstComponent.registry?.slug
        });
      }

      // Get total count
      const countQuery = this.UIComponentRepository
        .createQueryBuilder('ui_component');

      // Apply same registry filter to count query using registry IDs
      if (registryIds && registryIds.length > 0) {
        countQuery.andWhere('ui_component.registryId IN (:...registryIds)', { registryIds });
      }

      if (query) {
        countQuery.andWhere(
          '(ui_component.name ILIKE :query OR ' +
          'ui_component.description ILIKE :query OR ' +
          'ui_component.slug ILIKE :query)',
          { query: `%${query}%` }
        );
      }

      const totalCount = await countQuery.getCount();
      console.log(`Total matching components: ${totalCount}`);

      return {
        items: components.map(component => this.formatComponent(component)),
        totalCount,
        hasMore: offset + limit < totalCount,
        limit,
        offset
      };
    } catch (error) {
      throw new Error(`Component search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get specific items by their names
   * Supports two formats:
   * 1. With registry prefix: "@shadcn/button" (searches only in shadcn registry)
   * 2. Without prefix: "button" (searches across all registries)
   */
  async getRegistryItems(
    itemNames: string[],
  ): Promise<ComponentItem[]> {
    try {
      const items: ComponentItem[] = [];

      for (const itemName of itemNames) {
        // Try to parse registry/slug format (e.g., "@shadcn/button")
        const match = itemName.match(/^@([^\/]+)\/(.+)$/);
        
        if (match) {
          // Format: @registry/component
          const [, registrySlug, componentSlug] = match;

          const component = await this.UIComponentRepository.findOne({
            where: {
              slug: componentSlug,
              registry: { slug: registrySlug }
            },
            relations: ['registry', 'examples']
          });

          if (component) {
            items.push(this.formatComponent(component));
          }
        } else {
          // Format: component (no registry prefix)
          // Search by component slug or name across all registries
          const components = await this.UIComponentRepository.find({
            where: [
              { slug: itemName },
              { name: itemName }
            ],
            relations: ['registry', 'examples']
          });

          // Add all matching components from all registries
          components.forEach(component => {
            items.push(this.formatComponent(component));
          });
        }
      }

      return items;
    } catch (error) {
      throw new Error(`Get registry items failed: ${(error as Error).message}`);
    }
  }

  /**
   * Search for examples by query
   * Searches in example name and slug, filtered by registry
   */
  async searchExamples(
    registrySlugs?: string[],
    query?: string,
    options: Omit<SearchOptions, 'query' | 'offset'> = {}
  ): Promise<ComponentExample[]> {
    const { limit = 20 } = options;

    try {
      // If filtering by registries, first get the registry IDs
      let registryIds: number[] | undefined = undefined;
      if (registrySlugs && registrySlugs.length > 0) {
        const cleanSlugs = registrySlugs.map(slug => slug.replace(/^@/, ''));
        const matchingRegistries = await this.UIRegistryRepository
          .createQueryBuilder('registry')
          .where('registry.name IN (:...cleanSlugs) OR registry.slug IN (:...cleanSlugs)', { cleanSlugs })
          .getMany();
        
        registryIds = matchingRegistries.map(r => r.id);
        console.log(`Found ${matchingRegistries.length} registries for example search: [${registryIds.join(', ')}]`);
        
        if (registryIds.length === 0) {
          // No registries found, return empty result
          return [];
        }
      }

      const queryBuilder = this.UIComponentExampleRepository
        .createQueryBuilder('example')
        .leftJoinAndSelect('example.component', 'component')
        .leftJoinAndSelect('component.registry', 'registry');

      // Filter by registry IDs if provided (use database column name for reliability)
      if (registryIds && registryIds.length > 0) {
        queryBuilder.andWhere('component.registry_id IN (:...registryIds)', { registryIds });
        console.log(`Filtering examples by registry IDs: [${registryIds.join(', ')}]`);
      }

      // Search in example name and slug only (fuzzy search)
      if (query) {
        queryBuilder.andWhere(
          '(example.name ILIKE :query OR example.slug ILIKE :query)',
          { query: `%${query}%` }
        );
        console.log(`Searching examples with query: "${query}" (matching name or slug)`);
      }

      queryBuilder
        .orderBy('example.name', 'ASC')
        .take(limit);

      // Debug: Log the SQL query
      const sql = queryBuilder.getSql();
      const params = queryBuilder.getParameters();
      console.log('Example search SQL:', sql);
      console.log('Example search parameters:', params);

      const examples = await queryBuilder.getMany();
      console.log(`Found ${examples.length} examples matching criteria`);
      
      if (examples.length > 0) {
        console.log(`Sample example:`, {
          id: examples[0].id,
          name: examples[0].name,
          slug: examples[0].slug,
          componentId: examples[0].componentId,
          hasComponent: !!examples[0].component,
          componentName: examples[0].component?.name,
          registryName: examples[0].component?.registry?.name
        });
      }

      return examples.map(example => this.formatExample(example));
    } catch (error) {
      throw new Error(`Example search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Format registry for output
   * @param registry - The registry entity to format
   * @param includeComponents - Whether to include full component details
   */
  private formatRegistry(registry: UIRegistry, includeComponents: boolean = false): RegistryItem {
    const formatted: RegistryItem = {
      id: registry.id,
      slug: registry.slug,
      name: registry.name,
      description: registry.description || undefined,
      framework: registry.framework,
      npmPackage: registry.npmPackage || undefined,
      installCommand: registry.installCommand || undefined,
      docsUrl: registry.docsUrl || undefined,
      isOfficial: false, // Not in entity, default to false
      componentCount: registry.components?.length || 0,
      createdAt: registry.createdAt,
      updatedAt: registry.updatedAt
    };

    // Include full component details if requested
    if (includeComponents && registry.components) {
      formatted.components = registry.components.map(component => 
        this.formatComponent(component)
      );
    }

    return formatted;
  }

  /**
   * Format component for output
   */
  private formatComponent(component: UIComponent): ComponentItem {
    // Ensure registry is available - if not loaded, log a warning
    if (!component.registry && component.registryId) {
      console.warn(`Component ${component.id} (${component.name}) has registryId ${component.registryId} but registry relation is not loaded`);
    }

    const registrySlug = component.registry?.slug || '';
    const registryName = component.registry?.name || '';

    return {
      id: component.id,
      registryId: component.registryId,
      registrySlug,
      registryName,
      slug: component.slug,
      name: component.name,
      type: component.type,
      description: component.description || undefined,
      dependencies: component.dependencies || [],
      status: component.status,
      metadata: component.metadata,
      exampleCount: component.examples?.length || 0,
      addCommandArgument: registrySlug ? `@${registrySlug}/${component.slug}` : component.slug,
      createdAt: component.createdAt,
      updatedAt: component.updatedAt,
      examples: component.examples?.map(example => this.formatExample(example)) || []
    };
  }

  /**
   * Format example for output
   */
  private formatExample(example: UIComponentExample): ComponentExample {
    return {
      id: example.id,
      componentId: example.componentId,
      name: example.name,
      description: example.description || undefined,
      language: example.language || 'typescript', // Default to typescript if not set
      code: example.code,
      isPrimary: false, // Not in entity, default to false
      createdAt: example.createdAt,
      updatedAt: example.updatedAt
    };
  }
}

// Export singleton instance
export const registryService = new RegistryService();