import axios from 'axios';
import { getAuthToken, getRefreshToken, setAuthToken, clearAuthToken } from './auth';
import { refreshToken as refreshTokenApi } from '../services/auth';

const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      console.log(`Axios interceptor: Sending request to ${config.url}`);
      if (token) {
        console.log('Axios interceptor: Adding token to request');
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('Axios interceptor: No token available');
      }
      return config;
    },
    (error) => {
      console.error('Axios interceptor: Request error', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If the error is due to an expired token (401) and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshTokenValue = getRefreshToken();
          
          if (!refreshTokenValue) {
            // No refresh token available, logout user
            clearAuthToken();
            window.location.href = '/login';
            return Promise.reject(error);
          }
          
          // Try to refresh the token
          const { token, refreshToken: newRefreshToken } = await refreshTokenApi(refreshTokenValue);
          
          // Update tokens
          setAuthToken(token, newRefreshToken);
          
          // Update header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh token failed, logout user
          clearAuthToken();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors; 