import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUserAlerts } from '../services/alerts';
import { toast } from 'react-toastify';

const AlertWidget = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tạo hàm fetchAlerts để có thể gọi lại khi cần
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('DEBUG - AlertWidget: Fetching alerts');
      const data = await getUserAlerts();
      console.log('DEBUG - AlertWidget: Alerts fetched:', data);
      
      // Verify data is an array before using array methods
      if (Array.isArray(data)) {
        // Sort by newest first based on triggered_at
        const sortedAlerts = [...data].sort((a, b) => {
          const dateA = new Date(a.triggered_at);
          const dateB = new Date(b.triggered_at);
          return dateB - dateA; // Newest first
        });
        
        // Only show the most recent 3 alerts
        setAlerts(sortedAlerts.slice(0, 3));
      } else {
        console.warn('AlertWidget: getUserAlerts did not return an array', data);
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Không thể tải cảnh báo. Vui lòng thử lại sau.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Xử lý sự kiện cập nhật cảnh báo
  const handleAlertsUpdated = useCallback(() => {
    console.log('DEBUG - AlertWidget: Alert update event received');
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
    
    // Đăng ký lắng nghe sự kiện cập nhật cảnh báo
    window.addEventListener('alertsUpdated', handleAlertsUpdated);
    
    // Thiết lập interval để tự động làm mới cảnh báo mỗi 5 phút
    const intervalId = setInterval(() => {
      fetchAlerts();
    }, 5 * 60 * 1000); // 5 phút
    
    // Dọn dẹp interval và event listener khi component unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('alertsUpdated', handleAlertsUpdated);
    };
  }, [fetchAlerts, handleAlertsUpdated]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Cảnh báo</h2>
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(alerts) || alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Cảnh báo</h2>
        <p className="text-gray-600 text-center py-2">Không có cảnh báo nào.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Cảnh báo</h2>
        <Link to="/alerts" className="text-sm text-blue-600 hover:text-blue-800">
          Xem tất cả
        </Link>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert) => {
          let bgColor = 'bg-yellow-50';
          let textColor = 'text-yellow-800';
          
          if (alert.type === 'total_limit') {
            bgColor = 'bg-red-50';
            textColor = 'text-red-800';
          } else if (alert.type === 'category_limit') {
            bgColor = 'bg-orange-50';
            textColor = 'text-orange-800';
          } else if (alert.type === 'income_vs_expense') {
            bgColor = 'bg-blue-50';
            textColor = 'text-blue-800';
          }
          
          return (
            <div key={alert.alertId || `alert-${Math.random()}`} className={`p-3 ${bgColor} rounded-md`}>
              <p className={`text-sm ${textColor}`}>{alert.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(alert.triggered_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertWidget; 