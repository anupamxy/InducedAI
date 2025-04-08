import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

import { POSTGRESQL_DB } from '.env';
// Create postgres connection
const client = postgres(POSTGRESQL_DB)

// Create drizzle database instance
export const db = drizzle(client, { schema });