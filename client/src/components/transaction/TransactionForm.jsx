import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getAllCategories } from '../../services/categories';
import { createTransaction, updateTransaction } from '../../services/transactions';
import { toast } from 'react-toastify';
import styled from 'styled-components';

const TransactionForm = ({ transaction, onTransactionChange }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    categoryId: '',
    amount: '',
    date: new Date(),
    note: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Lấy danh sách danh mục khi component được mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Đang tải danh mục...');
        const data = await getAllCategories();
        console.log('Danh mục nhận được:', data);
        setCategories(data || []);
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
        toast.error(error.message || 'Không thể tải danh mục');
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value
    }));
    
    // Xóa lỗi khi người dùng sửa trường
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date }));
  };
  
  const resetForm = () => {
    setFormData({
      type: 'expense',
      categoryId: '',
      amount: '',
      date: new Date(),
      note: ''
    });
    setErrors({});
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setLoading(true);
      setErrors({});
      
      console.log('DEBUG - Submitting transaction with data:', formData);
      const selectedCategory = categories.find(cat => String(cat.id) === String(formData.categoryId));
      console.log('DEBUG - Selected category:', selectedCategory);
      
      // Format ngày thành DD-MM-YYYY trước khi gửi
      const formattedDate = formData.date ? 
        `${formData.date.getDate().toString().padStart(2, '0')}-${(formData.date.getMonth() + 1).toString().padStart(2, '0')}-${formData.date.getFullYear()}` : '';
      
      const transactionData = {
        ...formData,
        date: formattedDate
      };
      
      // If this is an edit, update the transaction
      if (transaction) {
        const result = await updateTransaction(transaction.transactionId, transactionData);
        console.log('DEBUG - Transaction updated:', result);
        resetForm();
        // Notify parent component
        if (onTransactionChange) onTransactionChange();
      } else {
        // Create new transaction
        const result = await createTransaction(transactionData);
        console.log('DEBUG - New transaction created:', result);
        resetForm();
        // Notify parent component
        if (onTransactionChange) onTransactionChange();
        toast.success('Giao dịch đã được thêm');
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setErrors({
        form: error.response?.data?.error || 'Có lỗi xảy ra khi lưu giao dịch'
      });
      toast.error('Có lỗi xảy ra khi lưu giao dịch');
    } finally {
      setLoading(false);
    }
  };
  
  // Sử dụng tất cả danh mục, không lọc
  const filteredCategories = categories;
  
  return (
    <StyledForm onSubmit={handleSubmit}>
      {errors.form && (
        <div className="error-message">
          {errors.form}
        </div>
      )}
      
      <div className="form-grid">
        {/* Transaction Type */}
        <div className="form-group">
          <label className="form-label">
            Loại giao dịch
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="type"
                value="expense"
                checked={formData.type === 'expense'}
                onChange={handleChange}
                className="radio-input"
              />
              <span>Chi tiêu</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="type"
                value="income"
                checked={formData.type === 'income'}
                onChange={handleChange}
                className="radio-input"
              />
              <span>Thu nhập</span>
            </label>
          </div>
        </div>
        
        {/* Category */}
        <div className="form-group">
          <label htmlFor="categoryId" className="form-label">
            Danh mục
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className={`form-select ${errors.categoryId ? 'error' : ''}`}
          >
            <option value="">-- Chọn danh mục --</option>
            {filteredCategories && filteredCategories.length > 0 ? (
              filteredCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            ) : (
              <option disabled>Không có danh mục</option>
            )}
          </select>
          {errors.categoryId && (
            <p className="error-text">{errors.categoryId}</p>
          )}
        </div>
        
        {/* Amount */}
        <div className="form-group">
          <label htmlFor="amount" className="form-label">
            Số tiền
          </label>
          <div className="input-with-icon">
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`form-input ${errors.amount ? 'error' : ''}`}
              placeholder="0"
              min="0"
            />
            <span className="currency-symbol">₫</span>
          </div>
          {errors.amount && (
            <p className="error-text">{errors.amount}</p>
          )}
        </div>
        
        {/* Date */}
        <div className="form-group">
          <label htmlFor="date" className="form-label">
            Ngày
          </label>
          <div className="datepicker-wrapper">
            <DatePicker
              selected={formData.date}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              className={`form-datepicker ${errors.date ? 'error' : ''}`}
            />
          </div>
          {errors.date && (
            <p className="error-text">{errors.date}</p>
          )}
        </div>
      </div>
      
      {/* Note */}
      <div className="form-group">
        <label htmlFor="note" className="form-label">
          Ghi chú (tùy chọn)
        </label>
        <textarea
          id="note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          className="form-textarea"
          rows="2"
          placeholder="Nhập ghi chú..."
        />
      </div>
      
      <div className="button-container">
        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? (
            <div className="spinner-container">
              <div className="button-spinner"></div>
              <span>Đang xử lý...</span>
            </div>
          ) : (
            'Thêm giao dịch'
          )}
        </button>
      </div>
    </StyledForm>
  );
};

const StyledForm = styled.form`
  --input-focus: #4E6679;
  --font-color: #000000;
  --font-color-sub: #464969;
  --main-color: #000000;
  --green-color: #80B878;
  --red-color: #C7424F;
  
  width: 100%;
  max-width: 100%;
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 12px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
  }
  
  .form-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--font-color);
    margin-bottom: 0;
  }
  
  .form-input,
  .form-select,
  .form-textarea,
  .form-datepicker {
    padding: 6px 10px;
    border: 2px solid var(--main-color);
    border-radius: 0;
    background-color: white;
    box-shadow: 2px 2px 0 var(--main-color);
    font-size: 14px;
    color: var(--font-color);
    width: 100%;
    box-sizing: border-box;
    max-width: 100%;
    transition: all 0.2s;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    
    &:focus {
      box-shadow: 3px 3px 0 var(--input-focus);
      border-color: var(--input-focus);
    }
    
    &.error {
      border-color: var(--red-color);
      box-shadow: 2px 2px var(--red-color);
    }
  }
  
  .radio-group {
    display: flex;
    gap: 16px;
  }
  
  .radio-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    
    span {
      margin-left: 6px;
      font-weight: 500;
    }
  }
  
  .input-with-icon {
    position: relative;
    width: 100%;
    
    .form-input {
      padding-right: 24px;
    }
    
    .currency-symbol {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--font-color-sub);
    }
  }
  
  .datepicker-wrapper {
    width: 100%;
    .react-datepicker-wrapper {
      width: 100%;
      display: block;
      
      .react-datepicker__input-container {
        width: 100%;
        display: block;
      }
    }
  }
  
  .error-message {
    background-color: #FFF5F5;
    border: 1px solid #FED7D7;
    color: var(--red-color);
    padding: 8px 10px;
    border-radius: 5px;
    margin-bottom: 12px;
    font-size: 13px;
  }
  
  .error-text {
    color: var(--red-color);
    font-size: 12px;
    margin-top: 2px;
  }
  
  .button-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
  
  .submit-button {
    padding: 8px 16px;
    border-radius: 0;
    border: 2px solid #000000;
    background-color: #89D9D9;
    color: #000000;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 3px 3px 0 #000000;
    font-family: 'Courier New', monospace;
    min-width: 130px;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 5px 5px 0 #000000;
      background-color: #72B6CF;
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 2px 2px 0 #000000;
      background-color: #5C8BA8;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .spinner-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .button-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default TransactionForm; 