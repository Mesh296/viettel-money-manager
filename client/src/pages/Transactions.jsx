import { useState } from 'react';
import Navbar from '../components/Navbar';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';

const Transactions = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Xử lý khi có giao dịch mới được thêm
  const handleTransactionAdded = () => {
    // Tăng refreshTrigger để kích hoạt useEffect trong TransactionList
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <div>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Giao dịch</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Quản lý giao dịch</h2>
            <p className="text-gray-600">
              Tại đây bạn có thể thêm mới, tìm kiếm, chỉnh sửa và xóa các giao dịch thu chi.
            </p>
          </div>
          
          {/* Form thêm mới giao dịch */}
          <div className="border-t border-gray-200 pt-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thêm giao dịch mới</h2>
            <TransactionForm onTransactionAdded={handleTransactionAdded} />
          </div>
          
          {/* Danh sách giao dịch */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Lịch sử giao dịch</h2>
            <p className="text-gray-600 mb-4">
              Bạn có thể tìm kiếm, lọc, chỉnh sửa hoặc xóa giao dịch bên dưới.
              Sử dụng bộ lọc để tìm kiếm giao dịch theo thời gian, danh mục, loại hoặc từ khóa.
            </p>
            <TransactionList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions; 