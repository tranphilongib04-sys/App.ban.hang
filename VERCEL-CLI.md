# Vercel CLI – Deploy từ terminal

## Vercel CLI là gì?
- Công cụ chạy trong terminal để **deploy** app lên Vercel không cần qua GitHub.
- Dùng khi bạn muốn deploy nhanh từ máy local, hoặc chưa/kông dùng GitHub.

## Các lệnh thường dùng

### 1. Deploy lần đầu (hoặc thêm project mới)
```bash
cd /Users/tranphilong/Desktop/dark-observatory
vercel
```
- Lần đầu sẽ hỏi đăng nhập (mở browser).
- Hỏi link project: chọn **Link to existing project** (nếu đã có trên Vercel) hoặc tạo mới.
- Sau khi chạy xong sẽ có URL dạng `https://xxx.vercel.app`.

### 2. Deploy lên production (thay thế bản đang chạy)
```bash
vercel --prod
```
- Build và deploy lên **production**.
- URL production (ví dụ `https://tpb-manage.vercel.app`) sẽ nhận bản mới.

### 3. Xem project đã link
```bash
vercel project ls
```

### 4. Xem các deploy
```bash
vercel ls
```

## Lưu ý
- Trên Vercel cần cấu hình **Environment Variables**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (nếu dùng Turso).
- Repo này dùng **Next.js**; Vercel sẽ tự nhận và build.
