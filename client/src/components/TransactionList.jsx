import { useState, useEffect } from 'react';
import { getCurrentUserTransactions, deleteTransaction, searchTransactions } from '../services/transactions';
import { toast } from 'react-toastify';
import TransactionFilter from './TransactionFilter';
import TransactionEdit from './TransactionEdit';
import styled from 'styled-components';

const TransactionList = ({ refreshTrigger, filter = 'all', onTransactionChange }) => {
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
        
        // Apply type filter based on the filter prop
        if (filter !== 'all') {
          transactionsData = transactionsData.filter(t => t.type === filter);
        }
        
        // Sort transactions by date added (newest first)
        transactionsData.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA; // Newest first
        });

        
        console.log('Transactions loaded:', transactionsData);
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
  }, [refreshTrigger, currentFilters, isFiltering, filter]);
  
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
    // Make sure we have a valid ID
    if (!id) {
      console.error("Invalid transaction ID:", id);
      toast.error('ID giao dịch không hợp lệ');
      return;
    }
    
    // Set the transaction ID to open the modal
    console.log('Setting transaction ID for editing:', id);
    
    try {
      // Reset any previous ID before setting the new one
      setEditingTransactionId(null);
      
      // Wait for state update to complete using setTimeout
      setTimeout(() => {
        setEditingTransactionId(id);
        console.log('Edited transaction ID state set to:', id);
      }, 50);
    } catch (error) {
      console.error("Error setting transaction ID:", error);
      toast.error("Có lỗi xảy ra khi mở modal chỉnh sửa");
    }
  };
  
  // Xử lý khi giao dịch đã được cập nhật
  const handleTransactionUpdated = () => {
    // Increment the refresh trigger to reload the transaction list
    console.log("Transaction updated, refreshing list with filter:", filter);
    
    // If onTransactionChange prop exists, call it to notify parent component
    if (typeof onTransactionChange === 'function') {
      onTransactionChange();
    } else {
      // Otherwise just refresh this component
      setRefreshTrigger(prev => prev + 1);
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
        <div className="filter-notification">
          <span>
            <strong>Đang lọc:</strong> {Object.keys(currentFilters).length} điều kiện được áp dụng
          </span>
          <button
            onClick={() => handleFilterChange({})}
            className="clear-filter-button"
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
      <StyledTransactionList>
        {renderFilter()}
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>Đang tải dữ liệu...</span>
        </div>
      </StyledTransactionList>
    );
  }
  
  if (error) {
    return (
      <StyledTransactionList>
        {renderFilter()}
        <div className="error-message">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Thử lại
          </button>
        </div>
      </StyledTransactionList>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <StyledTransactionList>
        {renderFilter()}
        {renderFilterNotification()}
        <div className="empty-message">
          <p>
            {isFiltering 
              ? 'Không tìm thấy giao dịch nào khớp với điều kiện lọc.' 
              : 'Bạn chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên!'}
          </p>
        </div>
      </StyledTransactionList>
    );
  }
  
  return (
    <StyledTransactionList>
      {renderFilter()}
      {renderFilterNotification()}
      
      <div className="table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Danh mục</th>
              <th>Loại</th>
              <th>Số tiền</th>
              <th>Ghi chú</th>
              <th className="actions-column">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              // Ensure we have a consistent ID value
              const transactionId = transaction.id || transaction.transactionId;
              
              return (
                <tr key={transactionId}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.category?.name || 'N/A'}</td>
                  <td>
                    <span className={`transaction-type ${transaction.type}`}>
                      {transaction.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                    </span>
                  </td>
                  <td className={`amount ${transaction.type}`}>
                    {formatAmount(transaction.amount)}
                  </td>
                  <td className="note-cell">
                    {transaction.note || ''}
                  </td>
                  <td className="actions-cell">
                    <button 
                      onClick={() => handleEdit(transactionId)}
                      className="edit-button"
                      aria-label="Sửa giao dịch"
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(transactionId)}
                      className="delete-button"
                      aria-label="Xóa giao dịch"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Modal chỉnh sửa giao dịch */}
      {editingTransactionId && (
        <TransactionEdit
          key={`edit-transaction-${editingTransactionId}`}
          transactionId={editingTransactionId}
          onClose={() => {
            console.log("Closing edit modal");
            setEditingTransactionId(null);
          }}
          onTransactionUpdated={() => {
            console.log("Transaction updated, refreshing list");
            handleTransactionUpdated();
          }}
        />
      )}
    </StyledTransactionList>
  );
};

const StyledTransactionList = styled.div`
  --input-focus: #5A67D8;
  --font-color: #2D3748;
  --font-color-sub: #4A5568;
  --bg-color: #FFF;
  --main-color: #2D3748;
  --green-color: #48BB78;
  --red-color: #F56565;
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    gap: 16px;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(90, 103, 216, 0.1);
    border-radius: 50%;
    border-top-color: var(--input-focus);
    animation: spin 1s ease-in-out infinite;
  }
  
  .error-message {
    background-color: #FFF5F5;
    border: 1px solid #FED7D7;
    color: var(--red-color);
    padding: 16px;
    border-radius: 5px;
    margin-bottom: 16px;
    text-align: center;
    
    .retry-button {
      margin-top: 12px;
      color: var(--red-color);
      text-decoration: underline;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 600;
      
      &:hover {
        color: #C53030;
      }
    }
  }
  
  .filter-notification {
    background-color: #EBF8FF;
    border: 1px solid #BEE3F8;
    color: #3182CE;
    padding: 12px 16px;
    border-radius: 5px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .clear-filter-button {
      color: #3182CE;
      text-decoration: underline;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 600;
      
      &:hover {
        color: #2C5282;
      }
    }
  }
  
  .empty-message {
    background-color: #F7FAFC;
    border: 1px solid #E2E8F0;
    color: var(--font-color-sub);
    padding: 24px;
    border-radius: 5px;
    text-align: center;
    font-weight: 500;
  }
  
  .table-container {
    overflow-x: auto;
    border-radius: 5px;
    border: 1px solid #E2E8F0;
  }
  
  .transaction-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    
    th, td {
      padding: 10px 14px;
      text-align: left;
    }
    
    th {
      background-color: #F8FAFC;
      font-weight: 600;
      color: var(--font-color);
      border-bottom: 1px solid #E2E8F0;
      white-space: nowrap;
      
      &:first-child {
        border-top-left-radius: 5px;
      }
      
      &:last-child {
        border-top-right-radius: 5px;
      }
      
      &.actions-column {
        text-align: right;
      }
    }
    
    td {
      border-bottom: 1px solid #E2E8F0;
      color: var(--font-color);
      
      &.note-cell {
        max-width: 200px;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--font-color-sub);
      }
      
      &.actions-cell {
        text-align: right;
        white-space: nowrap;
      }
      
      &.amount {
        font-weight: 600;
        
        &.income {
          color: var(--green-color);
        }
        
        &.expense {
          color: var(--red-color);
        }
      }
    }
    
    tr:hover {
      background-color: rgba(237, 242, 247, 0.5);
    }
    
    .transaction-type {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      
      &.income {
        background-color: rgba(72, 187, 120, 0.1);
        color: var(--green-color);
        border: 1px solid rgba(72, 187, 120, 0.3);
      }
      
      &.expense {
        background-color: rgba(245, 101, 101, 0.1);
        color: var(--red-color);
        border: 1px solid rgba(245, 101, 101, 0.3);
      }
    }
    
    .edit-button,
    .delete-button {
      background: none;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      
      &:hover {
        opacity: 0.8;
      }
    }
    
    .edit-button {
      color: var(--input-focus);
      margin-right: 12px;
    }
    
    .delete-button {
      color: var(--red-color);
    }
  }
  
  // Higher z-index to ensure modal appears above everything
  position: relative;
  z-index: 1;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default TransactionList; 