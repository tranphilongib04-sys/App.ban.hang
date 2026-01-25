# 🚀 Hướng dẫn chạy TPB Manage App

## ✅ Cách đơn giản nhất (Khuyến nghị)

**Double-click vào file này trên Desktop:**
```
CHAY-TPB-MANAGE.command
```

File này sẽ tự động mở Terminal và chạy app.

---

## 📱 Cách 2: Double-click vào TPB Manage.app

1. Tìm **TPB Manage.app** trên Desktop
2. Double-click vào đó
3. Nếu macOS hỏi quyền, chọn **"Open"**

---

## 💻 Cách 3: Chạy từ Terminal (Luôn hoạt động)

1. Mở **Terminal** (Applications > Utilities > Terminal)
2. Copy và paste lệnh sau:

```bash
cd /Users/tranphilong/Desktop/dark-observatory && npm run electron:dev
```

3. Nhấn Enter
4. Đợi vài giây → App sẽ tự động mở!

---

## 🔧 Nếu vẫn không chạy được

### Kiểm tra setup:
```bash
cd /Users/tranphilong/Desktop/dark-observatory
./test-app.sh
```

### Tạo lại shortcut:
```bash
cd /Users/tranphilong/Desktop/dark-observatory
./create-shortcut.sh
```

### Cài lại dependencies:
```bash
cd /Users/tranphilong/Desktop/dark-observatory
npm install
```

---

## ⚠️ Lỗi thường gặp

### "npm: command not found"
→ Cần cài Node.js: https://nodejs.org/

### "Port 3210 already in use"
→ Đóng app đang chạy hoặc restart máy

### "Cannot find module"
→ Chạy: `npm install` trong thư mục project

---

## 📍 Vị trí các file

- **Source code**: `/Users/tranphilong/Desktop/dark-observatory/`
- **Shortcut .app**: `/Users/tranphilong/Desktop/TPB Manage.app`
- **Shortcut .command**: `/Users/tranphilong/Desktop/CHAY-TPB-MANAGE.command`
- **Database**: `dark-observatory/data/tpb-manage.db`

---

## 💡 Tip

Nếu double-click không hoạt động, **luôn dùng Terminal** (Cách 3) - cách này luôn hoạt động!
