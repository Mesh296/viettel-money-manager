import Navbar from '../components/Navbar';

const Budgets = () => {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Ngân sách</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Quản lý ngân sách</h2>
            <p className="text-gray-600">
              Tại đây bạn có thể thiết lập ngân sách hàng tháng và theo dõi tình hình chi tiêu.
              Đặt hạn mức chi tiêu để quản lý tài chính hiệu quả hơn.
            </p>
          </div>
          
          {/* Ngân sách tổng */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Ngân sách tháng này</h2>
            
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Chi tiêu: 0₫ / 0₫</span>
                <span className="text-sm font-medium text-gray-700">0%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            
            <p className="text-gray-600 italic text-sm">
              Chức năng đặt ngân sách tổng sẽ được phát triển sau.
            </p>
          </div>
          
          {/* Ngân sách theo danh mục */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ngân sách theo danh mục</h2>
            
            <div className="space-y-4">
              <div className="p-3 border border-gray-200 rounded">
                <h3 className="font-medium text-gray-800">Ăn uống</h3>
                <div className="flex justify-between mb-1 mt-2">
                  <span className="text-sm text-gray-700">Chi tiêu: 0₫ / 0₫</span>
                  <span className="text-sm text-gray-700">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded">
                <h3 className="font-medium text-gray-800">Mua sắm</h3>
                <div className="flex justify-between mb-1 mt-2">
                  <span className="text-sm text-gray-700">Chi tiêu: 0₫ / 0₫</span>
                  <span className="text-sm text-gray-700">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
            
            <p className="mt-4 text-gray-600 italic text-sm">
              Chức năng đặt hạn mức cho từng danh mục sẽ được phát triển sau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budgets; 