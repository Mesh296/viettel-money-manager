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
  logApiOperation('Get Current Budget');
  
  try {
    const response = await axios.get(`${API_URL}/budgets/current`);
    logApiOperation('Get Current Budget Success', null, response.data);
    return response.data;
  } catch (error) {
    logApiOperation('Get Current Budget Error', null, null, error);
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
  logApiOperation('Get Category Budgets');
  
  try {
    const response = await axios.get(`${API_URL}/users-categories/current`); 
    logApiOperation('Get Category Budgets Success', null, response.data);
    return response.data;
  } catch (error) {
    logApiOperation('Get Category Budgets Error', null, null, error);
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