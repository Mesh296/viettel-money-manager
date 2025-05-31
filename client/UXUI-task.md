# Tài liệu Thiết kế UX/UI cho MMV Finance

## 1. Tổng quan về Phong cách Thiết kế
Trang Codecademy Python có giao diện tối giản, sử dụng bảng màu sáng, typography rõ ràng và các chi tiết pixel art tinh tế (như hoa văn chấm nhỏ). Để áp dụng phong cách này vào MMV Finance, chúng ta sẽ:
- **Ảnh hưởng Pixel Art:** Sử dụng hoa văn pixel nhẹ (như chấm hoặc viền) cho nền và các yếu tố trang trí, nhưng giữ mức độ tối thiểu để không làm phân tâm.
- **Đơn giản Hiện đại:** Bố cục gọn gàng, nhiều khoảng trắng, tập trung vào tính dễ dùng cho dữ liệu tài chính.
- **Typography:** Font sans-serif hiện đại, dễ đọc (tương tự Codecademy).
- **Bảng màu:** Nền sáng với các điểm nhấn pastel nhẹ nhàng (xanh, xanh lá, đỏ, vàng) kết hợp gradient hoặc texture pixel.
- **Tương tác:** Hiệu ứng hover, animation nhẹ và thông báo toast để tăng trải nghiệm người dùng.

## 2. Bảng màu
- **Nền chính:** Trắng ngà (#FFF5E9, giống nền Codecademy).
- **Nền phụ (Cards):** Trắng (#FFFFFF) với viền pixel hoặc bóng nhẹ.
- **Màu nhấn:**
  - Xanh dương (#5A67D8) cho các hành động chính (ví dụ: "Thêm giao dịch").
  - Xanh lá (#48BB78) cho thu nhập.
  - Đỏ (#F56565) cho chi tiêu hoặc cảnh báo.
  - Vàng (#F6E05E) cho cảnh báo nhẹ.
- **Màu chữ:**
  - Tiêu đề: Xám đậm (#2D3748).
  - Nội dung: Xám vừa (#4A5568).
  - Link: Xanh dương (#5A67D8).

## 3. Typography
- **Font chính:** Font sans-serif hiện đại như "Inter" hoặc "Roboto".
  - Tiêu đề lớn: Bold, 24px-32px.
  - Tiêu đề phần: Bold, 18px-20px.
  - Nội dung: Regular, 14px-16px.
  - Nút: Medium, 14px-16px.
- **Chạm nét Pixel Art:** Dùng font pixel như "Press Start 2P" (10px-12px) cho logo "MMV Finance" hoặc tiêu đề trang trí, nhưng sử dụng tiết chế để giữ độ dễ đọc.

## 4. Bố cục và Thành phần
- **Navbar (src/components/Navbar.jsx):**
  - Cố định phía trên, nền #FFF5E9, viền dưới nhẹ (1px solid #E2E8F0).
  - Logo "MMV Finance" dùng font pixel, bên trái.
  - Các link ("Dashboard", "Transactions",...) dạng danh sách ngang, màu xanh (#5A67D8) khi active, xám (#4A5568) khi không active.
  - Chào người dùng ("Xin chào, [User]") và nút "Đăng xuất" bên phải, nút xanh với viền pixel.

- **Dashboard (src/pages/Dashboard.jsx):**
  - Phần đầu: Tiêu đề lớn "Dashboard" với hoa văn pixel nền.
  - Widgets (`AlertWidget`, `RecentTransactions`, `MonthlyChart`, `CategorySpendingChart`): Dạng card trắng, viền pixel, bóng nhẹ.
  - Tiêu đề card (ví dụ: "Cảnh báo"): Bold, 18px, #2D3748.
  - Biểu đồ: Dùng màu pastel (xanh lá cho thu nhập, đỏ cho chi tiêu), viền pixel cho điểm dữ liệu.

- **Transactions Page (src/pages/Transactions.jsx):**
  - Bộ lọc (`TransactionFilter`): Card gập/mở với nút xanh "Tìm kiếm và lọc giao dịch" và mũi tên pixel (▲/▼).
  - Danh sách giao dịch (`TransactionList`): Bảng với màu xen kẽ (trắng và #F7FAFC), viền pixel.
  - Nút "Thêm giao dịch": Nút xanh nổi bật, viền pixel, đặt giữa trên bảng.

- **Alerts Page (src/pages/Alerts.jsx):**
  - Hiển thị cảnh báo trong card với nền màu theo loại: vàng (#FFF5E9) cho cảnh báo nhẹ, đỏ (#FED7D7) cho nghiêm trọng, cam (#FEEBC8) cho giới hạn danh mục.
  - Card có viền pixel, timestamp nhỏ góc dưới bên phải.

- **Forms (TransactionForm, TransactionEdit):**
  - Input: Nền trắng, viền pixel, vòng focus xanh (#5A67D8).
  - Label: Bold, 14px, #2D3748.
  - Nút ("Thêm giao dịch", "Cập nhật giao dịch"): Xanh, viền pixel, hiệu ứng hover phóng to nhẹ.

- **Toast Notifications (react-toastify):**
  - Màu: Xanh lá cho thành công, đỏ cho lỗi, vàng cho cảnh báo.
  - Viền pixel, icon pixel nhỏ (ví dụ: dấu check cho thành công).

## 5. Yếu tố Pixel Art
- **Hoa văn nền:** Dùng hoa văn chấm nhẹ (như Codecademy) cho nền chính.
- **Icon:** Thay icon thường bằng phiên bản pixel (ví dụ: lịch pixel cho date picker).
- **Viền và Bóng:** Viền pixel 1px (CSS border-image) cho card, nút, input.
- **Hình minh họa:** Thêm hình pixel nhỏ (ví dụ: ví pixel cho Dashboard).

## 6. Responsive
- **Desktop:** Bố cục lưới 2-3 cột cho Dashboard.
- **Tablet:** Xếp dọc widgets, giảm 10% kích thước font.
- **Mobile:** Font 12px cho nội dung, Navbar thành hamburger menu, tất cả xếp dọc.

## 7. Tương tác và Animation
- **Hover:** Nút và link phóng to nhẹ (1.05x), sáng hơn.
- **Loading:** Spinner pixel (hình vuông quay) cho trạng thái tải.
- **Toast:** Trượt từ trên phải xuống với hiệu ứng nảy pixel nhẹ.

---

# Nhiệm vụ cho AI Frontend

Dưới đây là các nhiệm vụ cụ thể để triển khai thiết kế UX/UI cho MMV Finance, dựa trên cấu trúc từ `repomix-output.md`.

### Task 1: Cập nhật Global Styles (src/index.css)
- **Mục tiêu:** Thiết lập bảng màu, typography và hoa văn pixel chung.
- **Chi tiết:**
  - Định nghĩa biến màu (ví dụ: `--background: #FFF5E9;`).
  - Font mặc định: "Inter" với fallback "Roboto, sans-serif".
  - Nền pixel chấm (radial-gradient).
  - Style mặc định cho nút, input, card với viền pixel.
- **Code mẫu:**
  ```css
  :root {
    --background: #FFF5E9;
    --card-bg: #FFFFFF;
    --primary-blue: #5A67D8;
    --income-green: #48BB78;
    --expense-red: #F56565;
    --warning-yellow: #F6E05E;
    --text-dark: #2D3748;
    --text-medium: #4A5568;
  }

  body {
    background: var(--background);
    background-image: radial-gradient(circle, #E2E8F0 1px, transparent 1px);
    background-size: 10px 10px;
    font-family: 'Inter', 'Roboto', sans-serif;
  }

  .card {
    background: var(--card-bg);
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border SVG */
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    padding: 1.5rem;
  }

  button {
    background: var(--primary-blue);
    color: white;
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border SVG */
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: transform 0.2s, background 0.3s;
  }

  button:hover {
    transform: scale(1.05);
    background: #4C51BF;
  }
  ```

### Task 2: Thiết kế lại Navbar (src/components/Navbar.jsx)
- **Mục tiêu:** Cập nhật Navbar theo phong cách Codecademy với logo pixel.
- **Chi tiết:**
  - Nền sáng, viền dưới nhẹ.
  - Logo "MMV Finance" dùng font "Press Start 2P".
  - Link xanh khi active, xám khi không active.
  - Nút "Đăng xuất" xanh với viền pixel.
  - Responsive: Hamburger menu trên mobile.
- **Code mẫu (CSS):**
  ```css
  .navbar {
    background: var(--background);
    border-bottom: 1px solid #E2E8F0;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .navbar-logo {
    font-family: 'Press Start 2P', cursive;
    font-size: 16px;
    color: var(--text-dark);
  }

  .navbar-links a {
    margin-left: 1.5rem;
    color: var(--text-medium);
    text-decoration: none;
    font-size: 16px;
  }

  .navbar-links a.active {
    color: var(--primary-blue);
    font-weight: bold;
  }

  .logout-btn {
    background: var(--primary-blue);
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
  }

  @media (max-width: 768px) {
    .navbar-links {
      display: none;
    }
    /* Thêm style hamburger menu */
  }
  ```

### Task 3: Style Widgets trên Dashboard (src/pages/Dashboard.jsx)
- **Mục tiêu:** Style các widget (`AlertWidget`, `RecentTransactions`, `MonthlyChart`, `CategorySpendingChart`) thành card pixel.
- **Chi tiết:**
  - Grid 2-3 cột trên desktop, xếp dọc trên mobile.
  - Card trắng, viền pixel, bóng nhẹ.
  - Thêm hình minh họa pixel (ví dụ: ví cho Dashboard).
  - Biểu đồ dùng màu pastel.
- **Code mẫu (CSS):**
  ```css
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
  }

  .widget-card {
    background: var(--card-bg);
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    border-radius: 4px;
  }

  .widget-title {
    font-size: 18px;
    font-weight: bold;
    color: var(--text-dark);
    margin-bottom: 1rem;
  }

  .chart {
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
  }

  @media (max-width: 768px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }
  ```

### Task 4: Style Trang Transactions (src/pages/Transactions.jsx)
- **Mục tiêu:** Cải thiện trang Transactions với bộ lọc, bảng và nút.
- **Chi tiết:**
  - Bộ lọc: Card gập/mở với nút xanh và mũi tên pixel.
  - Bảng giao dịch: Xen kẽ màu, viền pixel.
  - Nút "Thêm giao dịch": Xanh, viền pixel, nổi bật.
- **Code mẫu (CSS):**
  ```css
  .filter-section {
    background: var(--card-bg);
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .filter-toggle {
    background: var(--primary-blue);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
  }

  .transaction-table {
    width: 100%;
    border-collapse: collapse;
  }

  .transaction-table th,
  .transaction-table td {
    padding: 0.75rem;
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
  }

  .transaction-table tr:nth-child(even) {
    background: #F7FAFC;
  }

  .add-transaction-btn {
    background: var(--primary-blue);
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  ```

### Task 5: Style Trang Alerts (src/pages/Alerts.jsx)
- **Mục tiêu:** Style cảnh báo thành card với màu mã hóa.
- **Chi tiết:**
  - Card có viền pixel.
  - Nền màu: Vàng cho cảnh báo, đỏ cho nghiêm trọng, cam cho giới hạn danh mục.
  - Timestamp nhỏ góc dưới phải.
- **Code mẫu (CSS):**
  ```css
  .alert-card {
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    position: relative;
  }

  .alert-card.warning {
    background: #FFF5E9;
  }

  .alert-card.critical {
    background: #FED7D7;
  }

  .alert-card.category-limit {
    background: #FEEBC8;
  }

  .alert-timestamp {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    font-size: 12px;
    color: var(--text-medium);
  }
  ```

### Task 6: Style Forms (src/components/TransactionForm.jsx, src/components/TransactionEdit.jsx)
- **Mục tiêu:** Style input, label, nút với thẩm mỹ pixel.
- **Chi tiết:**
  - Input: Nền trắng, viền pixel, focus xanh.
  - Label: Bold, xám đậm.
  - Nút: Xanh, viền pixel, hover phóng to.
- **Code mẫu (CSS):**
  ```css
  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    font-weight: bold;
    color: var(--text-dark);
    font-size: 14px;
    margin-bottom: 0.5rem;
    display: block;
  }

  .form-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
    border-radius: 4px;
    font-size: 14px;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--primary-blue);
    box-shadow: 0 0 0 2px rgba(90, 103, 216, 0.2);
  }

  .form-button {
    background: var(--primary-blue);
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    color: white;
  }

  .form-button:hover {
    transform: scale(1.05);
    background: #4C51BF;
  }
  ```

### Task 7: Cải thiện Toast Notifications (react-toastify)
- **Mục tiêu:** Style toast với viền pixel và màu mã hóa.
- **Chi tiết:**
  - Xanh lá cho thành công, đỏ cho lỗi, vàng cho cảnh báo.
  - Viền pixel, icon pixel nhỏ.
  - Animation trượt với nảy nhẹ.
- **Code mẫu (CSS):**
  ```css
  .Toastify__toast {
    border: 1px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
    border-radius: 4px;
    animation: slideIn 0.5s ease-out;
  }

  .Toastify__toast--success {
    background: #E6FFE6;
    color: #2D3748;
  }

  .Toastify__toast--error {
    background: #FED7D7;
    color: #2D3748;
  }

  .Toastify__toast--warning {
    background: #FFF5E9;
    color: #2D3748;
  }

  @keyframes slideIn {
    0% { transform: translateX(100%); opacity: 0; }
    80% { transform: translateX(-10%); opacity: 1; }
    100% { transform: translateX(0); opacity: 1; }
  }
  ```

### Task 8: Thêm Icon và Hình minh họa Pixel
- **Mục tiêu:** Tích hợp icon và hình pixel cho giao diện.
- **Chi tiết:**
  - Tạo SVG pixel cho icon (lịch, bộ lọc, ví, biểu đồ).
  - Thêm ví pixel vào header Dashboard.
  - Thêm biểu đồ pixel vào header Transactions.
- **SVG mẫu (Icon lịch pixel):**
  ```svg
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="12" height="10" fill="#5A67D8" style="image-rendering: pixelated;" />
    <rect x="2" y="2" width="2" height="2" fill="#5A67D8" style="image-rendering: pixelated;" />
    <rect x="12" y="2" width="2" height="2" fill="#5A67D8" style="image-rendering: pixelated;" />
    <rect x="4" y="6" width="2" height="2" fill="#FFF" style="image-rendering: pixelated;" />
    <rect x="8" y="6" width="2" height="2" fill="#FFF" style="image-rendering: pixelated;" />
    <rect x="12" y="6" width="2" height="2" fill="#FFF" style="image-rendering: pixelated;" />
  </svg>
  ```

### Task 9: Thêm Loading States với Spinner Pixel
- **Mục tiêu:** Tạo spinner pixel cho trạng thái tải.
- **Chi tiết:**
  - Hình vuông quay nhỏ với viền pixel.
  - Áp dụng cho `AlertWidget`, `RecentTransactions`, `TransactionList`.
- **Code mẫu (CSS):**
  ```css
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #E2E8F0;
    border-image: url('data:image/svg+xml;...'); /* Pixelated border */
    border-top: 2px solid var(--primary-blue);
    border-radius: 4px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  ```

### Task 10: Đảm bảo Responsive trên các Thiết bị
- **Mục tiêu:** Tối ưu UI cho desktop, tablet, mobile.
- **Chi tiết:**
  - Media queries điều chỉnh bố cục, kích thước font, khoảng cách.
  - Navbar thành hamburger trên mobile.
  - Widgets xếp dọc trên tablet/mobile.
  - Font 12px cho nội dung trên mobile.
- **Code mẫu (CSS):**
  ```css
  @media (max-width: 1024px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
    h1 { font-size: 24px; }
    p { font-size: 14px; }
  }

  @media (max-width: 768px) {
    .navbar-links { display: none; }
    p { font-size: 12px; }
  }
  ```

---

# Tóm tắt
Tài liệu UX/UI này kết hợp phong cách pixel-art hiện đại từ Codecademy với sự đơn giản và rõ ràng cần thiết cho MMV Finance. Các nhiệm vụ trên cung cấp kế hoạch triển khai từng bước để AI frontend áp dụng style này vào các thành phần và trang của dự án, đảm bảo trải nghiệm người dùng nhất quán và hấp dẫn. Hãy bắt đầu với Task 1 để thiết lập nền tảng, sau đó thực hiện tuần tự các task còn lại.