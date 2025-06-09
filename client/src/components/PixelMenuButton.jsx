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
  border: 3px solid #000000;
  box-shadow: 3px 3px 0 #000000;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: transform 0.1s, box-shadow 0.1s;
  margin: 4px;
  image-rendering: pixelated;
  position: relative;
  transform-style: preserve-3d;
  
  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 #000000;
    background-color: #B1D480;
  }
  
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0 #000000;
    background-color: #658D78;
  }
  
  &::after {
    content: '';
    position: absolute;
    z-index: -1;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: #000000;
    transform: translateZ(-1px);
  }
`;

const StyledButton = styled.button`
  ${buttonStyles}
`;

const StyledLink = styled(Link)`
  ${buttonStyles}
`;

export default PixelMenuButton; 