import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { createBudget, getCurrentBudget, setCategoryBudget, getCategoryBudgets, updateCategoryBudget, getBudgetByMonth, getCategoryBudgetsByMonth, updateBudgetForMonth, deleteCategoryBudget } from '../services/budgets';
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
  const currentDate = new Date();
  const [monthlyBudget, setMonthlyBudget] = useState({
    amount: 0,
    spent: 0,
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear()
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
  
  // State cho việc chọn tháng
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);
  
  // Tạo mảng năm từ năm hiện tại trở về 5 năm trước
  const years = Array.from({ length: 6 }, (_, index) => currentDate.getFullYear() - index);
  
  // Hàm kiểm tra xem tháng được chọn có phải là tháng hiện tại không
  const checkIsCurrentMonth = (month, year) => {
    return (
      month === currentDate.getMonth() + 1 && 
      year === currentDate.getFullYear()
    );
  };
  
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
  const fetchMonthlySummary = async (month, year) => {
    try {

      
      // Get monthly summary from the statistics endpoint
      const response = await axios.get(`${API_URL}/statistics/summary`, {
        params: { month, year }
      });

      
      if (response.data) {
        const summary = {
          totalIncome: Math.abs(response.data.totalIncome || 0),
          totalExpenses: Math.abs(response.data.totalExpenses || 0)
        };
        

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
  const fetchCategorySpending = async (month, year) => {
    try {
      // Get category spending from the statistics endpoint
      const response = await axios.get(`${API_URL}/statistics/category-spending`, {
        params: { month, year }
      });
      
      
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
      
      setCategorySpending(spendingMap);
      return spendingMap;
    } catch (error) {
      console.error('Error fetching category spending:', error);
      return {};
    }
  };
  
  // Direct API call to fetch transaction summary by category
  const fetchTransactionsByCategoryDirect = async (month, year) => {
    try {
      // Get all transactions for the month
      const response = await axios.get(`${API_URL}/transactions/current`);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Unexpected transactions API response format');
        return {};
      }
      
      // Filter transactions for the current month and year
      const currentMonthTransactions = response.data.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() + 1 === month && txDate.getFullYear() === year;
      });
      
      
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
  const processBudgetData = (budgetData, targetMonth, targetYear) => {
    // Kiểm tra nếu không có dữ liệu
    if (!budgetData) {
      return null;
    }
    
    // Tạo chuỗi tháng để so sánh (tháng định dạng "Month YYYY")
    const monthFormat = formatMonth(targetMonth, targetYear);
    
    // Trường hợp API trả về một đối tượng đơn lẻ (từ by-month API)
    if (!Array.isArray(budgetData)) {
      // Kiểm tra xem đối tượng có đúng tháng không
      if (budgetData.month === monthFormat) {
        // Đảm bảo giá trị ngân sách là số dương
        return {
          ...budgetData,
          budget: Math.abs(budgetData.budget || 0)
        };
      } else {
        return null;
      }
    }
    
    // Trường hợp API trả về một mảng (từ current API)
    if (budgetData.length === 0) {
      return null;
    }
    
    // Lọc budget theo tháng được chọn
    const matchingBudgets = budgetData.filter(budget => budget.month === monthFormat);
    
    if (matchingBudgets.length === 0) {
      return null;
    }
    
    
    // Nếu có nhiều budget cho cùng một tháng, chọn cái mới nhất theo updatedAt
    const sortedBudgets = [...matchingBudgets].sort((a, b) => 
      new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    );
    
    
    // Get the most recent budget
    const latestBudget = sortedBudgets[0];
    
    // Ensure budget has positive values
    return {
      ...latestBudget,
      budget: Math.abs(latestBudget.budget || 0)
    };
  };
  
  // Process category budgets to handle negative values and ensure uniqueness
  const processCategoryBudgets = (categoryBudgetsData, targetMonth, targetYear) => {
    // Kiểm tra nếu không có dữ liệu
    if (!categoryBudgetsData) {
      return [];
    }
    
    // Tạo chuỗi tháng để so sánh (tháng định dạng "Month YYYY")
    const monthFormat = formatMonth(targetMonth, targetYear);
    console.log('Looking for category budgets with month:', monthFormat);
    
    // Đảm bảo dữ liệu là một mảng
    const budgetsArray = Array.isArray(categoryBudgetsData) 
      ? categoryBudgetsData 
      : [categoryBudgetsData];
    
    // Lọc các budget theo tháng được chọn
    const matchingBudgets = budgetsArray.filter(budget => 
      budget && budget.month === monthFormat
    );
    
    console.log(`Found ${matchingBudgets.length} category budgets for ${monthFormat}`);
    
    // Process to ensure unique and valid category budgets
    const uniqueBudgets = {};
    
    // First pass: create a map of the most recent budget per category
    matchingBudgets.forEach(budget => {
      if (!budget || !budget.categoryId) return;
      
      if (!uniqueBudgets[budget.categoryId] || 
          (budget.updatedAt && (!uniqueBudgets[budget.categoryId].updatedAt || 
            new Date(budget.updatedAt) > new Date(uniqueBudgets[budget.categoryId].updatedAt)))) {
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
  
  // Load data based on selected month and year
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all categories
        const categoriesData = await getAllCategories();
        setCategories(categoriesData || []);
        
        console.log('Fetched categories:', categoriesData);
        
        // Kiểm tra xem có phải tháng hiện tại không
        const isCurrentMonthSelected = checkIsCurrentMonth(selectedMonth, selectedYear);
        setIsCurrentMonth(isCurrentMonthSelected);

        // Tải ngân sách theo tháng đã chọn
        try {
          let budgetData;
          if (isCurrentMonthSelected) {
            budgetData = await getCurrentBudget();
            console.log('Fetched current budget data:', budgetData);
          } else {
            budgetData = await getBudgetByMonth(selectedMonth, selectedYear);
            console.log('Fetched budget data for specific month:', budgetData);
          }
          
          const processedBudget = processBudgetData(budgetData, selectedMonth, selectedYear);
          console.log('Processed budget data:', processedBudget);
          
          if (processedBudget) {
            // Set the budget with selected month/year
            setMonthlyBudget(prev => ({
              ...prev,
              amount: processedBudget.budget || 0,
              month: selectedMonth,
              year: selectedYear
            }));
          } else {
            // Nếu không có ngân sách, đặt giá trị mặc định
            setMonthlyBudget({
              amount: 0,
              spent: 0,
              month: selectedMonth,
              year: selectedYear
            });
          }
        } catch (budgetError) {
          console.error('Error loading budget data:', budgetError);
          toast.error('Không thể tải dữ liệu ngân sách.');
          
          // Set default values on error
          setMonthlyBudget({
            amount: 0,
            spent: 0,
            month: selectedMonth,
            year: selectedYear
          });
        }
        
        // Tải thông tin chi tiêu theo tháng
        if (isCurrentMonthSelected) {
          // Chỉ tính toán chi tiêu cho tháng hiện tại
          await fetchTransactionsByCategoryDirect(selectedMonth, selectedYear);
          await fetchMonthlySummary(selectedMonth, selectedYear);
        } else {
          // Cho tháng trước, đặt chi tiêu = 0 vì không có dữ liệu chính xác
          setMonthlyBudget(prev => ({
            ...prev,
            spent: 0
          }));
          setCategorySpending({});
        }
        
        // Tải ngân sách danh mục theo tháng
        try {
          let categoryBudgetsData;
          if (isCurrentMonthSelected) {
            categoryBudgetsData = await getCategoryBudgets();
            console.log('Fetched current category budgets:', categoryBudgetsData);
          } else {
            categoryBudgetsData = await getCategoryBudgetsByMonth(selectedMonth, selectedYear);
            console.log('Fetched category budgets for specific month:', categoryBudgetsData);
          }
          
          // Process the category budgets
          const processedBudgets = processCategoryBudgets(categoryBudgetsData, selectedMonth, selectedYear);
          console.log('Processed category budgets data:', processedBudgets);
          setCategoryBudgets(processedBudgets);
        } catch (catError) {
          console.error('Error loading category budgets:', catError);
          toast.error('Không thể tải dữ liệu hạn mức danh mục.');
          // Set empty array on error
          setCategoryBudgets([]);
        }
        
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error('Có lỗi xảy ra khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedMonth, selectedYear]);
  
  // Handle budget update
  const handleMonthlyBudgetSubmit = async (e) => {
    e.preventDefault();
    
    if (!newBudgetAmount || isNaN(newBudgetAmount) || Number(newBudgetAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    try {
      // Show loading toast
      const loadingToastId = toast.loading('Đang cập nhật ngân sách...');
      
      const budgetAmount = Math.abs(Number(newBudgetAmount)); // Ensure positive value

      // Cập nhật ngân sách cho tháng được chọn
      try {
        const response = await updateBudgetForMonth(
          budgetAmount,
          selectedMonth,
          selectedYear
        );
        
        console.log('Budget update response:', response);
      } catch (error) {
        console.error('Failed to update budget:', error);
        throw error;
      }
      
      // Update the amount in the state
      setMonthlyBudget(prev => ({
        ...prev,
        amount: budgetAmount
      }));
      
      setNewBudgetAmount('');
      toast.dismiss(loadingToastId);
      toast.success('Đã cập nhật ngân sách thành công');
    } catch (error) {
      console.error('Error updating budget:', error);
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
      
      // Check if this category already has a budget for the selected month
      const existingBudget = categoryBudgets.find(
        budget => budget.categoryId === selectedCategory
      );
      
      console.log('Existing budget found:', existingBudget);
      
      const budgetAmount = Math.abs(Number(categoryBudgetAmount)); // Ensure positive value
      
      let result;
      
      if (existingBudget) {
        // Update existing budget using the UserCategory ID
        try {
          console.log(`Updating budget for category ID: ${existingBudget.id}, amount: ${budgetAmount}`);
          result = await updateCategoryBudget(
            existingBudget.id, 
            budgetAmount, 
            selectedMonth, 
            selectedYear
          );
          console.log('Update category budget result:', result);
        } catch (updateError) {
          console.error('Failed to update category budget, creating a new one instead:', updateError);
          // Try to create a new one if update fails
          console.log(`Creating new budget for category ID: ${selectedCategory}, amount: ${budgetAmount}`);
          result = await setCategoryBudget(
            selectedCategory, 
            budgetAmount, 
            selectedMonth, 
            selectedYear
          );
          console.log('Create category budget result:', result);
        }
      } else {
        // Create new budget
        console.log(`Creating new budget for category ID: ${selectedCategory}, amount: ${budgetAmount}`);
        result = await setCategoryBudget(
          selectedCategory, 
          budgetAmount, 
          selectedMonth, 
          selectedYear
        );
        console.log('Create category budget result:', result);
      }
      
      // Refresh category budgets after update
      let refreshedBudgets;
      if (isCurrentMonth) {
        refreshedBudgets = await getCategoryBudgets();
      } else {
        refreshedBudgets = await getCategoryBudgetsByMonth(selectedMonth, selectedYear);
      }
      console.log('Refreshed category budgets:', refreshedBudgets);
      
      // Process the refreshed budgets
      const processedBudgets = processCategoryBudgets(refreshedBudgets, selectedMonth, selectedYear);
      setCategoryBudgets(processedBudgets);
      
      // Reset form
      setSelectedCategory('');
      setCategoryBudgetAmount('');
      toast.dismiss(loadingToastId);
      toast.success('Đã cập nhật hạn mức danh mục thành công');
      
      // Refresh spending data if it's current month
      if (isCurrentMonth) {
        fetchTransactionsByCategoryDirect(selectedMonth, selectedYear);
      }
    } catch (error) {
      console.error('Error setting category budget:', error);
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật hạn mức danh mục. Vui lòng thử lại sau.';
      toast.error(errorMessage);
    }
  };
  
  // Handle category budget deletion
  const handleDeleteCategoryBudget = async (budgetId) => {
    try {
      // Xác nhận xóa
      if (!window.confirm('Bạn có chắc muốn xóa hạn mức này?')) {
        return;
      }
      
      // Show loading toast
      const loadingToastId = toast.loading('Đang xóa hạn mức danh mục...');
      
      await deleteCategoryBudget(budgetId);
      
      // Refresh category budgets after deletion
      let refreshedBudgets;
      if (isCurrentMonth) {
        refreshedBudgets = await getCategoryBudgets();
      } else {
        refreshedBudgets = await getCategoryBudgetsByMonth(selectedMonth, selectedYear);
      }
      
      // Process the refreshed budgets
      const processedBudgets = processCategoryBudgets(refreshedBudgets, selectedMonth, selectedYear);
      setCategoryBudgets(processedBudgets);
      
      toast.dismiss(loadingToastId);
      toast.success('Đã xóa hạn mức danh mục thành công');
      
      // Refresh spending data if it's current month
      if (isCurrentMonth) {
        fetchTransactionsByCategoryDirect(selectedMonth, selectedYear);
      }
    } catch (error) {
      console.error('Error deleting category budget:', error);
      const errorMessage = error.response?.data?.message || 'Không thể xóa hạn mức danh mục. Vui lòng thử lại sau.';
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
    <MainLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ngân sách</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h2 className="text-lg font-medium text-blue-900 mb-2">Quản lý ngân sách</h2>
          <p className="text-gray-600">
            Tại đây bạn có thể thiết lập ngân sách hàng tháng và theo dõi tình hình chi tiêu.
            Đặt hạn mức chi tiêu để quản lý tài chính hiệu quả hơn.
          </p>
        </div>
        
        {/* Bộ chọn tháng và năm */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Chọn tháng xem ngân sách</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="sm:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {`Tháng ${month}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {!isCurrentMonth && (
              <div className="flex items-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={() => {
                    setSelectedMonth(currentDate.getMonth() + 1);
                    setSelectedYear(currentDate.getFullYear());
                  }}
                >
                  Về tháng hiện tại
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Ngân sách tổng */}
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {isCurrentMonth ? 'Ngân sách tháng này' : `Ngân sách ${formatMonthDisplay(selectedMonth, selectedYear)}`}
          </h2>
          
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
                    {isCurrentMonth ? (
                      `Chi tiêu: ${formatCurrency(monthlyBudget.spent)} / ${formatCurrency(monthlyBudget.amount)}`
                    ) : (
                      `Ngân sách: ${formatCurrency(monthlyBudget.amount)}`
                    )}
                  </span>
                  {isCurrentMonth && (
                    <span className="text-sm font-medium text-gray-700">
                      {calculatePercentage(monthlyBudget.spent, monthlyBudget.amount)}%
                    </span>
                  )}
                </div>
                {isCurrentMonth && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${calculatePercentage(monthlyBudget.spent, monthlyBudget.amount)}%` }}
                    ></div>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleMonthlyBudgetSubmit} className="mt-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-grow">
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Nhập ngân sách cho ${formatMonthDisplay(selectedMonth, selectedYear)} (VNĐ)`}
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {isCurrentMonth 
              ? 'Ngân sách theo danh mục tháng này' 
              : `Ngân sách theo danh mục ${formatMonthDisplay(selectedMonth, selectedYear)}`}
          </h2>
          
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
                      placeholder={`Nhập hạn mức cho ${formatMonthDisplay(selectedMonth, selectedYear)} (VNĐ)`}
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
                            {isCurrentMonth 
                              ? `Chi tiêu: ${formatCurrency(spent)} / ${formatCurrency(limit)}`
                              : `Hạn mức: ${formatCurrency(limit)}`
                            }
                          </span>
                          {isCurrentMonth && (
                            <span className="text-sm text-gray-700">
                              {calculatePercentage(spent, limit)}%
                            </span>
                          )}
                        </div>
                        {isCurrentMonth && (
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
                        )}
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
                            className="text-sm text-blue-600 hover:text-blue-800 mr-4"
                          >
                            Cập nhật
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategoryBudget(budget.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600 italic">
                    {isCurrentMonth 
                      ? 'Chưa có hạn mức danh mục nào được thiết lập cho tháng này.'
                      : `Chưa có hạn mức danh mục nào được thiết lập cho ${formatMonthDisplay(selectedMonth, selectedYear)}.`
                    }
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Budgets;