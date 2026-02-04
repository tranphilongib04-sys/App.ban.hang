# 🔗 Hướng dẫn cấu hình Webhook Sepay Dashboard

## 📋 Mục tiêu

Cấu hình webhook để Sepay tự động gửi thông báo thanh toán về server → hệ thống tự động xác nhận đơn và giao hàng.

---

## 🎯 Bước 1: Lấy URL Netlify của bạn

### Cách 1: Từ Netlify Dashboard
1. Đăng nhập vào [Netlify Dashboard](https://app.netlify.com)
2. Chọn site của bạn (ví dụ: `tbq-homie`)
3. Vào **Site overview** → Copy **Site URL** ở góc trên bên phải
   - Ví dụ: `https://tbq-homie-12345.netlify.app`

### Cách 2: Từ terminal (nếu đã deploy)
```bash
cd tbq-homie-deployment
netlify status
# Hoặc
netlify info
```

### URL Webhook hoàn chỉnh:
```
https://[your-site-url]/.netlify/functions/webhook-sepay
```

**Ví dụ:**
```
https://tbq-homie-12345.netlify.app/.netlify/functions/webhook-sepay
```

---

## 🎯 Bước 2: Lấy SEPAY_API_TOKEN

### Cách 1: Từ Sepay Dashboard
1. Đăng nhập [Sepay Dashboard](https://my.sepay.vn)
2. Vào **API** hoặc **Cài đặt** → **API Token**
3. Copy token (dạng: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Cách 2: Kiểm tra trong .env (local)
```bash
cd tbq-homie-deployment
cat .env | grep SEPAY_API_TOKEN
```

**⚠️ Lưu ý:** Token này sẽ dùng để:
- Xác thực webhook từ Sepay
- Gọi API Sepay để check payment

---

## 🎯 Bước 3: Cấu hình Webhook trong Sepay Dashboard

### 3.1. Đăng nhập Sepay Dashboard
- Truy cập: https://my.sepay.vn
- Đăng nhập với tài khoản của bạn

### 3.2. Tìm mục Webhook/Callback
**Các vị trí có thể có:**
- **Cổng thanh toán** → **Cài đặt** → **Webhook**
- **API** → **Webhook Settings**
- **Cài đặt** → **Thông báo** → **Webhook URL**
- **Tích hợp** → **Webhook**

**Giao diện thường có:**
```
┌─────────────────────────────────────┐
│ Webhook URL                         │
│ [___________________________]      │
│                                     │
│ Webhook Token (Optional)            │
│ [___________________________]       │
│                                     │
│ [✓] Enable Webhook                 │
│                                     │
│ [Lưu] [Hủy]                        │
└─────────────────────────────────────┘
```

### 3.3. Nhập thông tin

**Webhook URL:**
```
https://[your-site-url]/.netlify/functions/webhook-sepay
```

**Ví dụ cụ thể:**
```
https://tbq-homie-12345.netlify.app/.netlify/functions/webhook-sepay
```

**Webhook Token/Secret (nếu có):**
- Nhập cùng giá trị với `SEPAY_API_TOKEN` của bạn
- Hoặc để trống nếu Sepay không yêu cầu

**Events/Events to listen (nếu có):**
- Chọn: **Payment Success** / **Transaction Completed**
- Hoặc để mặc định (tất cả events)

### 3.4. Lưu cấu hình
- Click **Lưu** / **Save** / **Cập nhật**
- Sepay có thể gửi test webhook ngay → kiểm tra Netlify logs

---

## 🎯 Bước 4: Kiểm tra Environment Variables trên Netlify

### 4.1. Vào Netlify Dashboard
1. Đăng nhập [Netlify Dashboard](https://app.netlify.com)
2. Chọn site của bạn
3. Vào **Site settings** → **Environment variables**

### 4.2. Đảm bảo có các biến sau:

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `SEPAY_API_TOKEN` | Token API từ Sepay (dùng cho webhook auth + API calls) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `TURSO_DATABASE_URL` | URL database Turso | `libsql://xxx-xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | Auth token database | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...` |
| `DELIVERY_SECRET` | Secret để generate delivery token | `your-secret-key-here` |

### 4.3. Cập nhật nếu thiếu
- Click **Add a variable**
- Nhập **Key** và **Value**
- Click **Save**

**⚠️ Quan trọng:** Sau khi thêm/sửa env vars, cần **redeploy** site:
- Vào **Deploys** → Click **Trigger deploy** → **Deploy site**

---

## 🎯 Bước 5: Test Webhook

### 5.1. Test bằng script (khuyến nghị)

Chạy script test webhook:

```bash
cd tbq-homie-deployment
node scripts/test-webhook.js
```

Script này sẽ:
- Gửi request giả lập webhook từ Sepay
- Kiểm tra response từ server
- Hiển thị kết quả

### 5.2. Test thủ công bằng curl

```bash
# Thay YOUR_SITE_URL và YOUR_SEPAY_API_TOKEN
curl -X POST https://YOUR_SITE_URL/.netlify/functions/webhook-sepay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SEPAY_API_TOKEN" \
  -d '{
    "content": "IBFT TBQ20824761",
    "amountIn": 70000,
    "id": "test-webhook-123",
    "referenceCode": "REF123"
  }'
```

**Expected response:**
```json
{
  "success": false,
  "message": "Order not found"
}
```
(Đây là OK vì order code test không tồn tại)

### 5.3. Test với đơn thật

1. Tạo đơn hàng mới trên web
2. Thanh toán thành công trên Sepay
3. Kiểm tra Netlify logs:
   - **Functions** → **webhook-sepay** → **Logs**
   - Tìm dòng: `Webhook: Order TBQxxx fulfilled successfully`

---

## 🎯 Bước 6: Kiểm tra Logs

### 6.1. Netlify Function Logs
1. Vào **Netlify Dashboard** → **Functions**
2. Click vào `webhook-sepay`
3. Xem **Logs** tab

**Logs thành công:**
```
[Webhook] Received: {...}
Webhook: Order TBQ20824761 fulfilled successfully.
```

**Logs lỗi:**
```
[Webhook] Invalid Token: xxx
[Webhook] Order not found: TBQxxx
Insufficient amount for TBQxxx: Received 50000, Needed 70000
```

### 6.2. Sepay Dashboard Logs (nếu có)
- Vào **Sepay Dashboard** → **Webhook Logs** / **API Logs**
- Xem status code (200 = success, 401/500 = error)
- Xem response từ server

---

## ✅ Checklist hoàn thành

- [ ] Đã lấy URL Netlify site
- [ ] Đã lấy SEPAY_API_TOKEN từ Sepay
- [ ] Đã cấu hình Webhook URL trong Sepay Dashboard
- [ ] Đã nhập Webhook Token (nếu có)
- [ ] Đã kiểm tra Environment Variables trên Netlify
- [ ] Đã redeploy site sau khi sửa env vars
- [ ] Đã test webhook bằng script hoặc curl
- [ ] Đã kiểm tra logs sau khi thanh toán thử

---

## 🐛 Troubleshooting

### Lỗi: Webhook không được gọi
**Nguyên nhân:**
- Webhook URL sai
- Sepay chưa enable webhook
- Firewall/Netlify block request

**Giải pháp:**
1. Kiểm tra lại URL trong Sepay Dashboard
2. Test bằng curl (xem Bước 5.2)
3. Kiểm tra Netlify logs có request đến không

### Lỗi: 401 Unauthorized
**Nguyên nhân:**
- SEPAY_API_TOKEN không khớp
- Token không được gửi trong header

**Giải pháp:**
1. Kiểm tra `SEPAY_API_TOKEN` trong Netlify env vars
2. Đảm bảo Sepay gửi token trong header `Authorization: Bearer ...`
3. Xem logs: `[Webhook] Invalid Token: xxx`

### Lỗi: Order not found
**Nguyên nhân:**
- Order code không khớp format
- Transaction content không chứa order code

**Giải pháp:**
1. Kiểm tra format order code: `TBQ\d+` (ví dụ: `TBQ20824761`)
2. Xem logs: `Webhook ignored: No order code found in content`
3. Đảm bảo Sepay gửi order code trong `content` hoặc `transaction_content`

### Lỗi: Insufficient amount
**Nguyên nhân:**
- Số tiền thanh toán < 95% số tiền đơn hàng

**Giải pháp:**
1. Kiểm tra `amountIn` trong webhook payload
2. So sánh với `order.amount_total` trong database
3. Xem logs: `Insufficient amount for TBQxxx: Received X, Needed Y`

---

## 📞 Hỗ trợ

Nếu vẫn gặp vấn đề:
1. Xem file `FIX_AUTO_PAYMENT.md` để debug chi tiết
2. Chạy `scripts/manual-reconcile.js` để xử lý đơn pending thủ công
3. Kiểm tra `netlify/functions/webhook-sepay.js` để xem logic xử lý

---

## 🎉 Kết quả mong đợi

Sau khi cấu hình đúng:
- ✅ Sepay gửi webhook ngay sau khi thanh toán thành công
- ✅ Server tự động xác nhận đơn (`pending_payment` → `fulfilled`)
- ✅ Tự động giao hàng (tạo delivery page với credentials)
- ✅ User nhận được thông báo và link delivery

**Thời gian xử lý:** Thường < 5 giây sau khi thanh toán thành công.
