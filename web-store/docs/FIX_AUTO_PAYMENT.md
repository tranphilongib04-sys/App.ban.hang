# Fix: Tự động xác nhận thanh toán không hoạt động

## Vấn đề

- Sepay đã nhận tiền (giao dịch hiển thị trong dashboard)
- Web admin thấy đơn `pending_payment`
- Nhưng hệ thống **không tự động** chuyển sang `fulfilled` và giao hàng

## Nguyên nhân có thể

1. **Webhook Sepay chưa được cấu hình** → Sepay không gửi callback về server
2. **Logic match giao dịch không khớp** → check-payment không tìm thấy transaction
3. **Reconciliation job chưa chạy** → không có backup khi webhook fail
4. **SEPAY_API_TOKEN không đúng** → API call fail

---

## Giải pháp đã áp dụng

### 1. ✅ Cải thiện logic match giao dịch

**File:** `netlify/functions/check-payment.js`

- Match nhiều format Sepay: `IBFT TBQxxx`, `MBVCB.xxx.TBQxxx`, hoặc chỉ số
- Đọc nhiều field: `transaction_content`, `content`, `description`
- Đọc nhiều field amount: `amount_in`, `amount`, `amountIn`
- Thêm logging chi tiết để debug

### 2. ✅ Cải thiện reconciliation job

**File:** `netlify/functions/reconcile-payments.js`

- Match logic giống check-payment
- Chạy mỗi 5 phút (đã config trong `netlify.toml`)
- Tự động fulfill đơn đã thanh toán nhưng webhook miss

### 3. ✅ Script manual reconcile

**File:** `scripts/manual-reconcile.js`

Chạy thủ công để xác nhận thanh toán ngay:

```bash
cd tbq-homie-deployment
node scripts/manual-reconcile.js TBQ20824761
```

Hoặc reconcile tất cả đơn pending trong 24h:

```bash
node scripts/manual-reconcile.js
```

---

## Các bước cần làm NGAY

### Bước 1: Cấu hình Webhook trong Sepay Dashboard

1. Đăng nhập **Sepay Dashboard** → **Cổng thanh toán** → **Đơn hàng** hoặc **Cài đặt**
2. Tìm mục **Webhook URL** hoặc **Callback URL**
3. Nhập URL webhook của bạn:

   ```
   https://[your-netlify-site].netlify.app/.netlify/functions/webhook-sepay
   ```

   Ví dụ: `https://tbq-homie-12345.netlify.app/.netlify/functions/webhook-sepay`

4. **Webhook Secret/Token** (nếu có): Đặt giống với `SEPAY_API_TOKEN` trong Netlify env vars
5. Lưu cấu hình

### Bước 2: Kiểm tra Environment Variables trên Netlify

Vào **Netlify Dashboard** → **Site Settings** → **Environment Variables**, đảm bảo có:

- `SEPAY_API_TOKEN` = Token API từ Sepay (dùng cho check-payment và webhook verification)
- `TURSO_DATABASE_URL` = URL database
- `TURSO_AUTH_TOKEN` = Auth token database
- `DELIVERY_SECRET` = Secret cho delivery token

### Bước 3: Test manual reconcile cho đơn hiện tại

```bash
cd /Users/tranphilong/Desktop/dark-observatory/tbq-homie-deployment
node scripts/manual-reconcile.js TBQ20824761
```

Nếu script tìm thấy match và fulfill thành công → đơn sẽ chuyển sang `fulfilled`.

### Bước 4: Kiểm tra logs

**Netlify Dashboard** → **Functions** → **Logs**:

- Xem logs của `check-payment` khi user đang ở trang confirmation (polling)
- Xem logs của `webhook-sepay` khi Sepay gửi callback
- Xem logs của `reconcile-payments` (chạy mỗi 5 phút)

Tìm các dòng:
- `[CheckPayment] Match found` → match thành công
- `[CheckPayment] No match found` → không match, xem log để debug
- `[Reconcile] MATCH FOUND` → reconciliation tìm thấy
- `Webhook: Order ... fulfilled successfully` → webhook xử lý thành công

---

## Debug nếu vẫn không tự động

### 1. Kiểm tra Sepay API response

Thêm vào `check-payment.js` (tạm thời để debug):

```javascript
console.log('[DEBUG] SePay transactions:', JSON.stringify(transactions.slice(0, 3), null, 2));
```

Xem trong Netlify logs → format của `transaction_content`, `amount_in` có đúng không.

### 2. Kiểm tra webhook có được gọi không

- Vào **Sepay Dashboard** → xem có log/webhook history không
- Hoặc thêm logging vào `webhook-sepay.js`:

```javascript
console.log('[Webhook] Received:', JSON.stringify(body, null, 2));
```

### 3. Test webhook thủ công

```bash
curl -X POST https://[your-site].netlify.app/.netlify/functions/webhook-sepay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SEPAY_API_TOKEN" \
  -d '{
    "content": "IBFT TBQ20824761",
    "amountIn": 2000,
    "id": "test-123"
  }'
```

---

## Tóm tắt

✅ **Đã sửa:**
- Logic match giao dịch (nhiều format Sepay)
- Logging chi tiết
- Reconciliation job (chạy mỗi 5 phút)
- Script manual reconcile

⚠️ **Bạn cần làm:**
1. Cấu hình **Webhook URL** trong Sepay Dashboard
2. Đảm bảo **SEPAY_API_TOKEN** đúng trong Netlify env vars
3. Chạy **manual-reconcile** cho đơn hiện tại (TBQ20824761)
4. Kiểm tra **logs** để debug nếu vẫn lỗi

Sau khi cấu hình webhook và chạy manual-reconcile, các đơn mới sẽ tự động xác nhận khi:
- Webhook Sepay gửi về (ngay sau khi thanh toán), **hoặc**
- Reconciliation job chạy (mỗi 5 phút), **hoặc**
- User đang ở trang confirmation (polling check-payment mỗi 3s)
