import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">MM-Viettel App</Link>
        
        <div className="flex space-x-4 items-center">
          {isAuthenticated ? (
            <>
              <span className="text-gray-300">Xin chào, {user?.name || 'User'}</span>
              <Link to="/dashboard" className="hover:text-blue-300">Dashboard</Link>
              <button 
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-300">Đăng nhập</Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 