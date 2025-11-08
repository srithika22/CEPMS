// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Remove trailing slashes for consistency
export const API_URL = API_BASE_URL.replace(/\/+$/, '');
export const SOCKET_BASE_URL = SOCKET_URL.replace(/\/+$/, '');

// Export for backward compatibility
export default API_URL;