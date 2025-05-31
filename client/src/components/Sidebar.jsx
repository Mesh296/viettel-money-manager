import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <aside className="col-span-3 p-6 border-r border-gray-200 bg-white">
      <Link to="/" className="text-xl font-bold mb-6 block">MMV Finance</Link>
      
      {isAuthenticated && (
        <>
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <p className="font-medium">Xin chào, {user?.name || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.email || ''}</p>
          </div>
          
          <h2 className="text-lg font-semibold mb-4">Menu</h2>
          <ul className="space-y-2">
            <li>
              <Link to="/dashboard" className="flex items-center text-gray-700 hover:text-blue-600">
                <span className="mr-2">📊</span>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/transactions" className="flex items-center text-gray-700 hover:text-blue-600">
                <span className="mr-2">💵</span>
                <span>Giao dịch</span>
              </Link>
            </li>
            <li>
              <Link to="/categories" className="flex items-center text-gray-700 hover:text-blue-600">
                <span className="mr-2">🏷️</span>
                <span>Danh mục</span>
              </Link>
            </li>
            <li>
              <Link to="/budgets" className="flex items-center text-gray-700 hover:text-blue-600">
                <span className="mr-2">💰</span>
                <span>Ngân sách</span>
              </Link>
            </li>
            <li>
              <Link to="/alerts" className="flex items-center text-gray-700 hover:text-blue-600">
                <span className="mr-2">🔔</span>
                <span>Cảnh báo</span>
              </Link>
            </li>
          </ul>
          
          <div className="mt-8">
            <button 
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded w-full"
            >
              Đăng xuất
            </button>
          </div>
        </>
      )}
      
      {!isAuthenticated && (
        <div className="flex flex-col space-y-3">
          <Link to="/login" className="text-blue-600 hover:text-blue-800">Đăng nhập</Link>
          <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white text-center">
            Đăng ký
          </Link>
        </div>
      )}
    </aside>
  );
};

export default Sidebar; 