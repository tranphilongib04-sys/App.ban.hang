# Test Inventory Sync

Hướng dẫn test tính năng sync inventory từ local lên web.

## Cách test

### 1. Test bằng script tự động

```bash
npx tsx scripts/test-inventory-sync.ts
```

Script này sẽ:
- Tạo một inventory item test
- Kiểm tra xem nó có được đưa vào sync queue không
- Trigger sync
- Verify kết quả

### 2. Test thủ công

#### Bước 1: Import inventory ở local app

1. Mở app local
2. Vào trang Inventory
3. Click "Import" và nhập test data:
   ```
   Service: TestService
   TK/MK: test_account_1@test.com|password123
   Cost: 100000
   ```
4. Click Import

#### Bước 2: Kiểm tra sync queue

Mở database local và check:

```sql
SELECT * FROM local_pending_sync WHERE entity_type = 'inventory' ORDER BY created_at DESC LIMIT 5;
```

Bạn sẽ thấy các items mới được import đã được đưa vào queue.

#### Bước 3: Đợi sync tự động (30 giây)

Sync loop chạy tự động mỗi 30 giây. Hoặc có thể trigger ngay bằng cách:

1. Mở browser console trong app
2. Chạy:
```javascript
// Nếu có expose triggerSync function
await triggerSync();
```

#### Bước 4: Kiểm tra trên web admin

1. Đăng nhập vào web admin: https://tbq-admin.netlify.app
2. Vào phần Stock/Inventory
3. Kiểm tra xem các items mới có xuất hiện không

### 3. Kiểm tra logs

#### Local app logs

Trong console của app local, bạn sẽ thấy:
```
[SyncLoop] pulled2Way=0 pulledReadonly=0 pushed=1
```

#### Web admin logs

Check Netlify function logs để xem sync events:
- Vào Netlify dashboard
- Functions > api/sync/push
- Xem logs để verify requests

### 4. Verify sync hoạt động

#### Checklist:

- [ ] Inventory item được tạo ở local
- [ ] Item xuất hiện trong `local_pending_sync` table
- [ ] Sync loop chạy và push items
- [ ] Item được remove khỏi `local_pending_sync` (đã push thành công)
- [ ] Item xuất hiện trên web admin trong bảng `inventory_items`

### 5. Troubleshooting

#### Sync không push:

1. **Check environment variables:**
   ```bash
   # Trong .env của local app
   DESKTOP_SYNC_TOKEN=your_token_here
   ADMIN_WEB_URL=https://tbq-admin.netlify.app
   ```

2. **Check sync queue:**
   ```sql
   SELECT COUNT(*) FROM local_pending_sync;
   ```

3. **Check sync state:**
   ```sql
   SELECT * FROM local_sync_state;
   ```

#### Items không xuất hiện trên web:

1. Check web admin database có bảng `inventory_items` chưa
2. Check Netlify function logs để xem có lỗi không
3. Verify `DESKTOP_SYNC_TOKEN` khớp giữa local và web

### 6. Test update và delete

#### Test update:
1. Update một inventory item ở local
2. Verify nó được sync lên web

#### Test delete:
1. Delete một inventory item ở local  
2. Verify nó được xóa trên web

## Expected Results

✅ **Success:**
- Items được import → tự động vào sync queue
- Sync loop push items lên web trong vòng 30 giây
- Items xuất hiện trên web admin
- Update/Delete cũng được sync

❌ **Failure:**
- Items không vào sync queue → check `createInventoryItem` function
- Sync không push → check `DESKTOP_SYNC_TOKEN` và network
- Items không xuất hiện trên web → check web admin logs và database
