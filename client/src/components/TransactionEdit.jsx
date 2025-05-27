import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { updateTransaction, getTransactionById } from '../services/transactions';
import { getAllCategories } from '../services/categories';

const ModalPortal = ({ children }) => {
  // Sử dụng modalRoot hoặc body nếu không tìm thấy modalRoot
  const modalRoot = document.getElementById('modal-root') || document.body;
  
  useEffect(() => {
    // Lưu lại styles ban đầu của body
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
    };
    
    // Ghi đè styles của body khi modal mở
    document.body.style.overflow = 'hidden'; // Ngăn scroll
    document.body.style.position = 'relative';
    
    // Log cho debug
    console.log('Modal portal mounted, body styles adjusted');
    
    // Cleanup function
    return () => {
      // Khôi phục lại styles ban đầu
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      console.log('Modal portal unmounted, body styles restored');
    };
  }, []);
  
  return createPortal(children, modalRoot);
};

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
        
        // Tải song song cả giao dịch và danh mục để tối ưu thời gian
        const [transactionData, categoriesData] = await Promise.all([
          getTransactionById(transactionId),
          getAllCategories()
        ]);
        
        console.log('TransactionEdit - Transaction data received:', transactionData);
        console.log('TransactionEdit - Categories data received:', categoriesData);
        
        setCategories(categoriesData || []);
        
        // Định dạng ngày từ API thành định dạng YYYY-MM-DD cho input date
        let formattedDate = '';
        if (transactionData && transactionData.date) {
          // Đầu tiên, log dữ liệu ngày ban đầu để debug
          console.log('Original date from API:', transactionData.date);
          
          try {
            // Xử lý theo từng trường hợp định dạng ngày
            const dateStr = transactionData.date;
            
            if (typeof dateStr === 'string') {
              if (dateStr.includes('T')) {
                // Nếu là ISO string (ví dụ: 2025-05-25T00:00:00.000Z)
                // Tạo đối tượng Date với UTC time và điều chỉnh múi giờ 
                const date = new Date(dateStr);
                
                // Tạo chuỗi YYYY-MM-DD từ ngày được điều chỉnh
                // Lưu ý: toISOString() trả về theo UTC, nên chúng ta cần tách ra và tạo lại
                // bằng cách sử dụng UTC methods
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
                
              } else if (dateStr.includes('-') || dateStr.includes('/')) {
                // Định dạng DD-MM-YYYY hoặc DD/MM/YYYY
                let parts;
                if (dateStr.includes('-')) {
                  parts = dateStr.split('-');
                } else {
                  parts = dateStr.split('/');
                }
                
                // Kiểm tra xem parts[0] có phải là ngày (1-31) không
                if (parts.length === 3 && parseInt(parts[0]) <= 31) {
                  // Nếu là DD-MM-YYYY hoặc DD/MM/YYYY
                  formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else {
                  // Nếu là YYYY-MM-DD hoặc YYYY/MM/DD
                  formattedDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
                }
              }
            } else {
              // Nếu là đối tượng Date
              const date = new Date(dateStr);
              // Tạo chuỗi YYYY-MM-DD mà không bị ảnh hưởng bởi múi giờ
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              formattedDate = `${year}-${month}-${day}`;
            }
          } catch (error) {
            console.error('Error formatting date:', error);
            // Fallback: thử phương pháp đơn giản hơn
            const date = new Date(transactionData.date);
            // Sử dụng UTC methods
            formattedDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
          }
          
          console.log('TransactionEdit - Formatted date for input:', formattedDate);
        } else {
          console.error('TransactionEdit - No valid date in transaction data');
        }
        
        if (transactionData) {
          setTransaction({
            categoryId: transactionData.categoryId,
            type: transactionData.type || 'expense',
            amount: transactionData.amount || '',
            date: formattedDate,
            note: transactionData.note || ''
          });
          console.log('Set transaction state with categoryId:', transactionData.categoryId);
        } else {
          console.error('TransactionEdit - No transaction data returned from API');
          toast.error('Không thể tải thông tin giao dịch');
          onClose();
        }
        
      } catch (error) {
        console.error('TransactionEdit - Error loading transaction:', error);
        toast.error('Không thể tải thông tin giao dịch');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    
    if (transactionId) {
      fetchData();
    } else {
      console.error('TransactionEdit - No transaction ID provided');
      toast.error('Không có ID giao dịch để chỉnh sửa');
      onClose();
    }
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
    
    console.log('formatDateForAPI input:', htmlDate);
    
    try {
      // Nếu định dạng đúng là YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(htmlDate)) {
        const [year, month, day] = htmlDate.split('-');
        const formattedDate = `${day}-${month}-${year}`;
        console.log('formatDateForAPI output:', formattedDate);
        return formattedDate;
      }
      
      // Nếu đã là định dạng DD-MM-YYYY
      if (/^\d{2}-\d{2}-\d{4}$/.test(htmlDate)) {
        console.log('formatDateForAPI: date is already in DD-MM-YYYY format');
        return htmlDate;
      }
      
      // Thử xử lý trường hợp khác
      const date = new Date(htmlDate);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        console.log('formatDateForAPI fallback output:', formattedDate);
        return formattedDate;
      }
      
      // Nếu không đúng định dạng, log lỗi và trả về chuỗi ban đầu
      console.error('formatDateForAPI: Invalid date format, expected YYYY-MM-DD, got:', htmlDate);
      return htmlDate;
    } catch (error) {
      console.error('Error in formatDateForAPI:', error);
      return htmlDate;
    }
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
      
      // Đảm bảo categoryId là một UUID hợp lệ
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(transaction.categoryId)) {
        console.error('Invalid categoryId format:', transaction.categoryId);
        toast.error('ID danh mục không hợp lệ');
        setSubmitting(false);
        return;
      }
      
      // Chuyển đổi định dạng ngày trước khi gửi đến API
      const formattedTransaction = {
        ...transaction,
        categoryId: transaction.categoryId, // Đảm bảo đây là ID của danh mục (UUID)
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
  
  // Hàm render nội dung modal
  const renderContent = () => {
    if (loading) {
      return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-[9999]" 
             style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)'}}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full" style={{border: '5px solid blue'}}>
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3">Đang tải...</span>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-[9999]" 
           style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)'}}>
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full" style={{border: '5px solid red'}}>
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
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('Selected category ID:', value);
                  setTransaction(prev => ({
                    ...prev,
                    categoryId: value
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => {
                  // Log cho mỗi danh mục để debug
                  console.log(`Category option: id=${category.id}, name=${category.name}`);
                  return (
                    <option 
                      key={category.id} 
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  );
                })}
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
  
  // Sử dụng portal để đưa modal ra ngoài cây DOM hiện tại
  return <ModalPortal>{renderContent()}</ModalPortal>;
};

export default TransactionEdit; 