import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './TypeORM.config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Define it in your .env file.');
}

export default new DataSource(buildDataSourceOptions(databaseUrl));
