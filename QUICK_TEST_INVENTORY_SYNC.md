# Quick Test: Inventory Sync

## ✅ Đã hoàn thành

1. ✅ Thêm inventory vào sync system
2. ✅ Sửa các hàm create/update/delete để sync
3. ✅ Cập nhật admin-web để nhận inventory sync
4. ✅ Tự động tạo bảng inventory_items trên web nếu chưa có

## 🧪 Cách test nhanh

### Option 1: Test trong app (Khuyến nghị)

1. **Mở app local và import inventory:**
   - Vào trang Inventory
   - Click "Import" 
   - Nhập test data và import

2. **Kiểm tra sync queue:**
   ```sql
   -- Mở database local (data/tpb-manage.db)
   SELECT * FROM local_pending_sync WHERE entity_type = 'inventory' ORDER BY created_at DESC LIMIT 5;
   ```
   ✅ Nếu thấy items trong queue → sync đang hoạt động!

3. **Đợi 30 giây** (hoặc trigger sync ngay trong console):
   - Sync loop tự động chạy mỗi 30 giây
   - Items sẽ được push lên web

4. **Kiểm tra trên web:**
   - Đăng nhập https://tbq-admin.netlify.app
   - Vào phần Stock/Inventory
   - Xem items đã sync chưa

### Option 2: Test bằng script

```bash
npx tsx scripts/test-inventory-sync.ts
```

## 🔍 Verify

### Checklist:

- [ ] Import inventory ở local → items xuất hiện trong `local_pending_sync`
- [ ] Sync loop chạy → items được push (check logs: `[SyncLoop] pushed=X`)
- [ ] Items được remove khỏi queue sau khi push thành công
- [ ] Items xuất hiện trên web admin trong bảng `inventory_items`

## ⚠️ Troubleshooting

### Sync không hoạt động?

1. **Check environment variables:**
   ```bash
   # .env file
   DESKTOP_SYNC_TOKEN=your_token_here
   ADMIN_WEB_URL=https://tbq-admin.netlify.app
   ```

2. **Check sync queue:**
   ```sql
   SELECT COUNT(*) FROM local_pending_sync;
   ```

3. **Check logs:**
   - Local: Console logs `[SyncLoop] pushed=X`
   - Web: Netlify function logs

### Items không sync?

- Verify `DESKTOP_SYNC_TOKEN` khớp giữa local và web
- Check network connection
- Xem Netlify function logs để debug

## 📝 Notes

- Sync chạy tự động mỗi 30 giây
- Có thể trigger sync ngay bằng `triggerSync()` trong console
- Update và Delete cũng được sync tự động
