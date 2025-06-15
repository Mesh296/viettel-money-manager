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
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  
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
          console.log("testtttttttttttttt", a)
          const dateA = new Date(a.updatedAt);
          const dateB = new Date(b.updatedAt);
          return dateB - dateA; // Newest first
        });

        setTransactions(transactionsData);
        setCurrentPage(1); // Reset to first page when data changes
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
  
  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
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
            {currentTransactions.map((transaction) => {
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
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={prevPage} 
            disabled={currentPage === 1}
            className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
          >
            &laquo; Trước
          </button>
          
          <div className="pagination-pages">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // Show current page, first page, last page, and one page before and after current
              if (
                pageNumber === 1 || 
                pageNumber === totalPages || 
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                  >
                    {pageNumber}
                  </button>
                );
              }
              
              // Show ellipsis for gaps
              if (
                (pageNumber === 2 && currentPage > 3) || 
                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return <span key={pageNumber} className="pagination-ellipsis">...</span>;
              }
              
              return null;
            })}
          </div>
          
          <button 
            onClick={nextPage} 
            disabled={currentPage === totalPages}
            className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
          >
            Tiếp &raquo;
          </button>
        </div>
      )}
      
      {/* Pagination info */}
      <div className="pagination-info">
        Hiển thị {indexOfFirstTransaction + 1} - {Math.min(indexOfLastTransaction, transactions.length)} trên tổng số {transactions.length} giao dịch
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
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    margin-top: 16px;
    background-color: #ffffff;
  }
  
  .transaction-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
      border-right: 2px solid #cbd5e1;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }
    
    th {
      background-color: #89D9D9;
      font-weight: 800;
      color: #000000;
      white-space: nowrap;
    }
    
    td {
      background-color: #ffffff;
      color: #000000;
      
      &.note-cell {
        max-width: 200px;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .transaction-type {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 8px;
      border: 2px solid #cbd5e1;
      font-weight: 600;
      text-align: center;
      background-color: #ffffff;
      
      &.income {
        background-color: #80B878;
      }
      
      &.expense {
        background-color: #C7424F;
      }
    }
    
    .amount {
      font-weight: 700;
      
      &.income {
        color: #80B878;
      }
      
      &.expense {
        color: #C7424F;
      }
    }
    
    .actions-cell {
      width: 160px;
      text-align: center;
    }
  }
  
  .edit-button, .delete-button {
    padding: 4px 10px;
    border-radius: 8px;
    margin: 0 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid #cbd5e1;
    font-family: 'Courier New', monospace;
 
    color: #000000;
  }
  
  .edit-button {
    background-color: #89D9D9;
    border-color: #52A8A8;
    
    &:hover {
      background-color: #72B6CF;
    }
    
    &:active {
      transform: translateY(1px);
    }
  }
  
  .delete-button {
    background-color: #C7424F;
    border-color: #8b2e37;
    color: #ffffff;
    
    &:hover {
      background-color: #E06B51;
    }
    
    &:active {
      transform: translateY(1px);
    }
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    gap: 8px;
  }
  
  .pagination-button {
    padding: 8px 12px;
    border: 2px solid #52A8A8;
    background-color: #89D9D9;
    color: #000000;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    box-shadow: 2px 2px 0 #52A8A8;
    font-family: 'Courier New', monospace;
    
    &:hover:not(.disabled) {
      transform: translateY(-2px);
      box-shadow: 3px 3px 0 #52A8A8;
      background-color: #72B6CF;
    }
    
    &:active:not(.disabled) {
      transform: translateY(1px);
      box-shadow: 1px 1px 0 #52A8A8;
      background-color: #5C8BA8;
    }
    
    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .pagination-pages {
    display: flex;
    gap: 4px;
  }
  
  .pagination-number {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #52A8A8;
    background-color: #FFFFFF;
    color: #000000;
    cursor: pointer;
    transition: all 0.2s;

    font-family: 'Courier New', monospace;
    font-weight: 600;
    
    &:hover:not(.active) {
      transform: translateY(-2px);
      box-shadow: 3px 3px 0 #52A8A8;
      background-color: #F0F0F0;
    }
    
    &.active {
      background-color: #89D9D9;
      color: #000000;
      border-color: #52A8A8;
    }
  }
  
  .pagination-ellipsis {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000000;
    font-weight: 600;
  }
  
  .pagination-info {
    text-align: center;
    margin-top: 12px;
    color: var(--font-color-sub);
    font-size: 14px;
  }
  
  // Higher z-index to ensure modal appears above everything
  position: relative;
  z-index: 1;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default TransactionList; 