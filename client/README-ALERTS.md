# Hướng Dẫn Sử Dụng Hệ Thống Cảnh Báo

## Tổng Quan

Hệ thống cảnh báo được thiết kế để thông báo cho người dùng khi chi tiêu của họ đạt đến hoặc vượt quá ngân sách đã thiết lập. Có hai loại cảnh báo chính:

1. **Cảnh báo ngân sách tháng**: Khi tổng chi tiêu trong tháng đạt 90% hoặc vượt quá ngân sách hàng tháng
2. **Cảnh báo ngân sách danh mục**: Khi chi tiêu cho một danh mục cụ thể vượt quá ngân sách đã thiết lập cho danh mục đó

## Các Tính Năng Cảnh Báo

### 1. Hiển Thị Cảnh Báo

- **Trên Dashboard**: Hiển thị 3 cảnh báo mới nhất trong widget cảnh báo
- **Trang Cảnh Báo**: Hiển thị tất cả cảnh báo được phân loại theo mức độ nghiêm trọng
- **Toast Notification**: Hiển thị thông báo tạm thời khi một cảnh báo mới được tạo

### 2. Điều Kiện Kích Hoạt Cảnh Báo

- **Cảnh báo sắp vượt ngân sách tháng**: Khi chi tiêu đạt 90-99% ngân sách tháng (màu vàng)
- **Cảnh báo vượt ngân sách tháng**: Khi chi tiêu vượt 100% ngân sách tháng (màu đỏ)
- **Cảnh báo vượt ngân sách danh mục**: Khi chi tiêu cho một danh mục vượt ngân sách của danh mục đó (màu cam)

### 3. Thời Điểm Kiểm Tra Cảnh Báo

Hệ thống sẽ kiểm tra và tạo cảnh báo tại các thời điểm sau:

- Khi người dùng tạo một giao dịch chi tiêu mới
- Khi người dùng cập nhật một giao dịch chi tiêu
- Khi người dùng truy cập trang Dashboard (hệ thống tự động kiểm tra)

## Cách Thiết Lập

Để hệ thống cảnh báo hoạt động hiệu quả, bạn cần:

1. **Thiết lập ngân sách hàng tháng**:
   - Truy cập trang "Ngân sách"
   - Nhập số tiền ngân sách cho tháng hiện tại

2. **Thiết lập ngân sách cho từng danh mục**:
   - Truy cập trang "Ngân sách" 
   - Trong phần "Ngân sách theo danh mục", thiết lập ngân sách cho từng danh mục chi tiêu

3. **Ghi nhận các giao dịch chi tiêu**:
   - Truy cập trang "Giao dịch"
   - Thêm các giao dịch chi tiêu với danh mục và số tiền tương ứng

## Xử Lý Sự Cố

Nếu cảnh báo không hoạt động:

1. **Kiểm tra đã thiết lập ngân sách chưa**:
   - Ngân sách hàng tháng phải lớn hơn 0
   - Ngân sách danh mục phải được thiết lập

2. **Kiểm tra giao dịch chi tiêu**:
   - Phải có giao dịch loại "chi tiêu" (expense)
   - Giao dịch phải được gắn với danh mục đúng

3. **Kiểm tra console log**:
   - Mở developer console trong trình duyệt để xem log debug
   - Tìm các log có tiền tố "DEBUG" để xem thông tin chi tiết

## Chú ý

- Mỗi cảnh báo chỉ được tạo một lần cho mỗi điều kiện kích hoạt
- Cảnh báo sẽ không tự động xóa khi chi tiêu giảm dưới ngưỡng
- Bạn có thể xóa cảnh báo thủ công nếu không còn cần thiết

## Liên hệ hỗ trợ

Nếu bạn gặp vấn đề với hệ thống cảnh báo, vui lòng liên hệ với chúng tôi qua email support@example.com 