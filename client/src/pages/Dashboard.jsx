import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { getSummaryStatistics } from '../services/statistics';
import { toast } from 'react-toastify';
import RecentTransactions from '../components/RecentTransactions';
import MonthlyChart from '../components/MonthlyChart';
import CategorySpendingChart from '../components/CategorySpendingChart';
import CategoryTrendChart from '../components/CategoryTrendChart';
import AlertWidget from '../components/AlertWidget';
import MainLayout from '../components/MainLayout';
import styled from 'styled-components';

const Dashboard = () => {
  const { user, loading: userLoading } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Thêm state cho việc chọn tháng
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Hàm xử lý thay đổi tháng
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };
  
  // Hàm xử lý thay đổi năm
  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };
  
  // Thêm hàm để làm mới dữ liệu khi có thay đổi
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const data = await getSummaryStatistics(selectedMonth, selectedYear);
      setStatistics(data);
      setError(null);
    } catch (error) {
      console.error('Error refreshing statistics:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải thống kê');
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth, selectedYear]);
  
  // Listen for transaction updates from the chatbot or other components
  useEffect(() => {
    const handleTransactionUpdate = () => {
      console.log('Dashboard refresh triggered by transactionsUpdated event');
      refreshData();
    };
    
    // Add event listener
    window.addEventListener('transactionsUpdated', handleTransactionUpdate);
    
    // Clean up
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionUpdate);
    };
  }, [refreshData]);
  
  // Tải thống kê khi component mount hoặc khi tháng/năm thay đổi
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // Format số tiền
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Tạo danh sách các tháng để hiển thị trong dropdown
  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];
  
  // Tạo danh sách các năm để hiển thị trong dropdown (5 năm gần đây)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  // Nếu user chưa load, hiển thị trạng thái loading
  if (userLoading) {
    return (
      <MainLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>Đang tải...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <StyledDashboard>
        <div className="dashboard-container">
          <h1 className="page-title">Dashboard</h1>
          
          {/* Bộ chọn tháng và năm */}
          <div className="date-selector-container">
            <div className="date-selector">
              <div>
                <label htmlFor="month-select">Tháng:</label>
                <select 
                  id="month-select"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="year-select">Năm:</label>
                <select 
                  id="year-select"
                  value={selectedYear}
                  onChange={handleYearChange}
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Layout chia thành 2 cột cho desktop và 1 cột cho mobile */}
          <div className="dashboard-grid">
            {/* Cột bên trái */}
            <div className="dashboard-column main-column">
              <div className="section">
                <div className="section-header">
                  <h2>Thống kê {statistics?.monthName || ''} năm {statistics?.year}</h2>
                  <div className="info-icon" data-tooltip="Tổng hợp thu nhập, chi tiêu và số dư trong tháng. Số dư là chênh lệch giữa thu nhập và chi tiêu, không phải là chênh lệch giữa ngân sách và chi tiêu">
                    <i className="hn hn-info-circle"></i>
                  </div>
                </div>
                
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải thống kê...</p>
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <div className="dashboard-card combined-stats-card">
                    <div className="stats-summary">
                      {/* Thu nhập */}
                      <div className="stat-item income">
                        <h3>Tổng thu nhập</h3>
                        <p className="amount income-amount">
                          {formatAmount(statistics?.totalIncome || 0)}
                        </p>
                      </div>
                      
                      {/* Chi tiêu */}
                      <div className="stat-item expense">
                        <h3>Tổng chi tiêu</h3>
                        <p className="amount expense-amount">
                          {formatAmount(statistics?.totalExpense || 0)}
                        </p>
                      </div>
                      
                      {/* Số dư */}
                      <div className="stat-item balance">
                        <h3>Số dư</h3>
                        <p className={`amount ${statistics?.balance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
                          {formatAmount(statistics?.balance || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Biểu đồ thu chi theo tháng */}
              <div className="section">
                <div className="section-header">
                  <h2>Biểu đồ thu chi theo tháng</h2>
                  <div className="info-icon" data-tooltip="Biểu thị thu nhập và chi tiêu theo từng tháng trong năm">
                    <i className="hn hn-info-circle"></i>
                  </div>
                </div>
                <div className="dashboard-card chart-card">
                  <MonthlyChart year={selectedYear} selectedMonth={selectedMonth} />
                </div>
              </div>
              
              {/* Biểu đồ chi tiêu theo danh mục */}
              <div className="section">
                <div className="section-header">
                  <h2>Chi tiêu theo danh mục</h2>
                  <div className="info-icon" data-tooltip="Hiển thị tỷ lệ phần trăm của từng danh mục chi tiêu trong tổng chi tiêu của tháng">
                    <i className="hn hn-info-circle"></i>
                  </div>
                </div>
                <div className="dashboard-card chart-card">
                  <CategorySpendingChart 
                    month={selectedMonth} 
                    year={selectedYear} 
                  />
                </div>
              </div>
              
              {/* Biểu đồ xu hướng chi tiêu theo danh mục */}
              <div className="section">
                <div className="section-header">
                  <h2>Xu hướng chi tiêu theo danh mục</h2>
                  <div className="info-icon" data-tooltip="Theo dõi xu hướng chi tiêu của từng danh mục qua các tháng trong năm">
                    <i className="hn hn-info-circle"></i>
                  </div>
                </div>
                <div className="dashboard-card chart-card">
                  <CategoryTrendChart 
                    year={selectedYear} 
                    maxCategories={5} 
                  />
                </div>
              </div>
            </div>
            
            {/* Cột bên phải */}
            <div className="dashboard-column side-column">
              {/* Giao dịch gần đây */}
              <div className="section">
                <div className="section-header">
                  <h2>Giao dịch gần đây</h2>
                  <div className="info-icon" data-tooltip="Hiển thị các giao dịch mới nhất của bạn">
                    <i className="hn hn-info-circle"></i>
                  </div>
                </div>
                <div className="dashboard-card recent-transactions-card">
                  <RecentTransactions />
                </div>
              </div>
            </div>
          </div>
        </div>
      </StyledDashboard>
    </MainLayout>
  );
};

// Styled component cho dashboard
const StyledDashboard = styled.div`
  --input-focus: #5A67D8;
  --font-color: #2D3748;
  --font-color-sub: #4A5568;
  --bg-color: #FFF;
  --bg-color-alt: #ffffff;
  --main-color: #2D3748;
  --green-color: #48BB78;
  --red-color: #F56565;
  --yellow-color: #F6E05E;
  
  padding: 20px;
  background-color: var(--bg-color-alt);
  min-height: 100%;
  
  .dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .page-title {
    font-size: 28px;
    font-weight: 900;
    color: var(--main-color);
    margin-bottom: 20px;
  }
  
  .date-selector-container {
    margin-bottom: 20px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    padding: 12px 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
  }
  
  .dashboard-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
    
  }
  
  .main-column {
    flex: 2;
  }
  
  .side-column {
    flex: 1;
  }
  
  .section {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    > h2 {
      font-size: 20px;
      font-weight: 700;
      color: var(--main-color);
      margin-bottom: 12px;
      text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.8);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      
      h2 {
        font-size: 20px;
        font-weight: 700;
        color: var(--main-color);
        margin: 0;
        text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.8);
      }
      
      .info-icon {
        cursor: pointer;
        margin-left: 10px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        i {
          font-size: 18px;
          color: var(--main-color);
        }
        
        &:hover {
          i {
            color: var(--input-focus);
          }
        }
      }
    }
  }
  
  .dashboard-card {
    background: var(--bg-color);
    border-radius: 8px;
    border: 2px solid #cbd5e1;
   
    padding: 15px;
    margin-bottom: 15px;
    transition: transform 0.2s;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: var(--main-color);
      margin-bottom: 12px;
    }
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--main-color);
      margin-bottom: 6px;
    }
  }
  
  .chart-card {
    padding: 15px;
    height: 280px;
    display: flex;
    flex-direction: column;
  }
  
  .recent-transactions-card {
    height: auto;
    max-height: 230px;
    padding: 12px;
    overflow-y: auto;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }
  
  .combined-stats-card {
    padding: 20px;
  }
  
  .stats-summary {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 30px;
  }
  
  .stat-item {
    flex: 1;
    min-width: 150px;
    text-align: center;
    padding: 15px;
    border-radius: 6px;
    
    &.income {
      border-left: 4px solid var(--green-color);
      background-color: rgba(72, 187, 120, 0.1);
    }
    
    &.expense {
      border-left: 4px solid var(--red-color);
      background-color: rgba(245, 101, 101, 0.1);
    }
    
    &.balance {
      border-left: 4px solid rgba(114, 182, 207);
      background-color: rgba(114, 182, 207, 0.1);
    }
  }
  
  .income h3 {
    color: var(--green-color);
  }
  
  .expense h3 {
    color: var(--red-color);
  }
  
  .balance h3 {
    color: rgba(114, 182, 207);
  }
  
  .amount {
    font-size: 20px;
    font-weight: 700;
  }
  
  .income-amount {
    color: var(--green-color);
  }
  
  .expense-amount {
    color: var(--red-color);
  }
  
  .balance-positive {
    color: rgba(114, 182, 207);
  }
  
  .balance-negative {
    color: var(--red-color);
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 0;
  }
  
  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(90, 103, 216, 0.1);
    border-radius: 50%;
    border-top-color: var(--input-focus);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 12px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-message {
    background-color: #FEE2E2;
    border: 1px solid var(--red-color);
    color: #B91C1C;
    padding: 12px;
    border-radius: 8px;
    
    button {
      margin-top: 8px;
      color: #B91C1C;
      text-decoration: underline;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
    }
  }
  
  .date-selector {
    display: flex;
    gap: 15px;
    
    select {
      padding: 8px 12px;
      border-radius: 5px;
      border: 2px solid var(--main-color);
      background-color: var(--bg-color);
      box-shadow: 2px 2px var(--main-color);
      font-size: 15px;
      font-weight: 600;
      color: var(--font-color);
      outline: none;
      
      &:focus {
        border-color: var(--input-focus);
      }
    }
    
    label {
      font-weight: 600;
      color: var(--main-color);
      margin-right: 8px;
    }
  }
  
  @media (max-width: 992px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    
    .stats-summary {
      flex-direction: column;
      gap: 15px;
    }
    
    .stat-item {
      width: 100%;
    }
    
    .dashboard-card {
      padding: 12px;
    }
    
    .chart-card {
      height: 250px;
    }
    
    .date-selector {
      flex-direction: column;
      gap: 10px;
      
      > div {
        width: 100%;
        
        select {
          width: 100%;
        }
      }
    }
  }
`;

export default Dashboard;
