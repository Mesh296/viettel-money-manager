import { useState, useEffect } from 'react';
import { getCurrentUserTransactions, deleteTransaction } from '../services/transactions';
import { toast } from 'react-toastify';

const TransactionList = ({ refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tải danh sách giao dịch
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await getCurrentUserTransactions();
        console.log('Transactions loaded:', data);
        setTransactions(data);
        setError(null);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải giao dịch');
        toast.error(error.message || 'Có lỗi xảy ra khi tải giao dịch');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [refreshTrigger]); // Tải lại khi refreshTrigger thay đổi
  
  // Xử lý xóa giao dịch
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này không?')) {
      try {
        await deleteTransaction(id);
        setTransactions(transactions.filter(transaction => transaction.transactionId !== id));
        toast.success('Giao dịch đã được xóa thành công!');
      } catch (error) {
        toast.error(error.message || 'Có lỗi xảy ra khi xóa giao dịch');
      }
    }
  };
  
  // Format số tiền
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Format ngày
  const formatDate = (dateString) => {
    try {
      // Kiểm tra xem dateString có phải định dạng DD-MM-YYYY không
      if (typeof dateString === 'string' && dateString.includes('-')) {
        const parts = dateString.split('-');
        // Nếu có 3 phần và phần đầu tiên là ngày (định dạng DD-MM-YYYY)
        if (parts.length === 3 && parts[0].length <= 2) {
          // Chuyển từ DD-MM-YYYY sang YYYY-MM-DD để Date có thể parse
          const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(formattedDate));
        }
      }
      
      // Nếu không phải định dạng đặc biệt, sử dụng Date trực tiếp
      return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString));
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return dateString || 'N/A';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Đang tải dữ liệu...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-red-700 underline"
        >
          Thử lại
        </button>
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
        <p>Bạn chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên!</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ngày
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Danh mục
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Loại
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Số tiền
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ghi chú
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.transactionId}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(transaction.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.category?.name || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                </span>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(transaction.amount)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {transaction.note || ''}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  onClick={() => handleDelete(transaction.transactionId)}
                  className="text-red-600 hover:text-red-900 ml-2"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList; 