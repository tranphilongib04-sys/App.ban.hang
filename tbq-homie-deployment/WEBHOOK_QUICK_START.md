# ⚡ Webhook Sepay - Hướng dẫn nhanh

## 🎯 3 bước chính

### 1️⃣ Lấy thông tin
- **Netlify Site URL:** Vào Netlify Dashboard → Copy URL (ví dụ: `tbq-homie-12345.netlify.app`)
- **SEPAY_API_TOKEN:** Vào Sepay Dashboard → API → Copy token

### 2️⃣ Cấu hình trong Sepay Dashboard
1. Đăng nhập https://my.sepay.vn
2. Vào **Cổng thanh toán** → **Cài đặt** → **Webhook**
3. Nhập **Webhook URL:**
   ```
   https://[your-site-url]/.netlify/functions/webhook-sepay
   ```
   Ví dụ: `https://tbq-homie-12345.netlify.app/.netlify/functions/webhook-sepay`
4. Nhập **Webhook Token:** (nếu có) → dùng cùng `SEPAY_API_TOKEN`
5. Click **Lưu**

### 3️⃣ Kiểm tra Netlify Environment Variables
1. Vào Netlify Dashboard → **Site settings** → **Environment variables**
2. Đảm bảo có:
   - `SEPAY_API_TOKEN` = Token từ Sepay
   - `TURSO_DATABASE_URL` = URL database
   - `TURSO_AUTH_TOKEN` = Auth token database
   - `DELIVERY_SECRET` = Secret key
3. Nếu sửa → **Redeploy site**

---

## 🧪 Test Webhook

```bash
cd tbq-homie-deployment
node scripts/test-webhook.js
```

Script sẽ hỏi:
- Netlify Site URL
- SEPAY_API_TOKEN (hoặc dùng từ .env)
- Order Code (ví dụ: TBQ20824761)
- Amount (ví dụ: 70000)

---

## ✅ Kiểm tra hoạt động

1. **Tạo đơn hàng mới** → Thanh toán thành công
2. **Kiểm tra Netlify Logs:**
   - Functions → `webhook-sepay` → Logs
   - Tìm: `Webhook: Order TBQxxx fulfilled successfully`
3. **Kiểm tra database:** Order status = `fulfilled`

---

## 📖 Hướng dẫn chi tiết

Xem file: `HUONG_DAN_WEBHOOK_SEPAY.md`

---

## 🐛 Lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| 401 Unauthorized | Token không đúng | Kiểm tra `SEPAY_API_TOKEN` trong Netlify env vars |
| Order not found | Order code không khớp | Kiểm tra format: `TBQ\d+` (ví dụ: `TBQ20824761`) |
| Insufficient amount | Số tiền < 95% đơn hàng | Kiểm tra `amountIn` trong webhook payload |

---

## 📞 Cần giúp?

1. Xem `HUONG_DAN_WEBHOOK_SEPAY.md` (hướng dẫn đầy đủ)
2. Xem `FIX_AUTO_PAYMENT.md` (troubleshooting)
3. Chạy `scripts/manual-reconcile.js` để xử lý đơn pending thủ công
