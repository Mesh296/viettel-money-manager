import axios from 'axios';
import { API_URL } from './config';

// Thiết lập interceptor để thêm token vào mọi request
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Lấy thống kê tổng quan (tổng thu, tổng chi, số dư)
export const getSummaryStatistics = async (month = null, year = null) => {
  try {
    const token = getAuthToken();
    
    // Tạo query params
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    const response = await axios.get(`${API_URL}/statistics/summary`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('API error in getSummaryStatistics:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải thống kê tổng quan' };
  }
};

// Lấy dữ liệu chi tiêu theo danh mục
export const getCategorySpending = async (month = null, year = null) => {
  try {
    const token = getAuthToken();
    
    // Tạo query params
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    const response = await axios.get(`${API_URL}/statistics/category-spending`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Log để debug
    console.log('API Response in getCategorySpending:', response);
    
    // Kiểm tra cấu trúc response
    if (response.data && typeof response.data === 'object') {
      // Nếu là object và có thuộc tính data, trả về response.data.data
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Nếu response.data là array, trả về luôn
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Trường hợp khác, trả về mảng rỗng
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error('API error in getCategorySpending:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải thống kê chi tiêu theo danh mục' };
  }
};

// Lấy dữ liệu so sánh thu nhập và chi tiêu theo thời gian
export const getIncomeExpenseComparison = async (period = 'month', count = 6) => {
  try {
    const token = getAuthToken();
    
    const params = {
      period,
      count
    };
    
    const response = await axios.get(`${API_URL}/statistics/income-expense-comparison`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('API error in getIncomeExpenseComparison:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải dữ liệu so sánh thu chi' };
  }
};

// Lấy dữ liệu thu nhập và chi tiêu theo tháng để hiển thị biểu đồ cột
export const getMonthlyData = async (year = null) => {
  try {
    const token = getAuthToken();
    
    // Sử dụng năm hiện tại nếu không được cung cấp
    const params = {};
    if (year) params.year = year;
    
    const response = await axios.get(`${API_URL}/statistics/monthly`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Log để debug
    console.log('API Response in getMonthlyData:', response);
    
    // Kiểm tra cấu trúc response
    if (response.data && typeof response.data === 'object') {
      // Nếu là object và có thuộc tính data, trả về response.data.data
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Nếu response.data là array, trả về luôn
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Trường hợp khác, trả về mảng rỗng
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error('API error in getMonthlyData:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải dữ liệu theo tháng' };
  }
}; 