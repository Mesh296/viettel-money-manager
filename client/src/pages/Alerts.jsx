import Navbar from '../components/Navbar';

const Alerts = () => {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Cảnh báo</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Quản lý cảnh báo</h2>
            <p className="text-gray-600">
              Nhận thông báo khi chi tiêu vượt ngân sách. Thiết lập các ngưỡng cảnh báo 
              cho tổng chi tiêu hoặc chi tiêu theo danh mục.
            </p>
          </div>
          
          {/* Danh sách cảnh báo */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Cảnh báo hiện tại</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="ml-2 text-sm font-medium text-yellow-800">Chi tiêu tháng này sắp vượt ngưỡng</h3>
                </div>
                <p className="mt-2 text-sm text-yellow-700">
                  Bạn đã chi tiêu 0₫, đạt 0% ngân sách tháng (0₫).
                </p>
              </div>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="ml-2 text-sm font-medium text-red-800">Chi tiêu danh mục "Ăn uống" vượt ngưỡng</h3>
                </div>
                <p className="mt-2 text-sm text-red-700">
                  Bạn đã chi tiêu 0₫ cho ăn uống, vượt 0% ngân sách (0₫).
                </p>
              </div>
            </div>
          </div>
          
          {/* Thiết lập cảnh báo */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thiết lập cảnh báo</h2>
            <p className="text-gray-600 italic">
              Chức năng tùy chỉnh mức ngưỡng cảnh báo sẽ được phát triển sau.
            </p>
            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">Các loại cảnh báo sẽ được hỗ trợ:</p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Cảnh báo khi tổng chi tiêu vượt ngân sách tháng</li>
                <li>Cảnh báo khi chi tiêu theo danh mục vượt ngân sách</li>
                <li>Nhắc nhở khi chi tiêu trong tháng vượt quá thu nhập</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts; 