import Navbar from '../components/Navbar';

const Categories = () => {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Danh mục</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Quản lý danh mục</h2>
            <p className="text-gray-600">
              Tại đây bạn có thể xem và quản lý các danh mục giao dịch của mình.
              Danh mục được dùng để phân loại các khoản thu chi.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-md p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Danh mục Thu nhập</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="p-2 bg-green-50 rounded">Lương</li>
                <li className="p-2 bg-green-50 rounded">Thưởng</li>
                <li className="p-2 bg-green-50 rounded">Đầu tư</li>
                <li className="p-2 bg-green-50 rounded">Thu nhập phụ</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Danh mục Chi tiêu</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="p-2 bg-red-50 rounded">Ăn uống</li>
                <li className="p-2 bg-red-50 rounded">Mua sắm</li>
                <li className="p-2 bg-red-50 rounded">Hóa đơn</li>
                <li className="p-2 bg-red-50 rounded">Y tế</li>
                <li className="p-2 bg-red-50 rounded">Di chuyển</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6 mt-6">
            <p className="text-gray-600 italic">
              Chức năng thêm, chỉnh sửa và xóa danh mục sẽ được phát triển sau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories; 