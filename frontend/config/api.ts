/**
 * Centralized API configuration
 * Automatically uses the correct backend URL based on environment
 */

// Get the API base URL from environment variable or default to localhost
const getApiBaseUrl = (): string => {
  // In production (Render), VITE_API_URL environment variable is set via Vite
  // Access it through window object at runtime
  const globalApiUrl = typeof window !== 'undefined' ? (window as any).__VITE_API_URL__ : undefined;
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;

  const resolvedApiUrl = globalApiUrl || envApiUrl;
  
  if (resolvedApiUrl && resolvedApiUrl.trim()) {
    return resolvedApiUrl;
  }

  const env = (import.meta as any).env;
  if (env?.DEV) {
    return '';
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname?.endsWith('.local')
    ) {
      return '';
    }
  }
  
  // Default to deployed backend when running in production without an env override.
  return 'https://udash-backend.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  // Menu scraping endpoint (uses Vite proxy in dev, direct URL in prod)
  GET_MENU: (date: string) => {
    const path = `/grabngo-menu?date=${date}`;
    return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  },
  
  // Order endpoints (will be proxied in dev, direct in prod)
  CALCULATE_DELIVERY_FEE: `${API_BASE_URL || ''}/calculate-delivery-fee`,
  PLACE_ORDER: `${API_BASE_URL || ''}/place-order`,
  
  // Health check
  HEALTH_CHECK: `${API_BASE_URL || ''}/healthz`,
};

export default API_ENDPOINTS;
