import { 
  users, 
  apps, 
  requestLogs, 
  queuedRequests, 
  type User, 
  type InsertUser, 
  type App, 
  type InsertApp, 
  type RequestLog, 
  type InsertRequestLog, 
  type QueuedRequest, 
  type InsertQueuedRequest 
} from "@shared/schema";
import { nanoid } from "nanoid";
import crypto from 'crypto';
import { db } from './db';
import { eq, and } from 'drizzle-orm';
import connectPg from 'connect-pg-simple';
import session from 'express-session';
import pg from 'pg';

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: 'postgresql://anupam_owner:npg_QIupmAj8R6tX@ep-twilight-boat-a5xlp3cw-pooler.us-east-2.aws.neon.tech/anupam?sslmode=require',
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL!"))
  .catch(err => console.error("❌ Failed to connect to PostgreSQL:", err));



// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByApiKey(apiKey: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // App operations
  getApp(id: number): Promise<App | undefined>;
  getAppByAppId(appId: string): Promise<App | undefined>;
  getUserApps(userId: number): Promise<App[]>;
  createApp(app: InsertApp): Promise<App>;
  updateApp(id: number, app: Partial<App>): Promise<App | undefined>;
  
  // Request logs operations
  createRequestLog(log: InsertRequestLog): Promise<RequestLog>;
  getRequestLogs(userId: number, appId?: string): Promise<RequestLog[]>;
  
  // Queued requests operations
  createQueuedRequest(request: InsertQueuedRequest): Promise<QueuedRequest>;
  getQueuedRequests(userId: number, appId?: string): Promise<QueuedRequest[]>;
  updateQueuedRequest(id: number, request: Partial<QueuedRequest>): Promise<QueuedRequest | undefined>;
  deleteQueuedRequest(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize session store with PostgreSQL
    this.sessionStore = new PostgresSessionStore({
      pool, 
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByApiKey(apiKey: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.apiKey, apiKey));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const apiKey = this.generateApiKey();
    const [user] = await db.insert(users)
      .values({ 
        ...insertUser, 
        apiKey
      })
      .returning();
    return user;
  }

  // App operations
  async getApp(id: number): Promise<App | undefined> {
    const [app] = await db.select().from(apps).where(eq(apps.id, id));
    return app;
  }

  async getAppByAppId(appId: string): Promise<App | undefined> {
    const [app] = await db.select().from(apps).where(eq(apps.appId, appId));
    return app;
  }

  async getUserApps(userId: number): Promise<App[]> {
    return await db.select().from(apps).where(eq(apps.userId, userId));
  }

  async createApp(insertApp: InsertApp): Promise<App> {
    const appId = nanoid(10);
    const [app] = await db.insert(apps)
      .values({ 
        ...insertApp, 
        appId
      })
      .returning();
    return app;
  }

  async updateApp(id: number, appUpdate: Partial<App>): Promise<App | undefined> {
    const [app] = await db.update(apps)
      .set(appUpdate)
      .where(eq(apps.id, id))
      .returning();
    return app;
  }

  // Request logs operations
  async createRequestLog(insertLog: InsertRequestLog): Promise<RequestLog> {
    const [log] = await db.insert(requestLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getRequestLogs(userId: number, appId?: string): Promise<RequestLog[]> {
    if (appId) {
      return await db.select()
        .from(requestLogs)
        .where(and(
          eq(requestLogs.userId, userId),
          eq(requestLogs.appId, appId)
        ));
    } else {
      return await db.select()
        .from(requestLogs)
        .where(eq(requestLogs.userId, userId));
    }
  }

  // Queued requests operations
  async createQueuedRequest(insertRequest: InsertQueuedRequest): Promise<QueuedRequest> {
    const [request] = await db.insert(queuedRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getQueuedRequests(userId: number, appId?: string): Promise<QueuedRequest[]> {
    if (appId) {
      return await db.select()
        .from(queuedRequests)
        .where(and(
          eq(queuedRequests.userId, userId),
          eq(queuedRequests.appId, appId)
        ));
    } else {
      return await db.select()
        .from(queuedRequests)
        .where(eq(queuedRequests.userId, userId));
    }
  }

  async updateQueuedRequest(id: number, requestUpdate: Partial<QueuedRequest>): Promise<QueuedRequest | undefined> {
    const [request] = await db.update(queuedRequests)
      .set(requestUpdate)
      .where(eq(queuedRequests.id, id))
      .returning();
    return request;
  }

  async deleteQueuedRequest(id: number): Promise<boolean> {
    const result = await db.delete(queuedRequests)
      .where(eq(queuedRequests.id, id));
    return result.count > 0;
  }

  // Helper methods
  private generateApiKey(): string {
    const buffer = crypto.randomBytes(32);
    return `sk_${buffer.toString('hex')}`;
  }
}

export const storage = new DatabaseStorage();
