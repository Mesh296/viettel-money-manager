import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { IconContext } from "react-icons";
import styled from 'styled-components';
import ChatbotWidget from './ChatbotWidget';

const MainLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <IconContext.Provider value={{ className: "react-icons" }}>
      <StyledLayout $isAuthenticated={isAuthenticated}>
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

        {/* Chatbot Widget - chỉ hiển thị khi đã đăng nhập */}
        {isAuthenticated && <ChatbotWidget />}
      </StyledLayout>
    </IconContext.Provider>
  );
};

const StyledLayout = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$isAuthenticated ? '280px 1fr' : '1fr'};
  min-height: 100vh;
  background-color: #ffffff;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  image-rendering: pixelated;
  
  .sidebar-column {
    position: fixed;
    width: 280px;
    height: 100vh;
    z-index: 10;
    border-right: 1px solid #cbd5e1;
  }
  
  .content-column {
    grid-column: 2 / -1;
    padding: 24px;
    color: #000000;
  }
  
  .content-container {
    max-width: 1400px;
    margin: 0 auto;
    height: 100%;
  }
  
  /* Common styles for pixel art design */
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Courier New', monospace;
    color: #000000;
    font-weight: 800;
  }

  p, span, div {
    font-weight: 600;
  }
  
  input, select, button, textarea {
    font-family: 'Courier New', monospace;
    border-radius: 8px;
    border: 2px solid #cbd5e1;
    font-weight: 600;
  }
  
  button {
    background-color: #80B878;
    color: #000000;
    border: 2px solid #cbd5e1;
   
    transition: all 0.2s;
    
    &:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0 #cbd5e1;
    }
    
    &:active:not(:disabled) {
      transform: translate(1px, 1px);
      box-shadow: 1px 1px 0 #cbd5e1;
    }
  }
  
  .card, .panel {
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    background-color: #FFFFFF;
  }
  
  /* Responsive styles */
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    
    .sidebar-column {
      width: 240px;
    }
    
    .content-column {
      margin-left: ${props => props.$isAuthenticated ? '240px' : '0'};
    }
  }
  
  @media (max-width: 768px) {
    .sidebar-column {
      width: 100%;
      height: auto;
      position: relative;
      border-right: none;
      border-bottom: 2px solid #cbd5e1;
    }
    
    .content-column {
      margin-left: 0;
      grid-column: 1;
      padding: 16px;
    }
  }
`;

export default MainLayout; 