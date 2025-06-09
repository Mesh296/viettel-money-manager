import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import PixelButton from './PixelButton';

const Sidebar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <StyledSidebar>
      <div className="sidebar-container">
        <div className="logo-container">
          <Link to="/" className="logo">MMV Finance</Link>
        </div>
        
        {isAuthenticated && (
          <>
            <div className="user-profile">
              <div className="avatar-container">
                <i className="hn hn-github"></i>
              </div>
              <div className="user-info">
                <p className="user-name">{user?.name || 'User'}</p>
                <p className="user-email">{user?.email || ''}</p>
              </div>
            </div>
            
            <nav className="navigation">
              <h2 className="nav-title">Menu</h2>
              <ul className="nav-list">
                <li>
                  <Link 
                    to="/dashboard" 
                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  >
                    <i className="hn hn-chart-line-solid nav-icon"></i>
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/transactions" 
                    className={`nav-link ${isActive('/transactions') ? 'active' : ''}`}
                  >
                    <i className="hn hn-credit-card nav-icon"></i>
                    <span>Giao dịch</span>
                  </Link>
                </li>
          
                <li>
                  <Link 
                    to="/budgets" 
                    className={`nav-link ${isActive('/budgets') ? 'active' : ''}`}
                  >
                    <i className="hn hn-wallet-solid nav-icon"></i>
                    <span>Ngân sách</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/alerts" 
                    className={`nav-link ${isActive('/alerts') ? 'active' : ''}`}
                  >
                    <i className="hn hn-bell-solid nav-icon"></i>
                    <span>Cảnh báo</span>
                  </Link>
                </li>
              </ul>
            </nav>
            
            <div className="logout-container">
              <PixelButton onClick={logout} className="logout-button">
                Đăng xuất
              </PixelButton>
            </div>
          </>
        )}
        
        {!isAuthenticated && (
          <div className="auth-links">
            <PixelButton to="/login">
              Đăng nhập
            </PixelButton>
            <PixelButton to="/register">
              Đăng ký
            </PixelButton>
          </div>
        )}
      </div>
    </StyledSidebar>
  );
};

const StyledSidebar = styled.aside`
  background-color: #FFF5E9;
  height: 100%;
  border-right: 2px solid #000000;
  display: flex;
  flex-direction: column;
  box-shadow: none;
  padding: 0;
  image-rendering: pixelated;
  
  .sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 24px 20px;
  }
  
  .logo-container {
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 2px solid #000000;
  }
  
  .logo {
    font-size: 24px;
    font-weight: 700;
    color: #000000;
    text-decoration: none;
    letter-spacing: -0.5px;
    display: block;
    font-family: 'Courier New', monospace;
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: #ffffff;
    border: 2px solid #000000;
    border-radius: 0;
    margin-bottom: 24px;
  }
  
  .avatar-container {
    width: 40px;
    height: 40px;
    border: 2px solid #000000;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    color: #000000;
  }
  
  .user-info {
    flex: 1;
    overflow: hidden;
  }
  
  .user-name {
    font-weight: 600;
    color: #000000;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: 'Courier New', monospace;
  }
  
  .user-email {
    font-size: 12px;
    color: #000000;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: 'Courier New', monospace;
  }
  
  .navigation {
    flex: 1;
  }
  
  .nav-title {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    color: #000000;
    margin-bottom: 16px;
    margin-top: 0;
    letter-spacing: 1px;
    padding-left: 8px;
    font-family: 'Courier New', monospace;
  }
  
  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .nav-link {
    position: relative;
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 0;
    text-decoration: none;
    color: #000000;
    font-weight: 500;
    border: 2px solid #000000;
    transition: all 0.2s ease;
    font-family: 'Courier New', monospace;
    background-color: #ffffff;
    
    &:hover {
      background-color: #f0f0f0;
      color: #000000;
    }
    
    &.active {
      background-color: #000000;
      color: white;
    }
  }
  
  .nav-icon {
    margin-right: 12px;
    font-size: 18px;
  }
  
  .logout-container {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 2px solid #000000;
  }
  
  .logout-button {
    background-color: #C7424F !important;
    border-color: #000000 !important;
    color: #000000 !important;
    box-shadow: 4px 4px 0 #000000 !important;
    
    &:hover {
      background-color: #E06B51 !important;
      transform: translate(-2px, -2px) !important;
      box-shadow: 6px 6px 0 #000000 !important;
    }
    
    &:active {
      transform: translate(2px, 2px) !important;
      box-shadow: 2px 2px 0 #000000 !important;
      background-color: #942C4B !important;
    }
  }
  
  .auth-links {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 24px;
  }
`;

export default Sidebar; 