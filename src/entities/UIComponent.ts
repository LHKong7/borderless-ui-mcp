import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UIRegistry } from './UIRegistry';
import { UIComponentExample } from './UIComponentExample';

export enum ComponentType {
  INPUTCONTROL = 'input-control', // Buttons, checkboxes, radio buttons, text fields, dropdowns, sliders, and date pickers
  CONTAINER = 'container', // Cards, dialogs, accordions, and other layout elements that group related information. 
  NAVIGATIONAL = 'navigational', // Menus, sidebars, breadcrumbs, tabs, and pagination. 
  INFORMATIONAL = 'informational', // Notifications, progress bars, badges, alerts, and tooltips. 
  BUSINESS = 'biz' // business related components
}

export enum ComponentStatus {
  STABLE = 'stable',
  BETA = 'beta',
  ALPHA = 'alpha',
  DEPRECATED = 'deprecated'
}

@Entity('ui_component')
@Index('idx_ui_component_registry_slug', ['registry', 'slug'], { unique: true })
@Index('idx_ui_component_registry_type_status', ['registry', 'type', 'status'])
export class UIComponent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'registry_id' })
  registryId!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  slug!: string;

  @Column({ type: 'text', nullable: false })
  type!: ComponentType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', array: true, default: () => "ARRAY[]::text[]" })
  dependencies!: string[];

  @Column({ type: 'text', default: ComponentStatus.STABLE })
  status!: ComponentStatus;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => UIRegistry, registry => registry.components, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registry_id' })
  registry!: UIRegistry;

  @OneToMany(() => UIComponentExample, example => example.component, { cascade: true })
  examples!: UIComponentExample[];
}