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

const MonthlyChart = ({ year = null, selectedMonth = null }) => {
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
        
        // Tạo màu nền cho các cột, làm nổi bật tháng được chọn
        const incomeBackgroundColors = Array(12).fill('rgba(75, 192, 192, 0.7)');
        const expenseBackgroundColors = Array(12).fill('rgba(255, 99, 132, 0.7)');
        
        // Nếu có tháng được chọn, làm nổi bật tháng đó
        if (selectedMonth && selectedMonth >= 1 && selectedMonth <= 12) {
          const monthIndex = selectedMonth - 1; // Chuyển từ 1-12 sang 0-11
          incomeBackgroundColors[monthIndex] = 'rgba(75, 192, 192, 1)'; // Đậm hơn
          expenseBackgroundColors[monthIndex] = 'rgba(255, 99, 132, 1)'; // Đậm hơn
        }
        
        setChartData({
          labels: months,
          datasets: [
            {
              label: 'Thu nhập',
              data: incomeData,
              backgroundColor: incomeBackgroundColors,
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1
            },
            {
              label: 'Chi tiêu',
              data: expenseData,
              backgroundColor: expenseBackgroundColors,
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
  }, [year, selectedMonth]);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#2D3748' 
        }
      },
      title: {
        display: true,
        text: `Thu nhập và chi tiêu năm ${year || new Date().getFullYear()}`,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#2D3748' 
      },
      tooltip: {
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 14
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        padding: 10,
        cornerRadius: 4,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#2D3748', 
          callback: function(value) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0
            }).format(value);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1
        }
      },
      x: {
        ticks: {
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#2D3748' // Màu chữ đậm hơn
        },
        grid: {
          display: false
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
    <div className="h-full">
      {chartData && <Bar data={chartData} options={chartOptions} />}
    </div>
  );
};

export default MonthlyChart; 