import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { toast } from 'react-toastify';

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
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý giao dịch</h1>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thêm giao dịch mới</h2>
            <TransactionForm onTransactionChange={handleTransactionChange} />
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Danh sách giao dịch</h2>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => filterTransactions('all')}
                  className={`px-3 py-1 rounded ${activeTab === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Tất cả
                </button>
                <button 
                  onClick={() => filterTransactions('income')}
                  className={`px-3 py-1 rounded ${activeTab === 'income' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Thu nhập
                </button>
                <button 
                  onClick={() => filterTransactions('expense')}
                  className={`px-3 py-1 rounded ${activeTab === 'expense' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
      </div>
    </div>
  );
};

export default Transactions; 