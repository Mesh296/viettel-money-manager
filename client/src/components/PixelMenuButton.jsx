import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PixelMenuButton = ({ children, to, onClick, className }) => {
  // If 'to' prop is provided, render as Link, otherwise as button
  if (to) {
    return (
      <StyledLink to={to} className={`pixel-menu-button ${className || ''}`}>
        {children}
      </StyledLink>
    );
  }

  return (
    <StyledButton onClick={onClick} className={`pixel-menu-button ${className || ''}`}>
      {children}
    </StyledButton>
  );
};

const buttonStyles = `
  display: inline-block;
  padding: 8px 16px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-transform: uppercase;
  background-color: #80B878;
  color: #000000;
  border: 2px solid #cbd5e1;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: transform 0.1s;
  margin: 4px;
  image-rendering: pixelated;
  position: relative;
  border-radius: 8px;
  
  &:hover {
    transform: translate(-2px, -2px);
    background-color: #B1D480;
  }
  
  &:active {
    transform: translate(1px, 1px);
    background-color: #658D78;
  }
`;

const StyledButton = styled.button`
  ${buttonStyles}
`;

const StyledLink = styled(Link)`
  ${buttonStyles}
`;

export default PixelMenuButton; 