// apps/web/src/lib/axios.ts
import axios from 'axios';
import { useUserStore } from '@/store/userStore';
import { exchangeToken } from '@/actions/auth';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export default axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const axiosAuth = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

axiosAuth.interceptors.request.use(
  (config) => {
    // Get the token from our Zustand store
    const token = useUserStore.getState().user?.token; // Assuming token is nested in user state

    if (token) {
      // If the token exists, add it to the headers
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Continue with the request
  },
  (error) => {
    // If there's an error setting up the request, reject it
    return Promise.reject(error);
  }
);

axiosAuth.interceptors.response.use(
  // If the response is successful (e.g., status 200), just pass it through.
  (response) => response,

  // If the response is an error:
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is a 401 and we haven't already retried this request.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark that we are retrying

      try {
        // Attempt to get a new token by calling our server action
        const tokenResponse = await exchangeToken();

        if (!tokenResponse) {
          useUserStore.getState().setUser(null); // Clear the user from the store
          return Promise.reject(new Error('User not authenticated'));
        }

        const { token: newToken } = tokenResponse;

        // Update the token in our Zustand store
        useUserStore
          .getState()
          .setUser({ ...useUserStore.getState().user, token: newToken });

        // Update the header on the original request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        // Retry the original request
        return axiosAuth(originalRequest);
      } catch (refreshError) {
        // If the token exchange fails (e.g., Supabase session is also expired),
        // then we truly are logged out.
        useUserStore.getState().setUser(null); // Clear the user from the store
        // Optionally redirect to login page
        // window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // For any other error, just reject it.
    return Promise.reject(error);
  }
);
