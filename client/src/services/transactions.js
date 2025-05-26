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
    
    // Kiểm tra cấu trúc dữ liệu và trả về mảng giao dịch
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return response.data || [];
  } catch (error) {
    console.error('API error in getCurrentUserTransactions:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tải giao dịch' };
  }
};

// Lấy giao dịch theo ID
export const getTransactionById = async (transactionId) => {
  try {
    console.log('Getting transaction by ID:', transactionId);
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Transaction data received:', response.data);
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

// Tìm kiếm giao dịch theo các tiêu chí
export const searchTransactions = async (searchParams) => {
  try {
    const token = getAuthToken();
    
    // Chuẩn bị tham số tìm kiếm
    const params = {};
    if (searchParams.startDate) params.startDate = searchParams.startDate;
    if (searchParams.endDate) params.endDate = searchParams.endDate;
    if (searchParams.type) params.type = searchParams.type;
    if (searchParams.keyword) params.keyword = searchParams.keyword;
    if (searchParams.categoryId) params.categoryId = searchParams.categoryId;
    if (searchParams.minAmount) params.minAmount = parseFloat(searchParams.minAmount);
    if (searchParams.maxAmount) params.maxAmount = parseFloat(searchParams.maxAmount);
    if (searchParams.sortBy) params.sortBy = searchParams.sortBy;
    if (searchParams.sortOrder) params.sortOrder = searchParams.sortOrder;
    
    console.log('Search params:', params);
    
    const response = await axios.get(`${API_URL}/transactions/search`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Kiểm tra cấu trúc dữ liệu và trả về mảng giao dịch
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return response.data || [];
  } catch (error) {
    console.error('API error in searchTransactions:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tìm kiếm giao dịch' };
  }
};

// Cập nhật giao dịch
export const updateTransaction = async (transactionId, updateData) => {
  try {
    const token = getAuthToken();
    
    // Đảm bảo dữ liệu đúng format mà API yêu cầu
    const formattedData = {
      categoryId: updateData.categoryId,
      type: updateData.type,
      amount: parseFloat(updateData.amount),
      date: updateData.date,
      note: updateData.note || ""
    };
    
    console.log('Updating transaction ID:', transactionId);
    console.log('Update data for API:', formattedData);
    
    const response = await axios.put(`${API_URL}/transactions/update/${transactionId}`, formattedData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API error in updateTransaction:', error.response || error);
    throw error.response?.data || { message: 'Có lỗi xảy ra khi cập nhật giao dịch' };
  }
}; 