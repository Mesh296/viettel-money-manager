import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { IconContext } from "react-icons";
import styled from 'styled-components';

const MainLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <IconContext.Provider value={{ className: "react-icons" }}>
      <StyledLayout isAuthenticated={isAuthenticated}>
        {/* Sidebar */}
        {isAuthenticated && (
          <div className="sidebar-column">
            <Sidebar />
          </div>
        )}
        
        {/* Main content */}
        <div className="content-column">
          <div className="content-container">
            {children}
          </div>
        </div>
      </StyledLayout>
    </IconContext.Provider>
  );
};

const StyledLayout = styled.div`
  display: grid;
  grid-template-columns: ${props => props.isAuthenticated ? '280px 1fr' : '1fr'};
  min-height: 100vh;
  background-color: #FFF5E9;
  
  .sidebar-column {
    position: fixed;
    width: 280px;
    height: 100vh;
    z-index: 10;
  }
  
  .content-column {
    grid-column: 2 / -1;
    padding: 24px;
  }
  
  .content-container {
    max-width: 1400px;
    margin: 0 auto;
    height: 100%;
  }
  
  /* Responsive styles */
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    
    .sidebar-column {
      width: 240px;
    }
    
    .content-column {
      margin-left: ${props => props.isAuthenticated ? '240px' : '0'};
    }
  }
  
  @media (max-width: 768px) {
    .sidebar-column {
      width: 100%;
      height: auto;
      position: relative;
    }
    
    .content-column {
      margin-left: 0;
      grid-column: 1;
      padding: 16px;
    }
  }
`;

export default MainLayout; 