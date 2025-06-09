import React from 'react';
import styled from 'styled-components';
import Sidebar from '../components/Sidebar';
import PixelMenuButton from '../components/PixelMenuButton';

const PixelDemo = () => {
  return (
    <PageLayout>
      <SidebarContainer>
        <Sidebar />
      </SidebarContainer>
      <MainContent>
        <DemoSection>
          <h1>Pixel Button Demo</h1>
          <p>Below are examples of pixel-style buttons as requested:</p>
          
          <ButtonContainer>
            <PixelMenuButton to="/learn-more">Learn more</PixelMenuButton>
            <PixelMenuButton to="/media">Media</PixelMenuButton>
            <PixelMenuButton to="/careers">Careers</PixelMenuButton>
          </ButtonContainer>
          
          <InfoSection>
            <h2>Implementation Details</h2>
            <ul>
              <li>Sidebar has been updated with HackerNoon pixel icons</li>
              <li>Drop shadows removed from sidebar</li>
              <li>Background color changed to white with black border</li>
              <li>Buttons styled with pixel art design</li>
              <li>Icons: <i className="hn hn-bell-solid"></i> alert, 
                <i className="hn hn-wallet-solid"></i> budget, 
                <i className="hn hn-chart-line-solid"></i> dashboard, 
                <i className="hn hn-credit-card"></i> transaction, 
                <i className="hn hn-github"></i> user avatar
              </li>
            </ul>
          </InfoSection>
        </DemoSection>
      </MainContent>
    </PageLayout>
  );
};

const PageLayout = styled.div`
  display: flex;
  height: 100vh;
`;

const SidebarContainer = styled.div`
  width: 280px;
  height: 100%;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 24px;
  background-color: #f5f5f5;
  overflow-y: auto;
`;

const DemoSection = styled.section`
  background-color: white;
  border: 2px solid #000;
  padding: 24px;
  margin-bottom: 24px;
  
  h1 {
    font-family: 'Courier New', monospace;
    margin-top: 0;
    border-bottom: 2px solid #000;
    padding-bottom: 12px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  margin: 24px 0;
  flex-wrap: wrap;
`;

const InfoSection = styled.div`
  margin-top: 32px;
  border-top: 2px solid #000;
  padding-top: 24px;
  
  h2 {
    font-family: 'Courier New', monospace;
    margin-top: 0;
  }
  
  ul {
    font-family: 'Courier New', monospace;
  }
  
  .hn {
    margin: 0 8px;
    font-size: 20px;
  }
`;

export default PixelDemo; 