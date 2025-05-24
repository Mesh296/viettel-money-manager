import axios from 'axios';
import { API_URL } from './config';

// Thiết lập interceptor để thêm token vào mọi request
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Lấy tất cả danh mục
export const getAllCategories = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/categories/all`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('API error in getAllCategories:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải danh mục' };
  }
};

// Lấy danh mục theo ID
export const getCategoryById = async (categoryId) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/categories/${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('API error in getCategoryById:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải danh mục' };
  }
}; 