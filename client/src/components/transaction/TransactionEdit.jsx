import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { updateTransaction, getTransactionById } from '../../services/transactions';
import { getAllCategories } from '../../services/categories';

// Ultra-simple modal implementation for maximum compatibility
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

  // Apply body style when component mounts
  useEffect(() => {
    // Save original body style
    const originalOverflow = document.body.style.overflow;
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    // Clean up function to restore body style
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Fetch transaction data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Loading transaction data for ID:", transactionId);
        setLoading(true);
        
        // Fetch data in parallel
        const [transactionData, categoriesData] = await Promise.all([
          getTransactionById(transactionId),
          getAllCategories()
        ]);
        
        console.log("Received transaction data:", transactionData);
        console.log("Received categories:", categoriesData?.length);
        
        if (!categoriesData || !Array.isArray(categoriesData)) {
          throw new Error('Invalid categories data');
        }
        
        setCategories(categoriesData);
        
        if (!transactionData) {
          throw new Error('Transaction not found');
        }
        
        // Format the date for the date input
        let formattedDate = '';
        try {
          if (transactionData.date) {
            const dateStr = transactionData.date;
            const date = new Date(dateStr);
            
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          console.error('Error formatting date:', error);
        }
        
        setTransaction({
          categoryId: transactionData.categoryId || '',
          type: transactionData.type || 'expense',
          amount: transactionData.amount || '',
          date: formattedDate,
          note: transactionData.note || ''
        });
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Không thể tải dữ liệu giao dịch');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    
    if (transactionId) {
      fetchData();
    } else {
      console.error("No transaction ID provided");
      onClose();
    }
  }, [transactionId, onClose]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransaction(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Format date for API
  const formatDateForAPI = (htmlDate) => {
    if (!htmlDate) return '';
    
    try {
      const date = new Date(htmlDate);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return htmlDate;
    } catch (error) {
      return htmlDate;
    }
  };
  
  // Handle form submission
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
      
      const formattedTransaction = {
        ...transaction,
        date: formatDateForAPI(transaction.date)
      };
      
      await updateTransaction(transactionId, formattedTransaction);
      toast.success('Cập nhật giao dịch thành công!');
      
      if (typeof onTransactionUpdated === 'function') {
        onTransactionUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Có lỗi xảy ra khi cập nhật giao dịch');
      setSubmitting(false);
    }
  };

  // Modal backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Modal styles - using inline styles for maximum compatibility and avoid any CSS conflicts
  const modalStyles = {
    backdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999 // Super high z-index
    },
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: '8px',
      border: '2px solid #2D3748',
      boxShadow: '4px 4px #2D3748',
      width: '100%',
      maxWidth: '500px',
      margin: '20px',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #E2E8F0',
      padding: '16px 20px',
      backgroundColor: '#F8FAFC',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px'
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#2D3748',
      margin: 0
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#718096',
      padding: '4px'
    },
    form: {
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#2D3748'
    },
    radioGroup: {
      display: 'flex',
      gap: '16px'
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer'
    },
    radioSpan: {
      marginLeft: '6px'
    },
    select: {
      padding: '8px 12px',
      border: '2px solid #2D3748',
      borderRadius: '5px',
      backgroundColor: '#FFF',
      boxShadow: '2px 2px #2D3748',
      fontSize: '15px',
      color: '#2D3748',
      outline: 'none'
    },
    input: {
      padding: '8px 12px',
      border: '2px solid #2D3748',
      borderRadius: '5px',
      backgroundColor: '#FFF',
      boxShadow: '2px 2px #2D3748',
      fontSize: '15px',
      color: '#2D3748',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box'
    },
    textarea: {
      padding: '8px 12px',
      border: '2px solid #2D3748',
      borderRadius: '5px',
      backgroundColor: '#FFF',
      boxShadow: '2px 2px #2D3748',
      fontSize: '15px',
      color: '#2D3748',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box'
    },
    inputWithIcon: {
      position: 'relative'
    },
    currencySymbol: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#718096'
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '8px'
    },
    cancelButton: {
      padding: '8px 16px',
      borderRadius: '5px',
      border: '2px solid #CBD5E0',
      backgroundColor: 'white',
      color: '#4A5568',
      fontWeight: 600,
      cursor: 'pointer'
    },
    submitButton: {
      padding: '8px 16px',
      borderRadius: '5px',
      border: '2px solid #2D3748',
      backgroundColor: '#5A67D8',
      color: 'white',
      fontWeight: 600,
      cursor: 'pointer'
    },
    disabledButton: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    spinnerContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTop: '2px solid white',
      animation: 'spin 1s linear infinite'
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      gap: '16px'
    },
    loadingSpinner: {
      width: '40px',
      height: '40px',
      border: '3px solid rgba(90, 103, 216, 0.1)',
      borderRadius: '50%',
      borderTop: '3px solid #5A67D8',
      animation: 'spin 1s linear infinite'
    }
  };
  
  // Add a style element for the spin animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={modalStyles.backdrop} onClick={handleBackdropClick}>
      <div style={modalStyles.container}>
        {loading ? (
          <div style={modalStyles.loadingContainer}>
            <div style={modalStyles.loadingSpinner}></div>
            <span>Đang tải...</span>
          </div>
        ) : (
          <>
            <div style={modalStyles.header}>
              <h2 style={modalStyles.headerTitle}>Cập nhật giao dịch</h2>
              <button 
                onClick={onClose} 
                style={modalStyles.closeButton}
                aria-label="Đóng"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={modalStyles.form}>
              {/* Loại giao dịch */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>
                  Loại giao dịch
                </label>
                <div style={modalStyles.radioGroup}>
                  <label style={modalStyles.radioLabel}>
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={transaction.type === 'income'}
                      onChange={handleChange}
                    />
                    <span style={modalStyles.radioSpan}>Thu nhập</span>
                  </label>
                  <label style={modalStyles.radioLabel}>
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={transaction.type === 'expense'}
                      onChange={handleChange}
                    />
                    <span style={modalStyles.radioSpan}>Chi tiêu</span>
                  </label>
                </div>
              </div>
              
              {/* Danh mục */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>
                  Danh mục
                </label>
                <select
                  name="categoryId"
                  value={transaction.categoryId || ''}
                  onChange={handleChange}
                  style={modalStyles.select}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option 
                      key={category.id} 
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Số tiền */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>
                  Số tiền
                </label>
                <div style={modalStyles.inputWithIcon}>
                  <input
                    type="number"
                    name="amount"
                    value={transaction.amount}
                    onChange={handleChange}
                    placeholder="Nhập số tiền"
                    style={modalStyles.input}
                    min="1"
                    required
                  />
                  <span style={modalStyles.currencySymbol}>₫</span>
                </div>
              </div>
              
              {/* Ngày */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>
                  Ngày
                </label>
                <input
                  type="date"
                  name="date"
                  value={transaction.date || ''}
                  onChange={handleChange}
                  style={modalStyles.input}
                  required
                />
              </div>
              
              {/* Ghi chú */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>
                  Ghi chú
                </label>
                <textarea
                  name="note"
                  value={transaction.note || ''}
                  onChange={handleChange}
                  placeholder="Nhập ghi chú (không bắt buộc)"
                  style={modalStyles.textarea}
                  rows="3"
                ></textarea>
              </div>
              
              {/* Buttons */}
              <div style={modalStyles.buttonGroup}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    ...modalStyles.cancelButton,
                    ...(submitting ? modalStyles.disabledButton : {})
                  }}
                  disabled={submitting}
                >
                  Hủy
                </button>
                
                <button
                  type="submit"
                  style={{
                    ...modalStyles.submitButton,
                    ...(submitting ? modalStyles.disabledButton : {})
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div style={modalStyles.spinnerContainer}>
                      <div style={modalStyles.spinner}></div>
                      <span>Đang cập nhật...</span>
                    </div>
                  ) : (
                    'Cập nhật giao dịch'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionEdit; 