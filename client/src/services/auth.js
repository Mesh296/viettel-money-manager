import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, { email, password });

    // Kiểm tra cấu trúc response có đúng không
    if (!response.data.token && !response.data.accessToken) {
      console.warn('Auth service: Response không có token!', response.data);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

export const refreshToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${API_URL}/users/refresh-token`, { refreshToken });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getUserInfo = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token không tồn tại');
    }
    
    // Đảm bảo token được đính kèm trong header
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    const response = await axios.get(`${API_URL}/users/me`, config);
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
}; 