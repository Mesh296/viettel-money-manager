import { useState, useEffect } from 'react';
import { getCurrentUserTransactions } from '../services/transactions';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const RecentTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Listen for transaction updates from the chatbot
  useEffect(() => {
    const handleTransactionUpdate = () => {
      console.log('Recent transaction refresh triggered by event');
      setRefreshKey(prevKey => prevKey + 1);
    };
    
    // Add event listener
    window.addEventListener('transactionsUpdated', handleTransactionUpdate);
    
    // Clean up
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionUpdate);
    };
  }, []);
  
  // Tải danh sách giao dịch gần đây
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        setLoading(true);
        // Lấy tất cả giao dịch
        const data = await getCurrentUserTransactions();
        
        // Sort by date, newest first, then take only 3
        const sortedData = Array.isArray(data) ? [...data].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        }).slice(0, 4) : [];
        
        setTransactions(sortedData);
        setError(null);
      } catch (error) {
        console.error('Error loading recent transactions:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải giao dịch gần đây');
        toast.error(error.message || 'Có lỗi xảy ra khi tải giao dịch gần đây');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentTransactions();
  }, [refreshKey]);
  
  // Format số tiền
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Format ngày
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      
      // Kiểm tra nếu dateString là chuỗi ISO (từ API)
      if (typeof dateString === 'string') {
        // Nếu là định dạng DD-MM-YYYY
        if (dateString.includes('-') && dateString.split('-').length === 3) {
          const parts = dateString.split('-');
          // Nếu phần đầu tiên có thể là ngày (1-31)
          if (parts[0].length <= 2 && parseInt(parts[0]) <= 31) {
            // Chuyển từ DD-MM-YYYY sang YYYY-MM-DD để Date có thể parse
            const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            return new Intl.DateTimeFormat('vi-VN', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            }).format(new Date(formattedDate));
          }
        }
        
        // Nếu là định dạng DD/MM/YYYY
        if (dateString.includes('/') && dateString.split('/').length === 3) {
          const parts = dateString.split('/');
          // Nếu phần đầu tiên có thể là ngày (1-31)
          if (parts[0].length <= 2 && parseInt(parts[0]) <= 31) {
            // Chuyển từ DD/MM/YYYY sang YYYY-MM-DD để Date có thể parse
            const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            return new Intl.DateTimeFormat('vi-VN', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            }).format(new Date(formattedDate));
          }
        }
      }
      
      // Xử lý trường hợp chuỗi ISO hoặc đối tượng Date
      return new Intl.DateTimeFormat('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).format(new Date(dateString));
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return dateString || 'N/A';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-2">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-sm">Đang tải...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
        <p>{error}</p>
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-3 rounded text-center text-sm">
        <p>Bạn chưa có giao dịch nào.</p>
        <Link to="/transactions" className="text-blue-600 hover:text-blue-800 underline mt-1 inline-block text-sm">
          Thêm giao dịch mới
        </Link>
      </div>
    );
  }
  
  return (
    <div className="transaction-list">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ngày
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Danh mục
            </th>
            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Số tiền
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.transactionId || transaction.id} className="transaction-row">
              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                {formatDate(transaction.date)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {transaction.category?.name || 'N/A'}
              </td>
              <td className={`px-3 py-2 whitespace-nowrap text-xs font-medium text-right ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(transaction.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 text-right">
        <Link to="/transactions" className="text-blue-600 hover:text-blue-800 text-xs font-medium">
          Xem tất cả giao dịch →
        </Link>
      </div>
    </div>
  );
};

export default RecentTransactions; 