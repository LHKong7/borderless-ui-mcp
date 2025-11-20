# Borderless Components MCP Server - TypeScript Edition

A TypeScript-based MCP (Model Context Protocol) server for managing UI component registries with PostgreSQL backend.

## Features

- **TypeScript Full Support**: Complete rewrite in TypeScript with strict typing
- **PostgreSQL Database**: TypeORM integration with proper entity relationships
- **Component Registry Management**: Add, search, and manage UI components across multiple registries
- **MCP Protocol Support**: Full integration with Model Context Protocol for AI assistant integration
- **REST API**: HTTP endpoints for external integration
- **Component Examples**: Support for usage examples with different languages
- **Search & Filtering**: Advanced search capabilities with pagination

## Architecture

### Data Model
- **Registries** → **Components** → **Examples** (3-tier relationship)
- Each registry can contain multiple components
- Each component can have multiple usage examples

### Supported Registries
- **shadcn/ui**: Beautiful components with Radix UI + Tailwind CSS
- **Ant Design**: Enterprise-class UI design language
- **Chakra UI**: Simple, modular, and accessible components
- **Custom Registries**: Add your own component libraries

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure your PostgreSQL database
# Edit .env with your database credentials
```

## Development

### Using TypeScript (Recommended)

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Seed database with sample data
npm run seed
```

### Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=borderless_components

# Server Configuration
HTTP_PORT=3000
MCP_PORT=3001
NODE_ENV=development
```

## API Endpoints

### HTTP REST API

- `GET /` - Server information
- `GET /health` - Health check
- `GET /api/registries` - List all registries
- `POST /api/registries` - Create new registry
- `GET /api/components` - Search components with filters
- `POST /api/components` - Create new component

### MCP Tools

The server provides these MCP tools:

1. **get_project_registries** - List all available registries
2. **search_items_in_registries** - Search components with filters
3. **view_items_in_registries** - Get detailed component information
4. **get_item_examples_from_registries** - Get usage examples
5. **get_add_command_for_items** - Generate npm install commands
6. **get_audit_checklist** - Component audit checklist

## TypeScript Implementation

### Key Features

- **Strict Typing**: All entities, services, and utilities fully typed
- **Entity Relationships**: TypeORM decorators with proper foreign keys
- **Interface Definitions**: Comprehensive interfaces for all data structures
- **Error Handling**: Type-safe error handling throughout
- **Modular Architecture**: Clean separation of concerns

### Entity Types

```typescript
// Registry entity with enums
export enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
  BUN = 'bun'
}

export enum Language {
  TYPESCRIPT = 'ts',
  JAVASCRIPT = 'js'
}

// Component status and type enums
export enum ComponentStatus {
  STABLE = 'stable',
  BETA = 'beta',
  ALPHA = 'alpha',
  DEPRECATED = 'deprecated'
}
```

### Service Layer

```typescript
export class RegistryService {
  async searchComponents(
    registrySlugs?: string[],
    options: SearchOptions = {}
  ): Promise<SearchResult<ComponentItem>>

  async getRegistryItems(
    itemNames: string[],
    options: { useCache?: boolean } = {}
  ): Promise<ComponentItem[]>
}
```

## Database Schema

### ui_registry
- Primary registry information
- Package metadata
- Installation commands

### ui_component
- Component definitions
- Dependencies and props schema
- Categories and tags

### ui_component_example
- Usage examples
- Code snippets with language support
- Primary example flag

## Usage Examples

### Using as MCP Server

```bash
# Run as MCP server (stdio transport)
node dist/src/server.js

# Or in development
npm run dev
```

### Using HTTP API

```bash
# Get all registries
curl http://localhost:3000/api/registries

# Search components
curl "http://localhost:3000/api/components?query=button&limit=10"

# Create component
curl -X POST http://localhost:3000/api/components \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": 1,
    "slug": "button",
    "name": "Button",
    "type": "input",
    "description": "A button component"
  }'
```

### Seeding Database

```bash
# Run the seed script to populate with sample data
npm run seed
```

This will create:
- 3 sample registries (shadcn, antd, chakra)
- Multiple components with full metadata
- Usage examples with code snippets

## File Structure

```
src/
├── config/
│   └── database.ts          # TypeORM configuration
├── entities/
│   ├── index.ts             # Entity exports
│   ├── UIRegistry.ts        # Registry entity
│   ├── UIComponent.ts       # Component entity
│   └── UIComponentExample.ts # Example entity
├── services/
│   └── registryService.ts   # Business logic layer
├── mcp/
│   └── utils.ts             # MCP formatting utilities
├── server.ts                # Main server file
└── seed.ts                  # Database seeding script
```

## Migration from JavaScript

The project has been completely migrated from JavaScript to TypeScript:

1. **All .js files converted to .ts**
2. **Type annotations added throughout**
3. **Proper entity relationships with TypeORM**
4. **Interface definitions for all data structures**
5. **Enum definitions for constrained values**
6. **Type-safe service layer**
7. **Comprehensive error handling**

## Development Workflow

1. Make changes to TypeScript files in `src/`
2. Run `npm run build` to compile to JavaScript
3. Use `npm run dev` for development with automatic compilation
4. Test changes with `npm run seed` to reset database
5. Use `npm start` to run production build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your TypeScript changes
4. Ensure types are strict and comprehensive
5. Test the build: `npm run build`
6. Submit a pull request

## License

ISC