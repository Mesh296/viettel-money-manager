import axios from 'axios';
import { API_URL } from './config';
import { getAuthToken } from '../utils/auth';

// Lấy tất cả danh mục
export const getAllCategories = async () => {
  try {
    // Get the authentication token
    const token = getAuthToken();
    
    if (!token) {
      console.error('No authentication token found');
      throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
    }
    
    console.log('Fetching categories from API endpoint:', `${API_URL}/categories/all`);
    
    // Make the API request with authorization header
    const response = await axios.get(`${API_URL}/categories/all`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Validate response
    if (!response || !response.data) {
      console.error('Invalid API response:', response);
      throw new Error('Phản hồi API không hợp lệ');
    }
    
    console.log('Categories API response:', response.data);
    
    // Ensure we always return an array
    if (!Array.isArray(response.data)) {
      console.warn('API did not return an array of categories, converting to array');
      return response.data ? [response.data] : [];
    }
    
    return response.data;
  } catch (error) {
    console.error('API error in getAllCategories:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    }
    
    // Return empty array instead of throwing error to prevent UI breaking
    return [];
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