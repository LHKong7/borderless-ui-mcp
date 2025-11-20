import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UIComponent } from './UIComponent';

export enum ExampleLanguage {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  TSX = 'tsx',
  JSX = 'jsx',
  HTML = 'html',
  CSS = 'css'
}

@Entity('ui_component_example')
export class UIComponentExample {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'component_id' })
  componentId!: number;

  @Column({ type: 'text', nullable: false, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: false, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: false })
  language?: ExampleLanguage;

  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => UIComponent, component => component.examples, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_id' })
  component!: UIComponent;
}