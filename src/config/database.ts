import { DataSource } from 'typeorm';
import 'dotenv/config';

import { UIRegistry } from '../entities/UIRegistry';
import { UIComponent } from '../entities/UIComponent';
import { UIComponentExample } from '../entities/UIComponentExample';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || ''),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [UIRegistry, UIComponent, UIComponentExample],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});
