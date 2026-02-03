# 🌐 Hướng dẫn Setup Tab "Quản lý Web"

Tab "Web Admin" cho phép bạn quản lý đơn hàng và inventory từ website TBQ Homie ngay trong app desktop.

## ✅ Đã thêm gì?

### 1. **Tab mới trong Sidebar**
- Icon: 🌐 Globe
- Route: `/web-admin`
- Vị trí: Sau "Warranty", trước "Templates"

### 2. **Tính năng chính**

#### 📊 **Dashboard**
- Thống kê tổng quan (tổng đơn, đã giao, doanh thu)
- Danh sách đơn hàng gần đây
- Real-time data từ Turso database

#### 📦 **Quản lý Đơn hàng**
- Xem tất cả đơn từ website
- Filter theo trạng thái (pending/paid/delivered/expired/cancelled)
- **Giao hàng thủ công**: Click "Giao" để nhập TK/MK và giao cho khách
- **Cập nhật trạng thái**: Đổi trạng thái đơn (hủy, hết hạn, etc.)
- Copy mã đơn hàng
- Hiển thị thông tin khách hàng đầy đủ

#### 🏪 **Inventory Web**
- Xem tồn kho theo sản phẩm
- Số lượng: Available / Reserved / Sold
- Real-time sync với Turso

#### ⚙️ **Cài đặt**
- URL API Backend (Netlify Functions)
- API Token (ADMIN_API_TOKEN)
- URL Website
- Test connection

## 🚀 Cách Setup

### Bước 1: Thêm ADMIN_API_TOKEN vào Netlify

1. Đăng nhập vào [Netlify Dashboard](https://app.netlify.com)
2. Chọn site **tbq-homie**
3. Vào **Site configuration** → **Environment variables**
4. Click **Add a variable**
5. Thêm:
   ```
   Key: ADMIN_API_TOKEN
   Value: your-secret-token-here
   ```
   (Ví dụ: `tbq_admin_2026_secure_token_xyz123`)

6. Click **Save**
7. Deploy lại site: **Deploys** → **Trigger deploy** → **Deploy site**

### Bước 2: Cấu hình trong App

1. Mở app desktop/web
2. Vào tab **Web Admin**
3. Click tab **Cài đặt**
4. Nhập thông tin:
   ```
   URL API Backend: https://tbq-homie.netlify.app/.netlify/functions
   API Token: your-secret-token-here (cùng token ở bước 1)
   URL Website: https://tbq-homie.netlify.app
   ```
5. Click **Test kết nối**
6. Nếu thành công → Click **Lưu cài đặt**

### Bước 3: Sử dụng

1. Click **Làm mới** để load dữ liệu
2. Xem dashboard và đơn hàng
3. Giao hàng bằng cách:
   - Vào tab **Đơn hàng**
   - Filter "Đã thanh toán"
   - Click nút **Giao** trên đơn cần giao
   - Nhập nội dung (VD: `TK: abc@gmail.com | MK: password123`)
   - Click **Giao hàng**

## 🔐 Bảo mật

- API Token được lưu trong `localStorage` của browser
- Tất cả request đều dùng `Bearer Token` authentication
- Không có token = không xem được data

## 🛠️ Troubleshooting

### Lỗi "Unauthorized"
- Kiểm tra ADMIN_API_TOKEN đã set đúng trong Netlify chưa
- Deploy lại site sau khi thêm token
- Kiểm tra token trong app khớp với token trong Netlify

### Lỗi "Cannot connect"
- Kiểm tra URL API đúng chưa (phải có `.netlify/functions`)
- Kiểm tra internet connection
- Mở website xem có chạy không

### Không có dữ liệu
- Click **Làm mới**
- Kiểm tra website có đơn hàng chưa
- Check Netlify Functions logs

## 📁 Files đã tạo

```
src/app/web-admin/
├── page.tsx                    # Server component wrapper
├── loading.tsx                 # Loading skeleton
└── web-admin-client.tsx        # Main client component (800+ lines)

src/components/layout/
└── sidebar.tsx                 # Updated with Globe icon

tbq-homie-deployment/
└── .env.example                # Template cho env vars
```

## 🎯 Workflow giao hàng

1. Khách đặt hàng trên website → Status: **pending**
2. Khách chuyển khoản → Webhook tự động → Status: **paid**
3. Admin vào tab **Web Admin** → Filter "Đã thanh toán"
4. Click **Giao** → Nhập TK/MK → Click **Giao hàng**
5. Status tự động chuyển → **delivered**
6. Inventory tự động cập nhật → **sold**

## 🌟 Tính năng nổi bật

✅ Real-time sync với Turso database
✅ Responsive design (mobile-friendly)
✅ Toast notifications
✅ Copy to clipboard
✅ Filter & search
✅ Manual delivery
✅ Status management
✅ Inventory tracking
✅ Revenue statistics

## 📞 Support

Nếu có vấn đề, check:
1. Netlify Functions logs
2. Browser console
3. Network tab (DevTools)

Happy managing! 🎉
