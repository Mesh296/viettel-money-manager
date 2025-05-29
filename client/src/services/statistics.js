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

// Lấy chi tiêu theo từng danh mục
export const getCategoryExpenses = async (month = null, year = null) => {
  try {
    const token = getAuthToken();
    
    // Tạo query params
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    console.log('DEBUG - Fetching category expenses with params:', params);
    
    const response = await axios.get(`${API_URL}/statistics/category-spending`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Log để debug
    console.log('DEBUG - API Response in getCategoryExpenses:', response.data);
    
    // Kiểm tra cấu trúc response
    if (!response.data) {
      console.log('DEBUG - No data returned from API');
      return [];
    }
    
    let categoryExpenses = [];
    
    // Handle new API structure with 'categories' array
    if (response.data.categories && Array.isArray(response.data.categories)) {
      console.log('DEBUG - Found categories array in response:', response.data.categories.length);
      categoryExpenses = response.data.categories;
    } 
    // Handle older API structure
    else if (Array.isArray(response.data)) {
      console.log('DEBUG - Response.data is an array');
      categoryExpenses = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      console.log('DEBUG - Response.data.data is an array');
      categoryExpenses = response.data.data;
    } else {
      console.log('DEBUG - Unexpected response structure:', response.data);
      return [];
    }
    
    // Chuyển đổi định dạng dữ liệu để phù hợp với yêu cầu của hàm generateAlerts
    const formattedExpenses = categoryExpenses.map(item => {
      console.log('DEBUG - Formatting category expense item:', item);
      
      // Xác định các trường cần thiết dựa vào cấu trúc API
      const categoryId = item.categoryId || item.category_id || '';
      const amount = Number(item.total || item.amount || 0);
      const categoryName = item.categoryName || (item.category && item.category.name) || 'Không xác định';
      
      return {
        categoryId,
        amount,
        category: {
          name: categoryName
        }
      };
    });
    
    console.log('DEBUG - Formatted category expenses:', formattedExpenses);
    return formattedExpenses;
  } catch (error) {
    console.error('API error in getCategoryExpenses:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải chi tiêu theo danh mục' };
  }
}; 