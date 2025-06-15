import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import PixelButton from './PixelButton';
import cuteCat from '../assets/cute-cat-white.gif';


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
              <img src={cuteCat} alt="user avater" style={{width: "50px", height: "50px"}}/>
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
  background-color: #ffffff;
  height: 100%;
  border-right: 2px solid #cbd5e1;
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
    border-bottom: 2px solid #cbd5e1;
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
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    margin-bottom: 24px;
  }
  
  .avatar-container {
    width: 40px;
    height: 40px;

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
    border-radius: 8px;
    text-decoration: none;
    color: #000000;
    font-weight: 500;
    border: 2px solid #cbd5e1;
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
    border-top: 2px solid #cbd5e1;
  }
  
  .logout-button {
    background-color: #C7424F !important;
    border-color: #8b2e37 !important;
    color: #ffffff !important;
    
    &:hover {
      background-color: #E06B51 !important;
      transform: translate(-2px, -2px) !important;
    }
    
    &:active {
      transform: translate(2px, 2px) !important;
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