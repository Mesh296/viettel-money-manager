// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Set auth tokens in localStorage
export const setAuthToken = (token, refreshToken) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    console.warn('setAuthToken: Token rỗng, không lưu vào localStorage');
  }
  
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    console.warn('setAuthToken: RefreshToken rỗng, không lưu vào localStorage');
  }
};

// Get JWT token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get refresh token from localStorage
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Clear both tokens from localStorage
export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Set token in axios headers
export const setAxiosAuthToken = (axios, token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}; 