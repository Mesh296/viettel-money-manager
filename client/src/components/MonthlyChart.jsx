import { useState, useEffect } from 'react';
import { getMonthlyData } from '../services/statistics';
import { getCurrentUserTransactions } from '../services/transactions';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { toast } from 'react-toastify';

// Đăng ký các components cần thiết cho chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyChart = ({ year = null }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tải dữ liệu khi component mount
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        // Mặc định sử dụng năm hiện tại nếu không được cung cấp
        const currentYear = year || new Date().getFullYear();
        
        // Lấy tất cả giao dịch
        const transactions = await getCurrentUserTransactions();
        console.log('Transactions for chart:', transactions);
        
        // Chuẩn bị dữ liệu cho chart
        const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                         'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        
        const incomeData = Array(12).fill(0);
        const expenseData = Array(12).fill(0);
        
        // Lọc và nhóm dữ liệu theo tháng từ giao dịch
        if (Array.isArray(transactions)) {
          transactions.forEach(transaction => {
            // Chuyển đổi date string sang đối tượng Date
            const date = new Date(transaction.date);
            const transactionYear = date.getFullYear();
            const transactionMonth = date.getMonth(); // getMonth() trả về 0-11
            
            // Chỉ xử lý các giao dịch trong năm hiện tại
            if (transactionYear === currentYear) {
              if (transaction.type === 'income') {
                incomeData[transactionMonth] += parseFloat(transaction.amount) || 0;
              } else if (transaction.type === 'expense') {
                expenseData[transactionMonth] += parseFloat(transaction.amount) || 0;
              }
            }
          });
        }
        
        setChartData({
          labels: months,
          datasets: [
            {
              label: 'Thu nhập',
              data: incomeData,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1
            },
            {
              label: 'Chi tiêu',
              data: expenseData,
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 1
            }
          ]
        });
        
        setError(null);
      } catch (error) {
        console.error('Error loading chart data:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu biểu đồ');
        toast.error(error.message || 'Có lỗi xảy ra khi tải dữ liệu biểu đồ');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, [year]);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Thu nhập và chi tiêu năm ${year || new Date().getFullYear()}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Đang tải biểu đồ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded h-64 flex items-center justify-center">
        <div>
          <p className="font-medium">Không thể tải biểu đồ</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      {chartData && <Bar data={chartData} options={chartOptions} />}
    </div>
  );
};

export default MonthlyChart; 