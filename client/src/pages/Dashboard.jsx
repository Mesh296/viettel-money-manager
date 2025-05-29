import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useEffect, useState, useCallback } from 'react';
import { getSummaryStatistics } from '../services/statistics';
import { toast } from 'react-toastify';
import RecentTransactions from '../components/RecentTransactions';
import MonthlyChart from '../components/MonthlyChart';
import CategorySpendingChart from '../components/CategorySpendingChart';
import AlertWidget from '../components/AlertWidget';

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
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-lg">Đang tải thông tin người dùng...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Thông tin người dùng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Họ tên:</p>
                <p className="font-medium">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email:</p>
                <p className="font-medium">{user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Cảnh báo */}
          <div className="mb-6">
            <AlertWidget />
          </div>
          
          {/* Thống kê tổng quan */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thống kê tháng {statistics?.monthName || ''}</h2>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3">Đang tải thống kê...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 text-red-700 underline"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Thu nhập */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-green-800 mb-1">Tổng thu nhập</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(statistics?.totalIncome || 0)}
                  </p>
                </div>
                
                {/* Chi tiêu */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="text-sm font-medium text-red-800 mb-1">Tổng chi tiêu</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {formatAmount(statistics?.totalExpense || 0)}
                  </p>
                </div>
                
                {/* Số dư */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Số dư</h3>
                  <p className={`text-2xl font-bold ${statistics?.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatAmount(statistics?.balance || 0)}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Biểu đồ thu chi theo tháng */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Biểu đồ thu chi theo tháng</h2>
            <MonthlyChart year={new Date().getFullYear()} />
          </div>
          
          {/* Biểu đồ chi tiêu theo danh mục */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Chi tiêu theo danh mục</h2>
            <CategorySpendingChart 
              month={new Date().getMonth() + 1} 
              year={new Date().getFullYear()} 
            />
          </div>
          
          {/* Giao dịch gần đây */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Giao dịch gần đây</h2>
            <RecentTransactions />
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Chào mừng bạn đến với hệ thống!</h2>
            <p className="text-gray-600">
              Đây là trang dashboard của bạn. Bạn có thể xem thống kê tổng hợp tài chính của mình ở đây.
              Sử dụng thanh điều hướng để truy cập các chức năng khác của ứng dụng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 