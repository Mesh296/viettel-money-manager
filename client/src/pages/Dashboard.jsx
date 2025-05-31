import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { getSummaryStatistics } from '../services/statistics';
import { toast } from 'react-toastify';
import RecentTransactions from '../components/RecentTransactions';
import MonthlyChart from '../components/MonthlyChart';
import CategorySpendingChart from '../components/CategorySpendingChart';
import AlertWidget from '../components/AlertWidget';
import MainLayout from '../components/MainLayout';
import styled from 'styled-components';

const Dashboard = () => {
  const { user, loading: userLoading } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Thêm hàm để làm mới dữ liệu khi có thay đổi
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Lấy tháng hiện tại
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const data = await getSummaryStatistics(currentMonth, currentYear);
      setStatistics(data);
      setError(null);
    } catch (error) {
      console.error('Error refreshing statistics:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải thống kê');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Tải thống kê khi component mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // Format số tiền
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Nếu user chưa load, hiển thị trạng thái loading
  if (userLoading || !user) {
    return (
      <MainLayout>
        <StyledDashboard>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải thông tin người dùng...</p>
          </div>
        </StyledDashboard>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <StyledDashboard>
        <div className="dashboard-container">
          <h1 className="dashboard-title">Dashboard</h1>
          
          <div className="dashboard-card user-info">
            <h2>Thông tin người dùng</h2>
            <div className="user-info-grid">
              <div>
                <p className="label">Họ tên:</p>
                <p className="value">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="label">Email:</p>
                <p className="value">{user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Cảnh báo */}
          <div className="alert-container">
            <AlertWidget />
          </div>
          
          {/* Thống kê tổng quan */}
          <div className="section">
            <h2>Thống kê tháng {statistics?.monthName || ''}</h2>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <span>Đang tải thống kê...</span>
              </div>
            ) : error ? (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="stats-grid">
                {/* Thu nhập */}
                <div className="dashboard-card income">
                  <h3>Tổng thu nhập</h3>
                  <p className="amount income-amount">
                    {formatAmount(statistics?.totalIncome || 0)}
                  </p>
                </div>
                
                {/* Chi tiêu */}
                <div className="dashboard-card expense">
                  <h3>Tổng chi tiêu</h3>
                  <p className="amount expense-amount">
                    {formatAmount(statistics?.totalExpense || 0)}
                  </p>
                </div>
                
                {/* Số dư */}
                <div className="dashboard-card balance">
                  <h3>Số dư</h3>
                  <p className={`amount ${statistics?.balance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
                    {formatAmount(statistics?.balance || 0)}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Biểu đồ thu chi theo tháng */}
          <div className="section">
            <h2>Biểu đồ thu chi theo tháng</h2>
            <div className="dashboard-card chart-card">
              <MonthlyChart year={new Date().getFullYear()} />
            </div>
          </div>
          
          {/* Biểu đồ chi tiêu theo danh mục */}
          <div className="section">
            <h2>Chi tiêu theo danh mục</h2>
            <div className="dashboard-card chart-card">
              <CategorySpendingChart 
                month={new Date().getMonth() + 1} 
                year={new Date().getFullYear()} 
              />
            </div>
          </div>
          
          {/* Giao dịch gần đây */}
          <div className="section">
            <h2>Giao dịch gần đây</h2>
            <div className="dashboard-card">
              <RecentTransactions />
            </div>
          </div>
          
          <div className="section">
            <div className="dashboard-card welcome-card">
              <h2>Chào mừng bạn đến với hệ thống!</h2>
              <p>
                Đây là trang dashboard của bạn. Bạn có thể xem thống kê tổng hợp tài chính của mình ở đây.
                Sử dụng thanh bên để truy cập các chức năng khác của ứng dụng.
              </p>
            </div>
          </div>
        </div>
      </StyledDashboard>
    </MainLayout>
  );
};

const StyledDashboard = styled.div`
  --input-focus: #5A67D8;
  --font-color: #2D3748;
  --font-color-sub: #4A5568;
  --bg-color: #FFF;
  --bg-color-alt: #FFF5E9;
  --main-color: #2D3748;
  --green-color: #48BB78;
  --red-color: #F56565;
  --yellow-color: #F6E05E;
  
  padding: 20px;
  background-color: var(--bg-color-alt);
  
  .dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .dashboard-title {
    font-size: 28px;
    font-weight: 900;
    color: var(--main-color);
    margin-bottom: 24px;
  }
  
  .dashboard-card {
    padding: 20px;
    background: var(--bg-color);
    border-radius: 8px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
    margin-bottom: 20px;
    transition: transform 0.2s;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    h2 {
      margin: 0 0 16px;
      font-size: 18px;
      font-weight: 700;
      color: var(--main-color);
    }
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--main-color);
      margin-bottom: 8px;
    }
  }
  
  .section {
    margin-bottom: 30px;
    
    > h2 {
      font-size: 20px;
      font-weight: 700;
      color: var(--main-color);
      margin-bottom: 16px;
    }
  }
  
  .user-info {
    background: var(--bg-color);
    
    .user-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .label {
      font-size: 14px;
      color: var(--font-color-sub);
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 16px;
      font-weight: 600;
      color: var(--main-color);
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .income {
    h3 {
      color: var(--green-color);
    }
  }
  
  .expense {
    h3 {
      color: var(--red-color);
    }
  }
  
  .balance {
    h3 {
      color: var(--input-focus);
    }
  }
  
  .amount {
    font-size: 24px;
    font-weight: 700;
  }
  
  .income-amount {
    color: var(--green-color);
  }
  
  .expense-amount {
    color: var(--red-color);
  }
  
  .balance-positive {
    color: var(--input-focus);
  }
  
  .balance-negative {
    color: var(--red-color);
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
    border: 3px solid rgba(90, 103, 216, 0.1);
    border-radius: 50%;
    border-top-color: var(--input-focus);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-message {
    background-color: #FEE2E2;
    border: 1px solid var(--red-color);
    color: #B91C1C;
    padding: 16px;
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
  
  .chart-card {
    padding: 20px;
    height: 350px;
  }
  
  .welcome-card {
    background-color: var(--bg-color);
    
    p {
      color: var(--font-color-sub);
      line-height: 1.6;
    }
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .dashboard-card {
      padding: 16px;
    }
  }
`;

export default Dashboard; 