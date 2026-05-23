import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // Send the JWT cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

// Global response interceptor — propagate errors so callers can handle them
// NOTE: Do NOT do window.location.href here — it causes an infinite reload loop
// because /api/auth/me returns 401 on first load (no cookie yet).
// AuthContext's catch + PrivateRoute handle the unauthenticated state.
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;