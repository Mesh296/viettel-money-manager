import axios from 'axios';
import { API_URL } from './config';
import { getSummaryStatistics, getCategoryExpenses } from './statistics';
import { generateAlerts } from './alerts';
import { getCurrentBudget, getCategoryBudgets } from './budgets';

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
    

    
    const response = await axios.post(`${API_URL}/transactions/create`, formattedData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Kiểm tra cảnh báo sau khi tạo giao dịch mới
    if (formattedData.type === 'expense') {
      await checkAlertsAfterTransaction();
    }

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

    if (!transactionId) {
      console.error('No transaction ID provided to getTransactionById');
      throw new Error('ID giao dịch không hợp lệ');
    }
    
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token found');
      throw new Error('Bạn cần đăng nhập lại');
    }
    
    const response = await axios.get(`${API_URL}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    

    
    if (response && response.data) {
      return response.data;
    } else {
      console.error('Invalid response structure from server:', response);
      throw new Error('Dữ liệu giao dịch không hợp lệ');
    }
  } catch (error) {
    console.error('API error in getTransactionById:', error.response || error);
    
    // Xử lý lỗi chi tiết hơn
    if (error.response) {
      // Server trả về lỗi có status code
      if (error.response.status === 404) {
        throw { message: 'Không tìm thấy giao dịch này' };
      } else if (error.response.status === 403) {
        throw { message: 'Bạn không có quyền xem giao dịch này' };
      } else if (error.response.data && error.response.data.message) {
        throw error.response.data;
      }
    }
    
    throw { message: error.message || 'Có lỗi xảy ra khi tải giao dịch' };
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
    
    if (!updateData.categoryId) {
      throw new Error('ID danh mục không được để trống');
    }
    
    // Đảm bảo dữ liệu đúng format mà API yêu cầu
    const formattedData = {
      categoryId: updateData.categoryId, // Phải là UUID, không phải tên danh mục
      type: updateData.type,
      amount: parseFloat(updateData.amount),
      date: updateData.date,
      note: updateData.note || ""
    };
    

    
    // Kiểm tra categoryId có phải là UUID không
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(formattedData.categoryId)) {
      console.error('Invalid categoryId format, expected UUID but got:', formattedData.categoryId);
      throw new Error('ID danh mục không hợp lệ');
    }
    
    const response = await axios.put(`${API_URL}/transactions/update/${transactionId}`, formattedData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Kiểm tra cảnh báo sau khi cập nhật giao dịch
    if (formattedData.type === 'expense') {
      await checkAlertsAfterTransaction();
    }

    console.log('Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API error in updateTransaction:', error.response || error);
    throw error.response?.data || { message: error.message || 'Có lỗi xảy ra khi cập nhật giao dịch' };
  }
};

/**
 * Kiểm tra và tạo cảnh báo sau khi thêm/cập nhật giao dịch
 */
export const checkAlertsAfterTransaction = async () => {
  try {
    // Lấy tháng và năm hiện tại
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() trả về 0-11
    const currentYear = currentDate.getFullYear();
    
    console.log(`DEBUG - Checking alerts for month ${currentMonth}/${currentYear}`);
    
    // Lấy thống kê mới nhất
    const statistics = await getSummaryStatistics(currentMonth, currentYear);
    console.log('DEBUG - Retrieved statistics:', statistics);
    
    // Lấy ngân sách tháng hiện tại từ API
    const budget = await getCurrentBudget();
    console.log('DEBUG - Retrieved monthly budget:', budget);
    
    // Lấy ngân sách theo danh mục từ API
    const categoryBudgets = await getCategoryBudgets();
    console.log('DEBUG - Retrieved category budgets:', categoryBudgets);
    
    // Lấy chi tiêu theo danh mục từ API
    const categoryExpenses = await getCategoryExpenses(currentMonth, currentYear);
    console.log('DEBUG - Retrieved category expenses:', categoryExpenses);
    
    // Make sure our data formats are correct
    if (!Array.isArray(categoryBudgets)) {
      console.error('DEBUG - categoryBudgets is not an array!', categoryBudgets);
      return [];
    }
    
    if (!Array.isArray(categoryExpenses)) {
      console.error('DEBUG - categoryExpenses is not an array!', categoryExpenses);
      return [];
    }
    
    // Log the structure of the first items if they exist
    if (categoryBudgets.length > 0) {
      console.log('DEBUG - First category budget structure:', JSON.stringify(categoryBudgets[0]));
    }
    
    if (categoryExpenses.length > 0) {
      console.log('DEBUG - First category expense structure:', JSON.stringify(categoryExpenses[0]));
    }
    
    // Make sure categories have the expected properties
    const processedCategoryBudgets = categoryBudgets.map(budget => {
      // Ensure categoryId is a string
      if (budget.categoryId) {
        budget.categoryId = String(budget.categoryId).trim();
      }
      
      // Make sure budget_limit is accessible
      if (!budget.budget_limit && budget.amount) {
        budget.budget_limit = budget.amount;
      }
      
      return budget;
    });
    
    // Make sure expenses have the expected properties 
    const processedCategoryExpenses = categoryExpenses.map(expense => {
      // Ensure categoryId is a string
      if (expense.categoryId) {
        expense.categoryId = String(expense.categoryId).trim();
      }
      
      // Ensure category property exists with name
      if (!expense.category) {
        expense.category = { name: expense.categoryName || expense.name || 'Không xác định' };
      }
      
      // Make sure amount is accessible
      if (!expense.amount && expense.total) {
        expense.amount = expense.total;
      }
      
      return expense;
    });
    
    console.log('DEBUG - Alert check data after processing:');
    console.log('statistics:', statistics);
    console.log('budget:', budget);
    console.log('processedCategoryBudgets:', processedCategoryBudgets);
    console.log('processedCategoryExpenses:', processedCategoryExpenses);
    
    // Tạo cảnh báo dựa trên dữ liệu thực tế
    const alerts = await generateAlerts(statistics, budget, processedCategoryBudgets, processedCategoryExpenses);
    
    // Hiển thị thông báo cho người dùng
    if (alerts && alerts.length > 0) {
      console.log('Cảnh báo được tạo:', alerts);
    }
    
    return alerts;
  } catch (error) {
    console.error('Error checking alerts after transaction:', error);
    return [];
  }
}; 