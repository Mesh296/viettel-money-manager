import { useState, useEffect } from 'react';
import { getAllCategories } from '../../services/categories';

const TransactionFilter = ({ onFilterChange }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Tải danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Không thể tải danh mục:', error);
      }
    };

    fetchCategories();
  }, []);

  // Convert từ HTML date format (YYYY-MM-DD) sang định dạng DD-MM-YYYY cho API
  const formatDateForAPI = (htmlDate) => {
    if (!htmlDate) return '';
    const [year, month, day] = htmlDate.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Chuẩn bị các tham số tìm kiếm
    const filterParams = {};
    
    if (startDate) filterParams.startDate = formatDateForAPI(startDate); // Chuyển đổi định dạng
    if (endDate) filterParams.endDate = formatDateForAPI(endDate); // Chuyển đổi định dạng
    if (type) filterParams.type = type;
    if (keyword) filterParams.keyword = keyword;
    if (categoryId) filterParams.categoryId = categoryId;
    if (minAmount) filterParams.minAmount = parseFloat(minAmount);
    if (maxAmount) filterParams.maxAmount = parseFloat(maxAmount);
    
    // Gọi hàm callback khi người dùng áp dụng bộ lọc
    onFilterChange(filterParams);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setType('');
    setKeyword('');
    setCategoryId('');
    setMinAmount('');
    setMaxAmount('');
    
    // Gọi hàm callback với tham số trống để reset về mặc định
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-medium text-gray-900">
          Tìm kiếm và lọc giao dịch
        </h3>
        <span className="text-blue-500">
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t border-gray-100">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Khoảng thời gian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày (DD-MM-YYYY)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày (DD-MM-YYYY)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Loại giao dịch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại giao dịch
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả</option>
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
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Khoảng số tiền */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền từ
                </label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="VND"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền đến
                </label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="VND"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Từ khóa tìm kiếm */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Nhập từ khóa tìm kiếm trong ghi chú..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Xóa bộ lọc
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Áp dụng
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TransactionFilter; 