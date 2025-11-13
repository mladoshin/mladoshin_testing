import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { register } from 'tsconfig-paths';

// Register tsconfig paths for TypeORM CLI
register({
  baseUrl: join(__dirname, '../..'),
  paths: {
    'src/*': ['src/*'],
    '@modules/*': ['src/modules/*'],
  },
});

// Load environment variables
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'school_db',
  entities: [join(__dirname, '..', 'modules', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false, // Always false for migrations
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
