import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useEffect } from 'react';
import { getUserInfo } from '../services/auth';

const Dashboard = () => {
  const { user, loading } = useAuth();
  
  // Nếu user chưa load, hiển thị trạng thái loading
  if (loading || !user) {
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
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Chào mừng bạn đến với hệ thống!</h2>
            <p className="text-gray-600">
              Đây là trang dashboard của bạn. Bạn đã đăng nhập thành công vào hệ thống.
              Các tính năng khác sẽ được phát triển trong các bài tập tiếp theo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 