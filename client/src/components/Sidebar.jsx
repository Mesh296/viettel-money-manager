import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaChartPie, FaExchangeAlt, FaTags, FaWallet, FaBell, FaSignOutAlt, FaUser } from 'react-icons/fa';

const Sidebar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <aside className="col-span-3 p-6 border-r border-gray-200 bg-white">
      <Link to="/" className="text-xl font-bold mb-6 block">MMV Finance</Link>
      
      {isAuthenticated && (
        <>
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <div className="flex items-center mb-2">
              <FaUser className="text-blue-500 mr-2" />
              <p className="font-medium">{user?.name || 'User'}</p>
            </div>
            <p className="text-sm text-gray-500">{user?.email || ''}</p>
          </div>
          
          <h2 className="text-lg font-semibold mb-4">Menu</h2>
          <ul className="space-y-2">
            <li>
              <Link to="/dashboard" className="flex items-center text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50">
                <FaChartPie className="mr-3" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/transactions" className="flex items-center text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50">
                <FaExchangeAlt className="mr-3" />
                <span>Giao dịch</span>
              </Link>
            </li>
            <li>
              <Link to="/categories" className="flex items-center text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50">
                <FaTags className="mr-3" />
                <span>Danh mục</span>
              </Link>
            </li>
            <li>
              <Link to="/budgets" className="flex items-center text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50">
                <FaWallet className="mr-3" />
                <span>Ngân sách</span>
              </Link>
            </li>
            <li>
              <Link to="/alerts" className="flex items-center text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50">
                <FaBell className="mr-3" />
                <span>Cảnh báo</span>
              </Link>
            </li>
          </ul>
          
          <div className="mt-8">
            <button 
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded w-full flex items-center justify-center"
            >
              <FaSignOutAlt className="mr-2" />
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