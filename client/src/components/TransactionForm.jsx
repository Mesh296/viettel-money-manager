import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getAllCategories } from '../services/categories';
import { createTransaction, updateTransaction } from '../services/transactions';
import { toast } from 'react-toastify';

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
        toast.success('Giao dịch đã được cập nhật');
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.form}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Loại giao dịch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại giao dịch
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="type"
                value="expense"
                checked={formData.type === 'expense'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Chi tiêu</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="type"
                value="income"
                checked={formData.type === 'income'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Thu nhập</span>
            </label>
          </div>
        </div>
        
        {/* Danh mục */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
            Danh mục
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className={`mt-1 block w-full py-2 px-3 border ${errors.categoryId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
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
            <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
          )}
        </div>
        
        {/* Số tiền */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Số tiền
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`mt-1 block w-full py-2 px-3 border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="0"
              min="0"
              step="0.01"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₫</span>
            </div>
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>
        
        {/* Ngày */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày
          </label>
          <DatePicker
            selected={formData.date}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            className={`mt-1 block w-full py-2 px-3 border ${errors.date ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>
      </div>
      
      {/* Ghi chú */}
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          Ghi chú (tùy chọn)
        </label>
        <textarea
          id="note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows="3"
          className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nhập ghi chú về giao dịch này..."
        ></textarea>
      </div>
      
      {/* Nút submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </>
          ) : (
            transaction ? 'Cập nhật giao dịch' : 'Thêm giao dịch'
          )}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm; 