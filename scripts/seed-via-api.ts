import 'dotenv/config';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

interface RegistryData {
  name: string;
  slug: string;
  description?: string;
  framework: string;
  npmPackage?: string;
  installCommand?: string;
  docsUrl?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

interface ComponentData {
  registryId?: number;
  registrySlug?: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  dependencies?: string[];
  status?: string;
  introducedVersion?: string;
  deprecatedVersion?: string;
  metadata?: Record<string, any>;
}

interface ExampleData {
  name: string;
  slug: string;
  description?: string;
  language: string;
  code: string;
  metadata?: Record<string, any>;
}

async function makeRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  if (response.status === 204) {
    return {} as any; // No content
  }

  return response.json();
}

async function createRegistry(data: RegistryData) {
  console.log(`Creating registry: ${data.name}...`);
  const registry = await makeRequest('POST', '/api/registries', data);
  console.log(`✓ Created registry: ${registry.name} (ID: ${registry.id})`);
  return registry;
}

async function createComponent(data: ComponentData) {
  console.log(`Creating component: ${data.name}...`);
  const component = await makeRequest('POST', '/api/components', data);
  console.log(`✓ Created component: ${component.name} (ID: ${component.id})`);
  return component;
}

async function createExample(componentId: number, data: ExampleData) {
  console.log(`Creating example: ${data.name} for component ${componentId}...`);
  const example = await makeRequest(
    'POST',
    `/api/components/${componentId}/examples`,
    data
  );
  console.log(`✓ Created example: ${example.name} (ID: ${example.id})`);
  return example;
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const health = await response.json();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function seedViaAPI(): Promise<void> {
  try {
    console.log('🌱 Starting API-based seeding...\n');
    console.log(`📡 Connecting to API at ${API_BASE_URL}...\n`);
    
    // Check if server is running
    const isHealthy = await checkServerHealth();
    if (!isHealthy) {
      console.error(`❌ Cannot connect to server at ${API_BASE_URL}`);
      console.error('   Please make sure the server is running: npm run dev');
      process.exit(1);
    }

    // Create Registries
    console.log('📦 Creating registries...\n');
    
    const shadcnRegistry = await createRegistry({
      name: 'shadcn/ui',
      slug: 'shadcn',
      description: 'Beautifully designed components built with Radix UI and Tailwind CSS.',
      framework: 'react',
      npmPackage: 'shadcn-ui',
      installCommand: 'npx shadcn-ui@latest init',
      docsUrl: 'https://ui.shadcn.com/docs',
      isActive: true,
      metadata: {
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
    });

    const antdRegistry = await createRegistry({
      name: 'Ant Design',
      slug: 'antd',
      description: 'A UI library for React with comprehensive design resources.',
      framework: 'react',
      npmPackage: 'antd',
      installCommand: 'npm install antd',
      docsUrl: 'https://ant.design/docs',
      isActive: true,
      metadata: {
        version: '5.0.0',
        typescript: true
      }
    });

    const chakraRegistry = await createRegistry({
      name: 'Chakra UI',
      slug: 'chakra',
      description: 'Simple, modular and accessible component library that gives you the building blocks you need to build your React applications.',
      framework: 'react',
      npmPackage: '@chakra-ui/react',
      installCommand: 'npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion',
      docsUrl: 'https://chakra-ui.com/docs',
      isActive: true,
      metadata: {
        version: '2.8.0',
        emotion: true,
        framerMotion: true
      }
    });

    console.log('\n✅ All registries created!\n');

    // Create Components for shadcn
    console.log('🧩 Creating components for shadcn...\n');
    
    const shadcnButton = await createComponent({
      registrySlug: 'shadcn',
      name: 'Button',
      slug: 'button',
      type: 'input-control',
      description: 'A button component with multiple variants and sizes.',
      dependencies: ['@radix-ui/react-slot'],
      status: 'stable',
      metadata: {
        importPath: '@/components/ui/button'
      }
    });

    const shadcnInput = await createComponent({
      registrySlug: 'shadcn',
      name: 'Input',
      slug: 'input',
      type: 'input-control',
      description: 'A versatile input component for text, email, password, and more.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: '@/components/ui/input'
      }
    });

    const shadcnCard = await createComponent({
      registrySlug: 'shadcn',
      name: 'Card',
      slug: 'card',
      type: 'container',
      description: 'A flexible card component for displaying content.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: '@/components/ui/card'
      }
    });

    // Create Components for antd
    console.log('\n🧩 Creating components for antd...\n');
    
    const antdButton = await createComponent({
      registrySlug: 'antd',
      name: 'Button',
      slug: 'button',
      type: 'input-control',
      description: 'A button component with multiple types and sizes.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdInput = await createComponent({
      registrySlug: 'antd',
      name: 'Input',
      slug: 'input',
      type: 'input-control',
      description: 'A basic input component for entering text.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdTable = await createComponent({
      registrySlug: 'antd',
      name: 'Table',
      slug: 'table',
      type: 'container',
      description: 'A table component for displaying structured data with sorting, filtering, and pagination.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdForm = await createComponent({
      registrySlug: 'antd',
      name: 'Form',
      slug: 'form',
      type: 'container',
      description: 'A form component with validation, layout, and data collection capabilities.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdSelect = await createComponent({
      registrySlug: 'antd',
      name: 'Select',
      slug: 'select',
      type: 'input-control',
      description: 'A select component with search, multiple selection, and grouping support.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdDatePicker = await createComponent({
      registrySlug: 'antd',
      name: 'DatePicker',
      slug: 'date-picker',
      type: 'input-control',
      description: 'A date picker component for selecting dates with various formats and ranges.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdCard = await createComponent({
      registrySlug: 'antd',
      name: 'Card',
      slug: 'card',
      type: 'container',
      description: 'A card component for displaying content in a structured container.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdModal = await createComponent({
      registrySlug: 'antd',
      name: 'Modal',
      slug: 'modal',
      type: 'container',
      description: 'A modal dialog component for displaying content in an overlay.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdMenu = await createComponent({
      registrySlug: 'antd',
      name: 'Menu',
      slug: 'menu',
      type: 'navigational',
      description: 'A menu component for navigation with submenus, icons, and grouping.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdTabs = await createComponent({
      registrySlug: 'antd',
      name: 'Tabs',
      slug: 'tabs',
      type: 'navigational',
      description: 'A tabs component for organizing content into multiple panels.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    const antdMessage = await createComponent({
      registrySlug: 'antd',
      name: 'Message',
      slug: 'message',
      type: 'informational',
      description: 'A message component for displaying global feedback messages.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: 'antd'
      }
    });

    // Create Components for chakra
    console.log('\n🧩 Creating components for chakra...\n');
    
    const chakraButton = await createComponent({
      registrySlug: 'chakra',
      name: 'Button',
      slug: 'button',
      type: 'input-control',
      description: 'A button component with multiple variants.',
      dependencies: [],
      status: 'stable',
      metadata: {
        importPath: '@chakra-ui/react'
      }
    });

    console.log('\n✅ All components created!\n');

    // Create Examples
    console.log('📝 Creating examples...\n');

    // Examples for shadcn Button
    await createExample(shadcnButton.id, {
      name: 'Primary Button',
      slug: 'primary-button',
      description: 'A primary button example',
      language: 'tsx',
      code: `import { Button } from "@/components/ui/button"

export function PrimaryButton() {
  return <Button>Click me</Button>
}`
    });

    await createExample(shadcnButton.id, {
      name: 'Button Variants',
      slug: 'button-variants',
      description: 'Different button variants',
      language: 'tsx',
      code: `import { Button } from "@/components/ui/button"

export function ButtonVariants() {
  return (
    <div className="flex gap-2">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
}`
    });

    // Examples for shadcn Input
    await createExample(shadcnInput.id, {
      name: 'Basic Input',
      slug: 'basic-input',
      description: 'A basic input field',
      language: 'tsx',
      code: `import { Input } from "@/components/ui/input"

export function BasicInput() {
  return <Input placeholder="Enter text..." />
}`
    });

    // Examples for shadcn Card
    await createExample(shadcnCard.id, {
      name: 'Card Example',
      slug: 'card-example',
      description: 'A card with header and content',
      language: 'tsx',
      code: `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function CardExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
      </CardContent>
    </Card>
  )
}`
    });

    // Examples for antd Button
    await createExample(antdButton.id, {
      name: 'Ant Design Button',
      slug: 'antd-button',
      description: 'Basic Ant Design button',
      language: 'tsx',
      code: `import { Button } from 'antd';

export function AntdButton() {
  return <Button type="primary">Click me</Button>;
}`
    });

    await createExample(antdButton.id, {
      name: 'Button Types',
      slug: 'button-types',
      description: 'Different button types',
      language: 'tsx',
      code: `import { Button, Space } from 'antd';

export function ButtonTypes() {
  return (
    <Space>
      <Button type="primary">Primary</Button>
      <Button>Default</Button>
      <Button type="dashed">Dashed</Button>
      <Button type="text">Text</Button>
      <Button type="link">Link</Button>
    </Space>
  );
}`
    });

    await createExample(antdButton.id, {
      name: 'Button Sizes',
      slug: 'button-sizes',
      description: 'Buttons with different sizes',
      language: 'tsx',
      code: `import { Button, Space } from 'antd';

export function ButtonSizes() {
  return (
    <Space size="large">
      <Button type="primary" size="large">Large</Button>
      <Button type="primary">Default</Button>
      <Button type="primary" size="small">Small</Button>
    </Space>
  );
}`
    });

    await createExample(antdButton.id, {
      name: 'Button with Icon',
      slug: 'button-icon',
      description: 'Button with icon',
      language: 'tsx',
      code: `import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

export function ButtonWithIcon() {
  return (
    <Button type="primary" icon={<DownloadOutlined />}>
      Download
    </Button>
  );
}`
    });

    // Examples for antd Input
    await createExample(antdInput.id, {
      name: 'Ant Design Input',
      slug: 'antd-input',
      description: 'Basic Ant Design input',
      language: 'tsx',
      code: `import { Input } from 'antd';

export function AntdInput() {
  return <Input placeholder="Enter text..." />;
}`
    });

    await createExample(antdInput.id, {
      name: 'Input with Prefix',
      slug: 'input-prefix',
      description: 'Input with prefix icon',
      language: 'tsx',
      code: `import { Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export function InputWithPrefix() {
  return <Input prefix={<UserOutlined />} placeholder="Username" />;
}`
    });

    // Examples for antd Table
    await createExample(antdTable.id, {
      name: 'Basic Table',
      slug: 'basic-table',
      description: 'A basic table with data',
      language: 'tsx',
      code: `import { Table } from 'antd';

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London' },
];

export function BasicTable() {
  return <Table columns={columns} dataSource={data} />;
}`
    });

    await createExample(antdTable.id, {
      name: 'Table with Sorting',
      slug: 'table-sorting',
      description: 'Table with sortable columns',
      language: 'tsx',
      code: `import { Table } from 'antd';

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
  { title: 'Age', dataIndex: 'age', key: 'age', sorter: (a, b) => a.age - b.age },
  { title: 'Address', dataIndex: 'address', key: 'address' },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London' },
];

export function TableWithSorting() {
  return <Table columns={columns} dataSource={data} />;
}`
    });

    // Examples for antd Form
    await createExample(antdForm.id, {
      name: 'Basic Form',
      slug: 'basic-form',
      description: 'A basic form with validation',
      language: 'tsx',
      code: `import { Form, Input, Button } from 'antd';

export function BasicForm() {
  const onFinish = (values: any) => {
    console.log('Success:', values);
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
      <Form.Item label="Username" name="username" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Password" name="password" rules={[{ required: true }]}>
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  );
}`
    });

    await createExample(antdForm.id, {
      name: 'Form with Validation',
      slug: 'form-validation',
      description: 'Form with custom validation rules',
      language: 'tsx',
      code: `import { Form, Input, Button } from 'antd';

export function FormWithValidation() {
  return (
    <Form layout="vertical">
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' }
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  );
}`
    });

    // Examples for antd Select
    await createExample(antdSelect.id, {
      name: 'Basic Select',
      slug: 'basic-select',
      description: 'A basic select dropdown',
      language: 'tsx',
      code: `import { Select } from 'antd';

const { Option } = Select;

export function BasicSelect() {
  return (
    <Select defaultValue="lucy" style={{ width: 120 }}>
      <Option value="jack">Jack</Option>
      <Option value="lucy">Lucy</Option>
      <Option value="yiminghe">Yiminghe</Option>
    </Select>
  );
}`
    });

    await createExample(antdSelect.id, {
      name: 'Multiple Select',
      slug: 'multiple-select',
      description: 'Select with multiple selection',
      language: 'tsx',
      code: `import { Select } from 'antd';

const { Option } = Select;

export function MultipleSelect() {
  return (
    <Select mode="multiple" placeholder="Select items" style={{ width: '100%' }}>
      <Option value="apple">Apple</Option>
      <Option value="banana">Banana</Option>
      <Option value="orange">Orange</Option>
    </Select>
  );
}`
    });

    await createExample(antdSelect.id, {
      name: 'Select with Search',
      slug: 'select-search',
      description: 'Select with search functionality',
      language: 'tsx',
      code: `import { Select } from 'antd';

const { Option } = Select;

export function SelectWithSearch() {
  return (
    <Select showSearch placeholder="Search and select" style={{ width: 200 }}>
      <Option value="option1">Option 1</Option>
      <Option value="option2">Option 2</Option>
      <Option value="option3">Option 3</Option>
    </Select>
  );
}`
    });

    // Examples for antd DatePicker
    await createExample(antdDatePicker.id, {
      name: 'Basic DatePicker',
      slug: 'basic-datepicker',
      description: 'A basic date picker',
      language: 'tsx',
      code: `import { DatePicker } from 'antd';
import dayjs from 'dayjs';

export function BasicDatePicker() {
  return <DatePicker />;
}`
    });

    await createExample(antdDatePicker.id, {
      name: 'Date Range Picker',
      slug: 'date-range-picker',
      description: 'Date picker for selecting date ranges',
      language: 'tsx',
      code: `import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

export function DateRangePicker() {
  return <RangePicker />;
}`
    });

    // Examples for antd Card
    await createExample(antdCard.id, {
      name: 'Basic Card',
      slug: 'basic-card',
      description: 'A basic card component',
      language: 'tsx',
      code: `import { Card } from 'antd';

export function BasicCard() {
  return (
    <Card title="Card Title" style={{ width: 300 }}>
      <p>Card content</p>
    </Card>
  );
}`
    });

    await createExample(antdCard.id, {
      name: 'Card with Actions',
      slug: 'card-actions',
      description: 'Card with action buttons',
      language: 'tsx',
      code: `import { Card, Button } from 'antd';

export function CardWithActions() {
  return (
    <Card
      title="Card Title"
      extra={<Button>More</Button>}
      style={{ width: 300 }}
    >
      <p>Card content</p>
    </Card>
  );
}`
    });

    // Examples for antd Modal
    await createExample(antdModal.id, {
      name: 'Basic Modal',
      slug: 'basic-modal',
      description: 'A basic modal dialog',
      language: 'tsx',
      code: `import { Modal, Button } from 'antd';
import { useState } from 'react';

export function BasicModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        title="Basic Modal"
        open={isOpen}
        onOk={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
      >
        <p>Some contents...</p>
      </Modal>
    </>
  );
}`
    });

    await createExample(antdModal.id, {
      name: 'Modal with Form',
      slug: 'modal-form',
      description: 'Modal containing a form',
      language: 'tsx',
      code: `import { Modal, Form, Input, Button } from 'antd';
import { useState } from 'react';

export function ModalWithForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [form] = Form.useForm();

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        title="Form Modal"
        open={isOpen}
        onOk={() => {
          form.submit();
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}`
    });

    // Examples for antd Menu
    await createExample(antdMenu.id, {
      name: 'Basic Menu',
      slug: 'basic-menu',
      description: 'A basic navigation menu',
      language: 'tsx',
      code: `import { Menu } from 'antd';

export function BasicMenu() {
  const items = [
    { key: '1', label: 'Navigation One' },
    { key: '2', label: 'Navigation Two' },
    { key: '3', label: 'Navigation Three' },
  ];

  return <Menu mode="horizontal" items={items} />;
}`
    });

    await createExample(antdMenu.id, {
      name: 'Menu with Icons',
      slug: 'menu-icons',
      description: 'Menu with icons',
      language: 'tsx',
      code: `import { Menu } from 'antd';
import { MailOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons';

export function MenuWithIcons() {
  const items = [
    { key: 'mail', icon: <MailOutlined />, label: 'Navigation One' },
    { key: 'app', icon: <AppstoreOutlined />, label: 'Navigation Two' },
    { key: 'setting', icon: <SettingOutlined />, label: 'Navigation Three' },
  ];

  return <Menu mode="horizontal" items={items} />;
}`
    });

    // Examples for antd Tabs
    await createExample(antdTabs.id, {
      name: 'Basic Tabs',
      slug: 'basic-tabs',
      description: 'A basic tabs component',
      language: 'tsx',
      code: `import { Tabs } from 'antd';

const { TabPane } = Tabs;

export function BasicTabs() {
  return (
    <Tabs defaultActiveKey="1">
      <TabPane tab="Tab 1" key="1">
        Content of Tab Pane 1
      </TabPane>
      <TabPane tab="Tab 2" key="2">
        Content of Tab Pane 2
      </TabPane>
      <TabPane tab="Tab 3" key="3">
        Content of Tab Pane 3
      </TabPane>
    </Tabs>
  );
}`
    });

    await createExample(antdTabs.id, {
      name: 'Tabs with Icons',
      slug: 'tabs-icons',
      description: 'Tabs with icons',
      language: 'tsx',
      code: `import { Tabs } from 'antd';
import { AppleOutlined, AndroidOutlined } from '@ant-design/icons';

export function TabsWithIcons() {
  const items = [
    { key: '1', label: <span><AppleOutlined />Tab 1</span>, children: 'Content 1' },
    { key: '2', label: <span><AndroidOutlined />Tab 2</span>, children: 'Content 2' },
  ];

  return <Tabs items={items} />;
}`
    });

    // Examples for antd Message
    await createExample(antdMessage.id, {
      name: 'Success Message',
      slug: 'success-message',
      description: 'Display a success message',
      language: 'tsx',
      code: `import { message, Button } from 'antd';

export function SuccessMessage() {
  const showSuccess = () => {
    message.success('This is a success message');
  };

  return <Button onClick={showSuccess}>Show Success</Button>;
}`
    });

    await createExample(antdMessage.id, {
      name: 'Error Message',
      slug: 'error-message',
      description: 'Display an error message',
      language: 'tsx',
      code: `import { message, Button } from 'antd';

export function ErrorMessage() {
  const showError = () => {
    message.error('This is an error message');
  };

  return <Button onClick={showError}>Show Error</Button>;
}`
    });

    await createExample(antdMessage.id, {
      name: 'Multiple Message Types',
      slug: 'message-types',
      description: 'Different types of messages',
      language: 'tsx',
      code: `import { message, Button, Space } from 'antd';

export function MessageTypes() {
  const showMessages = () => {
    message.success('Success message');
    message.error('Error message');
    message.warning('Warning message');
    message.info('Info message');
  };

  return (
    <Space>
      <Button onClick={showMessages}>Show All Messages</Button>
    </Space>
  );
}`
    });

    // Examples for chakra Button
    await createExample(chakraButton.id, {
      name: 'Chakra Button',
      slug: 'chakra-button',
      description: 'Basic Chakra UI button',
      language: 'tsx',
      code: `import { Button } from '@chakra-ui/react';

export function ChakraButton() {
  return <Button colorScheme="blue">Click me</Button>;
}`
    });

    console.log('\n✅ All examples created!\n');
    console.log('🎉 Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Registries: 3`);
    console.log(`   - Components: 15 (shadcn: 3, antd: 11, chakra: 1)`);
    console.log(`   - Examples: 32`);
    console.log(`     • shadcn: 4 examples`);
    console.log(`     • antd: 27 examples`);
    console.log(`     • chakra: 1 example`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  seedViaAPI();
}

export { seedViaAPI };

