import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">MMV Finance</Link>
          {isAuthenticated && (
            <button className="md:hidden p-2" id="mobile-menu-button">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
            </button>
          )}
        </div>
        
        <div className={`mt-3 md:mt-0 md:flex md:space-x-3 items-center`}>
          {isAuthenticated ? (
            <>
              <span className="text-gray-300 block md:inline mr-4">Xin chào, {user?.name || 'User'}</span>
              
              <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0 mt-2 md:mt-0">
                <Link to="/dashboard" className="hover:text-blue-300 py-1">Dashboard</Link>
                <Link to="/transactions" className="hover:text-blue-300 py-1">Giao dịch</Link>
                <Link to="/categories" className="hover:text-blue-300 py-1">Danh mục</Link>
                <Link to="/budgets" className="hover:text-blue-300 py-1">Ngân sách</Link>
                <Link to="/alerts" className="hover:text-blue-300 py-1">Cảnh báo</Link>
                
                <button 
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded mt-2 md:mt-0"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <div className="flex space-x-4">
              <Link to="/login" className="hover:text-blue-300">Đăng nhập</Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 