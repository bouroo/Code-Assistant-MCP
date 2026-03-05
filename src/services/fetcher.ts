import { logger } from '../utils/logger.js';
import { TimeoutError } from '../utils/errors.js';

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface FetchResponse {
  content: string;
  headers: Record<string, string>;
  status: number;
  url: string;
}

export class FetcherService {
  private defaultTimeout = 30000;
  private defaultRetries = 3;
  private defaultRetryDelay = 1000;
  
  // Allowed URL schemes for SSRF protection
  private readonly allowedSchemes = ['https:', 'http:'];
  
  // Blocked hosts/private IP ranges for SSRF protection
  private readonly blockedHosts = [
    'localhost',
    '127.0.0.1',
    '::1',
    '0.0.0.0',
    '169.254.169.254', // AWS metadata
    'metadata.google.internal', // GCP metadata
  ];
  
  private isUrlAllowed(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Check scheme - only allow http and https
      if (!this.allowedSchemes.includes(parsedUrl.protocol)) {
        logger.warn('Blocked URL with disallowed scheme', { scheme: parsedUrl.protocol, url });
        return false;
      }
      
      // Check for blocked hosts
      const hostname = parsedUrl.hostname.toLowerCase();
      if (this.blockedHosts.includes(hostname)) {
        logger.warn('Blocked URL with disallowed host', { host: hostname, url });
        return false;
      }
      
      // Check for private IP ranges
      const ip = parsedUrl.hostname;
      if (this.isPrivateIP(ip)) {
        logger.warn('Blocked URL with private IP', { ip, url });
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  private isPrivateIP(hostname: string): boolean {
    // Check if it's a valid IP and falls within private ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    
    if (match) {
      const octet1 = parseInt(match[1], 10);
      const octet2 = parseInt(match[2], 10);
      
      // 10.0.0.0/8
      if (octet1 === 10) return true;
      // 172.16.0.0/12
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
      // 192.168.0.0/16
      if (octet1 === 192 && octet2 === 168) return true;
      // 127.0.0.0/8 (loopback)
      if (octet1 === 127) return true;
    }
    
    return false;
  }
  
  async fetch(url: string, options: FetchOptions = {}): Promise<FetchResponse> {
    // Validate URL scheme before making request
    if (!this.isUrlAllowed(url)) {
      throw new Error(`URL scheme or host is not allowed: ${url}`);
    }
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        logger.debug('HTTP fetch', { url, attempt: attempt + 1 });
        
        const response = await globalThis.fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          // Ensure we follow redirects but don't allow redirect to file:// or other dangerous protocols
          redirect: 'follow'
        });
        
        clearTimeout(timeoutId);
        
        const content = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        
        return {
          content,
          headers,
          status: response.status,
          url: response.url
        };
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new TimeoutError(url, timeout);
        }
        
        logger.warn('HTTP fetch failed', { url, attempt: attempt + 1, error: lastError.message });
        
        if (attempt < retries - 1) {
          await this.delay(retryDelay * (attempt + 1));
        }
      }
    }
    
    throw lastError ?? new Error('Fetch failed');
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const fetcherService = new FetcherService();
