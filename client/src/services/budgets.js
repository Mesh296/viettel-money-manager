import axios from 'axios';
import { API_URL } from './config';

// Debug helper
const logApiOperation = (operation, requestData = null, responseData = null, error = null) => {
  console.group(`Budget API: ${operation}`);
  if (requestData) console.log('Request:', requestData);
  if (responseData) console.log('Response:', responseData);
  if (error) console.error('Error:', error.response?.data || error.message || error);
  console.groupEnd();
};

// Helper to format month as expected by backend
const formatMonth = (monthNum, year = new Date().getFullYear()) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  // Convert to 0-based index
  const monthIndex = Number(monthNum) - 1;
  // Format as "May 2023"
  return `${months[monthIndex]} ${year}`;
};

// Create a new monthly budget
export const createBudget = async (amount, month, year) => {
  // Backend expects { month, budget }
  const requestData = {
    month: formatMonth(month, year), // Format month as "Month Year"
    budget: Number(amount) // Budget should be a number
  };
  
  logApiOperation('Create Budget', requestData);
  
  try {
    const response = await axios.post(`${API_URL}/budgets/create`, requestData);
    logApiOperation('Create Budget Success', requestData, response.data);
    return response.data;
  } catch (error) {
    logApiOperation('Create Budget Error', requestData, null, error);
    throw error;
  }
};

// Get user's current budget
export const getCurrentBudget = async () => {
  // Lấy tháng hiện tại
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const formattedMonth = formatMonth(currentMonth, currentYear);
  
  logApiOperation('Get Current Budget', { currentMonth: formattedMonth });
  
  try {
    const response = await axios.get(`${API_URL}/budgets/current`);
    logApiOperation('Get Current Budget Success', { currentMonth: formattedMonth }, response.data);
    
    // Nếu API trả về một mảng, lọc ra ngân sách của tháng hiện tại
    if (Array.isArray(response.data) && response.data.length > 0) {
      const currentMonthBudget = response.data.find(budget => budget.month === formattedMonth);
      
      if (currentMonthBudget) {
        console.log('Found current month budget:', currentMonthBudget);
        return currentMonthBudget;
      } else {
        console.log('Current month budget not found in response:', response.data);
        // Có thể gọi getBudgetByMonth để lấy ngân sách của tháng hiện tại
        return getBudgetByMonth(currentMonth, currentYear);
      }
    }
    
    return response.data;
  } catch (error) {
    logApiOperation('Get Current Budget Error', { currentMonth: formattedMonth }, null, error);
    throw error;
  }
};

// Get user's budget by month
export const getBudgetByMonth = async (month, year) => {
  const formattedMonth = formatMonth(month, year);
  logApiOperation('Get Budget By Month', { month: formattedMonth });
  
  try {
    const response = await axios.get(`${API_URL}/budgets/by-month`, {
      params: { month: formattedMonth }
    });
    logApiOperation('Get Budget By Month Success', { month: formattedMonth }, response.data);
    
    // Trả về dữ liệu như nhận được, không cần xử lý thêm
    // Component sẽ xử lý trường hợp null/undefined
    return response.data;
  } catch (error) {
    logApiOperation('Get Budget By Month Error', { month: formattedMonth }, null, error);
    // Nếu lỗi là 404 (không tìm thấy), trả về null thay vì throw lỗi
    if (error.response && error.response.status === 404) {
      console.log('No budget found for month', formattedMonth);
      return null;
    }
    throw error;
  }
};

// Update budget for specific month
export const updateBudgetForMonth = async (amount, month, year) => {
  // Backend expects { month, budget }
  const requestData = {
    month: formatMonth(month, year), // Format month as "Month Year"
    budget: Number(amount) // Budget should be a number
  };
  
  logApiOperation('Update Budget For Month', requestData);
  
  try {
    const response = await axios.put(`${API_URL}/budgets/update`, requestData);
    logApiOperation('Update Budget For Month Success', requestData, response.data);
    return response.data;
  } catch (error) {
    logApiOperation('Update Budget For Month Error', requestData, null, error);
    throw error;
  }
};

// Set category budget limit
export const setCategoryBudget = async (categoryId, amount, month = new Date().getMonth() + 1, year = new Date().getFullYear()) => {
  // Backend expects { categoryId, budget_limit, month }
  const requestData = {
    categoryId: String(categoryId),
    budget_limit: Number(amount),
    month: formatMonth(month, year) // Format month as "Month Year"
  };
  
  logApiOperation('Set Category Budget', requestData);
  
  try {
    const response = await axios.post(`${API_URL}/users-categories/create`, requestData);
    logApiOperation('Set Category Budget Success', requestData, response.data);
    return response.data;
  } catch (error) {
    logApiOperation('Set Category Budget Error', requestData, null, error);
    throw error;
  }
};

// Get user's category budget limits
export const getCategoryBudgets = async () => {
  // Lấy tháng hiện tại
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const formattedMonth = formatMonth(currentMonth, currentYear);
  
  logApiOperation('Get Category Budgets', { currentMonth: formattedMonth });
  
  try {
    const response = await axios.get(`${API_URL}/users-categories/current`); 
    logApiOperation('Get Category Budgets Success', { currentMonth: formattedMonth }, response.data);
    
    // Nếu API trả về một mảng, lọc ra ngân sách danh mục của tháng hiện tại
    if (Array.isArray(response.data) && response.data.length > 0) {
      const currentMonthBudgets = response.data.filter(budget => budget.month === formattedMonth);
      
      if (currentMonthBudgets.length > 0) {
        console.log('Found current month category budgets:', currentMonthBudgets);
        return currentMonthBudgets;
      } else {
        console.log('Current month category budgets not found in response');
        // Có thể gọi getCategoryBudgetsByMonth để lấy ngân sách danh mục của tháng hiện tại
        return getCategoryBudgetsByMonth(currentMonth, currentYear);
      }
    }
    
    return response.data;
  } catch (error) {
    logApiOperation('Get Category Budgets Error', { currentMonth: formattedMonth }, null, error);
    throw error;
  }
};

// Get user's category budgets by month
export const getCategoryBudgetsByMonth = async (month, year) => {
  const formattedMonth = formatMonth(month, year);
  logApiOperation('Get Category Budgets By Month', { month: formattedMonth });
  
  try {
    const response = await axios.get(`${API_URL}/users-categories/by-month`, {
      params: { month: formattedMonth }
    });
    logApiOperation('Get Category Budgets By Month Success', { month: formattedMonth }, response.data);
    
    // Trả về dữ liệu như nhận được
    return response.data;
  } catch (error) {
    logApiOperation('Get Category Budgets By Month Error', { month: formattedMonth }, null, error);
    // Nếu lỗi là 404 (không tìm thấy), trả về mảng rỗng thay vì throw lỗi
    if (error.response && error.response.status === 404) {
      console.log('No category budgets found for month', formattedMonth);
      return [];
    }
    throw error;
  }
};

// Update category budget limit - id is the UserCategory id, not the categoryId
export const updateCategoryBudget = async (id, amount, month = new Date().getMonth() + 1, year = new Date().getFullYear()) => {
  // Backend expects { budget_limit, month }
  const requestData = {
    budget_limit: Number(amount),
    month: formatMonth(month, year) // Format month as "Month Year"
  };
  
  logApiOperation('Update Category Budget', { id, ...requestData });
  
  try {
    const response = await axios.put(`${API_URL}/users-categories/update/${id}`, requestData);
    logApiOperation('Update Category Budget Success', { id, ...requestData }, response.data);
    return response.data;
  } catch (error) {
    logApiOperation('Update Category Budget Error', { id, ...requestData }, null, error);
    throw error;
  }
};

// Delete category budget (UserCategory)
export const deleteCategoryBudget = async (id) => {
  logApiOperation('Delete Category Budget', { id });
  
  try {
    const response = await axios.delete(`${API_URL}/users-categories/delete/${id}`);
    logApiOperation('Delete Category Budget Success', { id }, response.data);
    return response.data;
  } catch (error) {
    logApiOperation('Delete Category Budget Error', { id }, null, error);
    throw error;
  }
}; 