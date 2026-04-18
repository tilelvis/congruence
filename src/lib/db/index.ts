import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://user:pass@host/db';
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export type DB = typeof db;
