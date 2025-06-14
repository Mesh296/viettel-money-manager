import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { createBudget, getCurrentBudget, setCategoryBudget, getCategoryBudgets, updateCategoryBudget, getBudgetByMonth, getCategoryBudgetsByMonth, updateBudgetForMonth, deleteCategoryBudget } from '../services/budgets';
import { getAllCategories } from '../services/categories';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../services/config';
import styled from 'styled-components';

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
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
        
        // Get all categories with better error handling
        try {
          console.log('Fetching categories...');
          const categoriesData = await getAllCategories();
          
          // Validate the categories data
          if (!Array.isArray(categoriesData)) {
            console.error('Categories data is not an array:', categoriesData);
            toast.error('Định dạng dữ liệu danh mục không hợp lệ');
            setCategories([]);
          } else {
            console.log(`Fetched ${categoriesData.length} categories successfully:`, categoriesData);
            setCategories(categoriesData);
          }
        } catch (catError) {
          console.error('Failed to load categories:', catError);
          toast.error('Không thể tải danh sách danh mục. Vui lòng thử lại sau.');
          setCategories([]);
        }
        
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
          // Tính toán chi tiêu cho tháng hiện tại
          await fetchTransactionsByCategoryDirect(selectedMonth, selectedYear);
          await fetchMonthlySummary(selectedMonth, selectedYear);
        } else {
          // Cho các tháng khác, vẫn cần tải dữ liệu chi tiêu thực tế
          await fetchTransactionsByCategoryDirect(selectedMonth, selectedYear);
          await fetchMonthlySummary(selectedMonth, selectedYear);
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
  
  // Additional effect to fetch categories separately
  useEffect(() => {
    const fetchCategoriesDirectly = async () => {
      try {
        console.log('Fetching categories directly...');
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No token found for API request');
          toast.error('Không tìm thấy token đăng nhập');
          return;
        }
        
        // Logging the request details
        console.log('API URL:', `${API_URL}/categories/all`);
        console.log('Headers:', { Authorization: `Bearer ${token}` });
        
        const response = await axios.get(`${API_URL}/categories/all`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Raw categories API response:', response);
        
        if (!response || !response.data) {
          console.error('Invalid categories API response:', response);
          toast.error('Phản hồi API không hợp lệ');
          return;
        }
        
        let categoriesData;
        
        // Handle various response formats
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (typeof response.data === 'object') {
          // If response is an object with a data property that is an array
          if (response.data.data && Array.isArray(response.data.data)) {
            categoriesData = response.data.data;
          } else {
            // Convert object to array if needed
            categoriesData = [response.data];
          }
        } else {
          categoriesData = [];
        }
        
        // Log what we extracted
        console.log(`Extracted ${categoriesData.length} categories from API response:`, categoriesData);
        
        // Filter out any invalid category objects
        const validCategories = categoriesData.filter(cat => 
          cat && (cat.id || cat.categoryId) && cat.name
        );
        
        console.log(`Final ${validCategories.length} valid categories:`, validCategories);
        setCategories(validCategories);
      } catch (error) {
        console.error('Failed to load categories directly:', error);
        if (error.response) {
          console.error('Error response:', error.response);
        } else if (error.request) {
          console.error('Error request:', error.request);
        }
        toast.error('Không thể tải danh sách danh mục');
      }
    };
    
    fetchCategoriesDirectly();
  }, []);
  
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
    const category = categories.find(cat => 
      String(cat.id) === String(categoryId) || 
      String(cat.categoryId) === String(categoryId)
    );
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
      <StyledBudgets>
        <div className="container">
          <h1 className="page-title">Quản lý ngân sách {formatMonthDisplay(selectedMonth, selectedYear)}</h1>
          {/* Top section: 2 columns */}
          <div className="budget-top-row">
            {/* Left: chọn tháng + cập nhật ngân sách */}
            <div className="budget-left-col">
              <div className="month-selection-card budget-card">
                <h3 className="card-title">Chọn thời gian</h3>
                <div className="select-group">
                  <label className="input-label" htmlFor="month-select">Chọn tháng:</label>
                  <select
                    id="month-select"
                    className="select-input"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="select-group">
                  <label className="input-label" htmlFor="year-select">Chọn năm:</label>
                  <select
                    id="year-select"
                    className="select-input"
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <form onSubmit={handleMonthlyBudgetSubmit} className="budget-card">
                <h3 className="card-title">Cập nhật ngân sách</h3>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label" htmlFor="budget-amount">
                      Ngân sách tháng {formatMonthDisplay(selectedMonth, selectedYear)}:
                    </label>
                    <input
                      id="budget-amount"
                      type="number"
                      className="text-input"
                      placeholder="Nhập số tiền"
                      value={newBudgetAmount}
                      onChange={(e) => setNewBudgetAmount(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
            {/* Right: budget summary */}
            <div className="budget-right-col">
              {monthlyBudget && monthlyBudget.amount > 0 && (
                <div className="budget-summary">
                  <h3 className="card-title">Thông tin ngân sách</h3>
                  <div className="summary-row">
                    <span>Ngân sách hiện tại:</span>
                    <span className="amount">{formatCurrency(monthlyBudget.amount)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Đã chi tiêu:</span>
                    <span className="amount expense">{formatCurrency(monthlyBudget.spent)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Còn lại:</span>
                    <span className={`amount ${monthlyBudget.amount - monthlyBudget.spent >= 0 ? 'remaining' : 'over-budget'}`}>{formatCurrency(monthlyBudget.amount - monthlyBudget.spent)}</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className={`progress ${monthlyBudget.spent / monthlyBudget.amount > 0.9 ? 'danger' : monthlyBudget.spent / monthlyBudget.amount > 0.7 ? 'warning' : 'safe'}`}
                        style={{ width: `${calculatePercentage(monthlyBudget.spent, monthlyBudget.amount)}%` }}
                      ></div>
                    </div>
                    <div className="progress-label">
                      {calculatePercentage(monthlyBudget.spent, monthlyBudget.amount)}% sử dụng
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Category Budget Form */}
          <div className="budget-card">
            <h2>Ngân sách theo danh mục</h2>
            
            <form onSubmit={handleCategoryBudgetSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label" htmlFor="category-select">Danh mục:</label>
                  <div className="select-container">
                    <select
                      id="category-select"
                      className="select-input"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories && categories.length > 0 ? (
                        categories
                          // Include all categories except known income types
                          .filter(cat => {
                            // If the category has a type, filter by expense type
                            if (cat.type) {
                              return cat.type === 'expense';
                            }
                            // If no type, filter out known income category names
                            const incomeCategories = ['Salary', 'Investment', 'Side Income', 'Refund', 'Other Income', 'Savings/Investment'];
                            return !incomeCategories.includes(cat.name);
                          })
                          .map(category => (
                            <option key={category.id || category.categoryId} value={category.id || category.categoryId}>
                              {category.name}
                            </option>
                          ))
                      ) : (
                        <option value="" disabled>Không có danh mục chi tiêu nào</option>
                      )}
                    </select>
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="input-label" htmlFor="category-budget-amount">Ngân sách:</label>
                  <input
                    id="category-budget-amount"
                    type="number"
                    className="text-input"
                    placeholder="Nhập số tiền"
                    value={categoryBudgetAmount}
                    onChange={(e) => setCategoryBudgetAmount(e.target.value)}
                    required
                  />
                </div>
                
                <button 
                  type="submit"
                  className="submit-btn"
                  disabled={loading || !selectedCategory}
                >
                  {loading ? 'Đang xử lý...' : 'Thêm'}
                </button>
              </div>
            </form>
            
            <div className="category-budgets-container">
              <h3>Danh sách ngân sách theo danh mục</h3>
              
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : categoryBudgets.length === 0 ? (
                <p className="empty-message">Chưa có ngân sách nào được thiết lập cho tháng này</p>
              ) : (
                <div className="budget-table-container">
                  <table className="budget-table">
                    <thead>
                      <tr>
                        <th>Danh mục</th>
                        <th>Ngân sách</th>
                        <th>Đã chi tiêu</th>
                        <th>Còn lại</th>
                        <th>Tiến độ</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryBudgets.map((budget) => {
                        const categoryName = getCategoryName(budget.categoryId);
                        const spent = getCategorySpent(budget.categoryId);
                        // Check which property contains the budget value (could be budget or budget_limit)
                        const budgetAmount = budget.budget_limit || budget.budget || 0;
                        const remaining = budgetAmount - spent;
                        const percentUsed = budgetAmount <= 0 ? 
                          (spent > 0 ? 100 : 0) : // If budget is 0, show 100% if spent > 0, otherwise 0%
                          calculatePercentage(spent, budgetAmount);
                        
                        // Determine progress bar class based on conditions
                        let progressClass = 'safe';
                        if (spent > 0 && budgetAmount <= 0) {
                          progressClass = 'danger';
                        } else if (percentUsed > 90) {
                          progressClass = 'danger';
                        } else if (percentUsed > 70) {
                          progressClass = 'warning';
                        }
                        
                        return (
                          <tr key={budget.id}>
                            <td>{categoryName}</td>
                            <td>{formatCurrency(budgetAmount)}</td>
                            <td>{formatCurrency(spent)}</td>
                            <td className={remaining >= 0 ? 'remaining' : 'over-budget'}>
                              {formatCurrency(remaining)}
                            </td>
                            <td>
                              <div className="progress-bar">
                                <div
                                  className={`progress ${progressClass}`}
                                  style={{ width: `${percentUsed}%` }}
                                ></div>
                              </div>
                              <span className="progress-text">{percentUsed}%</span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleDeleteCategoryBudget(budget.id)}
                                className="delete-btn"
                                title="Xóa ngân sách danh mục này"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </StyledBudgets>
    </MainLayout>
  );
};

// Add the styled component definition
const StyledBudgets = styled.div`
  --input-focus: #4E6679;
  --font-color: #000000;
  --font-color-sub: #464969;
  --bg-color: #FFF;
  --main-color: #000000;
  --green-color: #80B878;
  --red-color: #C7424F;
  --yellow-color: #F2A561;
  
  padding: 20px;
  background-color: #FFF5E9;
  min-height: 100%;
  font-family: 'Courier New', monospace;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .page-title {
    font-size: 28px;
    font-weight: 900;
    color: var(--main-color);
    margin-bottom: 24px;
    border-bottom: 2px solid #000000;
    padding-bottom: 12px;
  }
  
  .budget-top-row {
    display: flex;
    gap: 0;
    margin-bottom: 32px;
    align-items: stretch;
    justify-content: stretch;
    width: 100%;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px 0 var(--main-color);
    overflow: hidden;
    background-color: var(--bg-color);
    @media (max-width: 900px) {
      flex-direction: column;
      gap: 0;
      border: none;
      box-shadow: none;
      overflow: visible;
    }
  }
  
  .budget-left-col {
    flex: 0 0 50%;
    max-width: 50%;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    gap: 0;
    justify-content: stretch;
    @media (max-width: 900px) {
      border: 2px solid var(--main-color);
      box-shadow: 4px 4px 0 var(--main-color);
    }
  }
  .budget-left-col .budget-card {
    margin-bottom: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
    flex: 1 0 auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  .budget-left-col .budget-card + .budget-card {
    margin-top: 0;
    border-top: 2px solid var(--main-color);
  }
  .budget-right-col {
    flex: 0 0 50%;
    max-width: 50%;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    border-left: 2px solid var(--main-color);
    background-color: var(--bg-color);
    @media (max-width: 900px) {
      border: 2px solid var(--main-color);
      box-shadow: 4px 4px 0 var(--main-color);
      margin-top: 16px;
    }
  }
  .budget-right-col .budget-summary {
    height: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    text-align: center;
    margin: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 20px;
    background-color: var(--bg-color);
  }
  .card-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--main-color);
    margin-bottom: 16px;
   
    padding-bottom: 8px;
    text-align: center;
    width: 100%;
  }
  .select-group {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    font-weight: 700;
    font-size: 16px;
    padding: 8px 12px;
    border-bottom: 1px dashed #E2E8F0;
    background: #F7FAFC;
    border-radius: 4px;
    width: 100%;
  }
  .summary-row:first-of-type {
    background: #EBF8FF;
    border: 1px solid #4299E1;
  }
  .summary-row:last-child {
    border-bottom: none;
    margin-bottom: 16px;
  }
  .summary-row .amount {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 0.5px;
    &.expense {
      color: #F56565;
    }
    &.remaining {
      color: #48BB78;
    }
    &.over-budget {
      color: #C7424F;
    }
  }
  .summary-row:first-of-type .amount {
    font-size: 24px;
    color: #3182CE;
    text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.8);
  }
  .progress-container {
    margin-top: 10px;
    margin-bottom: 0;
    width: 100%;
  }
  .progress-bar {
    height: 12px;
    border: 2px solid #5A67D8;
    background: #E2E8F0;
    box-shadow: 2px 2px 0 #5A67D8;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;
  }
  .progress-bar .progress {
    height: 100%;
    border-radius: 0;
    transition: width 0.4s cubic-bezier(.4,2,.6,1);
    &.safe {
      background: #48BB78;
    }
    &.warning {
      background: #F6E05E;
    }
    &.danger {
      background: #F56565;
    }
  }
  .progress-label {
    text-align: right;
    font-size: 13px;
    color: #5A67D8;
    font-family: 'Press Start 2P', 'Courier New', monospace;
    font-weight: 700;
    margin-top: 0;
  }
  
  .category-budgets-container {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 2px solid var(--main-color);
  }
  
  .empty-message {
    text-align: center;
    padding: 20px 0;
    color: var(--font-color);
    font-style: italic;
  }
  
  .budget-table-container {
    border: 2px solid #000;
    margin-top: 16px;
    box-shadow: 4px 4px 0 #000;
    overflow-x: auto;
  }
  
  .budget-table {
    text-align: center;
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #000000;
      border-right: 2px solid #000000;
    }
    
    th {
      font-weight: 700;
      color: var(--font-color);
      background-color: #89D9D9;
    }
    
    td {
      background-color: #ffffff;
    }
    
    .remaining {
      color: var(--green-color);
    }
    
    .over-budget {
      color: var(--red-color);
    }
    
    tbody tr:hover td {
      background-color: #f0f0f0;
    }
  }
  
  .delete-btn {
    padding: 6px 12px;
    border-radius: 0;
    border: 2px solid var(--main-color);
    background-color: var(--red-color);
    color: var(--main-color);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 2px 2px 0 var(--main-color);
    font-family: 'Courier New', monospace;
    
    &:hover:not(:disabled) {
      background-color: #E06B51;
      box-shadow: 3px 3px 0 var(--main-color);
    }
    
    &:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 1px 1px 0 var(--main-color);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 0;
    border-top-color: #000000;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }
  
  .loading-spinner-small {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 0;
    border-top-color: #000000;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    
    .form-row {
      flex-direction: column;
      align-items: stretch;
    }
    
    .budget-table {
      display: block;
      overflow-x: auto;
    }
  }
  
  .select-input {
    padding: 8px 12px;
    border-radius: 0;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 2px 2px 0 var(--main-color);
    font-size: 14px;
    font-weight: 600;
    color: var(--font-color);
    outline: none;
    font-family: 'Courier New', monospace;
    max-height: 38px;
    
    &:focus {
      border-color: var(--input-focus);
    }
    
    /* Add scrollability to dropdown */
    & option {
      max-height: 100px;
      overflow-y: auto;
    }
  }
  
  /* Force the select dropdown to show more items */
  #category-select {
    height: 38px !important; /* Fixed height to solve issues */
    overflow-y: visible;
    white-space: nowrap;
    -webkit-appearance: menulist;
    appearance: menulist;
    
    option {
      padding: 8px;
    }
  }
  
  /* Add a container style to control dropdown size */
  .select-container {
    position: relative;
    width: 100%;
    
    .select-input {
      width: 100%;
    }
  }
  
  @media (max-width: 900px) {
    .budget-left-col, .budget-right-col {
      max-width: 100%;
      min-width: 0;
      flex: 1 1 100%;
    }
  }
  
  .month-selection-card {
    flex: 1;
  }
  
  .total-budget-card {
    flex: 1.5;
  }
  
  .section {
    margin-bottom: 30px;
    
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: var(--main-color);
      margin-bottom: 16px;
    }
  }
  
  .budget-card {
    background: var(--bg-color);
    border-radius: 0;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px 0 var(--main-color);
    padding: 20px;
    margin-bottom: 20px;
    transition: transform 0.2s;
    image-rendering: pixelated;
    
    &:hover {
      transform: translateY(-2px);
    }
  }
  
  .form-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .input-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--font-color);
  }
  
  .text-input, .select-input {
    padding: 8px 12px;
    border-radius: 0;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 2px 2px 0 var(--main-color);
    font-size: 14px;
    font-weight: 600;
    color: var(--font-color);
    outline: none;
    font-family: 'Courier New', monospace;
    
    &:focus {
      border-color: var(--input-focus);
    }
  }
  
  .submit-btn, .action-btn {
    padding: 8px 16px;
    border-radius: 0;
    border: 2px solid var(--main-color);
    background-color: #89D9D9;
    color: var(--main-color);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 3px 3px 0 var(--main-color);
    font-family: 'Courier New', monospace;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 5px 5px 0 var(--main-color);
      background-color: #72B6CF;
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 2px 2px 0 var(--main-color);
      background-color: #5C8BA8;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;

export default Budgets;