import { App } from '@shared/schema';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface FixedWindow {
  count: number;
  windowStart: number;
}

interface LeakyBucket {
  tokens: number;
  lastLeaked: number;
}

interface SlidingWindow {
  count: number;
  timestamps: number[];
}

type RateLimiterState = Map<string, TokenBucket | FixedWindow | LeakyBucket | SlidingWindow>;

export class RateLimiter {
  private static instance: RateLimiter;
  private rateLimiterState: RateLimiterState = new Map();
  private queueTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if a request can be allowed or needs to be rate limited
   * @param app The App configuration
   * @param uniqueId A unique identifier for the request (e.g., appId + userId)
   * @returns An object with allow (boolean) and queueTime (ms to wait if allow is false)
   */
  public checkRateLimit(app: App, uniqueId: string): { allow: boolean; queueTime: number } {
    const key = `${app.appId}:${uniqueId}`;
    
    switch (app.strategy) {
      case 'token-bucket':
        return this.checkTokenBucket(key, app.requestCount, app.timeWindow);
      case 'leaky-bucket':
        return this.checkLeakyBucket(key, app.requestCount, app.timeWindow);
      case 'fixed-window':
        return this.checkFixedWindow(key, app.requestCount, app.timeWindow);
      case 'sliding-window':
        return this.checkSlidingWindow(key, app.requestCount, app.timeWindow);
      default:
        // Default to token bucket
        return this.checkTokenBucket(key, app.requestCount, app.timeWindow);
    }
  }

  /**
   * Queue a request to be processed later
   * @param key The request key
   * @param delay Delay in milliseconds before executing the callback
   * @param callback Function to call when the delay has passed
   */
  public queueRequest(key: string, delay: number, callback: () => void): void {
    // Clear any existing queue timer for this key
    if (this.queueTimers.has(key)) {
      clearTimeout(this.queueTimers.get(key));
    }
    
    // Set the new timer
    const timer = setTimeout(() => {
      callback();
      this.queueTimers.delete(key);
    }, delay);
    
    this.queueTimers.set(key, timer);
  }

  /**
   * Cancel a queued request
   * @param key The request key
   * @returns True if a request was cancelled, false otherwise
   */
  public cancelQueuedRequest(key: string): boolean {
    if (this.queueTimers.has(key)) {
      clearTimeout(this.queueTimers.get(key));
      this.queueTimers.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Implement Token Bucket algorithm
   */
  private checkTokenBucket(key: string, maxTokens: number, refillTimeInSeconds: number): { allow: boolean; queueTime: number } {
    const now = Date.now();
    const state = this.rateLimiterState.get(key) as TokenBucket || { tokens: maxTokens, lastRefill: now };
    
    // Calculate tokens to add based on time elapsed
    const timeElapsedInMs = now - state.lastRefill;
    const tokensToAdd = (timeElapsedInMs / 1000) * (maxTokens / refillTimeInSeconds);
    
    // Refill the bucket (up to max)
    state.tokens = Math.min(maxTokens, state.tokens + tokensToAdd);
    state.lastRefill = now;
    
    if (state.tokens >= 1) {
      // Allow the request and consume a token
      state.tokens -= 1;
      this.rateLimiterState.set(key, state);
      return { allow: true, queueTime: 0 };
    } else {
      // Calculate how long until a token becomes available
      const msUntilRefill = (1 - state.tokens) * (refillTimeInSeconds * 1000 / maxTokens);
      this.rateLimiterState.set(key, state);
      return { allow: false, queueTime: Math.ceil(msUntilRefill) };
    }
  }

  /**
   * Implement Leaky Bucket algorithm
   */
  private checkLeakyBucket(key: string, capacity: number, leakRateInSeconds: number): { allow: boolean; queueTime: number } {
    const now = Date.now();
    const state = this.rateLimiterState.get(key) as LeakyBucket || { tokens: 0, lastLeaked: now };
    
    // Calculate tokens leaked based on time elapsed
    const timeElapsedInMs = now - state.lastLeaked;
    const tokensLeaked = (timeElapsedInMs / 1000) * (capacity / leakRateInSeconds);
    
    // Update tokens (leak the bucket)
    state.tokens = Math.max(0, state.tokens - tokensLeaked);
    state.lastLeaked = now;
    
    if (state.tokens < capacity) {
      // Allow the request and add a token to the bucket
      state.tokens += 1;
      this.rateLimiterState.set(key, state);
      return { allow: true, queueTime: 0 };
    } else {
      // Calculate time until a token can be processed
      const msUntilLeaked = (state.tokens - capacity + 1) * (leakRateInSeconds * 1000 / capacity);
      this.rateLimiterState.set(key, state);
      return { allow: false, queueTime: Math.ceil(msUntilLeaked) };
    }
  }

  /**
   * Implement Fixed Window algorithm
   */
  private checkFixedWindow(key: string, limit: number, windowSizeInSeconds: number): { allow: boolean; queueTime: number } {
    const now = Date.now();
    const windowSizeInMs = windowSizeInSeconds * 1000;
    const state = this.rateLimiterState.get(key) as FixedWindow || { count: 0, windowStart: now };
    
    // Check if we're in a new window
    if (now - state.windowStart >= windowSizeInMs) {
      // Reset the window
      state.count = 1;
      state.windowStart = now;
      this.rateLimiterState.set(key, state);
      return { allow: true, queueTime: 0 };
    }
    
    if (state.count < limit) {
      // Allow the request and increment the counter
      state.count += 1;
      this.rateLimiterState.set(key, state);
      return { allow: true, queueTime: 0 };
    } else {
      // Calculate time until the window resets
      const msUntilReset = windowSizeInMs - (now - state.windowStart);
      this.rateLimiterState.set(key, state);
      return { allow: false, queueTime: msUntilReset };
    }
  }

  /**
   * Implement Sliding Window algorithm
   */
  private checkSlidingWindow(key: string, limit: number, windowSizeInSeconds: number): { allow: boolean; queueTime: number } {
    const now = Date.now();
    const windowSizeInMs = windowSizeInSeconds * 1000;
    const state = this.rateLimiterState.get(key) as SlidingWindow || { count: 0, timestamps: [] };
    
    // Remove timestamps that are outside the window
    const validTimestamps = state.timestamps.filter(ts => now - ts < windowSizeInMs);
    state.timestamps = validTimestamps;
    state.count = validTimestamps.length;
    
    if (state.count < limit) {
      // Allow the request and add the timestamp
      state.timestamps.push(now);
      state.count += 1;
      this.rateLimiterState.set(key, state);
      return { allow: true, queueTime: 0 };
    } else {
      // Calculate time until the oldest timestamp expires
      const oldestTimestamp = state.timestamps[0];
      const msUntilExpire = (oldestTimestamp + windowSizeInMs) - now;
      this.rateLimiterState.set(key, state);
      return { allow: false, queueTime: msUntilExpire };
    }
  }

  /**
   * Get the current usage for a specific rate limit key
   * @param app The App configuration
   * @param uniqueId A unique identifier for the request
   * @returns The current usage percentage (0-100)
   */
  public getUsagePercentage(app: App, uniqueId: string): number {
    const key = `${app.appId}:${uniqueId}`;
    
    if (!this.rateLimiterState.has(key)) {
      return 0;
    }
    
    const state = this.rateLimiterState.get(key);
    
    switch (app.strategy) {
      case 'token-bucket': {
        const bucket = state as TokenBucket;
        return ((app.requestCount - bucket.tokens) / app.requestCount) * 100;
      }
      case 'leaky-bucket': {
        const bucket = state as LeakyBucket;
        return (bucket.tokens / app.requestCount) * 100;
      }
      case 'fixed-window': {
        const window = state as FixedWindow;
        return (window.count / app.requestCount) * 100;
      }
      case 'sliding-window': {
        const window = state as SlidingWindow;
        return (window.count / app.requestCount) * 100;
      }
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();
