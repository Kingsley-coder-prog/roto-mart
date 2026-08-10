// Base URL for the backend API.
// Dev: unset → '' → calls are relative (/api/...) and Vite proxies them to :4000.
// Prod: set VITE_API_BASE_URL to the deployed backend origin (e.g. https://rotomart-api.onrender.com).
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
