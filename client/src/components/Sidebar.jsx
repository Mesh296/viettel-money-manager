import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaChartPie, FaExchangeAlt, FaTags, FaWallet, FaBell, FaSignOutAlt, FaUser } from 'react-icons/fa';
import styled from 'styled-components';

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
                <FaUser className="avatar-icon" />
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
                    <FaChartPie className="nav-icon" />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/transactions" 
                    className={`nav-link ${isActive('/transactions') ? 'active' : ''}`}
                  >
                    <FaExchangeAlt className="nav-icon" />
                    <span>Giao dịch</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/categories" 
                    className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
                  >
                    <FaTags className="nav-icon" />
                    <span>Danh mục</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/budgets" 
                    className={`nav-link ${isActive('/budgets') ? 'active' : ''}`}
                  >
                    <FaWallet className="nav-icon" />
                    <span>Ngân sách</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/alerts" 
                    className={`nav-link ${isActive('/alerts') ? 'active' : ''}`}
                  >
                    <FaBell className="nav-icon" />
                    <span>Cảnh báo</span>
                  </Link>
                </li>
              </ul>
            </nav>
            
            <div className="logout-container">
              <button 
                onClick={logout}
                className="logout-button"
              >
                <FaSignOutAlt className="logout-icon" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </>
        )}
        
        {!isAuthenticated && (
          <div className="auth-links">
            <Link to="/login" className="auth-button login-button">
              Đăng nhập
            </Link>
            <Link to="/register" className="auth-button register-button">
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </StyledSidebar>
  );
};

const StyledSidebar = styled.aside`
  background-color: #ffffff;
  height: 100%;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  padding: 0;
  
  .sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 24px 20px;
  }
  
  .logo-container {
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f5f5f5;
  }
  
  .logo {
    font-size: 24px;
    font-weight: 700;
    color: #5A67D8;
    text-decoration: none;
    letter-spacing: -0.5px;
    display: block;
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #EBF4FF 0%, #E6FFFA 100%);
    border-radius: 12px;
    margin-bottom: 24px;
  }
  
  .avatar-container {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #5A67D8;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    color: white;
  }
  
  .avatar-icon {
    font-size: 18px;
  }
  
  .user-info {
    flex: 1;
    overflow: hidden;
  }
  
  .user-name {
    font-weight: 600;
    color: #2D3748;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .user-email {
    font-size: 12px;
    color: #718096;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .navigation {
    flex: 1;
  }
  
  .nav-title {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    color: #718096;
    margin-bottom: 16px;
    margin-top: 0;
    letter-spacing: 1px;
    padding-left: 8px;
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
    color: #4A5568;
    font-weight: 500;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #F7FAFC;
      color: #5A67D8;
      border-color: #E2E8F0;
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    &.active {
      background-color: #5A67D8;
      color: white;
      border-color: #4C51BF;
      box-shadow: 0 4px 10px rgba(90, 103, 216, 0.4);
      
      &:hover {
        background-color: #4C51BF;
        transform: translateY(-2px);
      }
    }
  }
  
  .nav-icon {
    margin-right: 12px;
    font-size: 18px;
  }
  
  .logout-container {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #f5f5f5;
  }
  
  .logout-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    cursor: pointer;
    outline: none;
    border: 0;
    vertical-align: middle;
    text-decoration: none;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    color: #C53030;
    text-transform: uppercase;
    padding: 12px 16px;
    background: #FFF0F0;
    border: 2px solid #E53E3E;
    border-radius: 8px;
    transform-style: preserve-3d;
    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), 
                background 150ms cubic-bezier(0, 0, 0.58, 1);
    
    .logout-icon {
      margin-right: 8px;
    }
    
    &::before {
      position: absolute;
      content: '';
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #FED7D7;
      border-radius: inherit;
      box-shadow: 0 0 0 2px #E53E3E, 0 0.5em 0 0 #FFF5F5;
      transform: translate3d(0, 0.6em, -1em);
      transition: transform 150ms cubic-bezier(0, 0, 0.58, 1),
                  box-shadow 150ms cubic-bezier(0, 0, 0.58, 1);
    }
    
    &:hover {
      background: #FFF5F5;
      transform: translate(0, 0.25em);
      
      &::before {
        box-shadow: 0 0 0 2px #E53E3E, 0 0.4em 0 0 #FFF5F5;
        transform: translate3d(0, 0.45em, -1em);
      }
    }
    
    &:active {
      background: #FFF5F5;
      transform: translate(0em, 0.6em);
      
      &::before {
        box-shadow: 0 0 0 2px #E53E3E, 0 0 #FFF5F5;
        transform: translate3d(0, 0, -1em);
      }
    }
  }
  
  .auth-links {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 24px;
  }
  
  .auth-button {
    position: relative;
    display: inline-block;
    cursor: pointer;
    outline: none;
    vertical-align: middle;
    text-decoration: none;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    text-align: center;
    padding: 12px 16px;
    border-radius: 8px;
    transform-style: preserve-3d;
    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), 
                background 150ms cubic-bezier(0, 0, 0.58, 1);
                
    &::before {
      position: absolute;
      content: '';
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: inherit;
      transition: transform 150ms cubic-bezier(0, 0, 0.58, 1),
                  box-shadow 150ms cubic-bezier(0, 0, 0.58, 1);
    }
  }
  
  .login-button {
    color: #5A67D8;
    background: #EBF4FF;
    border: 2px solid #5A67D8;
    
    &::before {
      background: #E6FFFA;
      box-shadow: 0 0 0 2px #5A67D8, 0 0.5em 0 0 #EBF4FF;
      transform: translate3d(0, 0.6em, -1em);
    }
    
    &:hover {
      background: #EDF2F7;
      transform: translate(0, 0.25em);
      
      &::before {
        box-shadow: 0 0 0 2px #5A67D8, 0 0.4em 0 0 #EBF4FF;
        transform: translate3d(0, 0.45em, -1em);
      }
    }
    
    &:active {
      background: #EDF2F7;
      transform: translate(0em, 0.6em);
      
      &::before {
        box-shadow: 0 0 0 2px #5A67D8, 0 0 #EBF4FF;
        transform: translate3d(0, 0, -1em);
      }
    }
  }
  
  .register-button {
    color: white;
    background: #5A67D8;
    border: 2px solid #4C51BF;
    
    &::before {
      background: #4C51BF;
      box-shadow: 0 0 0 2px #4C51BF, 0 0.5em 0 0 #C3DAFE;
      transform: translate3d(0, 0.6em, -1em);
    }
    
    &:hover {
      background: #667EEA;
      transform: translate(0, 0.25em);
      
      &::before {
        box-shadow: 0 0 0 2px #4C51BF, 0 0.4em 0 0 #C3DAFE;
        transform: translate3d(0, 0.45em, -1em);
      }
    }
    
    &:active {
      background: #667EEA;
      transform: translate(0em, 0.6em);
      
      &::before {
        box-shadow: 0 0 0 2px #4C51BF, 0 0 #C3DAFE;
        transform: translate3d(0, 0, -1em);
      }
    }
  }
`;

export default Sidebar; 