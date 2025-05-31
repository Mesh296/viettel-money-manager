import { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { toast } from 'react-toastify';
import styled from 'styled-components';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'income', 'expense'

  // Callback when a transaction is created or updated
  const handleTransactionChange = () => {
    // Increment to trigger refresh
    setRefreshTrigger(prev => prev + 1);
  };
  
  const filterTransactions = (tab) => {
    setActiveTab(tab);
  };

  return (
    <MainLayout>
      <StyledTransactions>
        <div className="container">
          <h1 className="page-title">Quản lý giao dịch</h1>
          
          <div className="transaction-card">
            <h2>Thêm giao dịch mới</h2>
            <TransactionForm onTransactionChange={handleTransactionChange} />
          </div>
          
          <div className="section">
            <div className="header-row">
              <h2>Danh sách giao dịch</h2>
              
              <div className="filter-buttons">
                <button 
                  onClick={() => filterTransactions('all')}
                  className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                >
                  Tất cả
                </button>
                <button 
                  onClick={() => filterTransactions('income')}
                  className={`filter-btn income ${activeTab === 'income' ? 'active' : ''}`}
                >
                  Thu nhập
                </button>
                <button 
                  onClick={() => filterTransactions('expense')}
                  className={`filter-btn expense ${activeTab === 'expense' ? 'active' : ''}`}
                >
                  Chi tiêu
                </button>
              </div>
            </div>
            
            <div className="transaction-card">
              <TransactionList 
                refreshTrigger={refreshTrigger} 
                filter={activeTab} 
                onTransactionChange={handleTransactionChange} 
              />
            </div>
          </div>
        </div>
      </StyledTransactions>
    </MainLayout>
  );
};

const StyledTransactions = styled.div`
  --input-focus: #5A67D8;
  --font-color: #2D3748;
  --font-color-sub: #4A5568;
  --bg-color: #FFF;
  --bg-color-alt: #FFF5E9;
  --main-color: #2D3748;
  --green-color: #48BB78;
  --red-color: #F56565;
  --yellow-color: #F6E05E;
  
  padding: 20px;
  background-color: var(--bg-color-alt);
  min-height: 100%;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .page-title {
    font-size: 28px;
    font-weight: 900;
    color: var(--main-color);
    margin-bottom: 24px;
  }
  
  .section {
    margin-bottom: 20px;
  }
  
  .transaction-card {
    background: var(--bg-color);
    border-radius: 8px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
    padding: 20px;
    margin-bottom: 20px;
    transition: transform 0.2s;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: var(--main-color);
      margin-bottom: 16px;
    }
  }
  
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: var(--main-color);
      margin: 0;
    }
  }
  
  .filter-buttons {
    display: flex;
    gap: 8px;
  }
  
  .filter-btn {
    padding: 6px 12px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    font-weight: 600;
    color: var(--font-color);
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: #f3f4f6;
    }
    
    &.active {
      background-color: var(--input-focus);
      color: white;
    }
    
    &.income.active {
      background-color: var(--green-color);
      color: white;
    }
    
    &.expense.active {
      background-color: var(--red-color);
      color: white;
    }
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    
    .header-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      
      h2 {
        margin-bottom: 0;
      }
    }
    
    .filter-buttons {
      width: 100%;
      
      .filter-btn {
        flex: 1;
        text-align: center;
      }
    }
  }
`;

export default Transactions; 