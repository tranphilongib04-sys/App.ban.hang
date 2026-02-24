# Hướng dẫn nhập kho (TBQ Web Store)

## Lưu ý quan trọng

- **Chỉ sản phẩm GIAO LIỀN** mới cần nhập kho (SKU có `delivery_type = 'auto'`).
- **Sản phẩm giao sau 5–10 phút** (Đặt trước, `owner_upgrade`) **không cần** tồn kho: khách thanh toán xong nhắn Zalo, bạn giao tay.

---

## 1. Chuẩn bị

- **Admin Token:** Biến môi trường `ADMIN_API_TOKEN` (trùng với token bạn dùng đăng nhập admin).
- **SKU đã tồn tại:** Mã sản phẩm (`sku_code`) phải đã có trong bảng `skus` (chạy migration/seed nếu chưa).

---

## 2. API nhập kho

**Endpoint:** `POST /.netlify/functions/import-stock`

**Header:**
```
Authorization: Bearer <ADMIN_API_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "sku_code": "netflix_1m",
      "account_info": "email@gmail.com",
      "secret_key": "matkhau123",
      "note": "Ghi chú (tùy chọn)"
    }
  ]
}
```

| Trường         | Bắt buộc | Ý nghĩa |
|----------------|----------|--------|
| `sku_code`     | Có       | Mã SKU trong DB (vd: netflix_1m, grok_7d, chatgpt_code_1m_vn) |
| `account_info` | Có       | Tài khoản / email **hoặc** đường link (với sản phẩm dạng code/link) |
| `secret_key`   | Không    | Mật khẩu (để trống nếu là sản phẩm chỉ giao link) |
| `note`         | Không    | Ghi chú / hướng dẫn (hiển thị trên trang delivery) |

- Trùng cặp `sku_code` + `account_info` (đang available) sẽ bị **bỏ qua**, không tạo bản ghi trùng.

---

## 3. Ví dụ theo từng loại sản phẩm

### Giao liền – Tài khoản / mật khẩu (Netflix, Giao sau, Grok, ChatGPT Plus…)

```json
{
  "items": [
    { "sku_code": "netflix_1m", "account_info": "user1@mail.com", "secret_key": "pass123", "note": "" },
    { "sku_code": "grok_7d", "account_info": "grok_user@mail.com", "secret_key": "mk_grok", "note": "" }
  ]
}
```

- Khách thanh toán → trang delivery hiển thị **Tên đăng nhập** + **Mật khẩu**.

### Giao liền – Chỉ link (Code ChatGPT 1 tháng IP VN)

```json
{
  "items": [
    {
      "sku_code": "chatgpt_code_1m_vn",
      "account_info": "https://pay.openai.com/...",
      "secret_key": "",
      "note": "Tài khoản mới, chưa từng Plus. Thêm thẻ VN. Nhớ hủy gói trước khi hết tháng."
    }
  ]
}
```

- `account_info` = **link kích hoạt**.
- `note` = hướng dẫn & lưu ý (hiển thị trên trang delivery).

### Không cần nhập kho

Các sản phẩm **Đặt trước** (Adobe, Canva, YouTube, CapCut 7/14 ngày, v.v.) **không** nhập vào `stock_items`. Khách đặt → thanh toán → bạn giao qua Zalo trong 5–10 phút.

---

## 4. Cách gọi API

### A. Curl (terminal)

```bash
# Thay YOUR_ADMIN_TOKEN và URL nếu chạy local/production
curl -X POST "http://localhost:8888/.netlify/functions/import-stock" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"sku_code":"netflix_1m","account_info":"test@mail.com","secret_key":"pw123"}]}'
```

### B. Trang Admin (nếu đã thêm nút Nhập kho)

1. Mở **admin.html** (vd: `http://localhost:8888/admin.html`).
2. Đăng nhập bằng **Admin Token**.
3. Vào **Inventory** → dùng form/textarea **Nhập kho**.
4. Điền JSON `items` như trên → gửi.

### C. Script Node (test)

Có thể gọi API trực tiếp:

```js
const res = await fetch('http://localhost:8888/.netlify/functions/import-stock', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + process.env.ADMIN_API_TOKEN,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      { sku_code: 'grok_7d', account_info: 'tk1@mail.com', secret_key: 'mk1' }
    ]
  })
});
console.log(await res.json());
```

---

## 5. Mã SKU thường dùng (giao liền – cần nhập kho)

| sku_code            | Sản phẩm                    |
|---------------------|-----------------------------|
| netflix_1m          | Netflix 1 tháng             |
| spotify_premium_1m  | Giao sau 1 tháng           |
| chatgpt_plus_1m     | ChatGPT Plus (cấp TK)      |
| grok_7d             | Grok 7 ngày                 |
| chatgpt_code_1m_vn  | Code ChatGPT 1 tháng IP VN  |
| capcut_pro_1y       | CapCut Pro 1 năm (nếu dùng) |

Danh sách đầy đủ nằm trong bảng `skus` (xem qua admin Inventory hoặc DB). Chỉ nhập kho cho SKU có **delivery_type = 'auto'**.

---

## 6. Kiểm tra sau khi nhập

- Vào **Admin → Inventory**: xem số **Có sẵn** tăng đúng.
- Tạo đơn thử (sản phẩm giao liền) → thanh toán → kiểm tra trang delivery có đúng TK/MK hoặc link + ghi chú.

Nếu lỗi **SKU not found**: kiểm tra bảng `skus` trong database để đảm bảo SKU đã tồn tại trước khi nhập kho.
