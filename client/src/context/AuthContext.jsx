import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { getUserInfo, login as loginApi } from '../services/auth';
import { 
  setAuthToken, 
  getAuthToken, 
  clearAuthToken, 
  setAxiosAuthToken 
} from '../utils/auth';

// Create context
const AuthContext = createContext();

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state based on stored token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAuthToken();

        
        if (token) {
          setAxiosAuthToken(axios, token);
          
          try {

            const userData = await getUserInfo();

            setUser(userData);
          } catch (userError) {
            console.error('AuthContext init: Lỗi khi lấy thông tin user:', userError);
            // Nếu không lấy được thông tin user, xóa token
            clearAuthToken();
            setUser(null);
          }
        } else {

          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext init: Lỗi khởi tạo auth:", error);
        clearAuthToken();
        setUser(null);
      } finally {

        setLoading(false);
      }
    };


    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await loginApi(email, password);

      
      // Xử lý các trường hợp khác nhau của response từ server
      let token, refreshToken, userData;
      
      if (response.token) {
        // Trường hợp 1: response = { token, refreshToken, user }
        token = response.token;
        refreshToken = response.refreshToken;
        userData = response.user;
      } else if (response.data && response.data.token) {
        // Trường hợp 2: response = { data: { token, refreshToken, user } }
        token = response.data.token;
        refreshToken = response.data.refreshToken;
        userData = response.data.user;
      } else if (response.accessToken) {
        // Trường hợp 3: response = { accessToken, refreshToken, userData }
        token = response.accessToken;
        refreshToken = response.refreshToken;
        userData = response.userData || response.user;
      } else {
        console.error('Auth context: Không tìm thấy token trong response', response);
        throw new Error('Cấu trúc response không hợp lệ');
      }

      
      if (!token) {
        throw new Error('Token không hợp lệ');
      }
      
      // Lưu tokens
      setAuthToken(token, refreshToken);
      setAxiosAuthToken(axios, token);
      
      // Nếu không có userData từ response, thực hiện một request riêng để lấy thông tin user
      if (!userData) {
        console.log('Auth context: Không có userData, gọi API getUserInfo');
        try {
          userData = await getUserInfo();
          console.log('Auth context: Đã lấy userData từ API:', userData);
        } catch (userError) {
          console.error('Auth context: Lỗi khi lấy thông tin user:', userError);
        }
      }
      
      // Set user state
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Auth context: Lỗi đăng nhập:', error);
      setError(error.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    clearAuthToken();
    setAxiosAuthToken(axios, null);
    setUser(null);
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    get isAuthenticated() {
      const hasToken = !!getAuthToken();
      
      // Trong giai đoạn vừa đăng nhập, chúng ta có token nhưng chưa có user
      // Cho phép redirect đến dashboard trong trường hợp này
      // Nếu thực sự không có user, component sẽ được render lại khi API trả về
      return hasToken; // Không kiểm tra user để cho phép chuyển hướng
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 