import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { getCurrentUserTransactions } from '../services/transactions';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { toast } from 'react-toastify';

// Đăng ký các components cần thiết cho chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mảng các màu cho các danh mục
const CHART_COLORS = [
  'rgba(255, 99, 132, 0.7)',   // Đỏ
  'rgba(54, 162, 235, 0.7)',   // Xanh dương
  'rgba(255, 206, 86, 0.7)',   // Vàng
  'rgba(75, 192, 192, 0.7)',   // Xanh lá
  'rgba(153, 102, 255, 0.7)',  // Tím
  'rgba(255, 159, 64, 0.7)',   // Cam
  'rgba(199, 199, 199, 0.7)',  // Xám
  'rgba(83, 102, 255, 0.7)',   // Xanh dương nhạt
  'rgba(255, 99, 255, 0.7)',   // Hồng
  'rgba(24, 144, 122, 0.7)',   // Lục lam
  'rgba(45, 206, 137, 0.7)',   // Xanh ngọc
  'rgba(214, 107, 45, 0.7)',   // Cam đất
  'rgba(132, 94, 194, 0.7)',   // Tím nhạt
  'rgba(89, 177, 78, 0.7)',    // Xanh lá cây
  'rgba(203, 71, 120, 0.7)',   // Hồng đậm
  'rgba(67, 101, 139, 0.7)',   // Xanh dương đậm
  'rgba(169, 90, 161, 0.7)',   // Tím hồng
  'rgba(153, 140, 51, 0.7)',   // Vàng đất
  'rgba(65, 125, 122, 0.7)',   // Xanh rêu
  'rgba(207, 58, 36, 0.7)',    // Đỏ gạch
];

const CategoryTrendChart = ({ year = null }) => {
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
        console.log('Transactions for category trend chart:', transactions);
        
        // Lọc giao dịch chi tiêu trong năm hiện tại
        const filteredTransactions = Array.isArray(transactions) ? transactions.filter(transaction => {
          const date = new Date(transaction.date);
          return date.getFullYear() === currentYear && 
                 transaction.type === 'expense';
        }) : [];
        
        // Nếu không có dữ liệu, hiển thị thông báo
        if (!filteredTransactions || filteredTransactions.length === 0) {
          setError('Không có dữ liệu chi tiêu cho năm này');
          setLoading(false);
          return;
        }
        
        // Chuẩn bị dữ liệu cho chart
        const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        
        // Nhóm giao dịch theo danh mục và tháng
        const categoryData = {};
        
        filteredTransactions.forEach(transaction => {
          const date = new Date(transaction.date);
          const month = date.getMonth(); // 0-11
          const categoryId = transaction.categoryId;
          const categoryName = transaction.category?.name || 'Chưa phân loại';
          const amount = parseFloat(transaction.amount) || 0;
          
          if (!categoryData[categoryId]) {
            categoryData[categoryId] = {
              id: categoryId,
              name: categoryName,
              data: Array(12).fill(null),  // Sử dụng null thay vì 0
              points: [],  // Mảng lưu các điểm có dữ liệu
              total: 0
            };
          }
          
          // Lưu giá trị chi tiêu
          if (categoryData[categoryId].data[month] === null) {
            categoryData[categoryId].data[month] = amount;
          } else {
            categoryData[categoryId].data[month] += amount;
          }
          
          categoryData[categoryId].total += amount;
        });
        
        // Chuyển đổi thành mảng và sắp xếp theo tổng chi tiêu
        let categories = Object.values(categoryData);
        categories.sort((a, b) => b.total - a.total);
        
        // Hiển thị tất cả danh mục - không giới hạn maxCategories
        
        // Tạo dataset cho biểu đồ - chia giá trị cho 1000 để hiển thị nhỏ gọn
        const datasets = categories.map((category, index) => {
          const color = CHART_COLORS[index % CHART_COLORS.length];
          const borderColor = color.replace('0.7', '1');
          
          // Chia dữ liệu cho 1000 và chỉ giữ tháng có chi tiêu (khác null)
          const scaledData = category.data.map(value => 
            value !== null ? value / 1000 : null
          );
          
          return {
            label: category.name,
            data: scaledData,
            borderColor: borderColor,
            backgroundColor: color,
            tension: 0,  // Iso metric line (đường thẳng)
            borderWidth: 2,
            pointBackgroundColor: borderColor,
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            spanGaps: true  // Khi gặp null sẽ không vẽ line
          };
        });
        
        setChartData({
          labels: months,
          datasets: datasets
        });
        
        setError(null);
      } catch (error) {
        console.error('Error loading category trend data:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu xu hướng chi tiêu theo danh mục');
        toast.error(error.message || 'Có lỗi xảy ra khi tải dữ liệu xu hướng chi tiêu theo danh mục');
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
        position: 'right',  // Đặt legend bên phải
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#2D3748',
          usePointStyle: true,
          padding: 8,
          boxWidth: 8
        },
        maxHeight: 230  // Giới hạn chiều cao để có thể scroll khi nhiều danh mục
      },
      title: {
        display: true,
        text: `Xu hướng chi tiêu theo danh mục năm ${year || new Date().getFullYear()}`,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#2D3748',
        padding: {
          bottom: 15
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
        cornerRadius: 4,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            // Chỉ hiển thị tooltip nếu không phải null
            if (context.raw === null) return null;
            
            const value = context.raw * 1000 || 0;  // Nhân lại với 1000 để hiển thị giá trị thực
            const formattedValue = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(value);
            return `${label}: ${formattedValue}`;
          }
        }
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
            // Hiển thị giá trị đã chia cho 1000
            return value;
          }
        },
        title: {
          display: true,
          text: '(nghìn VND)',
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#2D3748'
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
          color: '#2D3748'
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
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
      {chartData && <Line data={chartData} options={chartOptions} />}
    </div>
  );
};

export default CategoryTrendChart; 