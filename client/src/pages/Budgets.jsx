import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { createBudget, getCurrentBudget, setCategoryBudget, getCategoryBudgets, updateCategoryBudget } from '../services/budgets';
import { getAllCategories } from '../services/categories';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../services/config';

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

const Budgets = () => {
  const [monthlyBudget, setMonthlyBudget] = useState({
    amount: 0,
    spent: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [categorySpending, setCategorySpending] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryBudgetAmount, setCategoryBudgetAmount] = useState('');
  const [monthlySummary, setMonthlySummary] = useState({
    totalIncome: 0,
    totalExpenses: 0
  });
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(amount || 0));
  };
  
  // Format month for display
  const formatMonthDisplay = (month, year) => {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    // Convert to 0-based index
    const monthIndex = Number(month) - 1;
    return `${months[monthIndex]} ${year}`;
  };
  
  // Calculate percentage
  const calculatePercentage = (spent, total) => {
    if (total <= 0) return 0;
    const percentage = (Math.abs(spent) / Math.abs(total)) * 100;
    return Math.min(percentage, 100).toFixed(0);
  };

  // Get monthly summary data
  const fetchMonthlySummary = async () => {
    try {
      // Get current month and year for statistics
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      console.log(`Fetching statistics for month: ${month}, year: ${year}`);
      
      // Get monthly summary from the statistics endpoint
      const response = await axios.get(`${API_URL}/statistics/summary`, {
        params: { month, year }
      });
      
      console.log('Monthly summary API response:', response.data);
      
      if (response.data) {
        const summary = {
          totalIncome: Math.abs(response.data.totalIncome || 0),
          totalExpenses: Math.abs(response.data.totalExpenses || 0)
        };
        
        console.log('Processed summary data:', summary);
        setMonthlySummary(summary);
        return summary;
      }
      return { totalIncome: 0, totalExpenses: 0 };
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      return { totalIncome: 0, totalExpenses: 0 };
    }
  };

  // Get category spending data
  const fetchCategorySpending = async () => {
    try {
      // Get current month and year for statistics
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      // Get category spending from the statistics endpoint
      const response = await axios.get(`${API_URL}/statistics/category-spending`, {
        params: { month, year }
      });
      
      console.log('Category spending API response:', response.data);
      
      // Format the data into a map of categoryId -> amount spent
      const spendingMap = {};
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(item => {
          if (item && item.categoryId) {
            // Handle negative values (expenses) by using absolute value
            const amount = item.type === 'expense' ? Math.abs(item.amount || 0) : 0;
            spendingMap[item.categoryId] = amount;
          }
        });
      }
      
      console.log('Processed category spending data:', spendingMap);
      setCategorySpending(spendingMap);
      return spendingMap;
    } catch (error) {
      console.error('Error fetching category spending:', error);
      return {};
    }
  };
  
  // Direct API call to fetch transaction summary by category
  const fetchTransactionsByCategoryDirect = async () => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      // Get all transactions for the month
      const response = await axios.get(`${API_URL}/transactions/current`);
      console.log('All transactions API response:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Unexpected transactions API response format');
        return {};
      }
      
      // Filter transactions for the current month and year
      const currentMonthTransactions = response.data.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() + 1 === month && txDate.getFullYear() === year;
      });
      
      console.log('Current month transactions:', currentMonthTransactions);
      
      // Group by category and sum up expense amounts only
      const spendingByCategory = {};
      let totalExpenses = 0;
      
      currentMonthTransactions.forEach(tx => {
        if (!tx.categoryId) return;
        
        // Initialize category if needed
        if (!spendingByCategory[tx.categoryId]) {
          spendingByCategory[tx.categoryId] = 0;
        }
        
        // Only add expenses (not income) to category spending
        if (tx.type === 'expense') {
          const amount = Math.abs(tx.amount || 0);
          spendingByCategory[tx.categoryId] += amount;
          totalExpenses += amount;
        }
      });
      
      console.log('Direct calculation of spending by category:', spendingByCategory);
      console.log('Total expenses calculated:', totalExpenses);
      
      // Update states - only update the spending amounts, not the budget limits
      setCategorySpending(spendingByCategory);
      
      // Update just the spent amount, preserve the original budget amount
      setMonthlyBudget(prev => ({
        ...prev,
        spent: totalExpenses
      }));
      
      return spendingByCategory;
    } catch (error) {
      console.error('Error fetching and processing transactions:', error);
      return {};
    }
  };
  
  // Process budget data to ensure we have correct values
  const processBudgetData = (budgetData) => {
    if (!budgetData || !Array.isArray(budgetData) || budgetData.length === 0) {
      console.log('No budget data to process');
      return null;
    }
    
    // Sort by createdAt date, most recent first
    const sortedBudgets = [...budgetData].sort((a, b) => 
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    
    console.log('Sorted budgets by date:', sortedBudgets);
    
    // Get the most recent budget
    const latestBudget = sortedBudgets[0];
    
    // Ensure budget has positive values
    return {
      ...latestBudget,
      budget: Math.abs(latestBudget.budget || 0)
    };
  };
  
  // Process category budgets to handle negative values and ensure uniqueness
  const processCategoryBudgets = (categoryBudgetsData) => {
    if (!categoryBudgetsData || !Array.isArray(categoryBudgetsData)) {
      return [];
    }
    
    // Process to ensure unique and valid category budgets
    const uniqueBudgets = {};
    
    // First pass: create a map of the most recent budget per category
    categoryBudgetsData.forEach(budget => {
      if (!budget.categoryId) return;
      
      if (!uniqueBudgets[budget.categoryId] || 
          (budget.createdAt && (!uniqueBudgets[budget.categoryId].createdAt || 
            new Date(budget.createdAt) > new Date(uniqueBudgets[budget.categoryId].createdAt)))) {
        uniqueBudgets[budget.categoryId] = {
          ...budget,
          budget_limit: Math.abs(budget.budget_limit || 0) // Ensure positive value
        };
      }
    });
    
    console.log('Processed category budgets:', uniqueBudgets);
    
    // Convert back to array
    return Object.values(uniqueBudgets);
  };
  
  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all categories
        const categoriesData = await getAllCategories();
        setCategories(categoriesData || []);
        
        console.log('Fetched categories:', categoriesData);

        // First, get the current budget limit
        try {
          const budgetData = await getCurrentBudget();
          console.log('Fetched budget data:', budgetData);
          
          const processedBudget = processBudgetData(budgetData);
          
          if (processedBudget) {
            // Set the initial budget with month/year
            setMonthlyBudget(prev => ({
              ...prev,
              amount: processedBudget.budget || 0,
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear()
            }));
          }
        } catch (budgetError) {
          console.error('Error loading budget data:', budgetError);
          toast.error('Không thể tải dữ liệu ngân sách.');
        }
        
        // Now get category spending data from transactions
        await fetchTransactionsByCategoryDirect();
        
        // Get monthly summary
        const summary = await fetchMonthlySummary();
        
        // Get category budgets
        try {
          const categoryBudgetsData = await getCategoryBudgets();
          console.log('Fetched category budgets:', categoryBudgetsData);
          
          // Process the category budgets
          const processedBudgets = processCategoryBudgets(categoryBudgetsData);
          setCategoryBudgets(processedBudgets);
        } catch (catError) {
          console.error('Error loading category budgets:', catError);
          toast.error('Không thể tải dữ liệu hạn mức danh mục.');
        }
        
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error('Có lỗi xảy ra khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle budget update - use update instead of create to avoid duplicates
  const handleMonthlyBudgetSubmit = async (e) => {
    e.preventDefault();
    
    if (!newBudgetAmount || isNaN(newBudgetAmount) || Number(newBudgetAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    try {
      // Show loading toast
      const loadingToastId = toast.loading('Đang cập nhật ngân sách...');
      
      // Get current month and year
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const budgetAmount = Math.abs(Number(newBudgetAmount)); // Ensure positive value

      // Attempt to create a new budget
      try {
        const response = await createBudget(
          budgetAmount,
          currentMonth,
          currentYear
        );
        
        console.log('Budget creation response:', response);
      } catch (createError) {
        // If creation fails because budget exists, try to update it
        if (createError.response?.data?.message?.includes('already exists')) {
          console.log('Budget already exists, updating instead');
          const updateResponse = await axios.put(`${API_URL}/budgets/update`, {
            month: formatMonth(currentMonth, currentYear),
            budget: budgetAmount
          });
          console.log('Budget update response:', updateResponse.data);
        } else {
          throw createError; // Re-throw if it's a different error
        }
      }
      
      // Update ONLY the amount in the state, preserve the spent amount
      setMonthlyBudget(prev => ({
        ...prev,
        amount: budgetAmount
      }));
      
      setNewBudgetAmount('');
      toast.dismiss(loadingToastId);
      toast.success('Đã cập nhật ngân sách tháng thành công');
      
      // Don't call fetchMonthlySummary() here as it might overwrite our changes
    } catch (error) {
      console.error('Error creating/updating budget:', error);
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật ngân sách. Vui lòng thử lại sau.';
      toast.error(errorMessage);
    }
  };
  
  // Handle category budget submission
  const handleCategoryBudgetSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    
    if (!categoryBudgetAmount || isNaN(categoryBudgetAmount) || Number(categoryBudgetAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    try {
      // Show loading toast
      const loadingToastId = toast.loading('Đang cập nhật hạn mức danh mục...');
      
      // For debugging
      console.log('Selected category:', selectedCategory);
      console.log('Category budget amount:', categoryBudgetAmount);
      console.log('Current category budgets:', categoryBudgets);
      
      // Check if this category already has a budget
      const existingBudget = categoryBudgets.find(
        budget => budget.categoryId === selectedCategory
      );
      
      console.log('Existing budget found:', existingBudget);
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const budgetAmount = Math.abs(Number(categoryBudgetAmount)); // Ensure positive value
      
      let result;
      
      if (existingBudget) {
        // Update existing budget using the UserCategory ID
        try {
          console.log(`Updating budget for category ID: ${existingBudget.id}, amount: ${budgetAmount}`);
          result = await updateCategoryBudget(
            existingBudget.id, 
            budgetAmount, 
            currentMonth, 
            currentYear
          );
          console.log('Update category budget result:', result);
        } catch (updateError) {
          console.error('Failed to update category budget, creating a new one instead:', updateError);
          // Try to create a new one if update fails
          console.log(`Creating new budget for category ID: ${selectedCategory}, amount: ${budgetAmount}`);
          result = await setCategoryBudget(
            selectedCategory, 
            budgetAmount, 
            currentMonth, 
            currentYear
          );
          console.log('Create category budget result:', result);
        }
      } else {
        // Create new budget
        console.log(`Creating new budget for category ID: ${selectedCategory}, amount: ${budgetAmount}`);
        result = await setCategoryBudget(
          selectedCategory, 
          budgetAmount, 
          currentMonth, 
          currentYear
        );
        console.log('Create category budget result:', result);
      }
      
      // Refresh category budgets after update
      const refreshedBudgets = await getCategoryBudgets();
      console.log('Refreshed category budgets:', refreshedBudgets);
      
      // Process the refreshed budgets
      const processedBudgets = processCategoryBudgets(refreshedBudgets);
      setCategoryBudgets(processedBudgets);
      
      // Reset form
      setSelectedCategory('');
      setCategoryBudgetAmount('');
      toast.dismiss(loadingToastId);
      toast.success('Đã cập nhật hạn mức danh mục thành công');
      
      // Refresh spending data
      fetchTransactionsByCategoryDirect();
    } catch (error) {
      console.error('Error setting category budget:', error);
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật hạn mức danh mục. Vui lòng thử lại sau.';
      toast.error(errorMessage);
    }
  };
  
  // Find category name by id
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Danh mục không xác định';
  };
  
  // Get spent amount for a category
  const getCategorySpent = (categoryId) => {
    return categorySpending[categoryId] || 0;
  };
  
  // Get budget limit for a category
  const getCategoryBudgetLimit = (categoryId) => {
    const budget = categoryBudgets.find(budget => budget.categoryId === categoryId);
    return budget ? Math.abs(budget.budget_limit || 0) : 0;
  };
  
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Ngân sách</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Quản lý ngân sách</h2>
            <p className="text-gray-600">
              Tại đây bạn có thể thiết lập ngân sách hàng tháng và theo dõi tình hình chi tiêu.
              Đặt hạn mức chi tiêu để quản lý tài chính hiệu quả hơn.
            </p>
          </div>
          
          {/* Ngân sách tổng */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Ngân sách tháng này</h2>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Đang tải...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Chi tiêu: {formatCurrency(monthlyBudget.spent)} / {formatCurrency(monthlyBudget.amount)}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {calculatePercentage(monthlyBudget.spent, monthlyBudget.amount)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${calculatePercentage(monthlyBudget.spent, monthlyBudget.amount)}%` }}
                    ></div>
                  </div>
                </div>
                
                <form onSubmit={handleMonthlyBudgetSubmit} className="mt-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-grow">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập ngân sách tháng (VNĐ)"
                        value={newBudgetAmount}
                        onChange={(e) => setNewBudgetAmount(e.target.value)}
                        min="1"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cập nhật
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
          
          {/* Ngân sách theo danh mục */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ngân sách theo danh mục</h2>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Đang tải...</span>
                </div>
              </div>
            ) : (
              <>
                <form id="budget-form" onSubmit={handleCategoryBudgetSubmit} className="mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        required
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập hạn mức (VNĐ)"
                        value={categoryBudgetAmount}
                        onChange={(e) => setCategoryBudgetAmount(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Đặt hạn mức
                      </button>
                    </div>
                  </div>
                </form>
                
                <div className="space-y-4">
                  {categoryBudgets.length > 0 ? (
                    categoryBudgets.map(budget => {
                      // Get the actual spending for this category
                      const spent = getCategorySpent(budget.categoryId);
                      // Get the budget limit (always positive)
                      const limit = Math.abs(budget.budget_limit || 0);
                      
                      return (
                        <div key={`budget-${budget.id || budget.categoryId}`} className="p-3 border border-gray-200 rounded">
                          <h3 className="font-medium text-gray-800">{getCategoryName(budget.categoryId)}</h3>
                          <div className="flex justify-between mb-1 mt-2">
                            <span className="text-sm text-gray-700">
                              Chi tiêu: {formatCurrency(spent)} / {formatCurrency(limit)}
                            </span>
                            <span className="text-sm text-gray-700">
                              {calculatePercentage(spent, limit)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                calculatePercentage(spent, limit) > 90 
                                  ? 'bg-red-500' 
                                  : calculatePercentage(spent, limit) > 70 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`} 
                              style={{ width: `${calculatePercentage(spent, limit)}%` }}
                            ></div>
                          </div>
                          <div className="mt-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory(budget.categoryId);
                                setCategoryBudgetAmount(Math.abs(budget.budget_limit || ''));
                                window.scrollTo({
                                  top: document.getElementById('budget-form')?.offsetTop - 100 || 0,
                                  behavior: 'smooth'
                                });
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Cập nhật
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-600 italic">Chưa có hạn mức danh mục nào được thiết lập.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budgets; 