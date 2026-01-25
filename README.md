# TPB Manage - Desktop Application

Ứng dụng desktop quản lý subscription và khách hàng cho macOS.

## 🚀 Cách sử dụng nhanh

### Tạo shortcut trên Desktop (Lần đầu)

```bash
cd /Users/tranphilong/Desktop/dark-observatory
./create-shortcut.sh
```

Sau đó double-click vào **TPB Manage.app** trên Desktop để mở app.

### Build Production App (Khuyến nghị)

Để tạo desktop application thực sự (không phải web local):

```bash
cd /Users/tranphilong/Desktop/dark-observatory
./build-and-create-shortcut.sh
```

Hoặc:

```bash
./create-desktop-app.sh
```

Script sẽ:
1. Build Next.js app
2. Build Electron app thành .app file
3. Copy app lên Desktop

Sau khi build xong, bạn sẽ có **TPB Manage.app** trên Desktop - đây là desktop application thực sự!

## 📋 Tính năng

- ✅ Quản lý khách hàng & subscription
- ✅ Nhắc nhở gia hạn tự động (0-3 ngày)
- ✅ Gia hạn nhanh 1-click
- ✅ Quản lý inventory (TK/MK/Keys)
- ✅ Giao hàng FIFO + Copy tin nhắn
- ✅ Bảo hành: cấp tài khoản mới
- ✅ Báo cáo doanh thu & lợi nhuận

## 🗄️ Database

- **Loại**: SQLite (Local)
- **Development**: `./data/tpb-manage.db`
- **Production (Electron)**: `~/Library/Application Support/TPB Manage/data/tpb-manage.db`
- Database tự động được tạo khi chạy app lần đầu

## 🛠️ Công nghệ

- **Frontend**: Next.js 16 + React 19
- **Desktop**: Electron
- **Database**: SQLite (better-sqlite3)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS + Radix UI

## 📝 Scripts có sẵn

### Development
- `npm run dev` - Chạy Next.js development server
- `npm run electron:dev` - Chạy cả Next.js dev server và Electron (hot reload)

### Production
- `npm run build` - Build Next.js production
- `npm run electron:pack` - Build Electron app vào thư mục dist/
- `npm run electron:build` - Build và tạo installer

### Utilities
- `./create-shortcut.sh` - Tạo shortcut development mode trên Desktop
- `./build-and-create-shortcut.sh` - Build production app và tạo shortcut
- `./create-desktop-app.sh` - Build production app và copy lên Desktop

## 📌 Lưu ý quan trọng

- ✅ App là **desktop application** thực sự, không phải web app
- ✅ Chạy độc lập, không cần trình duyệt
- ✅ Database được lưu local
- ✅ Chỉ dành cho macOS

## 🐛 Troubleshooting

### Shortcut không hoạt động

1. Kiểm tra xem đã chạy script tạo shortcut chưa:
   ```bash
   ./create-shortcut.sh
   ```

2. Nếu muốn production app, chạy:
   ```bash
   ./build-and-create-shortcut.sh
   ```

### App không chạy được

1. Đảm bảo đã cài đặt Node.js (v18+)
2. Chạy `npm install` để cài dependencies
3. Build lại app: `./build-and-create-shortcut.sh`

### Database không tìm thấy

- Database được tạo tự động khi chạy app lần đầu
- Development: `./data/tpb-manage.db`
- Production: `~/Library/Application Support/TPB Manage/data/tpb-manage.db`
