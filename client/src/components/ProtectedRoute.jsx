import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  console.log('ProtectedRoute: isAuthenticated =', isAuthenticated);
  console.log('ProtectedRoute: loading =', loading);
  console.log('ProtectedRoute: user =', user);
  console.log('ProtectedRoute: token =', getAuthToken() ? 'Có' : 'Không');

  if (loading) {
    console.log('ProtectedRoute: Đang tải...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Không xác thực, chuyển hướng đến /login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: Đã xác thực, hiển thị nội dung');
  return children;
};

export default ProtectedRoute; 