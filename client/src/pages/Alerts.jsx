import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getUserAlerts, deleteAlert, deleteAllAlerts } from '../services/alerts';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../services/config';
import { Link } from 'react-router-dom';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await getUserAlerts();
      console.log('DEBUG - Alerts page: Alerts fetched:', data);
      
      // Make sure data is an array
      if (Array.isArray(data)) {
        setAlerts(data);
      } else {
        console.warn('Alerts page: getUserAlerts did not return an array', data);
        setAlerts([]);
        toast.warning('Định dạng dữ liệu cảnh báo không hợp lệ.');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Không thể tải cảnh báo. Vui lòng thử lại sau.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Also listen for alertsUpdated event
    const handleAlertsUpdated = () => {
      console.log('DEBUG - Alerts page: Alert update event received');
      fetchAlerts();
    };
    
    window.addEventListener('alertsUpdated', handleAlertsUpdated);
    
    return () => {
      window.removeEventListener('alertsUpdated', handleAlertsUpdated);
    };
  }, []);

  // Hàm tạo cảnh báo thử nghiệm
  const createTestAlert = async () => {
    try {
      setTestLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Bạn cần đăng nhập để thực hiện chức năng này');
        return;
      }
      
      // Make sure we match the server's expected alert data format
      // Server requires: message, type, triggered_at
      // Where type must be one of: total_limit, category_limit, income_vs_expense
      const alertData = {
        message: 'Đây là cảnh báo thử nghiệm',
        type: 'total_limit', // Valid alert type per server requirements
        triggered_at: new Date().toISOString() // Use ISO format for dates
      };
      
      await axios.post(`${API_URL}/alerts/create`, alertData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success('Đã tạo cảnh báo thử nghiệm!');
      
      // Tải lại danh sách cảnh báo
      await fetchAlerts();
    } catch (error) {
      console.error('Error creating test alert:', error);
      const errorMessage = error.response?.data?.error || 'Không thể tạo cảnh báo thử nghiệm';
      toast.error(errorMessage);
    } finally {
      setTestLoading(false);
    }
  };
  
  // Hàm xóa cảnh báo
  const handleDeleteAlert = async (alertId) => {
    if (!alertId) {
      toast.error('ID cảnh báo không hợp lệ');
      return;
    }
    
    try {
      // Mark only this specific alert as being deleted
      setAlerts(currentAlerts => 
        currentAlerts.map(alert => 
          alert.alertId === alertId 
            ? { ...alert, isDeleting: true } 
            : alert
        )
      );
      
      // Delete the alert from the server
      await deleteAlert(alertId);
      toast.success('Đã xóa cảnh báo');
      
      // Remove only the deleted alert from the UI
      setAlerts(currentAlerts => 
        currentAlerts.filter(alert => alert.alertId !== alertId)
      );
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Không thể xóa cảnh báo. Vui lòng thử lại sau.');
      
      // Remove the isDeleting flag from the alert if deletion failed
      setAlerts(currentAlerts => 
        currentAlerts.map(alert => 
          alert.alertId === alertId 
            ? { ...alert, isDeleting: false } 
            : alert
        )
      );
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Hàm xóa tất cả cảnh báo
  const handleDeleteAllAlerts = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả cảnh báo?')) {
      return;
    }
    
    try {
      setBulkDeleteLoading(true);
      
      // Lấy tất cả cảnh báo hiện tại
      const currentAlerts = [...alerts];
      
      if (currentAlerts.length === 0) {
        toast.info('Không có cảnh báo nào để xóa');
        return;
      }
      
      // Đánh dấu tất cả cảnh báo đang được xóa
      setAlerts(currentAlerts.map(alert => ({ ...alert, isDeleting: true })));
      
      // Xóa từng cảnh báo
      const deletePromises = currentAlerts.map(alert => 
        deleteAlert(alert.alertId)
      );
      
      await Promise.all(deletePromises);
      
      toast.success(`Đã xóa ${currentAlerts.length} cảnh báo`);
      setAlerts([]);
    } catch (error) {
      console.error('Error deleting all alerts:', error);
      toast.error('Không thể xóa tất cả cảnh báo. Vui lòng thử lại sau.');
      
      // Tải lại danh sách cảnh báo
      await fetchAlerts();
    } finally {
      setBulkDeleteLoading(false);
    }
  };
  
  // Hàm kiểm tra cảnh báo để gỡ lỗi
  const debugAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Bạn cần đăng nhập để thực hiện chức năng này');
        return;
      }
      
      console.log('DEBUG - Current alerts:', alerts);
      
      // Log alerts to console in table format for better readability
      console.table(alerts.map(alert => ({
        id: alert.alertId,
        message: alert.message,
        type: alert.type,
        date: new Date(alert.triggered_at).toLocaleString('vi-VN')
      })));
      
      toast.info('Đã ghi log cảnh báo vào console');
    } catch (error) {
      console.error('Error debugging alerts:', error);
    }
  };

  // Helper function to render alert based on type
  const renderAlert = (alert) => {
    let bgColor = 'bg-yellow-50';
    let borderColor = 'border-yellow-200';
    let textColor = 'text-yellow-800';
    let descColor = 'text-yellow-700';
    let iconColor = 'text-yellow-400';
    
    if (alert.type === 'total_limit') {
      bgColor = 'bg-red-50';
      borderColor = 'border-red-200';
      textColor = 'text-red-800';
      descColor = 'text-red-700';
      iconColor = 'text-red-400';
    } else if (alert.type === 'approaching_total_limit') {
      bgColor = 'bg-yellow-50';
      borderColor = 'border-yellow-200';
      textColor = 'text-yellow-800';
      descColor = 'text-yellow-700';
      iconColor = 'text-yellow-400';
    } else if (alert.type === 'category_limit') {
      bgColor = 'bg-orange-50';
      borderColor = 'border-orange-200';
      textColor = 'text-orange-800';
      descColor = 'text-orange-700';
      iconColor = 'text-orange-400';
    } else if (alert.type === 'income_vs_expense') {
      bgColor = 'bg-blue-50';
      borderColor = 'border-blue-200';
      textColor = 'text-blue-800';
      descColor = 'text-blue-700';
      iconColor = 'text-blue-400';
    }

    // Make sure we have a valid date
    let formattedDate = '';
    try {
      formattedDate = new Date(alert.triggered_at).toLocaleDateString('vi-VN');
    } catch (e) {
      console.error('Invalid date format in alert:', alert.triggered_at);
      formattedDate = 'Không xác định';
    }
    
    return (
      <div key={alert.alertId || `alert-${Math.random()}`} className={`p-4 ${bgColor} border ${borderColor} rounded-md ${alert.isDeleting ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className={`h-5 w-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className={`ml-2 text-sm font-medium ${textColor}`}>{alert.message}</h3>
          </div>
          
          {/* Delete button */}
          <button 
            onClick={() => handleDeleteAlert(alert.alertId)}
            disabled={deleteLoading || alert.isDeleting}
            className={`text-gray-400 hover:text-red-500 transition-colors ${alert.isDeleting ? 'cursor-not-allowed opacity-50' : ''}`}
            title="Xóa cảnh báo"
          >
            {alert.isDeleting ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
        <p className={`mt-2 text-sm ${descColor}`}>
          Ngày tạo: {formattedDate}
        </p>
      </div>
    );
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Cảnh báo</h1>
            <div className="flex space-x-2">
              {alerts.length > 0 && (
                <button 
                  onClick={handleDeleteAllAlerts} 
                  className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ${bulkDeleteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={bulkDeleteLoading}
                >
                  {bulkDeleteLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : 'Xóa tất cả'}
                </button>
              )}
              <button 
                onClick={createTestAlert} 
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${testLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={testLoading}
              >
                {testLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : 'Tạo cảnh báo thử nghiệm'}
              </button>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Quản lý cảnh báo</h2>
            <p className="text-gray-600">
              Nhận thông báo khi chi tiêu vượt ngân sách. Thiết lập các ngưỡng cảnh báo 
              cho tổng chi tiêu hoặc chi tiêu theo danh mục.
            </p>
          </div>
          
          {/* Danh sách cảnh báo */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Cảnh báo hiện tại</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={debugAlerts} 
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Debug
                </button>
                <button 
                  onClick={fetchAlerts} 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Làm mới
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map(alert => renderAlert(alert))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-gray-600 text-center">Không có cảnh báo nào.</p>
              </div>
            )}
          </div>
          
          {/* Thiết lập cảnh báo */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thiết lập cảnh báo</h2>
            <p className="text-gray-600 italic mb-4">
              Cảnh báo sẽ được tạo tự động khi:
            </p>
            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <ul className="text-sm text-gray-600 space-y-3 list-disc list-inside">
                <li>Chi tiêu tháng hiện tại vượt quá ngân sách hàng tháng đã thiết lập</li>
                <li>Chi tiêu tháng hiện tại đạt trên 90% ngân sách hàng tháng (cảnh báo sớm)</li>
                <li>Chi tiêu cho một danh mục cụ thể vượt quá ngân sách đã đặt cho danh mục đó</li>
              </ul>
              
              <div className="mt-5 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700">
                <p className="font-medium mb-2">Để cảnh báo hoạt động đúng, bạn cần:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Thiết lập ngân sách hàng tháng trong mục <Link to="/budgets" className="text-blue-600 underline">Ngân sách</Link></li>
                  <li>Thiết lập ngân sách cho từng danh mục chi tiêu</li>
                  <li>Ghi nhận các giao dịch chi tiêu của bạn trong <Link to="/transactions" className="text-blue-600 underline">Giao dịch</Link></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts; 