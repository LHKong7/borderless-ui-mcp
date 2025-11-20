import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UIComponent } from './UIComponent';

@Entity('ui_registry')
@Index('idx_ui_registry_slug_lower', ['slug'])
@Index('idx_ui_registry_framework_active', ['framework', 'isActive'])
export class UIRegistry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  name!: string;

  @Column({ type: 'text', unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text' })
  framework!: string;

  @Column({ type: 'text', nullable: true, name: 'npm_package' })
  npmPackage?: string;

  @Column({ type: 'text', nullable: true, name: 'install_command' })
  installCommand?: string;

  @Column({ type: 'text', nullable: true, name: 'docs_url' })
  docsUrl?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => UIComponent, component => component.registry, { cascade: true })
  components!: UIComponent[];
}