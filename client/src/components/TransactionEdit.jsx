import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { updateTransaction, getTransactionById } from '../services/transactions';
import { getAllCategories } from '../services/categories';

const TransactionEdit = ({ transactionId, onClose, onTransactionUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [transaction, setTransaction] = useState({
    categoryId: '',
    type: 'expense',
    amount: '',
    date: '',
    note: ''
  });
  
  // Tải dữ liệu giao dịch và danh mục
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('TransactionEdit - Loading transaction with ID:', transactionId);
        
        // Tải thông tin giao dịch cần cập nhật
        const transactionData = await getTransactionById(transactionId);
        console.log('TransactionEdit - Transaction data received:', transactionData);
        
        // Tải danh sách danh mục
        const categoriesData = await getAllCategories();
        
        setCategories(categoriesData);
        
        // Định dạng ngày từ API thành định dạng YYYY-MM-DD cho input date
        let formattedDate = '';
        if (transactionData.date) {
          const date = new Date(transactionData.date);
          formattedDate = date.toISOString().split('T')[0];
          console.log('TransactionEdit - Formatted date for input:', formattedDate);
        }
        
        setTransaction({
          categoryId: transactionData.categoryId,
          type: transactionData.type,
          amount: transactionData.amount,
          date: formattedDate,
          note: transactionData.note || ''
        });
        
        setLoading(false);
      } catch (error) {
        console.error('TransactionEdit - Error loading transaction:', error);
        toast.error('Không thể tải thông tin giao dịch');
        setLoading(false);
        onClose();
      }
    };
    
    fetchData();
  }, [transactionId, onClose]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransaction({
      ...transaction,
      [name]: value
    });
  };
  
  // Format ngày từ YYYY-MM-DD sang DD-MM-YYYY cho API
  const formatDateForAPI = (htmlDate) => {
    if (!htmlDate) return '';
    const [year, month, day] = htmlDate.split('-');
    return `${day}-${month}-${year}`;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!transaction.categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    
    if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    if (!transaction.date) {
      toast.error('Vui lòng chọn ngày');
      return;
    }
    
    try {
      setSubmitting(true);
      console.log('TransactionEdit - Submitting update for transaction ID:', transactionId);
      
      // Chuyển đổi định dạng ngày trước khi gửi đến API
      const formattedTransaction = {
        ...transaction,
        date: formatDateForAPI(transaction.date)
      };
      
      console.log('TransactionEdit - Formatted data for API:', formattedTransaction);
      
      await updateTransaction(transactionId, formattedTransaction);
      toast.success('Cập nhật giao dịch thành công!');
      onTransactionUpdated();
      onClose();
    } catch (error) {
      console.error('TransactionEdit - Error updating transaction:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật giao dịch');
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cập nhật giao dịch</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loại giao dịch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại giao dịch
            </label>
            <select
              name="type"
              value={transaction.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="income">Thu nhập</option>
              <option value="expense">Chi tiêu</option>
            </select>
          </div>
          
          {/* Danh mục */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
            </label>
            <select
              name="categoryId"
              value={transaction.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Số tiền */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền
            </label>
            <input
              type="number"
              name="amount"
              value={transaction.amount}
              onChange={handleChange}
              placeholder="Nhập số tiền"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="1"
              required
            />
          </div>
          
          {/* Ngày */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày (DD-MM-YYYY)
            </label>
            <input
              type="date"
              name="date"
              value={transaction.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={transaction.note}
              onChange={handleChange}
              placeholder="Nhập ghi chú (không bắt buộc)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            ></textarea>
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={submitting}
            >
              Hủy
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                  <span>Đang cập nhật...</span>
                </div>
              ) : (
                'Cập nhật giao dịch'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionEdit; 