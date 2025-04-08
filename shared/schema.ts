import { pgTable, text, serial, integer, timestamp, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// API/App registration model
export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  appId: text("app_id").notNull().unique(),
  strategy: text("strategy").notNull(),
  requestCount: integer("request_count").notNull(),
  timeWindow: integer("time_window").notNull(), // in seconds
  active: integer("active").default(1),
  authToken: text("auth_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppSchema = createInsertSchema(apps).pick({
  userId: true,
  name: true,
  baseUrl: true,
  strategy: true,
  requestCount: true,
  timeWindow: true,
  authToken: true,
});

// Request logs model
export const requestLogs = pgTable("request_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  appId: text("app_id").notNull(),
  path: text("path").notNull(),
  method: text("method").notNull(),
  status: integer("status"),
  responseTime: integer("response_time"),
  timestamp: timestamp("timestamp").defaultNow(),
  rateLimited: integer("rate_limited").default(0),
  queued: integer("queued").default(0),
});

export const insertRequestLogSchema = createInsertSchema(requestLogs).pick({
  userId: true,
  appId: true,
  path: true,
  method: true,
  status: true,
  responseTime: true,
  rateLimited: true,
  queued: true,
});

// Queued requests model
export const queuedRequests = pgTable("queued_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  appId: text("app_id").notNull(),
  path: text("path").notNull(),
  method: text("method").notNull(),
  headers: jsonb("headers").notNull(),
  body: jsonb("body"),
  queuedAt: timestamp("queued_at").defaultNow(),
  estimatedProcessingTime: timestamp("estimated_processing_time"),
  status: text("status").notNull(), // "queued", "processing", "completed", "cancelled"
});

export const insertQueuedRequestSchema = createInsertSchema(queuedRequests).pick({
  userId: true,
  appId: true,
  path: true,
  method: true,
  headers: true,
  body: true,
  estimatedProcessingTime: true,
  status: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type App = typeof apps.$inferSelect;
export type InsertApp = z.infer<typeof insertAppSchema>;

export type RequestLog = typeof requestLogs.$inferSelect;
export type InsertRequestLog = z.infer<typeof insertRequestLogSchema>;

export type QueuedRequest = typeof queuedRequests.$inferSelect;
export type InsertQueuedRequest = z.infer<typeof insertQueuedRequestSchema>;

// Extended schemas for validation
export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().email("Username must be a valid email")
});

export const loginUserSchema = z.object({
  username: z.string().email("Username must be a valid email"),
  password: z.string().min(1, "Password is required")
});

export const registerAppSchema = insertAppSchema.omit({ userId: true }).extend({
  name: z.string().min(1, "API name is required"),
  baseUrl: z.string().url("Base URL must be a valid URL"),
  strategy: z.enum(["token-bucket", "leaky-bucket", "fixed-window", "sliding-window"]),
  requestCount: z.number().int().positive("Request count must be positive"),
  timeWindow: z.number().int().positive("Time window must be positive"),
  authToken: z.string().optional()
});
