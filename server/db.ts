import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create postgres connection
const client = postgres('postgresql://anupam_owner:npg_QIupmAj8R6tX@ep-twilight-boat-a5xlp3cw-pooler.us-east-2.aws.neon.tech/anupam?sslmode=require');

// Create drizzle database instance
export const db = drizzle(client, { schema });