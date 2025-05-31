import { useState, useEffect } from 'react';
import { getCurrentUserTransactions } from '../services/transactions';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const RecentTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tải danh sách giao dịch gần đây
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        setLoading(true);
        // Lấy 3 giao dịch gần nhất
        const data = await getCurrentUserTransactions({ limit: 3 });
        
        // Sort by createdAt date, newest first
        const sortedData = Array.isArray(data) ? [...data].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date);
          const dateB = new Date(b.createdAt || b.date);
          return dateB - dateA;
        }) : [];
        
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
  }, []);
  
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
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Đang tải dữ liệu...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-4 rounded text-center">
        <p>Bạn chưa có giao dịch nào.</p>
        <Link to="/transactions" className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block">
          Thêm giao dịch mới
        </Link>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ngày
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Danh mục
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Loại
            </th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Số tiền
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.transactionId}>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                {formatDate(transaction.date)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                {transaction.category?.name || 'N/A'}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                </span>
              </td>
              <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium text-right ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(transaction.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-right">
        <Link to="/transactions" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Xem tất cả giao dịch →
        </Link>
      </div>
    </div>
  );
};

export default RecentTransactions; 