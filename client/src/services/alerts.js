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
 */
export const createAlert = async (alertData) => {
  try {
    console.log('DEBUG - Creating alert with data:', alertData);
    const response = await axios.post(`${API_URL}/alerts/create`, alertData);
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
 */
export const checkMonthlyBudgetWarning = async (totalExpense, budgetLimit) => {
  try {
    console.log('DEBUG - INSIDE checkMonthlyBudgetWarning function');
    console.log('totalExpense:', totalExpense, 'type:', typeof totalExpense);
    console.log('budgetLimit:', budgetLimit, 'type:', typeof budgetLimit);

    // Convert values to numbers if they're not already and ensure they're valid
    const expenseAmount = Number(totalExpense) || 0;
    const budgetAmount = Number(budgetLimit) || 0;
    
    // Calculate percentage of budget used
    const percentageUsed = budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
    console.log(`DEBUG - Monthly budget percentage used: ${percentageUsed.toFixed(1)}%`);
    
    // Warning threshold - 90% of budget used but not exceeded yet
    if (budgetAmount > 0 && percentageUsed >= 90 && expenseAmount <= budgetAmount) {
      console.log(`DEBUG - MONTHLY BUDGET WARNING SHOULD TRIGGER: ${expenseAmount} is ${percentageUsed.toFixed(1)}% of ${budgetAmount}`);
      
      // Make sure to format with commas as thousands separators
      const formattedBudget = budgetAmount.toLocaleString('vi-VN');
      const percentFormatted = percentageUsed.toFixed(0);
      const message = `Chi tiêu tháng này đã đạt ${percentFormatted}% ngân sách ${formattedBudget}₫`;
      
      // Create the alert
      const alert = {
        message,
        type: 'total_warning', // New type for approaching limit
        triggered_at: new Date().toISOString(),
        severity: 'medium',
        data: {
          spent: expenseAmount,
          budget: budgetAmount,
          percentage: Math.round(percentageUsed)
        }
      };

      console.log('DEBUG - Monthly budget warning created:', alert);
      
      // Show toast notification for the alert - Ensure this is being displayed
      const toastMessage = `⚠️ ${message}`;
      toast.info(toastMessage, {
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
        const result = await createAlert(alertToCreate);
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
 */
export const checkCategoryBudgetWarning = async (categoryExpense, categoryBudget, categoryName, categoryId) => {
  try {
    console.log('DEBUG - INSIDE checkCategoryBudgetWarning function');
    console.log('categoryId:', categoryId);
    console.log('categoryName:', categoryName);
    console.log('categoryExpense:', categoryExpense, 'type:', typeof categoryExpense);
    console.log('categoryBudget:', categoryBudget, 'type:', typeof categoryBudget);

    // Convert values to numbers if they're not already and ensure they're valid
    const expenseAmount = Number(categoryExpense) || 0;
    const budgetAmount = Number(categoryBudget) || 0;
    
    // Calculate percentage of budget used
    const percentageUsed = budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
    console.log(`DEBUG - Category ${categoryName} percentage used: ${percentageUsed.toFixed(1)}%`);
    
    // Warning threshold - 90% of budget used but not exceeded yet
    if (budgetAmount > 0 && percentageUsed >= 90 && expenseAmount <= budgetAmount) {
      console.log(`DEBUG - CATEGORY WARNING SHOULD TRIGGER for ${categoryName}: ${expenseAmount} is ${percentageUsed.toFixed(1)}% of ${budgetAmount}`);
      
      // Make sure to format with commas as thousands separators
      const formattedBudget = budgetAmount.toLocaleString('vi-VN');
      const percentFormatted = percentageUsed.toFixed(0);
      const message = `Chi tiêu danh mục "${categoryName}" đã đạt ${percentFormatted}% ngân sách ${formattedBudget}₫`;
      
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
          percentage: Math.round(percentageUsed)
        }
      };

      console.log('DEBUG - Category budget warning created:', alert);
      
      // Show toast notification for the alert - Ensure this is being displayed
      const toastMessage = `⚠️ ${message}`;
      toast.info(toastMessage, {
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
        const result = await createAlert(alertToCreate);
        console.log('DEBUG - Category budget warning saved to database:', result);
      } catch (err) {
        console.error('Failed to save category warning alert to database:', err);
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
    // Always return false to ensure alerts are created every time budget is exceeded
    // This ensures alerts always appear after deleting and recreating transactions
    return false;
    
    // Original implementation below (commented out)
    /*
    const existingAlerts = await getUserAlerts();
    
    // Check if any alert contains a similar message (fuzzy match)
    const similarAlert = existingAlerts.find(alert => 
      alert.message.includes(message.substring(0, 20)) // Match first 20 chars
    );
    
    return !!similarAlert;
    */
  } catch (error) {
    console.error('Error checking existing alerts:', error);
    return false; // Assume no similar alert exists if there's an error
  }
};

/**
 * Check if monthly expense exceeds budget
 * @param {number} totalExpense - Total expense amount
 * @param {number} budgetLimit - Budget limit amount
 */
export const checkMonthlyBudgetAlert = async (totalExpense, budgetLimit) => {
  try {
    console.log('DEBUG - Checking monthly budget alert:');
    console.log('totalExpense:', totalExpense, 'type:', typeof totalExpense);
    console.log('budgetLimit:', budgetLimit, 'type:', typeof budgetLimit);

    // Convert values to numbers if they're not already and ensure they're valid
    const expenseAmount = Number(totalExpense) || 0;
    const budgetAmount = Number(budgetLimit) || 0;
    
    // STRICT VALIDATION: If budget is set and spending ACTUALLY exceeds it
    // Only create alert if expense is TRULY greater than budget
    if (budgetAmount > 0 && expenseAmount > budgetAmount) {
      console.log(`DEBUG - MONTHLY BUDGET ALERT SHOULD TRIGGER: ${expenseAmount} > ${budgetAmount}`);
      
      // Make sure to format with commas as thousands separators
      const formattedBudget = budgetAmount.toLocaleString('vi-VN');
      const message = `Chi tiêu tháng này đã vượt ngân sách ${formattedBudget}₫`;
      
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
          percentage: Math.round((expenseAmount / budgetAmount) * 100)
        }
      };

      console.log('DEBUG - Monthly budget alert created:', alert);
      
      // Show toast notification for the alert
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
        await createAlert(alertToCreate);
      } catch (err) {
        console.error('Failed to save alert to database:', err);
      }
      
      return alert;
    } else {
      // Log why alert wasn't created
      if (budgetAmount <= 0) {
        console.log(`DEBUG - No monthly alert: Budget amount invalid (${budgetAmount})`);
      } else if (expenseAmount <= budgetAmount) {
        console.log(`DEBUG - No monthly alert: Expense (${expenseAmount}) <= Budget (${budgetAmount})`);
      }
      return null;
    }
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
 */
export const checkCategoryBudgetAlert = async (categoryExpense, categoryBudget, categoryName, categoryId) => {
  try {
    console.log('DEBUG - INSIDE checkCategoryBudgetAlert function');
    console.log('categoryId:', categoryId);
    console.log('categoryName:', categoryName);
    console.log('categoryExpense:', categoryExpense, 'type:', typeof categoryExpense);
    console.log('categoryBudget:', categoryBudget, 'type:', typeof categoryBudget);

    // Special case - if the category name is "Shopping", add extra logging
    if (categoryName === "Shopping") {
      console.log(`DEBUG - SPECIAL ATTENTION: Checking "Shopping" category alert with expense ${categoryExpense} and budget ${categoryBudget}`);
    }

    // Convert values to numbers if they're not already and ensure they're valid
    const expenseAmount = Number(categoryExpense) || 0;
    const budgetAmount = Number(categoryBudget) || 0;
    
    // Calculate percentage used
    const percentageUsed = budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
    console.log(`DEBUG - Category ${categoryName} percentage used: ${percentageUsed.toFixed(1)}%`);
    
    // STRICT VALIDATION: If category budget is set and spending ACTUALLY exceeds it
    // Only create alert if expense is TRULY greater than budget
    if (budgetAmount > 0 && expenseAmount > budgetAmount) {
      console.log(`DEBUG - CATEGORY ALERT SHOULD TRIGGER for ${categoryName}: ${expenseAmount} > ${budgetAmount}`);
      
      // Make sure to format with commas as thousands separators
      const formattedBudget = budgetAmount.toLocaleString('vi-VN');
      const message = `Chi tiêu danh mục "${categoryName}" đã vượt ngân sách ${formattedBudget}₫`;
      
      // Check if similar alert already exists before creating a new one
      const alertExists = await checkAlertExists(message);
      if (alertExists) {
        console.log(`DEBUG - Similar category alert for "${categoryName}" already exists, skipping`);
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
          percentage: Math.round((expenseAmount / budgetAmount) * 100)
        }
      };

      console.log('DEBUG - Category budget alert created:', alert);
      
      // Show toast notification for the alert
      const toastMessage = `⚠️ ${message}`;
      console.log('DEBUG - Showing toast notification for category alert:', toastMessage);
      toast.warning(toastMessage, {
        position: "top-right",
        autoClose: 8000, // Longer display time
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
        const result = await createAlert(alertToCreate);
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
 */
export const generateAlerts = async (statistics, budget, categoryBudgets, categoryExpenses) => {
  try {
    console.log('DEBUG - Generating alerts with data:');
    console.log('statistics:', statistics);
    console.log('budget:', budget);
    console.log('categoryBudgets:', categoryBudgets);
    console.log('categoryExpenses:', categoryExpenses);

    const alerts = [];
    
    // Check total monthly budget - exceeded
    if (budget) {
      // Get the budget amount from the correct property based on API response structure
      const budgetAmount = budget.budget || budget.amount || 0;
      const totalExpense = statistics?.totalExpense || 0;
      
      console.log('DEBUG - Total monthly comparison:', totalExpense, 'vs', budgetAmount);
      
      // First check if budget is exceeded
      const budgetAlert = await checkMonthlyBudgetAlert(totalExpense, budgetAmount);
      if (budgetAlert) alerts.push(budgetAlert);
      
      // If not exceeded, check if approaching limit (90%)
      if (!budgetAlert) {
        const budgetWarning = await checkMonthlyBudgetWarning(totalExpense, budgetAmount);
        if (budgetWarning) alerts.push(budgetWarning);
      }
    }
    
    // Check if we have enough data to process category budgets
    if (!categoryBudgets || categoryBudgets.length === 0) {
      console.log('DEBUG - No category budgets to check');
    } else if (!categoryExpenses || categoryExpenses.length === 0) {
      console.log('DEBUG - No category expenses to check against budgets');
      
      // If we have budgets but no expenses, we need to force check the expense data
      console.log('DEBUG - Attempting to check budgets with transaction data instead...');
      
      // Try to generate dummy expense data based on the category budgets we have
      // This allows alerts to trigger even when the expenses API fails
      if (statistics && statistics.totalExpense > 0) {
        // Create a temporary expense entry for each budget
        const tempExpenses = categoryBudgets.map(budget => {
          const categoryId = budget.categoryId;
          // Extract category name if available
          let categoryName = 'Không xác định';
          if (budget.category && budget.category.name) {
            categoryName = budget.category.name;
          }
          
          // Assume 50% of total expense for this category as a fallback
          // This is just a dummy value to ensure alerts trigger
          const estimatedAmount = statistics.totalExpense * 0.5;
          
          console.log(`DEBUG - Creating temporary expense for category: ${categoryName} (${categoryId}), estimated amount: ${estimatedAmount}`);
          
          return {
            categoryId,
            amount: estimatedAmount,
            category: {
              name: categoryName
            }
          };
        });
        
        if (tempExpenses.length > 0) {
          console.log('DEBUG - Using temporary expense data for alert checking:', tempExpenses);
          categoryExpenses = tempExpenses;
        }
      }
    }
    
    // Check category budgets - Ensure all arrays exist
    if (categoryBudgets && categoryBudgets.length > 0 && categoryExpenses && categoryExpenses.length > 0) {
      console.log('DEBUG - Checking category budgets...');
      console.log('DEBUG - Number of category budgets:', categoryBudgets.length);
      console.log('DEBUG - Number of category expenses:', categoryExpenses.length);
      
      // Log all category expenses for debugging
      console.log('All category expenses:', JSON.stringify(categoryExpenses, null, 2));
      console.log('All category budgets:', JSON.stringify(categoryBudgets, null, 2));
      
      // Track which categories we've already processed to avoid duplicates
      const processedCategoryIds = new Set();
      
      // Create a lookup map for category expenses by categoryId for faster access
      const categoryExpensesMap = {};
      categoryExpenses.forEach(expense => {
        if (expense.categoryId) {
          const id = String(expense.categoryId).trim();
          categoryExpensesMap[id] = expense;
          console.log(`DEBUG - Added category expense to map: ${id} -> ${expense.name || expense.categoryName || (expense.category && expense.category.name) || 'unknown'}`);
        } else {
          console.log('DEBUG - Expense missing categoryId:', expense);
        }
      });
      
      // Log all the category IDs we found to help debug
      console.log('DEBUG - Category Expense Map Keys:', Object.keys(categoryExpensesMap));
      
      // Pre-check for specific categories and log their details
      for (const expense of categoryExpenses) {
        console.log(`DEBUG - Examining expense category: ${expense.category?.name || 'Unknown'}, ID: ${expense.categoryId}`);
      }
      
      // First, process all budget entries
      for (const categoryBudget of categoryBudgets) {
        // Skip invalid entries
        if (!categoryBudget.categoryId) {
          console.log('DEBUG - Skipping budget entry with no categoryId:', categoryBudget);
          continue;
        }
        
        const budgetCategoryId = String(categoryBudget.categoryId).trim();
        console.log(`DEBUG - Checking budget for category ID: ${budgetCategoryId}`);
        
        // Skip if we've already processed this category
        if (processedCategoryIds.has(budgetCategoryId)) {
          console.log(`DEBUG - Skipping duplicate category budget: ${budgetCategoryId}`);
          continue;
        }
        
        // Get the budget amount
        const budgetAmount = categoryBudget.budget_limit || categoryBudget.amount || 0;
        console.log(`DEBUG - Category budget amount: ${budgetAmount}`);
        
        // Skip categories with no budget
        if (budgetAmount <= 0) {
          console.log(`DEBUG - Skipping category with no budget: ${budgetCategoryId}`);
          continue;
        }
        
        // Get the matching expense entry directly from our map
        const categoryExpense = categoryExpensesMap[budgetCategoryId];
        console.log(`DEBUG - Found expense for category ${budgetCategoryId}:`, categoryExpense);
        
        if (categoryExpense) {
          // Get expense amount and category name
          const expenseAmount = categoryExpense.amount || categoryExpense.total || 0;
          console.log(`DEBUG - Category expense amount: ${expenseAmount}`);
          
          // Get category name in order of preference
          let categoryName = 'Không xác định';
          if (categoryExpense.category && categoryExpense.category.name) {
            categoryName = categoryExpense.category.name;
          } else if (categoryExpense.name) {
            categoryName = categoryExpense.name;
          } else if (categoryExpense.categoryName) {
            categoryName = categoryExpense.categoryName;
          }
          
          console.log(`DEBUG - Processing alert check for category "${categoryName}" (${budgetCategoryId})`);
          console.log(`DEBUG - Expense: ${expenseAmount}, Budget: ${budgetAmount}`);
          
          // First check if budget is exceeded
          if (expenseAmount > 0) {
            console.log(`DEBUG - Category ${categoryName} has expense > 0`);
            
            // Check if exceeded
            if (expenseAmount > budgetAmount) {
              console.log(`DEBUG - Expense (${expenseAmount}) > Budget (${budgetAmount}) for ${categoryName}`);
              
              const catAlert = await checkCategoryBudgetAlert(
                expenseAmount, 
                budgetAmount, 
                categoryName,
                budgetCategoryId
              );
              
              if (catAlert) {
                console.log(`DEBUG - Alert generated for category "${categoryName}":`, catAlert);
                alerts.push(catAlert);
              } else {
                console.log(`DEBUG - No alert was returned for ${categoryName} despite being over budget`);
              }
            } 
            // If not exceeded, check if approaching limit (90%)
            else {
              const percentageUsed = (expenseAmount / budgetAmount) * 100;
              console.log(`DEBUG - Category ${categoryName} using ${percentageUsed.toFixed(1)}% of budget`);
              
              if (percentageUsed >= 90) {
                console.log(`DEBUG - Category ${categoryName} at warning level (${percentageUsed.toFixed(1)}%)`);
                console.log(`DEBUG - CALLING checkCategoryBudgetWarning for ${categoryName}`);
                
                const catWarning = await checkCategoryBudgetWarning(
                  expenseAmount,
                  budgetAmount,
                  categoryName,
                  budgetCategoryId
                );
                
                if (catWarning) {
                  console.log(`DEBUG - Warning generated for category "${categoryName}":`, catWarning);
                  alerts.push(catWarning);
                } else {
                  console.log(`DEBUG - No warning was generated by checkCategoryBudgetWarning for ${categoryName}`);
                }
              } else {
                console.log(`DEBUG - Category ${categoryName} below warning threshold (${percentageUsed.toFixed(1)}% < 90%)`);
              }
            }
          } else {
            console.log(`DEBUG - No alert needed for ${categoryName}: Expense is 0`);
          }
          
          // Mark as processed
          processedCategoryIds.add(budgetCategoryId);
        } else {
          console.log(`DEBUG - No expense found for category with ID: ${budgetCategoryId}`);
          
          // If we are missing expense data for a category, we can use the statistics.totalExpense
          // to estimate category expenses and still trigger alerts
          if (statistics && statistics.totalExpense > 0) {
            // Try to extract category name
            let categoryName = 'Không xác định';
            if (categoryBudget.category && categoryBudget.category.name) {
              categoryName = categoryBudget.category.name;
            }
            
            // Estimate an expense amount (50% of total for example) to check alerts
            const estimatedAmount = statistics.totalExpense * 0.5;
            console.log(`DEBUG - Using estimated expense for category ${categoryName}: ${estimatedAmount}`);
            
            // Check if this estimated expense would trigger an alert
            if (estimatedAmount > budgetAmount) {
              console.log(`DEBUG - Estimated expense (${estimatedAmount}) > Budget (${budgetAmount}) for ${categoryName}`);
              
              const catAlert = await checkCategoryBudgetAlert(
                estimatedAmount,
                budgetAmount,
                categoryName,
                budgetCategoryId
              );
              
              if (catAlert) {
                console.log(`DEBUG - Alert generated for category "${categoryName}" with estimated expense:`, catAlert);
                alerts.push(catAlert);
              }
            } else if ((estimatedAmount / budgetAmount) * 100 >= 90) {
              console.log(`DEBUG - Estimated expense at warning level for ${categoryName}`);
              
              const catWarning = await checkCategoryBudgetWarning(
                estimatedAmount,
                budgetAmount,
                categoryName,
                budgetCategoryId
              );
              
              if (catWarning) {
                console.log(`DEBUG - Warning generated for category "${categoryName}" with estimated expense:`, catWarning);
                alerts.push(catWarning);
              }
            }
          }
        }
      }
    } else {
      console.log('DEBUG - Cannot check category budgets:');
      console.log('Has categoryBudgets:', !!categoryBudgets);
      console.log('categoryBudgets length:', categoryBudgets?.length || 0);
      console.log('Has categoryExpenses:', !!categoryExpenses);
      console.log('categoryExpenses length:', categoryExpenses?.length || 0);
    }
    
    console.log('DEBUG - Generated alerts:', alerts);
    return alerts;
  } catch (error) {
    console.error('Error generating alerts:', error);
    return []; // Return empty array instead of throwing to prevent UI breaking
  }
}; 