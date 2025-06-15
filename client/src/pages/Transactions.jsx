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

  // Listen for transaction updates from the chatbot or other components
  useEffect(() => {
    const handleTransactionUpdate = () => {
      console.log('Main transactions page refresh triggered by event');
      setRefreshTrigger(prev => prev + 1);
    };
    
    // Add event listener
    window.addEventListener('transactionsUpdated', handleTransactionUpdate);
    
    // Clean up
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionUpdate);
    };
  }, []);

  // Callback when a transaction is created or updated
  const handleTransactionChange = () => {
    // Increment to trigger refresh
    setRefreshTrigger(prev => prev + 1);
  };
  
  const filterTransactions = (tab) => {
    // Update active tab
    setActiveTab(tab);
    // Trigger refresh of the transaction list with the new filter
    setRefreshTrigger(prev => prev + 1);
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
            
            <TransactionList 
              refreshTrigger={refreshTrigger} 
              filter={activeTab} 
              onTransactionChange={handleTransactionChange} 
            />
          </div>
        </div>
      </StyledTransactions>
    </MainLayout>
  );
};

const StyledTransactions = styled.div`
  --input-focus: #4E6679;
  --font-color: #000000;
  --font-color-sub: #464969;
  --bg-color: #FFF;
  --bg-color-alt: #ffffff;
  --main-color: #000000;
  --green-color: #80B878;
  --red-color: #C7424F;
  --yellow-color: #F2A561;
  
  padding: 20px;
  background-color: var(--bg-color-alt);
  min-height: 100%;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .page-title {
    font-size: 28px;
    font-weight: 900;
    color: var(--main-color);
    margin-bottom: 24px;
    border-bottom: 2px solid #000000;
    padding-bottom: 12px;
  }
  
  .section {
    margin-bottom: 20px;
  }
  
  .transaction-card {
    background: #ffffff;
    border-radius: 8px;
    border: 2px solid #cbd5e1;
   
    padding: 20px;
    margin-bottom: 20px;
    transition: transform 0.2s;
    width: 100%;
    box-sizing: border-box;
    
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: var(--main-color);
      margin-bottom: 16px;
      margin-top: 0;
      border-bottom: 2px solid var(--main-color);
      padding-bottom: 8px;
    }
  }
  
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
    
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: var(--main-color);
      margin: 0;
    }
    
    @media (max-width: 600px) {
      flex-direction: column;
      align-items: flex-start;
    }
  }
  
  .filter-buttons {
    display: flex;
    gap: 8px;
    
    @media (max-width: 600px) {
      width: 100%;
      justify-content: space-between;
    }
  }
  
  .filter-btn {
    padding: 8px 16px;
    border-radius: 0;
    border: 2px solid #cbd5e1;
    background-color: #fff;
    font-weight: 600;
    color: var(--main-color);
    cursor: pointer;
    transition: all 0.2s;

    font-family: 'Courier New', monospace;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 #cbd5e1;
    }
    
    &.active {
      background-color: #89D9D9;
      color: var(--main-color);
      border-color: #52A8A8;
      transform: translateY(-1px);
      box-shadow: 3px 3px 0 #52A8A8;
    }
    
    &.income.active {
      background-color: var(--green-color);
      color: var(--main-color);
    }
    
    &.expense.active {
      background-color: var(--red-color);
      color: #ffffff;
      border-color: #8b2e37;
    }
  }
`;

export default Transactions; 