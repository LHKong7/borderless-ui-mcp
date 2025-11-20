# API cURL Examples

Complete collection of cURL commands for testing the Borderless Components MCP Server API.

## Table of Contents
- [Info & Health Endpoints](#info--health-endpoints)
- [Registry Operations](#registry-operations)
- [Component Operations](#component-operations)
- [Example Operations](#example-operations)

---

## Info & Health Endpoints

### Get Server Info
```bash
curl http://localhost:3000/
```

**Response:**
```json
{
  "message": "Borderless Components MCP Server with PostgreSQL",
  "endpoints": {
    "http": {
      "root": "/",
      "health": "/health",
      "api": "/api",
      "registries": "/api/registries",
      "components": "/api/components",
      "examples": "/api/examples"
    },
    "mcp": {
      "port": 3001,
      "transport": "http",
      "endpoint": "/mcp"
    }
  }
}
```

### Health Check
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```

---

## Registry Operations

### 1. Get All Registries
```bash
curl http://localhost:3000/api/registries
```

**Response:** Array of registry objects with their components.

---

### 2. Get Registry by ID
```bash
curl http://localhost:3000/api/registries/1
```

**Response:** Single registry object with components.

---

### 3. Create New Registry
```bash
curl -X POST http://localhost:3000/api/registries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Material-UI",
    "slug": "mui",
    "description": "React components for faster and easier web development",
    "framework": "react",
    "npmPackage": "@mui/material",
    "packageManager": "npm",
    "installCommand": "npm install @mui/material @emotion/react @emotion/styled",
    "homepageUrl": "https://mui.com/",
    "repoUrl": "https://github.com/mui/material-ui",
    "docsUrl": "https://mui.com/getting-started/",
    "license": "MIT",
    "isOfficial": true,
    "isActive": true,
    "metadata": {
      "version": "5.0.0",
      "themeSupport": true
    }
  }'
```

**Required Fields:**
- `name` (string)
- `slug` (string, unique)
- `framework` (string)

**Optional Fields:**
- `description`, `npmPackage`, `packageManager`, `installCommand`
- `homepageUrl`, `repoUrl`, `docsUrl`, `license`
- `isOfficial` (boolean, default: false)
- `isActive` (boolean, default: true)
- `metadata` (object, default: {})

**Response:** Created registry object (201)

---

## Component Operations

### 1. Get All Components (with Filters)

#### Basic Query
```bash
curl http://localhost:3000/api/components
```

#### Filter by Registry Slug
```bash
curl "http://localhost:3000/api/components?registrySlug=antd"
```

#### Filter by Registry ID
```bash
curl "http://localhost:3000/api/components?registryId=1"
```

#### Search with Query
```bash
curl "http://localhost:3000/api/components?registrySlug=antd&query=button"
```

#### Filter by Type
```bash
curl "http://localhost:3000/api/components?registrySlug=antd&type=input-control"
```

#### Filter by Status
```bash
curl "http://localhost:3000/api/components?registrySlug=antd&status=stable"
```

#### With Pagination
```bash
curl "http://localhost:3000/api/components?registrySlug=antd&limit=10&offset=0"
```

#### Combined Filters
```bash
curl "http://localhost:3000/api/components?registrySlug=antd&query=button&type=input-control&status=stable&limit=5&offset=0"
```

**Query Parameters:**
- `registrySlug` (string) - Filter by registry slug
- `registryId` (integer) - Filter by registry ID
- `query` (string) - Search in name, description, slug
- `type` (string) - Filter by component type
- `status` (string) - Filter by status (stable, beta, alpha, deprecated)
- `limit` (integer, default: 20) - Items per page
- `offset` (integer, default: 0) - Skip items

**Response:**
```json
{
  "items": [...],
  "pagination": {
    "totalCount": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. Get Component by ID
```bash
curl http://localhost:3000/api/components/1
```

**Response:** Single component with registry and examples relations.

---

### 3. Create New Component
```bash
curl -X POST http://localhost:3000/api/components \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Button",
    "slug": "button",
    "type": "input-control",
    "description": "A versatile button component for user interactions",
    "dependencies": ["react", "react-dom"],
    "status": "stable",
    "introducedVersion": "5.0.0",
    "registrySlug": "mui",
    "metadata": {
      "variants": ["contained", "outlined", "text"],
      "sizes": ["small", "medium", "large"]
    }
  }'
```

**Required Fields:**
- `name` (string, unique)
- `slug` (string, unique)
- `type` (string) - Options: `input-control`, `container`, `navigational`, `informational`, `biz`
- `registrySlug` (string) - Must exist in database

**Optional Fields:**
- `description` (string)
- `dependencies` (array of strings, default: [])
- `status` (string, default: "stable") - Options: `stable`, `beta`, `alpha`, `deprecated`
- `introducedVersion` (string)
- `deprecatedVersion` (string)
- `metadata` (object, default: {})

**Response:** Created component object (201)

---

### 4. Update Component
```bash
curl -X PUT http://localhost:3000/api/components/1 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description for the button component",
    "status": "beta",
    "dependencies": ["react", "react-dom", "@mui/system"],
    "metadata": {
      "variants": ["contained", "outlined", "text", "icon"],
      "sizes": ["small", "medium", "large", "xlarge"]
    }
  }'
```

**All Fields Optional** - Only include fields you want to update:
- `name`, `slug`, `type`, `description`
- `dependencies`, `status`
- `introducedVersion`, `deprecatedVersion`
- `metadata`

**Response:** Updated component object (200)

---

### 5. Delete Component
```bash
curl -X DELETE http://localhost:3000/api/components/1
```

**Response:** 204 No Content (success) or 404 Not Found

---

## Example Operations

### 1. Get All Examples for a Component
```bash
curl http://localhost:3000/api/components/1/examples
```

**Response:** Array of example objects for the specified component.

---

### 2. Get Example by ID
```bash
curl http://localhost:3000/api/examples/1
```

**Response:** Single example object with component relation.

---

### 3. Create New Example for a Component
```bash
curl -X POST http://localhost:3000/api/components/1/examples \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Button Usage",
    "description": "Simple example showing basic button usage",
    "language": "tsx",
    "code": "import { Button } from '\''@mui/material'\'';\n\nexport default function BasicButton() {\n  return (\n    <Button variant=\"contained\" color=\"primary\">\n      Click Me\n    </Button>\n  );\n}",
    "isPrimary": true
  }'
```

**Required Fields:**
- `name` (string, unique)
- `language` (string) - Options: `typescript`, `javascript`, `tsx`, `jsx`, `html`, `css`
- `code` (string) - The actual code content

**Optional Fields:**
- `description` (string)
- `isPrimary` (boolean, default: false) - Only one primary example per component

**Response:** Created example object (201)

---

### 4. Update Example
```bash
curl -X PUT http://localhost:3000/api/examples/1 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated example description",
    "code": "import { Button } from '\''@mui/material'\'';\nimport { useState } from '\''react'\'';\n\nexport default function InteractiveButton() {\n  const [count, setCount] = useState(0);\n  return (\n    <Button \n      variant=\"contained\" \n      onClick={() => setCount(count + 1)}\n    >\n      Clicked {count} times\n    </Button>\n  );\n}",
    "isPrimary": true
  }'
```

**All Fields Optional** - Only include fields you want to update:
- `name`, `description`, `language`, `code`, `isPrimary`

**Response:** Updated example object (200)

---

### 5. Delete Example
```bash
curl -X DELETE http://localhost:3000/api/examples/1
```

**Response:** 204 No Content (success) or 404 Not Found

---

## Complete Workflow Examples

### Example 1: Create a Complete Registry with Component and Examples

```bash
# Step 1: Create Registry
REGISTRY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/registries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shadcn UI",
    "slug": "shadcn",
    "description": "Beautifully designed components built with Radix UI and Tailwind CSS",
    "framework": "react",
    "npmPackage": "shadcn-ui",
    "installCommand": "npx shadcn-ui@latest init",
    "homepageUrl": "https://ui.shadcn.com/",
    "license": "MIT",
    "isOfficial": true
  }')

echo "Registry created: $REGISTRY_RESPONSE"

# Step 2: Create Component
COMPONENT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/components \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Card",
    "slug": "card",
    "type": "container",
    "description": "A flexible container for grouping related content",
    "dependencies": ["react"],
    "status": "stable",
    "registrySlug": "shadcn"
  }')

COMPONENT_ID=$(echo $COMPONENT_RESPONSE | jq -r '.id')
echo "Component created with ID: $COMPONENT_ID"

# Step 3: Create Primary Example
curl -X POST "http://localhost:3000/api/components/$COMPONENT_ID/examples" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Card",
    "description": "A simple card with title and content",
    "language": "tsx",
    "code": "import { Card } from '\''./card'\'';\n\nexport default function BasicCard() {\n  return (\n    <Card>\n      <h3>Card Title</h3>\n      <p>Card content goes here</p>\n    </Card>\n  );\n}",
    "isPrimary": true
  }'

# Step 4: Create Secondary Example
curl -X POST "http://localhost:3000/api/components/$COMPONENT_ID/examples" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Card with Image",
    "description": "Card with header image and action buttons",
    "language": "tsx",
    "code": "import { Card } from '\''./card'\'';\n\nexport default function ImageCard() {\n  return (\n    <Card>\n      <img src=\"/image.jpg\" alt=\"Card\" />\n      <h3>Card Title</h3>\n      <p>Card content</p>\n      <button>Action</button>\n    </Card>\n  );\n}",
    "isPrimary": false
  }'

echo "Complete workflow finished!"
```

---

### Example 2: Search and Filter Components

```bash
# Search for all button components across all registries
curl "http://localhost:3000/api/components?query=button"

# Search for input components in Material-UI
curl "http://localhost:3000/api/components?registrySlug=mui&type=input-control"

# Get stable components with pagination
curl "http://localhost:3000/api/components?status=stable&limit=10&offset=0"

# Complex search: beta button components in Ant Design
curl "http://localhost:3000/api/components?registrySlug=antd&query=button&status=beta"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "name, slug, and framework are required"
}
```

### 404 Not Found
```json
{
  "error": "Registry not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database connection failed"
}
```

---

## Notes

1. **Base URL**: All examples use `http://localhost:3000`. Replace with your server URL.

2. **Content-Type**: Always include `-H "Content-Type: application/json"` for POST/PUT requests.

3. **Response Codes**:
   - `200 OK` - Successful GET/PUT
   - `201 Created` - Successful POST
   - `204 No Content` - Successful DELETE
   - `400 Bad Request` - Validation error
   - `404 Not Found` - Resource not found
   - `500 Internal Server Error` - Server error

4. **JSON Formatting**: Use `| jq` to pretty-print JSON responses:
   ```bash
   curl http://localhost:3000/api/registries | jq
   ```

5. **Authentication**: Currently no authentication is implemented. Add authentication headers when implemented.

6. **Rate Limiting**: No rate limiting is currently implemented.

---

## Testing Tips

### Save Response to File
```bash
curl http://localhost:3000/api/components/1 > component.json
```

### Show Response Headers
```bash
curl -i http://localhost:3000/api/registries
```

### Verbose Output (for debugging)
```bash
curl -v http://localhost:3000/api/components
```

### Follow Redirects
```bash
curl -L http://localhost:3000/api/registries
```

### Set Timeout
```bash
curl --max-time 10 http://localhost:3000/api/components
```

---

## Automated Testing Script

```bash
#!/bin/bash

# Test all endpoints
echo "Testing Borderless Components API..."

echo "\n1. Health Check"
curl -s http://localhost:3000/health | jq

echo "\n2. Get All Registries"
curl -s http://localhost:3000/api/registries | jq '. | length'

echo "\n3. Get Components"
curl -s "http://localhost:3000/api/components?limit=5" | jq '.pagination'

echo "\n4. Search Components"
curl -s "http://localhost:3000/api/components?query=button" | jq '.items | length'

echo "\nAll tests completed!"
```

Save as `test-api.sh`, make executable with `chmod +x test-api.sh`, and run with `./test-api.sh`.

