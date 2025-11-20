# 🚀 Borderless Components MCP Server

> **The universal bridge between AI Code assistants and UI component ecosystems**

[English](README.md) | [中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## ✨ Why Borderless Components?

Tired of your AI assistant generating generic HTML or spending time explaining which UI components to install? **Borderless Components** revolutionizes AI-powered web development by providing a centralized, intelligent registry of UI components that AI assistants can instantly discover and use.

When you ask your AI to "create a dashboard with charts and forms", instead of generic HTML, it now knows exactly which components to use from your favorite UI libraries - whether it's Ant Design, Material-UI, shadcn/ui, or any other framework.

## 🎯 The Problem We Solve

**Before Borderless Components:**
```
User: "Create a admin dashboard with a data table and form"
AI: *Generates generic HTML and CSS*
User: "Can you use Material-UI components instead?"
AI: *Requires manual explanation of available components*
User: "Now switch to Ant Design"
AI: *Needs another context switch and component explanations*
```

**After Borderless Components:**
```
User: "Create a admin dashboard with Material-UI components"
AI: *Instantly discovers and uses perfect Material-UI components*
User: "Great! Now recreate this with shadcn/ui"
AI: *Seamlessly switches to the best shadcn/ui components*
```

## 🌟 Key Features

### 🔍 **Intelligent Component Discovery**
- **Smart Search**: Fuzzy matching across component names, descriptions, and metadata
- **Cross-Framework**: Support for React, Vue, Angular, and vanilla JS components
- **Multi-Registry**: Search across multiple UI libraries simultaneously
- **Usage Examples**: Built-in code examples for every component

### 🛠 **Developer-First Design**
- **MCP Protocol**: Native Model Context Protocol integration for seamless AI communication
- **RESTful API**: Full HTTP API for traditional applications
- **PostgreSQL**: Robust database with TypeORM for reliable data storage
- **TypeScript**: Full type safety and excellent developer experience

### 📦 **Extensible Registry System**
- **Multiple Frameworks**: React, Vue, Angular, Svelte, and more
- **Popular Libraries**: Pre-configured support for Ant Design, Material-UI, shadcn/ui, Element Plus, and more
- **Custom Components**: Easily add your own component libraries
- **Version Management**: Track component versions and deprecation status

### 🚀 **Production Ready**
- **Performance Optimized**: Efficient queries with pagination and caching
- **Scalable Architecture**: Designed for high-traffic applications
- **Health Monitoring**: Built-in health checks and monitoring endpoints
- **Easy Deployment**: Docker-friendly with clear setup instructions

## 🏗 Architecture Overview

```
┌─────────────────┐    MCP 协议      ┌─────────────────┐
│   AI 助手       │ ◄─────────────► │  Borderless     │
│  (Claude/GPT-4) │                 │  Components     │
│                 │                 │    服务器       │
└─────────────────┘                 │                 │
         │                           │                 │
         │ HTTP API                  │                 │
         │                           │                 │
┌─────────────────┐                 │                 │
│   Web/App UI    │ ◄──────────────►│                 │
│    仪表板        │    RESTful API  │                 │
└─────────────────┘                 └─────────────────┘
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │   PostgreSQL    │
                                  │     数据库       │
                                  │                 │
                                  │ • 注册表         │
                                  │ • 组件           │
                                  │ • 示例          │
                                  └─────────────────┘
```

## 🚀 Quick Start

### Installation

```bash
npm install borderless-components-mcp
```

### Basic Setup

1. **Clone and Setup**
```bash
git clone https://github.com/your-org/borderless-components-mcp.git
cd borderless-components-mcp
npm install
```

2. **Configure Database**
```bash
# Copy environment template
cp .env.example .env

# Edit your database configuration
# Default: postgresql://localhost:5432/borderless_components
```

3. **Initialize Database**
```bash
npm run build
npm run seed:api  # 填充示例注册表和组件
```

4. **Start the Server**
```bash
npm run dev  # Development mode
# or
npm start    # Production mode
```

5. add to your code agent

That's it! Your server is now running at:
- **HTTP API**: `http://localhost:3000`
- **MCP Endpoint**: `http://localhost:3000/mcp`

## 🔌 Integration Examples

### AI Assistant Integration (MCP)

```javascript
// Configure your AI assistant to use Borderless Components
const mcpConfig = {
  name: "borderless-components",
  endpoint: "http://localhost:3000/mcp",
  tools: [
    "get_available_registries",
    "get_available_ui_components_from_registries",
    "search_items_in_registries",
    "get_item_examples_from_registries"
  ]
};
```

### Web Application Integration

```javascript
// Search for components across all registries
const response = await fetch('http://localhost:3000/api/components?query=button&limit=10');
const components = await response.json();

// Search in specific registries
const antdButtons = await fetch('http://localhost:3000/api/components?registrySlug=antd&query=button');
const shadcnButtons = await fetch('http://localhost:3000/api/components?registrySlug=shadcn&query=button');
```

## 📚 Available Tools

### 🔎 **Discovery Tools**

- **`get_available_registries`** - List all available UI libraries
- **`get_available_ui_components_from_registries`** - Get components from specific registries
- **`search_items_in_registries`** - Smart search across components and registries
- **`get_item_examples_from_registries`** - Get usage examples for components

### 🌐 **REST API Endpoints**

- **GET** `/api/registries` - Browse all registries
- **GET** `/api/components` - Search and filter components
- **GET** `/api/components/:id/examples` - Get component examples
- **POST** `/api/registries` - Add new registry
- **POST** `/api/components` - Add new component

## 🎨 Use Cases

### 🤖 AI-Powered Development

**Rapid Prototyping**: AI assistants can instantly discover and use appropriate components, reducing development time from hours to minutes.

**Framework Switching**: Easily switch between UI frameworks while maintaining functionality - perfect for design system exploration.

**Code Generation**: Generate production-ready code with proper component usage, including dependencies and installation commands.

### 👥 Team Collaboration

**Component Governance**: Centralized registry ensures teams use approved, consistent components across projects.

**Knowledge Sharing**: Built-in examples and documentation accelerate onboarding and knowledge transfer.

**Version Management**: Track component versions, deprecation, and migration paths across the organization.

### 🏢 Enterprise Integration

**Design Systems**: Integrate with internal component libraries and design systems for maximum consistency.

**Multi-Project Management**: Manage component usage across multiple projects and teams from a single interface.

**Analytics & Insights**: Track component usage patterns to inform design system improvements and training needs.

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
HTTP_PORT=3000              # HTTP API port
MCP_PORT=3001              # MCP server port (optional)

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/borderless_components"

# Development
NODE_ENV=development
```

### Adding Custom Registries

```javascript
// Add your custom component library
const customRegistry = {
  name: "My Design System",
  slug: "my-design-system",
  framework: "react",
  npmPackage: "@mycompany/design-system",
  installCommand: "npm install @mycompany/design-system",
  description: "Our company's design system components"
};

// POST to /api/registries
await fetch('http://localhost:3000/api/registries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(customRegistry)
});
```

## 🛣 Roadmap

### 🎯 **Upcoming Features**

- [ ] **Visual Component Explorer** - Web-based component browser
- [ ] **Component Dependency Analysis** - Automatic dependency resolution
- [ ] **Usage Analytics Dashboard** - Track component usage patterns
- [ ] **GitHub Integration** - Auto-sync with component repositories
- [ ] **Component Testing Suite** - Automated component validation
- [ ] **Theme Support** - Multiple theme variants per component
- [ ] **Performance Metrics** - Component bundle size and performance data

### 🌟 **Future Vision**

- **AI-Powered Recommendations**: Intelligent component suggestions based on project context
- **Cross-Framework Translation**: Convert components between React, Vue, and Angular
- **Community Registry**: Public component registry for open-source libraries
- **Design System Generator**: Automatically generate design systems from component usage

## 🤝 Contributing

We're building the future of AI-powered development! We welcome contributions of all kinds:

- 🐛 **Bug Reports** - Help us squash issues
- 💡 **Feature Requests** - Suggest new capabilities
- 📖 **Documentation** - Improve guides and examples
- 🔧 **Code Contributions** - Submit pull requests
- 🎨 **UI/UX** - Design better interfaces
- 🧪 **Testing** - Improve test coverage

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/borderless-components-mcp.git
cd borderless-components-mcp

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Contribution Guidelines

1. **Code Style**: Follow TypeScript and Prettier configurations
2. **Testing**: Add tests for new features and bug fixes
3. **Documentation**: Update README and API docs for changes
4. **Commits**: Use conventional commit messages
5. **PRs**: Include clear descriptions and testing instructions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Model Context Protocol (MCP)** - For enabling seamless AI integration
- **TypeORM** - Excellent database ORM for TypeScript
- **Express.js** - Robust web framework for our API
- **PostgreSQL** - Powerful relational database
- **All Contributors** - The amazing developers building the future of AI-powered development

## 📞 Get in Touch

- **GitHub Issues**: [Report bugs and request features](https://github.com/your-org/borderless-components-mcp/issues)
- **Discussions**: [Join our community discussions](https://github.com/your-org/borderless-components-mcp/discussions)
- **Email**: [Contact our team](jamesklh5666@gmail.com)
- **wechat group QRCode**: ![wechat QR Code](./_img/wechatgroupQR.png "QR Code")

---

<div align="center">

**⭐ Star this repo** if Borderless Components helps you build faster with AI!

**🚀 Ready to revolutionize your AI-powered development?**
[Get Started Now](#quick-start) • [View Docs](./docs) • [Join Community](https://github.com/your-org/borderless-components-mcp/discussions)

Made with ❤️ by LHKong7 from the Borderless team

</div>