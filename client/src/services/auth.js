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
    console.log(`Auth service: Đang gọi API login tới ${API_URL}/users/login`);
    const response = await axios.post(`${API_URL}/users/login`, { email, password });
    console.log('Auth service: Raw response:', response);
    console.log('Auth service: Response từ API login:', response.data);
    console.log('Auth service: Response structure:', JSON.stringify(response.data, null, 2));
    
    // Kiểm tra cấu trúc response có đúng không
    if (!response.data.token && !response.data.accessToken) {
      console.warn('Auth service: Response không có token!', response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Auth service: Lỗi khi gọi API login:', error);
    console.error('Auth service: Error details:', error.response?.data);
    throw error.response?.data || { message: error.message };
  }
};

export const refreshToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getUserInfo = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    console.log('getUserInfo: Token từ localStorage:', token ? 'Có' : 'Không');
    
    if (!token) {
      throw new Error('Token không tồn tại');
    }
    
    // Đảm bảo token được đính kèm trong header
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    console.log(`getUserInfo: Đang gọi API tới ${API_URL}/users/me`);
    const response = await axios.get(`${API_URL}/users/me`, config);
    console.log('getUserInfo: Response từ API:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('getUserInfo: Lỗi khi gọi API:', error.response?.data || error.message);
    throw error.response?.data || { message: error.message };
  }
}; 