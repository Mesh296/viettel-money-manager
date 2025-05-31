import { useState, useEffect } from 'react';
import { getCurrentUserTransactions, deleteTransaction, searchTransactions } from '../services/transactions';
import { toast } from 'react-toastify';
import TransactionFilter from './TransactionFilter';
import TransactionEdit from './TransactionEdit';

const TransactionList = ({ refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [isFiltering, setIsFiltering] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  
  // Tải danh sách giao dịch
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        let response;
        if (isFiltering && Object.keys(currentFilters).length > 0) {
          // Nếu đang lọc, gọi API search
          response = await searchTransactions(currentFilters);
        } else {
          // Nếu không, gọi API lấy tất cả giao dịch
          response = await getCurrentUserTransactions();
        }
        
        // Kiểm tra cấu trúc dữ liệu và xác định đúng mảng giao dịch
        let transactionsData = [];
        if (response && Array.isArray(response)) {
          transactionsData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          transactionsData = response.data;
        } else {
          console.warn('Unexpected response format:', response);
          transactionsData = [];
        }
        
        // Sort transactions by date added (newest first)
        transactionsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date);
          const dateB = new Date(b.createdAt || b.date);
          return dateB - dateA; // Newest first
        });
        
        console.log('Transactions loaded:', response);
        setTransactions(transactionsData);
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
  }, [refreshTrigger, currentFilters, isFiltering]);
  
  // Xử lý khi thay đổi bộ lọc
  const handleFilterChange = (filterParams) => {
    if (Object.keys(filterParams).length > 0) {
      setIsFiltering(true);
      setCurrentFilters(filterParams);
    } else {
      setIsFiltering(false);
      setCurrentFilters({});
    }
  };
  
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
  
  // Mở modal chỉnh sửa giao dịch
  const handleEdit = (id) => {
    console.log('Opening edit modal for transaction ID:', id);
    // Đảm bảo ID không bị null
    if (id) {
      setEditingTransactionId(id);
      // Debug cho người dùng
      toast.info(`Đang mở modal chỉnh sửa cho giao dịch: ${id.substring(0, 8)}...`);
      console.log('EditingTransactionId has been set to:', id);
    } else {
      console.error('Cannot open edit modal: Transaction ID is null or undefined');
      toast.error('Không thể mở modal chỉnh sửa: ID giao dịch không hợp lệ');
    }
  };
  
  // Xử lý khi giao dịch đã được cập nhật
  const handleTransactionUpdated = () => {
    // Tải lại danh sách giao dịch
    if (isFiltering) {
      // Nếu đang lọc, áp dụng lại bộ lọc hiện tại
      handleFilterChange(currentFilters);
    } else {
      // Nếu không, tải lại tất cả
      setCurrentFilters({});
      setIsFiltering(false);
    }
  };
  
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
  
  // Render bộ lọc
  const renderFilter = () => {
    return <TransactionFilter onFilterChange={handleFilterChange} />;
  };
  
  // Render thông báo nếu đang lọc
  const renderFilterNotification = () => {
    if (isFiltering) {
      return (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
          <span className="text-sm text-blue-700">
            <span className="font-medium">Đang lọc:</span> {Object.keys(currentFilters).length} điều kiện được áp dụng
          </span>
          <button
            onClick={() => handleFilterChange({})}
            className="text-sm text-blue-700 hover:text-blue-900 underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      );
    }
    return null;
  };
  
  if (loading) {
    return (
      <div>
        {renderFilter()}
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        {renderFilter()}
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-red-700 underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div>
        {renderFilter()}
        {renderFilterNotification()}
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
          <p>
            {isFiltering 
              ? 'Không tìm thấy giao dịch nào khớp với điều kiện lọc.' 
              : 'Bạn chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên!'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {renderFilter()}
      {renderFilterNotification()}
      
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
              <tr key={transaction.id || transaction.transactionId}>
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
                    onClick={() => handleEdit(transaction.transactionId)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(transaction.id || transaction.transactionId)}
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
      
      {/* Modal chỉnh sửa giao dịch */}
      {editingTransactionId && (
        <>
          {/* Thông báo debug hiển thị cho người dùng */}
          <div className="fixed top-0 left-0 right-0 bg-yellow-200 p-4 mb-4 text-center z-[2000]">
            Modal đang mở với ID: {editingTransactionId}
          </div>
          <TransactionEdit
            key={`edit-transaction-${editingTransactionId}`}
            transactionId={editingTransactionId}
            onClose={() => {
              console.log('Closing modal...');
              setEditingTransactionId(null);
            }}
            onTransactionUpdated={handleTransactionUpdated}
          />
        </>
      )}
    </div>
  );
};

export default TransactionList; 