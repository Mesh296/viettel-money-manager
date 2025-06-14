import { useState, useEffect } from 'react';
import { getCategorySpending } from '../services/statistics';
import { getCurrentUserTransactions } from '../services/transactions';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { toast } from 'react-toastify';

// Đăng ký các components cần thiết cho chart
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Mảng các màu cho các danh mục
const CHART_COLORS = [
  'rgba(255, 99, 132, 0.8)',   // Đỏ
  'rgba(54, 162, 235, 0.8)',   // Xanh dương
  'rgba(255, 206, 86, 0.8)',   // Vàng
  'rgba(75, 192, 192, 0.8)',   // Xanh lá
  'rgba(153, 102, 255, 0.8)',  // Tím
  'rgba(255, 159, 64, 0.8)',   // Cam
  'rgba(199, 199, 199, 0.8)',  // Xám
  'rgba(83, 102, 255, 0.8)',   // Xanh dương nhạt
  'rgba(255, 99, 255, 0.8)',   // Hồng
  'rgba(24, 144, 122, 0.8)',   // Lục lam
];

const CategorySpendingChart = ({ month = null, year = null }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tải dữ liệu khi component mount
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        // Mặc định sử dụng tháng và năm hiện tại nếu không được cung cấp
        const currentDate = new Date();
        const currentMonth = month || currentDate.getMonth() + 1; // getMonth() trả về 0-11
        const currentYear = year || currentDate.getFullYear();
        
        // Lấy tất cả giao dịch
        const transactions = await getCurrentUserTransactions();
        console.log('Transactions for category chart:', transactions);
        
        // Lọc giao dịch chi tiêu trong tháng hiện tại
        const filteredTransactions = Array.isArray(transactions) ? transactions.filter(transaction => {
          const date = new Date(transaction.date);
          return date.getMonth() + 1 === currentMonth && 
                 date.getFullYear() === currentYear &&
                 transaction.type === 'expense';
        }) : [];
        
        // Nếu không có dữ liệu, hiển thị thông báo
        if (!filteredTransactions || filteredTransactions.length === 0) {
          setError('Không có dữ liệu chi tiêu cho tháng này');
          setLoading(false);
          return;
        }
        
        // Nhóm và tính tổng theo danh mục
        const categoryMap = {};
        
        filteredTransactions.forEach(transaction => {
          const categoryId = transaction.categoryId;
          const categoryName = transaction.category?.name || 'Chưa phân loại';
          const amount = parseFloat(transaction.amount) || 0;
          
          if (!categoryMap[categoryId]) {
            categoryMap[categoryId] = {
              name: categoryName,
              total: 0
            };
          }
          
          categoryMap[categoryId].total += amount;
        });
        
        // Chuyển đổi thành mảng để vẽ biểu đồ
        const categories = Object.values(categoryMap);
        
        // Chuẩn bị dữ liệu cho chart
        const labels = categories.map(item => item.name);
        const values = categories.map(item => item.total);
        
        // Nếu không có dữ liệu hợp lệ sau khi xử lý
        if (labels.length === 0) {
          setError('Không thể xử lý dữ liệu chi tiêu theo danh mục');
          setLoading(false);
          return;
        }
        
        const backgroundColors = labels.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]);
        const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));
        
        setChartData({
          labels,
          datasets: [
            {
              label: 'Chi tiêu',
              data: values,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
            },
          ],
        });
        
        setError(null);
      } catch (error) {
        console.error('Error loading category spending data:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu chi tiêu theo danh mục');
        toast.error(error.message || 'Có lỗi xảy ra khi tải dữ liệu chi tiêu theo danh mục');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, [month, year]);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 60,
        bottom: 40,
        left: 20
      }
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#2D3748', // Màu chữ đậm hơn
          padding: 15,
          boxWidth: 15,
          usePointStyle: true,
        }
      },
      title: {
        display: true,
        text: `Chi tiêu theo danh mục tháng ${month || new Date().getMonth() + 1}/${year || new Date().getFullYear()}`,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#2D3748', // Màu chữ đậm hơn
        padding: {

          bottom: 35
        }
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
        boxPadding: 5,
        cornerRadius: 4,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const formattedValue = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(value);
            return `${label}: ${formattedValue}`;
          }
        }
      },
      // Thêm plugin datalabels để hiển thị phần trăm và đường chỉ
      datalabels: {
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 4,
        padding: {
          top: 2,
          bottom: 2,
          left: 4,
          right: 4
        },
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value, context) => {
          // Tính phần trăm
          const datapoints = context.chart.data.datasets[0].data;
          const total = datapoints.reduce((total, datapoint) => total + datapoint, 0);
          const percentage = (value / total * 100).toFixed(1) + '%';
          return percentage;
        },
        display: function(context) {
          // Chỉ hiển thị nhãn cho các phần chiếm từ 5% trở lên
          const datapoints = context.chart.data.datasets[0].data;
          const total = datapoints.reduce((total, datapoint) => total + datapoint, 0);
          return context.dataset.data[context.dataIndex] / total > 0.05;
        },
        offset: 15,
        align: 'end',
        anchor: 'end'
      }
    },
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
      {chartData && <Pie data={chartData} options={chartOptions} />}
    </div>
  );
};

export default CategorySpendingChart; 