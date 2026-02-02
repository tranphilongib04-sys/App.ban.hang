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

## Đồng bộ Local + Vercel (cùng lúc)

Để **local** và **Vercel** dùng chung một database và đồng bộ cùng lúc:

1. **Trên Vercel** (Project → Settings → Environment Variables):
   - `TURSO_DATABASE_URL` = URL database Turso
   - `TURSO_AUTH_TOKEN` = token Turso

2. **Trên máy local** (file `.env` hoặc `.env.local`):
   - Cùng cấu hình: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - Mặc định app sẽ dùng **embedded replicas**: đọc/ghi local, tự sync lên Turso mỗi vài giây. Vercel luôn đọc trực tiếp Turso → hai bên luôn thấy cùng dữ liệu.
   - Nếu muốn local chỉ kết nối trực tiếp Turso (không lưu file local), đặt: `TURSO_SYNC_ENABLED=false`

Kết quả: thao tác trên local hoặc trên Vercel đều cập nhật cùng một Turso; hai môi trường đồng bộ.

## Lưu ý
- Trên Vercel cần cấu hình **Environment Variables**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (nếu dùng Turso).
- Repo này dùng **Next.js**; Vercel sẽ tự nhận và build.
