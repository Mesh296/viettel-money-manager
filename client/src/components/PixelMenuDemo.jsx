import React from 'react';
import styled from 'styled-components';
import PixelMenuButton from './PixelMenuButton';

const PixelMenuDemo = () => {
  return (
    <DemoContainer>
      <ButtonRow>
        <PixelMenuButton to="/learn-more">Learn more</PixelMenuButton>
        <PixelMenuButton to="/media">Media</PixelMenuButton>
        <PixelMenuButton to="/careers">Careers</PixelMenuButton>
      </ButtonRow>
    </DemoContainer>
  );
};

const DemoContainer = styled.div`
  padding: 20px;
  background-color: #ffffff;
  border: 2px solid #000000;
  margin: 20px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

export default PixelMenuDemo; 