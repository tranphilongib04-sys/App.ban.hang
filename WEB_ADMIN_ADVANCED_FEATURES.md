# 🚀 Web Admin - Tính năng Nâng cao

## ✨ Tổng quan

Phiên bản nâng cao của Web Admin với 6 tabs quản trị mạnh mẽ:

### 📦 **1. Quản lý Sản phẩm**
- ✅ Xem danh sách sản phẩm
- ✅ Thêm sản phẩm mới
- ✅ Sửa thông tin sản phẩm
- ✅ Xóa sản phẩm
- ✅ Ẩn/Hiện sản phẩm trên web
- ✅ Đánh dấu Featured

### 📋 **2. Quản lý Stock Units**
- ✅ Xem tất cả stock units (Available/Reserved/Sold)
- ✅ Import hàng loạt từ text (TK|MK)
- ✅ Export stock chưa bán ra CSV
- ✅ Thống kê real-time

### 👥 **3. Quản lý Khách hàng**
- ✅ Danh sách khách hàng từ orders
- ✅ Tổng đơn hàng của mỗi khách
- ✅ Tổng chi tiêu
- ✅ Đơn hàng cuối cùng
- ✅ Tìm kiếm khách hàng

### 📊 **4. Analytics**
- 📈 Biểu đồ doanh thu theo ngày
- 🏆 Top sản phẩm bán chạy
- 📉 Conversion rate (pending → paid → delivered)
- 👤 Customer insights
- 🎯 Filter theo khoảng thời gian (7/30/90 ngày)

### ⚡ **5. Tự động hóa**
- 🤖 Auto-delivery khi thanh toán (Sepay webhook)
- 📱 Zalo notification (coming soon)
- ✉️ Email delivery (coming soon)
- 🔔 Push notifications (coming soon)

### 📝 **6. Webhook Logs**
- 📋 Lịch sử webhook events
- ✅ Success/Failed status
- 🔍 View payload
- ⏰ Timestamp tracking

---

## 🔧 Setup Backend (Netlify Functions)

### Bước 1: Upload Functions mới

Upload 5 files mới vào `tbq-homie-deployment/netlify/functions/`:

1. **products.js** - CRUD sản phẩm
2. **stock-units.js** - Quản lý stock + bulk import
3. **customers.js** - Danh sách khách hàng
4. **analytics.js** - Thống kê & analytics
5. **webhook-logs.js** - Logs webhook events

### Bước 2: Tạo Tables trong Turso (nếu chưa có)

```sql
-- Bảng webhook_logs (optional, for logging)
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    payload TEXT,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created
ON webhook_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_status
ON webhook_logs(status);
```

### Bước 3: Deploy

```bash
cd tbq-homie-deployment
git add netlify/functions/*.js
git commit -m "Add advanced admin API endpoints"
git push origin main
```

Netlify sẽ tự động deploy.

---

## 🎯 Sử dụng Tính năng Nâng cao

### Bật chế độ Advanced

**Cách 1: Environment variable (Production)**
```bash
# Thêm vào .env.local
NEXT_PUBLIC_WEB_ADMIN_ADVANCED=true
```

**Cách 2: Sửa code trực tiếp (Development)**

File: `src/app/web-admin/page.tsx`
```typescript
export default function WebAdminPage() {
    // Đổi thành true để dùng advanced
    const useAdvanced = true;

    return useAdvanced ? <WebAdminAdvanced /> : <WebAdminClient />;
}
```

### Restart server

```bash
npm run dev
```

Mở: http://127.0.0.1:3210/web-admin

---

## 📦 Tab 1: Quản lý Sản phẩm

### Thêm sản phẩm mới

1. Click **"Thêm sản phẩm"**
2. Nhập thông tin:
   - **Code**: `chatgpt_team_1m` (unique)
   - **Name**: `ChatGPT Team - 1 tháng`
   - **Category**: `ChatGPT`
   - **Description**: Mô tả chi tiết
   - **Image URL**: Link ảnh sản phẩm
   - **Featured**: ✅ (hiện ở homepage)
   - **Active**: ✅ (hiện trên web)
3. Click **"Thêm"**

### Sửa sản phẩm

1. Click icon **Edit** (✏️)
2. Sửa thông tin
3. Click **"Cập nhật"**

### Ẩn/Hiện sản phẩm

- Click icon **👁️ (Eye)** → Hiện trên web
- Click icon **👁️‍🗨️ (EyeOff)** → Ẩn khỏi web

### Xóa sản phẩm

- Click icon **🗑️ (Trash)**
- Confirm → Xóa vĩnh viễn

---

## 📋 Tab 2: Quản lý Stock

### Import stock hàng loạt

1. Click **"Import Stock"**
2. Chọn sản phẩm từ dropdown
3. Nhập danh sách TK|MK, mỗi dòng 1 stock:
   ```
   user1@gmail.com|password123
   user2@gmail.com|password456
   user3@gmail.com|password789
   ```
4. Click **"Import X units"**
5. ✅ Thành công → Stock tự động vào database

### Export stock chưa bán

1. Click **"Export Available"**
2. File CSV tự động download
3. Columns: Product, Username, Password, Status, Created

### Xem chi tiết stock

- Table hiển thị 100 units mới nhất
- Filter theo status (TODO)
- Secret được mask (••••)

---

## 👥 Tab 3: Khách hàng

### Tìm kiếm khách

- Input search box
- Tìm theo: Tên, Email, SĐT
- Real-time filter

### Thông tin hiển thị

| Khách hàng | Email | SĐT | Tổng đơn | Tổng chi tiêu | Đơn cuối |
|------------|-------|-----|----------|---------------|----------|
| Nguyễn A | ... | ... | 5 đơn | 500.000₫ | 02/02/2026 |

### Use cases

- **Tìm VIP**: Sort by "Tổng chi tiêu"
- **Khách quen**: Nhiều đơn hàng
- **Inactive**: Lâu không mua (check "Đơn cuối")

---

## 📊 Tab 4: Analytics

### Doanh thu theo ngày

- Biểu đồ line chart (TODO: Cần thêm charting library)
- Filter: 7 ngày / 30 ngày / 90 ngày
- Xem trend tăng/giảm

### Top sản phẩm

| Sản phẩm | Số đơn | Doanh thu |
|----------|--------|-----------|
| ChatGPT Plus | 50 | 3.500.000₫ |
| Netflix Extra | 30 | 2.100.000₫ |

### Conversion Rate

```
100 đơn Pending → 85 Paid (85%) → 80 Delivered (94%)
```

### Customer Stats

- New customers: Khách mới
- Returning: Khách quay lại

---

## ⚡ Tab 5: Tự động hóa

### Auto-delivery

**Bật:**
1. Toggle checkbox "Auto-delivery khi thanh toán"
2. Hệ thống tự động:
   - Nhận webhook từ Sepay
   - Check đơn hàng
   - Lấy stock available
   - Giao hàng tự động
   - Update status

**Lưu ý:**
- Chỉ hoạt động nếu có stock available
- Nếu hết stock → Manual delivery

### Zalo notification (Coming soon)

- Auto send Zalo khi:
  - Có đơn mới
  - Thanh toán thành công
  - Giao hàng

### Email delivery (Coming soon)

- Auto send email với TK/MK sau khi delivered

---

## 📝 Tab 6: Logs

### Webhook Logs

Xem tất cả events từ webhooks:

| ID | Event | Status | Payload | Time |
|----|-------|--------|---------|------|
| 1 | payment.success | ✅ success | {...} | 10:30 |
| 2 | payment.failed | ❌ failed | {...} | 10:25 |

### Debug

- Click vào payload để xem chi tiết
- Filter by status
- Export logs (TODO)

---

## 🔌 API Endpoints

Tất cả endpoints yêu cầu `Authorization: Bearer <token>`

### Products API

```javascript
// List products
GET /products
Response: { success: true, products: [...] }

// Create product
POST /products
Body: { code, name, category, description, image_url, featured, active }

// Update product
PUT /products/:id
Body: { name, category, ... }

// Delete product
DELETE /products/:id

// Toggle active
PATCH /products/:id/toggle
Body: { active: true/false }
```

### Stock Units API

```javascript
// List stock
GET /stock-units?status=available
Response: { success: true, stock: [...] }

// Add single
POST /stock-units
Body: { product_code, secret }

// Bulk import
POST /stock-units/bulk
Body: { stock: [{ product_code, secret }, ...] }

// Delete
DELETE /stock-units/:id
```

### Customers API

```javascript
// List customers
GET /customers
Response: { success: true, customers: [...] }
```

### Analytics API

```javascript
// Get analytics
GET /analytics?range=7days
Response: {
  daily_revenue: [...],
  top_products: [...],
  conversion_rate: {...},
  customer_stats: {...}
}
```

### Webhook Logs API

```javascript
// Get logs
GET /webhook-logs?limit=50
Response: { success: true, logs: [...] }
```

---

## 🎨 UI Components Mới

### Tabs Navigation
```jsx
<TabsList className="grid grid-cols-6">
  <TabsTrigger value="products">Sản phẩm</TabsTrigger>
  <TabsTrigger value="stock">Stock</TabsTrigger>
  <TabsTrigger value="customers">Khách hàng</TabsTrigger>
  <TabsTrigger value="analytics">Analytics</TabsTrigger>
  <TabsTrigger value="automation">Tự động hóa</TabsTrigger>
  <TabsTrigger value="logs">Logs</TabsTrigger>
</TabsList>
```

### Icon Usage
- 🚀 Zap - Tự động hóa
- 📦 Package - Sản phẩm
- 👥 Users - Khách hàng
- 📊 BarChart3 - Analytics
- 📝 Activity - Logs
- ➕ Plus - Thêm mới
- ✏️ Edit - Sửa
- 🗑️ Trash2 - Xóa
- 👁️ Eye/EyeOff - Show/Hide
- ⬆️ Upload - Import
- ⬇️ Download - Export

---

## 🔮 Future Features

### Phase 2 (Coming soon)
- [ ] Charts visualization (recharts)
- [ ] Zalo API integration
- [ ] Email automation (SendGrid/Resend)
- [ ] Bulk actions (Delete multiple stock)
- [ ] Advanced filters & search
- [ ] Export reports to Excel
- [ ] Product variants CRUD
- [ ] Customer tags & notes
- [ ] Blacklist management

### Phase 3
- [ ] Dashboard widgets
- [ ] Real-time notifications
- [ ] Activity logs (Ai làm gì, khi nào)
- [ ] Role-based access
- [ ] Multi-language support
- [ ] Dark mode

---

## 🐛 Troubleshooting

### "Product not found" khi import stock

→ Check product_code phải tồn tại trong bảng `products`

### API returns empty array

→ Check database có data chưa
→ Xem Netlify Functions logs

### Auto-delivery không hoạt động

→ Check webhook endpoint có nhận được event không
→ Xem logs tab
→ Check stock còn available không

### UI không load data

→ F12 → Console → Xem errors
→ Check Network tab
→ Verify API token đúng

---

## 📞 Support

**Logs để check:**
1. Browser Console (F12)
2. Network tab (F12)
3. Netlify Functions logs
4. Turso database logs

**Common issues:**
- 401 Unauthorized → Token sai
- 404 Not Found → Endpoint chưa deploy
- 500 Internal → Database/code error

---

## ✅ Checklist Hoàn thành

- [x] Component WebAdminAdvanced.tsx (1000+ lines)
- [x] 5 Netlify Functions mới
- [x] Products CRUD API
- [x] Stock Units bulk import API
- [x] Customers aggregation API
- [x] Analytics API
- [x] Webhook Logs API
- [x] UI với 6 tabs
- [x] Import/Export stock
- [x] Search & filter
- [x] Auto-delivery toggle
- [ ] Charts (recharts - cần install)
- [ ] Zalo integration
- [ ] Email automation

---

**🎉 Web Admin Advanced đã sẵn sàng!**

Bật advanced mode → Truy cập http://127.0.0.1:3210/web-admin → Quản trị toàn diện!
