# 🚀 Test Nhanh Tab "Web Admin"

## ✅ Status: ĐÃ HOÀN THÀNH

Tab "Web Admin" đã được tích hợp vào app của bạn!

## 📍 Truy cập ngay

```
http://127.0.0.1:3210/web-admin
```

Hoặc click vào sidebar → **Web Admin** (icon 🌐)

## 🎯 Test không cần setup (xem UI)

1. Mở app: http://127.0.0.1:3210
2. Click **Web Admin** trong sidebar
3. Xem được:
   - ✅ 4 tabs: Dashboard / Đơn hàng / Inventory / Cài đặt
   - ✅ Layout đầy đủ
   - ✅ Buttons, tables, forms

## 🔌 Test với data thật (cần setup)

### Bước 1: Tạo Admin Token

```bash
# Tạo token ngẫu nhiên
echo "tbq_admin_$(openssl rand -hex 16)"
# Hoặc dùng token đơn giản:
# tbq_admin_2026
```

Copy token này!

### Bước 2: Thêm vào Netlify

1. Vào: https://app.netlify.com
2. Chọn site: **tbq-homie** (hoặc site bạn deploy)
3. **Site configuration** → **Environment variables**
4. Click **Add a variable**:
   ```
   Key: ADMIN_API_TOKEN
   Value: [paste token ở bước 1]
   ```
5. **Save**
6. **Deploys** → **Trigger deploy** → **Deploy site**
7. Đợi ~1 phút để deploy xong

### Bước 3: Cấu hình trong App

1. Vào tab **Web Admin** → Tab **Cài đặt**
2. Nhập:
   ```
   URL API Backend: https://tbq-homie.netlify.app/.netlify/functions
   API Token: [paste token giống bước 1]
   URL Website: https://tbq-homie.netlify.app
   ```
3. Click **Test kết nối** → Nếu thành công: "Kết nối thành công! ✅"
4. Click **Lưu cài đặt**

### Bước 4: Load Data

1. Quay về tab **Dashboard**
2. Click nút **Làm mới** (↻)
3. Data sẽ load từ Turso database
4. Xem:
   - Thống kê đơn hàng
   - Doanh thu
   - Inventory

## 💡 Test các tính năng

### ✅ Xem đơn hàng
1. Tab **Đơn hàng**
2. Filter theo trạng thái
3. Copy mã đơn (click icon copy)

### ✅ Giao hàng thủ công
1. Tab **Đơn hàng** → Filter "Đã thanh toán"
2. Click nút **Giao** trên đơn
3. Nhập nội dung:
   ```
   TK: test@gmail.com
   MK: password123
   ```
4. Click **Giao hàng**
5. Check toast notification ✅

### ✅ Cập nhật trạng thái
1. Click icon **Settings** (⚙️) trên đơn
2. Chọn trạng thái mới
3. Click **Cập nhật**

### ✅ Xem Inventory
1. Tab **Inventory**
2. Xem stock của từng sản phẩm:
   - 🟢 Available
   - 🟡 Reserved
   - ⚪ Sold

## 🎨 Screenshots (nên có)

### Dashboard
- 3 cards: Tổng đơn / Đã giao / Doanh thu
- Bảng đơn gần đây

### Đơn hàng
- Filter dropdown
- Table với actions
- Dialog giao hàng

### Inventory
- Table stock summary

### Cài đặt
- Form cấu hình
- Test connection button

## 🐛 Troubleshooting

### "Unauthorized" error
```
→ Check token đúng chưa
→ Deploy lại Netlify sau khi add token
→ Clear cache browser (Cmd+Shift+R)
```

### Không load data
```
→ Click "Làm mới"
→ Check Network tab (F12)
→ Xem Netlify Functions logs
```

### UI lỗi
```
→ Reload page (Cmd+R)
→ Check console (F12)
→ Restart dev server
```

## 📊 API Endpoints đang dùng

```javascript
// Lấy đơn hàng + stats
GET https://tbq-homie.netlify.app/.netlify/functions/admin-orders
Headers: Authorization: Bearer <token>

// Giao hàng
POST https://tbq-homie.netlify.app/.netlify/functions/admin-orders
Body: { action: "deliver", orderCode: "...", deliveryContent: "..." }

// Cập nhật status
POST https://tbq-homie.netlify.app/.netlify/functions/admin-orders
Body: { action: "update_status", orderCode: "...", newStatus: "..." }

// Lấy inventory
GET https://tbq-homie.netlify.app/.netlify/functions/inventory?action=all
```

## ✨ Tính năng đã tích hợp

✅ Real-time data từ Turso
✅ Toast notifications (sonner)
✅ Copy to clipboard
✅ Responsive mobile
✅ Filter & sort
✅ Manual delivery
✅ Status management
✅ Revenue tracking
✅ Settings persistence (localStorage)
✅ Loading states
✅ Error handling
✅ Badges & icons
✅ Dialogs (shadcn/ui)

## 🎉 Hoàn tất!

Bây giờ bạn có thể:
1. Quản lý đơn hàng web ngay trong app desktop
2. Giao hàng nhanh chóng
3. Theo dõi inventory real-time
4. Xem báo cáo doanh thu

**Không cần mở Netlify dashboard nữa!** 🚀
