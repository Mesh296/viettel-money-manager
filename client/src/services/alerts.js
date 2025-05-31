import axios from 'axios';
import { API_URL } from './config';
import { toast } from 'react-toastify';

/**
 * Get all alerts for the current user
 */
export const getUserAlerts = async () => {
  try {
    console.log('DEBUG - Fetching alerts from API', `${API_URL}/alerts/current`);
    const response = await axios.get(`${API_URL}/alerts/current`);
    
    // Check if response has data property
    const alertsData = response.data || [];
    
    // Make sure we always return an array even if API returns null or non-array
    if (!Array.isArray(alertsData)) {
      console.warn('API did not return an array for alerts, defaulting to empty array');
      return [];
    }
    
    console.log('DEBUG - Alerts fetched successfully:', alertsData);
    return alertsData;
  } catch (error) {
    console.error('Error fetching user alerts:', error);
    // Return empty array instead of throwing error to prevent UI breaking
    return [];
  }
};

/**
 * Create a new alert
 * @param {Object} alertData - Alert data to create
 * @param {boolean} showToast - Whether to show a toast notification (default: false)
 */
export const createAlert = async (alertData, showToast = false) => {
  try {
    console.log('DEBUG - Creating alert with data:', alertData);
    const response = await axios.post(`${API_URL}/alerts/create`, alertData);
    
    // Only show toast if explicitly requested (for direct alert creation, not for budget alerts)
    if (showToast && alertData.message) {
      toast.info(`⚠️ ${alertData.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
    
    // Dispatch an event to notify components that alerts have been updated
    window.dispatchEvent(new Event('alertsUpdated'));
    return response.data;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};

/**
 * Delete an alert by ID
 * @param {string|number} alertId - The ID of the alert to delete
 */
export const deleteAlert = async (alertId) => {
  try {
    console.log('DEBUG - Deleting alert with ID:', alertId);
    const response = await axios.delete(`${API_URL}/alerts/delete/${alertId}`);
    // Dispatch an event to notify components that alerts have been updated
    window.dispatchEvent(new Event('alertsUpdated'));
    return response.data;
  } catch (error) {
    console.error('Error deleting alert:', error);
    throw error;
  }
};

/**
 * Delete all alerts for the current user
 * Note: This is implemented as a client-side workaround since the server doesn't have a delete-all endpoint
 */
export const deleteAllAlerts = async () => {
  try {
    console.log('DEBUG - Deleting all alerts');
    
    // Get all user alerts first
    const alerts = await getUserAlerts();
    
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return { message: 'No alerts to delete' };
    }
    
    // Delete each alert one by one
    const deletePromises = alerts.map(alert => deleteAlert(alert.alertId));
    await Promise.all(deletePromises);
    
    // Dispatch an event to notify components that alerts have been updated
    window.dispatchEvent(new Event('alertsUpdated'));
    
    return { message: `Successfully deleted ${alerts.length} alerts` };
  } catch (error) {
    console.error('Error deleting all alerts:', error);
    throw error;
  }
};

/**
 * Check if monthly expense is approaching budget limit (90% threshold)
 * @param {number} totalExpense - Total expense amount
 * @param {number} budgetLimit - Budget limit amount
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 */
export const checkMonthlyBudgetWarning = async (totalExpense, budgetLimit, month = null, year = null) => {
  try {
    console.log('DEBUG - INSIDE checkMonthlyBudgetWarning function');
    console.log('totalExpense:', totalExpense, 'type:', typeof totalExpense);
    console.log('budgetLimit:', budgetLimit, 'type:', typeof budgetLimit);

    // Convert values to numbers if they're not already and ensure they're valid
    const expenseAmount = Number(totalExpense) || 0;
    const budgetAmount = Number(budgetLimit) || 0;
    
    // Get current month/year for comparison
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // Use provided month/year or default to current
    const targetMonth = month || currentMonth;
    const targetYear = year || currentYear;
    
    const isCurrentMonth = (targetMonth === currentMonth && targetYear === currentYear);
    
    // Calculate percentage of budget used
    const percentageUsed = budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
    console.log(`DEBUG - Monthly budget percentage used: ${percentageUsed.toFixed(1)}%`);
    
    // Warning threshold - 90% of budget used but not exceeded yet
    if (budgetAmount > 0 && percentageUsed >= 90 && expenseAmount <= budgetAmount) {
      console.log(`DEBUG - MONTHLY BUDGET WARNING SHOULD TRIGGER: ${expenseAmount} is ${percentageUsed.toFixed(1)}% of ${budgetAmount}`);
      
      // Make sure to format with commas as thousands separators
      const formattedBudget = budgetAmount.toLocaleString('vi-VN');
      const percentFormatted = percentageUsed.toFixed(0);
      
      // Create different message based on whether it's the current month
      const monthText = isCurrentMonth 
        ? "tháng này" 
        : `tháng ${targetMonth}/${targetYear}`;
      
      const message = `Chi tiêu ${monthText} đã đạt ${percentFormatted}% ngân sách ${formattedBudget}₫`;
      
      // Check if similar alert already exists before creating a new one
      const alertExists = await checkAlertExists(message);
      if (alertExists) {
        console.log('DEBUG - Similar monthly budget warning already exists, skipping');
        return null;
      }
      
      // Create the alert
      const alert = {
        message,
        type: 'total_warning', // New type for approaching limit
        triggered_at: new Date().toISOString(),
        severity: 'medium',
        data: {
          spent: expenseAmount,
          budget: budgetAmount,
          percentage: Math.round(percentageUsed),
          month: targetMonth,
          year: targetYear
        }
      };

      console.log('DEBUG - Monthly budget warning created:', alert);
      
      // Show toast notification for the warning - We DO want to show this
      const toastMessage = `⚠️ ${message}`;
      toast.warning(toastMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Create the alert in the database - only send the required fields
      try {
        const alertToCreate = {
          message: alert.message,
          type: alert.type,
          triggered_at: alert.triggered_at
        };
        const result = await createAlert(alertToCreate, false); // Don't show toast again when saving to database
        console.log('DEBUG - Monthly budget warning saved to database:', result);
      } catch (err) {
        console.error('Failed to save warning alert to database:', err);
      }
      
      return alert;
    } else {
      // Log why warning wasn't created
      if (budgetAmount <= 0) {
        console.log(`DEBUG - No monthly warning: Budget amount invalid (${budgetAmount})`);
      } else if (percentageUsed < 90) {
        console.log(`DEBUG - No monthly warning: Used only ${percentageUsed.toFixed(1)}% of budget`);
      } else if (expenseAmount > budgetAmount) {
        console.log(`DEBUG - No monthly warning: Already exceeded budget, should trigger full alert instead`);
      }
      return null;
    }
  } catch (error) {
    console.error('Error checking budget warning:', error);
    return null;
  }
};

/**
 * Check if category expense is approaching category budget (90% threshold)
 * @param {number} categoryExpense - Category expense amount
 * @param {number} categoryBudget - Category budget limit
 * @param {string} categoryName - Category name
 * @param {string|number} categoryId - Category ID
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 */
export const checkCategoryBudgetWarning = async (categoryExpense, categoryBudget, categoryName, categoryId, month = null, year = null) => {
  try {
    console.log('DEBUG - INSIDE checkCategoryBudgetWarning function');
    console.log('categoryId:', categoryId);
    console.log('categoryName:', categoryName);
    console.log('categoryExpense:', categoryExpense, 'type:', typeof categoryExpense);
    console.log('categoryBudget:', categoryBudget, 'type:', typeof categoryBudget);

    // Convert values to numbers if they're not already and ensure they're valid
    const expenseAmount = Number(categoryExpense) || 0;
    const budgetAmount = Number(categoryBudget) || 0;
    
    // Get current month/year for comparison
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // Use provided month/year or default to current
    const targetMonth = month || currentMonth;
    const targetYear = year || currentYear;
    
    const isCurrentMonth = (targetMonth === currentMonth && targetYear === currentYear);
    
    // Calculate percentage of budget used
    const percentageUsed = budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
    console.log(`DEBUG - Category ${categoryName} percentage used: ${percentageUsed.toFixed(1)}%`);
    
    // Warning threshold - 90% of budget used but not exceeded yet
    if (budgetAmount > 0 && percentageUsed >= 90 && expenseAmount <= budgetAmount) {
      console.log(`DEBUG - CATEGORY WARNING SHOULD TRIGGER for ${categoryName}: ${expenseAmount} is ${percentageUsed.toFixed(1)}% of ${budgetAmount}`);
      
      // Make sure to format with commas as thousands separators
      const formattedBudget = budgetAmount.toLocaleString('vi-VN');
      const percentFormatted = percentageUsed.toFixed(0);
      
      // Create different message based on whether it's the current month
      const monthText = isCurrentMonth 
        ? "tháng này" 
        : `tháng ${targetMonth}/${targetYear}`;
      
      const message = `Chi tiêu danh mục "${categoryName}" ${monthText} đã đạt ${percentFormatted}% ngân sách ${formattedBudget}₫`;
      
      // Check if similar alert already exists before creating a new one
      const alertExists = await checkAlertExists(message);
      if (alertExists) {
        console.log('DEBUG - Similar category budget warning already exists, skipping');
        return null;
      }
      
      // Create the alert
      const alert = {
        message,
        type: 'category_warning', // New type for approaching limit
        triggered_at: new Date().toISOString(),
        severity: 'medium',
        data: {
          categoryId, // Add categoryId to data
          category: categoryName,
          spent: expenseAmount,
          budget: budgetAmount,
          percentage: Math.round(percentageUsed),
          month: targetMonth,
          year: targetYear
        }
      };

      console.log('DEBUG - Category budget warning created:', alert);
      
      // Show toast notification for the warning - We DO want to show this
      const toastMessage = `⚠️ ${message}`;
      toast.warning(toastMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Create the alert in the database - only send the required fields
      try {
        const alertToCreate = {
          message: alert.message,
          type: alert.type,
          triggered_at: alert.triggered_at
        };
        const result = await createAlert(alertToCreate, false); // Don't show toast again when saving to database
        console.log('DEBUG - Category budget warning saved to database:', result);
      } catch (err) {
        console.error('Failed to save warning alert to database:', err);
      }
      
      return alert;
    } else {
      // Log why warning wasn't created
      if (budgetAmount <= 0) {
        console.log(`DEBUG - No category warning for "${categoryName}": Budget amount invalid (${budgetAmount})`);
      } else if (percentageUsed < 90) {
        console.log(`DEBUG - No category warning for "${categoryName}": Used only ${percentageUsed.toFixed(1)}% of budget`);
      } else if (expenseAmount > budgetAmount) {
        console.log(`DEBUG - No category warning for "${categoryName}": Already exceeded budget, should trigger full alert instead`);
      }
      return null;
    }
  } catch (error) {
    console.error('Error checking category budget warning:', error);
    return null;
  }
};

/**
 * Check if an alert with similar message already exists to avoid duplicates
 * @param {string} message - The alert message to check
 */
export const checkAlertExists = async (message) => {
  try {
    // Get existing alerts from the backend
    const existingAlerts = await getUserAlerts();
    
    // Check if any alert contains the same message
    const similarAlert = existingAlerts.find(alert => 
      alert.message === message
    );
    
    return !!similarAlert;
  } catch (error) {
    console.error('Error checking existing alerts:', error);
    return false; // Assume no similar alert exists if there's an error
  }
};

/**
 * Check if monthly expense exceeds budget
 * @param {number} totalExpense - Total expense amount
 * @param {number} budgetLimit - Budget limit amount
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 */
export const checkMonthlyBudgetAlert = async (totalExpense, budgetLimit, month = null, year = null) => {
  try {
    console.log('DEBUG - Checking monthly budget alert:');
    console.log('totalExpense:', totalExpense, 'type:', typeof totalExpense);
    console.log('budgetLimit:', budgetLimit, 'type:', typeof budgetLimit);
    console.log('month:', month, 'year:', year);

    // Convert values to numbers if they're not already and ensure they're valid
    const expenseAmount = Number(totalExpense) || 0;
    const budgetAmount = Number(budgetLimit) || 0;
    
    // Get current month/year for comparison
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // Use provided month/year or default to current
    const targetMonth = month || currentMonth;
    const targetYear = year || currentYear;
    
    const isCurrentMonth = (targetMonth === currentMonth && targetYear === currentYear);
    
    // STRICT VALIDATION: If budget is set and spending ACTUALLY exceeds it
    // Only create alert if expense is TRULY greater than budget
    if (budgetAmount > 0 && expenseAmount > budgetAmount) {
      console.log(`DEBUG - MONTHLY BUDGET ALERT SHOULD TRIGGER: ${expenseAmount} > ${budgetAmount}`);
      
      // Make sure to format with commas as thousands separators
      const formattedBudget = budgetAmount.toLocaleString('vi-VN');
      
      // Create different message based on whether it's the current month
      const monthText = isCurrentMonth 
        ? "tháng này" 
        : `tháng ${targetMonth}/${targetYear}`;
      
      const message = `Chi tiêu ${monthText} đã vượt ngân sách ${formattedBudget}₫`;
      
      // Check if similar alert already exists before creating a new one
      const alertExists = await checkAlertExists(message);
      if (alertExists) {
        console.log('DEBUG - Similar monthly budget alert already exists, skipping');
        return null;
      }
      
      const alert = {
        message,
        type: 'total_limit', // This is one of the server's accepted types
        triggered_at: new Date().toISOString(), // Use ISO format for dates
        // Client-side only fields below (not sent to server)
        severity: 'high',
        data: {
          spent: expenseAmount,
          budget: budgetAmount,
          percentage: Math.round((expenseAmount / budgetAmount) * 100),
          month: targetMonth,
          year: targetYear
        }
      };

      console.log('DEBUG - Monthly budget alert created:', alert);
      
      // NOTE: Toast notification is now handled by the transaction creation code
      // No need to show toast here to avoid duplication
      
      // Create the alert in the database - only send the required fields
      try {
        const alertToCreate = {
          message: alert.message,
          type: alert.type,
          triggered_at: alert.triggered_at
        };
        await createAlert(alertToCreate, false); // Explicitly set showToast to false
      } catch (err) {
        console.error('Failed to save alert to database:', err);
      }
      
      return alert;
    }
    // Log why alert wasn't created
    if (budgetAmount <= 0) {
      console.log(`DEBUG - No monthly alert: Budget amount invalid (${budgetAmount})`);
    } else if (expenseAmount <= budgetAmount) {
      console.log(`DEBUG - No monthly alert: Expense (${expenseAmount}) <= Budget (${budgetAmount})`);
    }
    return null;
  } catch (error) {
    console.error('Error checking budget alert:', error);
    return null; // Return null instead of throwing to prevent UI breaking
  }
};

/**
 * Check if category expense exceeds category budget
 * @param {number} categoryExpense - Category expense amount
 * @param {number} categoryBudget - Category budget limit
 * @param {string} categoryName - Category name
 * @param {string|number} categoryId - Category ID
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 */
export const checkCategoryBudgetAlert = async (categoryExpense, categoryBudget, categoryName, categoryId, month = null, year = null) => {
  try {
    console.log('DEBUG - INSIDE checkCategoryBudgetAlert function');
    
    // Convert values to numbers if they're not already and ensure they're valid
    const expenseAmount = Number(categoryExpense) || 0;
    const budgetAmount = Number(categoryBudget) || 0;
    
    // Get current month/year for comparison
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // Use provided month/year or default to current
    const targetMonth = month || currentMonth;
    const targetYear = year || currentYear;
    
    const isCurrentMonth = (targetMonth === currentMonth && targetYear === currentYear);
    
    // Calculate percentage used
    const percentageUsed = budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
    
    // STRICT VALIDATION: If category budget is set and spending ACTUALLY exceeds it
    // Only create alert if expense is TRULY greater than budget
    if (budgetAmount > 0 && expenseAmount > budgetAmount) {
      console.log(`DEBUG - CATEGORY ALERT SHOULD TRIGGER for ${categoryName}: ${expenseAmount} > ${budgetAmount}`);
      
      // Make sure to format with commas as thousands separators
      const formattedBudget = budgetAmount.toLocaleString('vi-VN');
      
      // Create different message based on whether it's the current month
      const monthText = isCurrentMonth 
        ? "tháng này" 
        : `tháng ${targetMonth}/${targetYear}`;
      
      const message = `Chi tiêu danh mục "${categoryName}" ${monthText} đã vượt ngân sách ${formattedBudget}₫`;
      
      // Check if similar alert already exists before creating a new one
      const alertExists = await checkAlertExists(message);
      if (alertExists) {
        console.log('DEBUG - Similar category budget alert already exists, skipping');
        return null;
      }
      
      const alert = {
        message,
        type: 'category_limit', // This is one of the server's accepted types
        triggered_at: new Date().toISOString(), // Use ISO format for dates
        // Client-side only fields below (not sent to server)
        severity: 'high',
        data: {
          categoryId, // Add categoryId to data
          category: categoryName,
          spent: expenseAmount,
          budget: budgetAmount,
          percentage: Math.round((expenseAmount / budgetAmount) * 100),
          month: targetMonth,
          year: targetYear
        }
      };

      console.log('DEBUG - Category budget alert created:', alert);
      
      // NOTE: Toast notification is now handled by the transaction creation code
      // No need to show toast here to avoid duplication
      
      // Create the alert in the database - only send the required fields
      try {
        const alertToCreate = {
          message: alert.message,
          type: alert.type,
          triggered_at: alert.triggered_at
        };
        const result = await createAlert(alertToCreate, false); // Explicitly set showToast to false
        console.log('DEBUG - Category budget alert saved to database:', result);
      } catch (err) {
        console.error('Failed to save alert to database:', err);
      }
      
      return alert;
    } else {
      // Log why alert wasn't created
      if (budgetAmount <= 0) {
        console.log(`DEBUG - No category alert for "${categoryName}": Budget amount invalid (${budgetAmount})`);
      } else if (expenseAmount <= budgetAmount) {
        console.log(`DEBUG - No category alert for "${categoryName}": Expense (${expenseAmount}) <= Budget (${budgetAmount})`);
      }
      return null;
    }
  } catch (error) {
    console.error('Error checking category budget alert:', error);
    return null; // Return null instead of throwing to prevent UI breaking
  }
};

/**
 * Generate all alerts based on current financial data
 * @param {Object} statistics - Statistics data with monthly expenses and income
 * @param {Object} budget - Monthly budget data
 * @param {Array} categoryBudgets - Category budget data
 * @param {Array} categoryExpenses - Category expense data
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 */
export const generateAlerts = async (statistics, budget, categoryBudgets, categoryExpenses, month = null, year = null) => {
  try {
    const alerts = [];
    
    // Get current month/year if not provided
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1; // 1-12
    const targetYear = year || currentDate.getFullYear();
    
    console.log(`Generating alerts for month: ${targetMonth}, year: ${targetYear}`);
    
    // Check total monthly budget - exceeded
    if (budget) {
      // Get the budget amount from the correct property based on API response structure
      const budgetAmount = budget.budget || budget.amount || 0;
      const totalExpense = statistics?.totalExpense || 0;
      
      // First check if budget is exceeded
      const budgetAlert = await checkMonthlyBudgetAlert(totalExpense, budgetAmount, targetMonth, targetYear);
      if (budgetAlert) alerts.push(budgetAlert);
      
      // If not exceeded, check if approaching limit (90%)
      if (!budgetAlert) {
        const budgetWarning = await checkMonthlyBudgetWarning(totalExpense, budgetAmount, targetMonth, targetYear);
        if (budgetWarning) alerts.push(budgetWarning);
      }
    }
    
    // Check if we have enough data to process category budgets
    if (!categoryBudgets || categoryBudgets.length === 0) {
      console.log('DEBUG - No category budgets to check');
    } else if (!categoryExpenses || categoryExpenses.length === 0) {
      console.log('DEBUG - No category expenses to check against budgets');
    } else {
      // Track which categories we've already processed to avoid duplicates
      const processedCategoryIds = new Set();
      
      // Create a lookup map for category expenses by categoryId for faster access
      const categoryExpensesMap = {};
      categoryExpenses.forEach(expense => {
        if (expense.categoryId) {
          const id = String(expense.categoryId).trim();
          categoryExpensesMap[id] = expense;
        }
      });
      
      // First, process all budget entries
      for (const categoryBudget of categoryBudgets) {
        // Skip invalid entries
        if (!categoryBudget.categoryId) {
          continue;
        }
        
        const budgetCategoryId = String(categoryBudget.categoryId).trim();
        
        // Skip if we've already processed this category
        if (processedCategoryIds.has(budgetCategoryId)) {
          continue;
        }
        
        // Get the budget amount
        const budgetAmount = categoryBudget.budget_limit || categoryBudget.amount || 0;
        
        // Skip categories with no budget
        if (budgetAmount <= 0) {
          continue;
        }
        
        // Get the matching expense entry directly from our map
        const categoryExpense = categoryExpensesMap[budgetCategoryId];
        
        if (categoryExpense) {
          // Get expense amount and category name
          const expenseAmount = categoryExpense.amount || categoryExpense.total || 0;
          
          // Get category name in order of preference
          let categoryName = 'Không xác định';
          if (categoryExpense.category && categoryExpense.category.name) {
            categoryName = categoryExpense.category.name;
          } else if (categoryExpense.name) {
            categoryName = categoryExpense.name;
          } else if (categoryExpense.categoryName) {
            categoryName = categoryExpense.categoryName;
          }
          
          // First check if budget is exceeded
          if (expenseAmount > 0) {
            // Check if exceeded
            if (expenseAmount > budgetAmount) {
              const catAlert = await checkCategoryBudgetAlert(
                expenseAmount, 
                budgetAmount, 
                categoryName,
                budgetCategoryId,
                targetMonth,
                targetYear
              );
              
              if (catAlert) {
                alerts.push(catAlert);
              }
            } 
            // If not exceeded, check if approaching limit (90%)
            else {
              const percentageUsed = (expenseAmount / budgetAmount) * 100;
              
              if (percentageUsed >= 90) {
                const catWarning = await checkCategoryBudgetWarning(
                  expenseAmount,
                  budgetAmount,
                  categoryName,
                  budgetCategoryId,
                  targetMonth,
                  targetYear
                );
                
                if (catWarning) {
                  alerts.push(catWarning);
                }
              }
            }
          }
          
          // Mark as processed
          processedCategoryIds.add(budgetCategoryId);
        }
      }
    }
    
    return alerts;
  } catch (error) {
    console.error('Error generating alerts:', error);
    return []; // Return empty array instead of throwing to prevent UI breaking
  }
}; 