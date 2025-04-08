import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  registerUserSchema, 
  loginUserSchema, 
  registerAppSchema,
  insertUserSchema,
  users
} from "@shared/schema";
import { hashPassword, verifyPassword, generateApiKey } from "./utils/crypto";
import { rateLimiter } from "./utils/rateLimiter";
import { forwardRequest, queueRequest, cancelQueuedRequest } from "./utils/proxy";
import session from "express-session";
import { eq } from "drizzle-orm";
import { db } from "./db";

// Declare session with userId property
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup session middleware with PostgreSQL
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 86400000 }, // 24 hours
    store: storage.sessionStore
  }));

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };

  // Middleware to check API key
  const checkApiKey = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ message: 'API key is required' });
    }
    
    const user = await storage.getUserByApiKey(apiKey);
    if (!user) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
    
    // Set user ID to request object
    (req as any).userId = user.id;
    next();
  };

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = registerUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(data.password);
      
      // Create user
      const user = await storage.createUser({
        username: data.username,
        password: hashedPassword
      });
      
      // Set user in session
      req.session.userId = user.id;
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        apiKey: user.apiKey
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginUserSchema.parse(req.body);
      
      // Get user by username
      const user = await storage.getUserByUsername(data.username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Verify password
      const isValid = await verifyPassword(data.password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        username: user.username,
        apiKey: user.apiKey
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        apiKey: user.apiKey
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // API Key regeneration
  app.post('/api/auth/regenerate-key', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const newApiKey = generateApiKey();
      
      // Update user in database with new API key
      await db.update(users)
        .set({ apiKey: newApiKey })
        .where(eq(users.id, req.session.userId!));
      
      res.json({
        apiKey: newApiKey
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // App management routes
  app.post('/api/apps', requireAuth, async (req, res) => {
    try {
      const data = registerAppSchema.parse(req.body);
      
      const app = await storage.createApp({
        userId: req.session.userId!,
        name: data.name,
        baseUrl: data.baseUrl,
        strategy: data.strategy,
        requestCount: data.requestCount,
        timeWindow: data.timeWindow,
        authToken: data.authToken
      });
      
      res.status(201).json({
        id: app.id,
        name: app.name,
        baseUrl: app.baseUrl,
        appId: app.appId,
        strategy: app.strategy,
        requestCount: app.requestCount,
        timeWindow: app.timeWindow,
        active: app.active,
        createdAt: app.createdAt
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/apps', requireAuth, async (req, res) => {
    try {
      const apps = await storage.getUserApps(req.session.userId!);
      
      // Add usage percentage to each app
      const appsWithUsage = await Promise.all(apps.map(async (app) => {
        const usage = rateLimiter.getUsagePercentage(app, req.session.userId!.toString());
        return {
          ...app,
          usage,
          // Don't expose the auth token
          authToken: app.authToken ? '********' : undefined
        };
      }));
      
      res.json(appsWithUsage);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/apps/:id', requireAuth, async (req, res) => {
    try {
      const appId = parseInt(req.params.id);
      
      // Validate app belongs to user
      const app = await storage.getApp(appId);
      if (!app || app.userId !== req.session.userId) {
        return res.status(404).json({ message: 'App not found' });
      }
      
      // Update the app
      const data = registerAppSchema.partial().parse(req.body);
      
      const updatedApp = await storage.updateApp(appId, {
        name: data.name,
        baseUrl: data.baseUrl,
        strategy: data.strategy,
        requestCount: data.requestCount,
        timeWindow: data.timeWindow,
        authToken: data.authToken,
        active: req.body.active !== undefined ? req.body.active : app.active
      });
      
      if (!updatedApp) {
        return res.status(404).json({ message: 'App not found' });
      }
      
      res.json({
        id: updatedApp.id,
        name: updatedApp.name,
        baseUrl: updatedApp.baseUrl,
        appId: updatedApp.appId,
        strategy: updatedApp.strategy,
        requestCount: updatedApp.requestCount,
        timeWindow: updatedApp.timeWindow,
        active: updatedApp.active,
        createdAt: updatedApp.createdAt
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Queued requests routes
  app.get('/api/queued-requests', requireAuth, async (req, res) => {
    try {
      const queuedRequests = await storage.getQueuedRequests(req.session.userId!);
      
      // Map to add estimated wait time
      const now = Date.now();
      const requests = queuedRequests.map(req => {
        // Ensure estimatedProcessingTime is treated as a string
        const estimatedWaitTime = req.estimatedProcessingTime 
          ? Math.max(0, new Date(req.estimatedProcessingTime.toString()).getTime() - now) 
          : 0;
        
        // Ensure queuedAt is treated as a string to create a valid date
        const queuedAtTime = req.queuedAt 
          ? new Date(req.queuedAt.toString()).getTime() 
          : now;
          
        return {
          ...req,
          estimatedWaitTime,
          timeInQueue: now - queuedAtTime
        };
      });
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/queued-requests/:id', requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      
      // Find the request first to check ownership
      const queuedRequest = await storage.updateQueuedRequest(requestId, {}); // No changes, just to get the request
      
      if (!queuedRequest || queuedRequest.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Queued request not found' });
      }
      
      // Cancel the request
      await cancelQueuedRequest(requestId);
      
      res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Request statistics routes
  app.get('/api/stats', requireAuth, async (req, res) => {
    try {
      const logs = await storage.getRequestLogs(req.session.userId!);
      const apps = await storage.getUserApps(req.session.userId!);
      const queuedRequests = await storage.getQueuedRequests(req.session.userId!);
      
      // Calculate high-level stats
      const totalApps = apps.length;
      const totalRequestsToday = logs.filter(log => {
        const today = new Date();
        const logDate = log.timestamp ? new Date(log.timestamp) : null;
        return logDate && logDate.toDateString() === today.toDateString();
      }).length;
      
      const rateLimitedRequests = logs.filter(log => log.rateLimited === 1).length;
      const queuedRequestsCount = queuedRequests.filter(req => req.status === 'queued').length;
      
      // Calculate daily stats for graph
      const dailyStats = new Map<string, number>();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      // Initialize with zeros
      last7Days.forEach(day => dailyStats.set(day, 0));
      
      // Count requests per day
      logs.forEach(log => {
        if (log.timestamp) {
          const day = new Date(log.timestamp).toISOString().split('T')[0];
          if (dailyStats.has(day)) {
            dailyStats.set(day, dailyStats.get(day)! + 1);
          }
        }
      });
      
      res.json({
        totalApps,
        totalRequestsToday,
        rateLimitedRequests,
        queuedRequests: queuedRequestsCount,
        dailyStats: Object.fromEntries(dailyStats)
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Proxy API routes
  app.all('/apis/:appId/*', checkApiKey, async (req, res) => {
    const appId = req.params.appId;
    const path = req.url.replace(`/apis/${appId}`, '');
    const userId = (req as any).userId;
    
    try {
      // Find the app
      const app = await storage.getAppByAppId(appId);
      if (!app) {
        return res.status(404).json({ message: 'API not found' });
      }
      
      // Check if app is active
      if (app.active !== 1) {
        return res.status(403).json({ message: 'API is not active' });
      }
      
      // Check rate limit
      const rateLimitResult = rateLimiter.checkRateLimit(app, userId.toString());
      
      if (!rateLimitResult.allow) {
        // Request is rate limited
        if (rateLimitResult.queueTime > 0) {
          // Queue the request for later processing
          const estimatedProcessingTime = new Date(Date.now() + rateLimitResult.queueTime);
          
          const requestData = {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.body
          };
          
          const queuedRequestId = await queueRequest(
            app,
            userId,
            path,
            requestData,
            estimatedProcessingTime
          );
          
          return res.status(429).json({
            message: 'Rate limit exceeded, request has been queued',
            queuedRequestId,
            estimatedProcessingTime
          });
        }
        
        // Can't queue the request (e.g., queue is full)
        return res.status(429).json({ message: 'Rate limit exceeded' });
      }
      
      // Forward the request
      const requestData = {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: req.body
      };
      
      const result = await forwardRequest(app, userId, path, requestData);
      
      // Set response headers
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Send response
      res.status(result.status).json(result.data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ message: 'Proxy error', error: (error as Error).message });
    }
  });

  return httpServer;
}
