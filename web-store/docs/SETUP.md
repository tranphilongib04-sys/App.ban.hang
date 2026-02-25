# 🚀 TBQ HOMIE - Hệ thống Auto Delivery + Invoice

## 📋 Tổng quan

Hệ thống bán tài khoản số với các tính năng:
- ✅ Atomic reserve (all or nothing) với quantity > 1
- ✅ Auto delivery sau thanh toán
- ✅ Invoice tự động
- ✅ Chống cấp trùng tài khoản
- ✅ Trang delivery bảo mật với token

## 🔧 Setup

### 1. Database Migration

Schema đã được migrate sẵn trên Turso cloud database. Không cần chạy migration thủ công.

### 2. Environment Variables (Netlify)

Thêm các biến môi trường trong Netlify Dashboard:

```
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
SEPAY_API_TOKEN=... (optional, cho auto payment detection)
ADMIN_API_TOKEN=... (optional, cho admin API)
DELIVERY_SECRET=... (bắt buộc, secret để generate delivery token)
CRON_SECRET=... (optional, cho manual cron trigger)
```

### 3. Setup Scheduled Function (Release Expired)

Thêm vào `netlify.toml`:

```toml
[[plugins]]
  package = "@netlify/plugin-scheduled-functions"

[functions.release-expired]
  schedule = "*/5 * * * *"  # Every 5 minutes
```

Hoặc setup qua Netlify Dashboard:
- Go to Functions → Scheduled Functions
- Add: `release-expired` với schedule `*/5 * * * *`

### 4. Import Products

Tạo products trong database:

```sql
INSERT INTO products (code, name, variant, base_price, is_active)
VALUES 
  ('chatgpt_plus-1m', 'ChatGPT Plus', 'Cấp TK mới', 70000, 1),
  ('netflix_extra', 'Giao sau 1 tháng', NULL, 70000, 1);
```

### 5. Import Stock Units

Sử dụng script import hoặc insert trực tiếp:

```sql
INSERT INTO stock_units (product_id, username, password_encrypted, password_iv, password_masked, status)
VALUES 
  (1, 'user1@gmail.com', 'base64_encrypted_password', 'base64_iv', 'use***@gmail.com', 'available');
```

## 📡 API Endpoints

### Public APIs

- `POST /.netlify/functions/create-order` - Tạo đơn hàng + reserve inventory
- `GET /.netlify/functions/check-payment?orderCode=...&amount=...` - Kiểm tra thanh toán + auto delivery
- `GET /.netlify/functions/delivery?token=...&order=...` - Trang nhận hàng
- `GET /.netlify/functions/invoice?order=...&token=...` - Invoice HTML/PDF
- `GET /.netlify/functions/inventory?service=...&variant=...` - Kiểm tra tồn kho

### Admin APIs

- `GET /.netlify/functions/admin-orders` - Xem đơn hàng (cần Bearer token)
- `POST /.netlify/functions/admin-orders` - Cập nhật trạng thái đơn

### Cron

- `GET /.netlify/functions/release-expired?secret=...` - Release expired reservations

## 🔄 Flow

1. **Khách đặt hàng** → `create-order` → Reserve N units (atomic)
2. **Khách thanh toán** → Sepay callback → `check-payment` detect
3. **Auto delivery** → Update order → Generate credentials → Create invoice
4. **Redirect** → Delivery page với token
5. **Khách xem** → Reveal password → Download invoice

## 🛡️ Security

- Delivery token có thời hạn 7 ngày
- Password được encrypt trong DB
- Delivery page chỉ hiển thị khi có token hợp lệ
- Invoice không chứa password

## 📝 Notes

- Quantity > 1: Reserve atomic (all or nothing)
- Reservation timeout: 30 phút
- Auto release expired: Mỗi 5 phút
- Invoice number format: `TBQ-YYYYMM-xxxxx`

## 🐛 Troubleshooting

### Migration fails
- Kiểm tra `TURSO_DATABASE_URL` và `TURSO_AUTH_TOKEN`
- Đảm bảo có quyền CREATE TABLE

### Order không reserve được
- Kiểm tra stock_units có `status = 'available'`
- Kiểm tra `product_id` mapping đúng

### Payment không detect
- Kiểm tra `SEPAY_API_TOKEN`
- Kiểm tra transaction content có chứa orderCode

### Delivery page 403
- Kiểm tra token còn hạn (7 ngày)
- Kiểm tra `DELIVERY_SECRET` match
