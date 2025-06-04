import { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { getUserAlerts, deleteAlert, deleteAllAlerts } from '../services/alerts';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../services/config';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

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
        // Sort by newest first based on triggered_at
        const sortedAlerts = [...data].sort((a, b) => {
          const dateA = new Date(a.triggered_at);
          const dateB = new Date(b.triggered_at);
          return dateB - dateA; // Newest first
        });
        setAlerts(sortedAlerts);
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
    // Make sure we have a valid date
    let formattedDate = '';
    try {
      formattedDate = new Date(alert.triggered_at).toLocaleDateString('vi-VN');
    } catch (e) {
      console.error('Invalid date format in alert:', alert.triggered_at);
      formattedDate = 'Không xác định';
    }

    return (
      <div
        key={alert.alertId || `alert-${Math.random()}`}
        className={`alert-item ${alert.type} ${alert.isDeleting ? 'deleting' : ''}`}
      >
        <div className="alert-content">
          <div className="alert-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="alert-message">
            <p className="message">{alert.message || "Cảnh báo hệ thống"}</p>
            <p className="details">
              {alert.details && <span className="detail-text">{alert.details}</span>}
              <span className="date">{formattedDate}</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <StyledAlerts>
        <div className="container">
          <h1 className="page-title">Quản lý cảnh báo</h1>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Danh sách cảnh báo</h2>

              <button
                className="action-btn delete-all"
                onClick={handleDeleteAllAlerts}
                disabled={bulkDeleteLoading || alerts.length === 0}
              >
                {bulkDeleteLoading ? 'Đang xóa...' : 'Xóa tất cả'}
              </button>
            </div>

            <div className="alerts-card">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <span>Đang tải cảnh báo...</span>
                </div>
              ) : alerts.length === 0 ? (
                <div className="empty-state">
                  <p>Không có cảnh báo nào.</p>
                  <p className="subtext">
                    Cảnh báo sẽ xuất hiện khi bạn vượt quá ngân sách hoặc có các vấn đề về tài chính.
                  </p>
                </div>
              ) : (
                <div className="alerts-list">
                  {alerts.map(alert => renderAlert(alert))}
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <div className="alerts-info-card">
              <h3>Cài đặt cảnh báo</h3>
              <p>
                Bạn có thể cài đặt các ngưỡng cảnh báo và các loại thông báo trong phần Cài đặt.
              </p>
              <Link to="/settings" className="settings-link">
                Đi đến Cài đặt
              </Link>
            </div>
          </div>
        </div>
      </StyledAlerts>
    </MainLayout>
  );
};

const StyledAlerts = styled.div`
  --input-focus: #5A67D8;
  --font-color: #2D3748;
  --font-color-sub: #4A5568;
  --bg-color: #FFF;
  --bg-color-alt: #FFF5E9;
  --main-color: #2D3748;
  --green-color: #48BB78;
  --red-color: #F56565;
  --yellow-color: #F6E05E;
  --orange-color: #ED8936;
  --blue-color: #4299E1;
  
  padding: 20px;
  background-color: var(--bg-color-alt);
  min-height: 100%;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .page-title {
    font-size: 28px;
    font-weight: 900;
    color: var(--main-color);
    margin-bottom: 24px;
  }
  
  .section {
    margin-bottom: 30px;
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--main-color);
      margin-bottom: 16px;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
  }
  
  .action-card, .alerts-card, .alerts-info-card {
    background: var(--bg-color);
    border-radius: 8px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
    padding: 20px;
    margin-bottom: 20px;
    transition: transform 0.2s;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    h2, h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--main-color);
      margin-bottom: 16px;
    }
  }
  
  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .action-btn {
    padding: 8px 16px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    font-weight: 600;
    color: var(--font-color);
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    &.create {
      background-color: var(--green-color);
      color: white;
    }
    
    &.delete-all {
      background-color: var(--red-color);
      color: white;
    }
    
    &.debug {
      background-color: var(--yellow-color);
      color: var(--font-color);
    }
  }
  
  .alerts-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .alert-item {
    display: flex;
    padding: 12px;
    border-radius: 6px;
    border-left: 4px solid var(--yellow-color);
    background-color: rgba(246, 224, 94, 0.1);
    
    &.deleting {
      opacity: 0.6;
    }
    
    &.total_limit {
      border-left-color: var(--red-color);
      background-color: rgba(245, 101, 101, 0.1);
    }
    
    &.approaching_total_limit {
      border-left-color: var(--yellow-color);
      background-color: rgba(246, 224, 94, 0.1);
    }
    
    &.category_limit {
      border-left-color: var(--orange-color);
      background-color: rgba(237, 137, 54, 0.1);
    }
    
    &.income_vs_expense {
      border-left-color: var(--blue-color);
      background-color: rgba(66, 153, 225, 0.1);
    }
  }
  
  .alert-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .alert-icon {
    width: 24px;
    height: 24px;
    
    svg {
      width: 100%;
      height: 100%;
      
      .total_limit & {
        color: var(--red-color);
      }
      
      .approaching_total_limit & {
        color: var(--yellow-color);
      }
      
      .category_limit & {
        color: var(--orange-color);
      }
      
      .income_vs_expense & {
        color: var(--blue-color);
      }
    }
  }
  
  .alert-message {
    .message {
      font-weight: 600;
      color: var(--main-color);
      margin-bottom: 4px;
    }
    
    .details {
      font-size: 14px;
      color: var(--font-color-sub);
      
      .date {
        margin-left: 8px;
        opacity: 0.8;
      }
    }
  }
  
  .alert-actions {
    .delete-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      border: none;
      background: none;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: rgba(0,0,0,0.05);
      }
      
      svg {
        width: 20px;
        height: 20px;
        color: var(--red-color);
      }
      
      .loading-icon {
        animation: spin 1s linear infinite;
        stroke: var(--red-color);
      }
    }
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(90, 103, 216, 0.1);
    border-radius: 50%;
    border-top-color: var(--input-focus);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: 40px 0;
    
    p {
      font-size: 16px;
      color: var(--font-color);
      margin-bottom: 8px;
    }
    
    .subtext {
      font-size: 14px;
      color: var(--font-color-sub);
    }
  }
  
  .alerts-info-card {
    background-color: var(--bg-color);
    
    p {
      color: var(--font-color-sub);
      margin-bottom: 16px;
      line-height: 1.6;
    }
    
    .settings-link {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 5px;
      background-color: var(--input-focus);
      color: white;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
    }
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    
    .action-buttons {
      flex-direction: column;
      
      .action-btn {
        width: 100%;
      }
    }
  }
`;

export default Alerts; 