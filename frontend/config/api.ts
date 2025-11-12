/**
 * Centralized API configuration
 * Automatically uses the correct backend URL based on environment
 */

// Get the API base URL from environment variable or default to localhost
const getApiBaseUrl = (): string | undefined => {
  // In production (Render), VITE_API_URL environment variable is set via Vite
  // Access it through window object at runtime
  const apiUrl = (window as any).__VITE_API_URL__ || 
                 (import.meta as any).env?.VITE_API_URL;
  
  if (apiUrl && apiUrl.trim()) {
    return apiUrl;
  }
  
  // In development mode, return undefined to use relative paths (Vite proxy handles routing)
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return undefined;
  }
  
  // In production without VITE_API_URL set, fall back to the known deployed backend URL
  // NOTE: It's still best practice to set VITE_API_URL in your deployment.
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
