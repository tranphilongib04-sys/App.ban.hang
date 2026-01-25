# 🚀 Cách chạy TPB Manage App

## Cách 1: Double-click shortcut trên Desktop (Đơn giản nhất)

1. Tìm file **TPB Manage.app** trên Desktop
2. Double-click vào đó
3. Terminal sẽ tự động mở và chạy app
4. Đợi vài giây để app khởi động

## Cách 2: Chạy từ Terminal (Nếu shortcut không hoạt động)

Mở Terminal và chạy:

```bash
cd /Users/tranphilong/Desktop/dark-observatory
npm run electron:dev
```

## Cách 3: Tạo lại shortcut

Nếu shortcut bị lỗi, chạy lệnh sau để tạo lại:

```bash
cd /Users/tranphilong/Desktop/dark-observatory
./create-shortcut.sh
```

## ⚠️ Lỗi thường gặp

### 1. "Command not found: npm"
- Cần cài Node.js: https://nodejs.org/
- Hoặc chạy: `brew install node`

### 2. "Cannot find module"
- Chạy: `npm install` trong thư mục project

### 3. "Port 3210 already in use"
- Đóng app đang chạy hoặc đổi port trong `package.json`

### 4. App không mở được
- Kiểm tra Terminal có hiển thị lỗi gì không
- Thử chạy trực tiếp: `cd /Users/tranphilong/Desktop/dark-observatory && npm run electron:dev`

## 📍 Vị trí app

- **Source code**: `/Users/tranphilong/Desktop/dark-observatory/`
- **Shortcut**: `/Users/tranphilong/Desktop/TPB Manage.app`
- **Database**: `dark-observatory/data/tpb-manage.db`
