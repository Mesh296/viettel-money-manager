import axios from 'axios';
import { API_URL } from './config';

// Thiết lập interceptor để thêm token vào mọi request
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Tạo giao dịch mới
export const createTransaction = async (transactionData) => {
  try {
    const token = getAuthToken();
    
    // Đảm bảo dữ liệu đúng format mà API yêu cầu
    const formattedData = {
      categoryId: transactionData.categoryId,
      type: transactionData.type,
      amount: parseFloat(transactionData.amount),
      date: transactionData.date,
      note: transactionData.note || ""
    };
    
    console.log('Formatted transaction data for API:', formattedData);
    
    const response = await axios.post(`${API_URL}/transactions/create`, formattedData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('API error in createTransaction:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tạo giao dịch' };
  }
};

// Lấy tất cả giao dịch của người dùng hiện tại
export const getCurrentUserTransactions = async (options = {}) => {
  try {
    const token = getAuthToken();
    
    // Tạo query params từ options
    const params = {};
    if (options.limit) params.limit = options.limit;
    if (options.offset) params.offset = options.offset;
    if (options.sortBy) params.sortBy = options.sortBy;
    if (options.sortOrder) params.sortOrder = options.sortOrder;
    
    const response = await axios.get(`${API_URL}/transactions/current`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Log dữ liệu giao dịch để debug
    console.log('Transaction data from API:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('API error in getCurrentUserTransactions:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải giao dịch' };
  }
};

// Lấy giao dịch theo ID
export const getTransactionById = async (transactionId) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('API error in getTransactionById:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải giao dịch' };
  }
};

// Xóa giao dịch
export const deleteTransaction = async (transactionId) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/transactions/delete/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('API error in deleteTransaction:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi xóa giao dịch' };
  }
}; 