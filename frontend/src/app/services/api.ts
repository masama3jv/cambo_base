export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
export const API_UPLOADS_URL = API_BASE_URL.replace('/api', '/uploads');
