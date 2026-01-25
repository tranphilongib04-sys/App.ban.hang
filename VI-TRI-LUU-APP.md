# 📍 Vị trí lưu của TPB Manage App

## 1. 📂 Source Code (Mã nguồn)

**Vị trí:**
```
/Users/tranphilong/Desktop/dark-observatory/
```

Đây là thư mục chứa toàn bộ mã nguồn của app.

## 2. 🖥️ Shortcut trên Desktop

**Vị trí:**
```
/Users/tranphilong/Desktop/TPB Manage.app
```

Đây là shortcut để mở app. Double-click vào đây để chạy app.

## 3. 📦 App đã build (Production)

**Vị trí:**
```
/Users/tranphilong/Desktop/dark-observatory/dist/mac/TPB Manage.app
```

Sau khi chạy `./build-and-create-shortcut.sh` hoặc `./create-desktop-app.sh`, app sẽ được build tại đây và copy lên Desktop.

## 4. 💾 Database

### Development Mode (Khi chạy từ source code)
```
/Users/tranphilong/Desktop/dark-observatory/data/tpb-manage.db
```

### Production Mode (Khi chạy app đã build)
```
~/Library/Application Support/TPB Manage/data/tpb-manage.db
```

Hoặc đầy đủ:
```
/Users/tranphilong/Library/Application Support/TPB Manage/data/tpb-manage.db
```

## 5. 📋 Tóm tắt

| Loại | Vị trí |
|------|--------|
| **Source Code** | `/Users/tranphilong/Desktop/dark-observatory/` |
| **Shortcut Desktop** | `/Users/tranphilong/Desktop/TPB Manage.app` |
| **App đã build** | `/Users/tranphilong/Desktop/dark-observatory/dist/mac/TPB Manage.app` |
| **Database (Dev)** | `/Users/tranphilong/Desktop/dark-observatory/data/tpb-manage.db` |
| **Database (Prod)** | `~/Library/Application Support/TPB Manage/data/tpb-manage.db` |

## 💡 Lưu ý

- **Source code**: Luôn giữ ở `/Users/tranphilong/Desktop/dark-observatory/`
- **Shortcut**: Có thể di chuyển hoặc xóa, tạo lại bằng `./create-shortcut.sh`
- **Database**: Tự động tạo khi chạy app lần đầu, không cần tạo thủ công
