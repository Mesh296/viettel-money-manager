Task 1: Hoàn thiện thiết lập dự án và triển khai tính năng xác thực
Công việc cần làm
1. Cài đặt các thư viện phụ thuộc 

Cài đặt Node.js (phiên bản LTS) và npm/yarn nếu chưa có.
Cài đặt các thư viện cần thiết:
Chạy lệnh: npm install axios react-router-dom.
Nếu sử dụng Tailwind CSS đầy đủ (không dùng CDN):
Chạy lệnh: npm install -D tailwindcss postcss autoprefixer.
Khởi tạo Tailwind: npx tailwindcss init -p.
Cấu hình tailwind.config.js để quét các file index.html và src/**/*.{js,ts,jsx,tsx}.
Cập nhật src/index.css với các chỉ thị @tailwind base, @components, @utilities.


Kiểm tra dự án chạy đúng bằng lệnh npm run dev và truy cập http://localhost:5173.

1. Thiết lập cấu trúc thư mục 

Tạo các thư mục và file trong src/:
src/assets/: Lưu trữ hình ảnh, biểu tượng.
src/components/: Chứa các thành phần tái sử dụng như Navbar.jsx, FormInput.jsx.
src/pages/: Chứa các trang như Login.jsx, Register.jsx, Dashboard.jsx.
src/services/: Chứa các hàm gọi API như auth.js.
src/utils/: Chứa các hàm tiện ích như quản lý token.


Cập nhật src/App.jsx để thiết lập React Router với các route cơ bản: /login, /register, / (chuyển hướng đến /login).
Đảm bảo src/main.jsx render ứng dụng đúng với React.StrictMode.

1. Tạo dịch vụ xác thực

Tạo file src/services/auth.js:
Hàm register(data): Gửi POST request đến /api/users/register với dữ liệu người dùng (name, email, password).
Hàm login(email, password): Gửi POST request đến /api/users/login để lấy JWT và refresh token.
Hàm refreshToken(refreshToken): Gửi POST request đến /api/auth/refresh để làm mới token.


Tạo file src/utils/auth.js:
Hàm setAuthToken(token, refreshToken): Lưu token và refresh token vào localStorage.
Hàm getAuthToken(): Lấy JWT từ localStorage.
Hàm getRefreshToken(): Lấy refresh token từ localStorage.
Hàm clearAuthToken(): Xóa cả hai token khỏi localStorage.



1. Tạo AuthContext và Protected Routes 

Tạo file src/context/AuthContext.jsx:
Tạo AuthContext để quản lý trạng thái người dùng và các hàm login, logout.
Sử dụng useEffect để kiểm tra token khi tải ứng dụng, gọi API /api/users/me để lấy thông tin người dùng.
Xử lý login để lưu token và cập nhật trạng thái người dùng, logout để xóa token và reset trạng thái.


Tạo file src/components/ProtectedRoute.jsx:
Kiểm tra trạng thái người dùng từ AuthContext.
Nếu đang tải, hiển thị thông báo "Đang tải...".
Nếu không có người dùng, chuyển hướng đến /login.
Nếu có người dùng, render nội dung con.


Cập nhật src/App.jsx để bọc ứng dụng trong AuthProvider và thêm route /dashboard với ProtectedRoute.

1. Xây dựng trang Login và Register

Tạo file src/pages/Login.jsx:
Tạo form với các trường email, password.
Xử lý submit để gọi hàm login từ AuthContext, lưu token, và chuyển hướng đến /dashboard.
Hiển thị thông báo lỗi nếu API trả về lỗi (ví dụ: "User does not exist").


Tạo file src/pages/Register.jsx:
Tạo form với các trường name, email, password.
Xử lý submit để gọi hàm register từ services/auth.js, sau đó chuyển hướng đến /login.
Hiển thị thông báo lỗi nếu API trả về lỗi (ví dụ: "User already existed").


Sử dụng Tailwind CSS để thiết kế giao diện responsive, với form căn giữa màn hình, nút submit, và thông báo lỗi màu đỏ.


Lưu ý

Đảm bảo backend chạy tại http://localhost:3000 để gọi API.
Thêm biến môi trường REACT_APP_API_URL trong .env để dễ dàng thay đổi URL backend.
Kiểm tra cấu hình CORS trong backend nếu gặp lỗi liên quan.
Có thể thêm react-toastify để hiển thị thông báo lỗi/success đẹp hơn.

