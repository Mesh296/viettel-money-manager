import React from 'react';
import styled from 'styled-components';
import botLogo from '../assets/bot-logo.webp';

const QuoteBanner = () => {
  return (
    <StyledBanner>
      <div className="banner-container">
        <div className="logo-container">
          <img src={botLogo} alt="Finance Bot Logo" className="logo" />
        </div>
        <div className="speech-bubble">
          <p className="quote">"Save money and money will save you"</p>
        </div>
      </div>
    </StyledBanner>
  );
};

const StyledBanner = styled.div`
  display: inline-flex;
  align-items: center;
  margin-right: 24px;
  
  .banner-container {
    display: flex;
    align-items: center;
    position: relative;
  }
  
  .logo-container {
    display: flex;
    align-items: center;
    z-index: 2;
  }
  
  .logo {
    width: 60px;
    height: 60px;
    object-fit: contain;
  }
  
  .speech-bubble {
    position: relative;
    background: #ffffff;
    border: 2px solid #cbd5e1;
    border-radius: 12px;
    padding: 12px 16px;
    margin-left: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    z-index: 1;
    
    &:before {
      content: '';
      position: absolute;
      left: -10px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-right: 10px solid #cbd5e1;
      z-index: 0;
    }
    
    &:after {
      content: '';
      position: absolute;
      left: -7px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-right: 8px solid #ffffff;
      z-index: 1;
    }
  }
  
  .quote {
    font-family: 'Courier New', monospace;
    font-weight: 700;
    font-size: 16px;
    color: #000000;
    margin: 0;
    font-style: italic;
    white-space: nowrap;
  }
  
  @media (max-width: 768px) {
    display: flex;
    margin-right: 0;
    margin-bottom: 16px;
    
    .banner-container {
      width: 100%;
    }
    
    .logo {
      width: 50px;
      height: 50px;
    }
    
    .quote {
      font-size: 14px;
      white-space: normal;
    }
  }
`;

export default QuoteBanner; 