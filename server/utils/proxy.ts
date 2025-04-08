import fetch, { Response } from 'node-fetch';
import { App, InsertRequestLog, InsertQueuedRequest } from '@shared/schema';
import { storage } from '../storage';
import { rateLimiter } from './rateLimiter';

// Interface for request data
interface RequestData {
  method: string;
  headers: Record<string, string>;
  body?: any;
}

// Interface for proxy result
interface ProxyResult {
  status: number;
  data: any;
  headers: Record<string, string>;
  responseTime: number;
}

/**
 * Forward a request to the target API
 */
export async function forwardRequest(
  app: App,
  userId: number,
  path: string,
  requestData: RequestData
): Promise<ProxyResult> {
  const startTime = Date.now();
  
  // Prepare headers - remove host header and add authorization if needed
  const headers = { ...requestData.headers };
  delete headers.host;
  
  // Add authorization header if the app has an auth token
  if (app.authToken) {
    headers['Authorization'] = `Bearer ${app.authToken}`;
  }
  
  // Construct the full URL
  const url = `${app.baseUrl}${path}`;
  
  try {
    // Make the request
    const response = await fetch(url, {
      method: requestData.method,
      headers,
      body: requestData.body ? JSON.stringify(requestData.body) : undefined,
    });
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Parse response data
    let data: any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Prepare response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // Log the request
    await logRequest(userId, app.appId, path, requestData.method, response.status, responseTime);
    
    return {
      status: response.status,
      data,
      headers: responseHeaders,
      responseTime
    };
  } catch (error) {
    // Log the failed request
    const responseTime = Date.now() - startTime;
    await logRequest(userId, app.appId, path, requestData.method, 500, responseTime);
    
    throw error;
  }
}

/**
 * Log a request to storage
 */
async function logRequest(
  userId: number,
  appId: string,
  path: string,
  method: string,
  status: number,
  responseTime: number,
  rateLimited: number = 0,
  queued: number = 0
): Promise<void> {
  const requestLog: InsertRequestLog = {
    userId,
    appId,
    path,
    method,
    status,
    responseTime,
    rateLimited,
    queued
  };
  
  await storage.createRequestLog(requestLog);
}

/**
 * Queue a request for later processing
 */
export async function queueRequest(
  app: App,
  userId: number,
  path: string,
  requestData: RequestData,
  estimatedProcessingTime: Date
): Promise<number> {
  // Store the request in the queue
  const queuedRequest: InsertQueuedRequest = {
    userId,
    appId: app.appId,
    path,
    method: requestData.method,
    headers: requestData.headers,
    body: requestData.body,
    estimatedProcessingTime,
    status: 'queued'
  };
  
  // Log as a queued request
  await logRequest(
    userId,
    app.appId,
    path,
    requestData.method,
    0, // No status yet
    0,  // No response time yet
    0,  // Not rate limited (it's queued)
    1   // It is queued
  );
  
  const createdRequest = await storage.createQueuedRequest(queuedRequest);
  
  // Set up the rate limiter to process this request when the time comes
  const key = `queue:${createdRequest.id}`;
  const queueTime = estimatedProcessingTime.getTime() - Date.now();
  
  rateLimiter.queueRequest(key, queueTime, async () => {
    // Update the request status
    await storage.updateQueuedRequest(createdRequest.id, { status: 'processing' });
    
    try {
      // Forward the request
      const result = await forwardRequest(app, userId, path, requestData);
      
      // Update the request status
      await storage.updateQueuedRequest(createdRequest.id, { 
        status: 'completed' 
      });
    } catch (error) {
      // Update the request status to error
      await storage.updateQueuedRequest(createdRequest.id, { 
        status: 'error' 
      });
    }
  });
  
  return createdRequest.id;
}

/**
 * Cancel a queued request
 */
export async function cancelQueuedRequest(requestId: number): Promise<boolean> {
  const request = await storage.updateQueuedRequest(requestId, { status: 'cancelled' });
  if (!request) {
    return false;
  }
  
  // Cancel the rate limiter queue
  const key = `queue:${requestId}`;
  return rateLimiter.cancelQueuedRequest(key);
}
