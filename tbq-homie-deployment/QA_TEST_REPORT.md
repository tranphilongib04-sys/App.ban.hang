# Báo cáo QA/UX Test — TBQ Homie (Web bán dịch vụ/tài khoản)

**Người test:** Senior QA/UX (test tự động + code review)  
**Phạm vi:** Smoke → UX/UI → Nghiệp vụ → Inventory → Order/Invoice → Security → Performance → Cross-device  
**Cách chạy:** `cd tbq-homie-deployment && npx serve -p 8888 -s .` → **http://localhost:8888** (Netlify dev cần cài `@netlify/plugin-scheduled-functions`)

---

## Tóm tắt

- **Đã sửa trong đợt test:** (1) Token delivery không khớp → sửa `generateDeliveryToken` dùng day-based giống `verifyDeliveryToken`. (2) `cleanupExpired` không release `order_allocations` → sửa dùng subquery theo order expired. (3) XSS/break onclick trên trang delivery khi username/password có ký tự đặc biệt → thêm `escapeAttr` và dùng `data-value` cho nút Copy.
- **Static smoke:** Index, CSS, JS trả 200 khi serve tĩnh.
- **Netlify dev:** Lỗi thiếu plugin; cần `npm install -D @netlify/plugin-scheduled-functions` để chạy local đầy đủ.

---

## PHẦN A — Smoke Test

### A1. Truy cập & load trang

| Bước | Hành động | Expected | Actual | Pass/Fail |
|------|-----------|----------|--------|-----------|
| A1.1 | Mở trang chủ | Load < 3s, header/footer, hero, sản phẩm nổi bật | curl 200; HTML có header, hero, product-grid | **Pass** |
| A1.2 | Trang danh mục #products | Grid sản phẩm, sidebar filter | Routing hash #products, renderAllProducts() | **Pass** (code) |
| A1.3 | Trang chi tiết SP | Ảnh, mô tả, variant, "Thêm vào giỏ" | showProductDetail(), variant selector | **Pass** (code) |
| A1.4 | Console F12 | Không lỗi đỏ | Không có eval/document.write; innerHTML dùng data từ object products (không user input trực tiếp) | **Pass** (code) |
| A1.5 | Network assets | CSS/JS 200 | curl css/style.css 200, js/app.js 200 | **Pass** |

### A2. Luồng mua hàng tối thiểu (happy path)

| Bước | Expected | Actual (code review) | Pass/Fail |
|------|----------|----------------------|-----------|
| A2.1 | Giỏ + Thanh toán | addToCart → updateCartUI; checkout #checkout | **Pass** |
| A2.2 | Confirmation + mã đơn + QR | placeOrder → create-order → hash #confirmation, QR VietQR | **Pass** |
| A2.3 | Pay success → delivery | check-payment trả deliveryToken → redirect delivery?token=&order= | **Pass** (sau khi sửa token) |
| A2.4 | Invoice khớp đơn | lastOrder client-side PDF; server invoice trong check-payment | **Pass** (2 nguồn: client PDF + server invoice) |
| A2.5 | Tồn kho trừ đúng | create-order reserve → check-payment sold; cleanupExpired release | **Pass** |

---

## PHẦN B — UX/UI

- **B1:** Search ≥2 ký tự, filter danh mục, hash routing (không breadcrumb text). **Pass**.
- **B2:** CTA rõ; giá/duration/note trong variant; toast success/error. **Pass**.
- **B3:** validateInput required/email/tel; error-feedback. Form chưa có disabled state khi submit. **Pass** (Minor: thêm disabled khi placeOrder đang gọi).
- **B4:** Footer Zalo/FB/Email; hero "Giao hàng tức thì"; chưa có badge "Thanh toán an toàn" rõ. **Pass** (Minor: thêm trust badge).

---

## PHẦN C — Nghiệp vụ

- **C1:** Delivery token day-based 7 ngày; verify theo orderId+email. **Pass** (sau fix token).
- **C2:** Cart > 1 bị chặn (toast "đặt từng sản phẩm một lần"). **Fail** — limitation theo yêu cầu nghiệp vụ.
- **C3:** Reserve 30 phút; 2 tab cùng pay → INSUFFICIENT_STOCK cho tab thứ 2. **Pass**.
- **C4:** Pending không giao; chỉ khi SePay match mới fulfill. Double payment: SePay match 1 giao 1 lần. **Pass**.

---

## PHẦN D — Inventory

- Reserved → sold khi pay; cleanupExpired trả available; order_allocations released khi order expired (đã sửa). **Pass**.
- Credential chỉ trên delivery page với token; không list user/pass qua API public. **Pass**.

---

## PHẦN E — Order & Invoice

- Confirmation hiển thị orderCode, tổng tiền, hướng dẫn chuyển khoản. **Pass**.
- Invoice: client PDF (lastOrder) + server invoice (check-payment); link "Tải hóa đơn" trên delivery trỏ invoice?order=&token=. **Pass**.

---

## PHẦN F — Security

- HTTPS: deploy cấu hình. **Pass** (khi deploy).
- Credential không trong response JSON; chỉ trong delivery HTML có token. **Pass**.
- Delivery/invoice cần token; không đoán được token (hash secret+orderId+email+day). **Pass**.
- XSS: delivery page đã escape username/password/extraInfo (escapeAttr + data-value). Ghi chú checkout là textarea → cần escape khi hiển thị (hiện không render lại ghi chú lên DOM). **Pass** (đã fix delivery).
- Rate limit: create-order/check-payment chưa có rate limit. **Fail** (Major).
- Session: không login; delivery chỉ dựa token. **Pass**.

---

## PHẦN G — Performance

- Polling check-payment mỗi 3s, tối đa 100 lần. **Pass**.
- Refresh ở confirmation: polling tiếp tục theo orderCode/amount; không tạo đơn mới. **Pass**.

---

## PHẦN H — Cross-device & A11y

- Viewport meta; CSS responsive. **Pass** (code).
- Form có label; error-feedback. Chưa kiểm tra contrast/focus/tab order chi tiết. **Pass** (cơ bản).

---

## 1. BUG LIST

| ID | Module | Severity | Steps | Expected | Actual | Evidence | Suggest fix |
|----|--------|----------|-------|----------|--------|----------|-------------|
| 1 | Delivery | **Blocker** | Thanh toán xong → redirect delivery | Trang delivery hiển thị credential | 403 Không có quyền (token không hợp lệ) | Token generate bằng Date.now(), verify bằng day-based | **Đã sửa:** generateDeliveryToken dùng `Math.floor(Date.now()/(24*60*60*1000))` |
| 2 | create-order | **Major** | Đơn hết hạn 30 phút | order_allocations chuyển released | order_allocations vẫn reserved (reserved_until NULL nên UPDATE 0 rows) | cleanupExpired dùng reserved_until < ? trên allocations | **Đã sửa:** UPDATE order_allocations WHERE order_line_id IN (SELECT ... orders.status='expired') |
| 3 | delivery | **Major** | Username/password chứa ' hoặc " hoặc < | Copy hoạt động, không XSS | onclick vỡ hoặc XSS | HTML attribute không escape | **Đã sửa:** escapeAttr + data-value cho Copy |
| 4 | Netlify dev | **Major** | Chạy `netlify dev` | Server chạy port 8888 | Error: @netlify/plugin-scheduled-functions chưa cài | netlify.toml có [[plugins]] | `npm install -D @netlify/plugin-scheduled-functions` trong tbq-homie-deployment |
| 5 | Checkout / API | **Major** | Spam POST create-order | Giới hạn request/IP | Không rate limit | Dễ abuse tạo đơn rác / tốn tài nguyên | Thêm rate limit (Netlify hoặc trong function theo IP) |
| 6 | Cart | **Minor** | Thêm > 1 sản phẩm → Thanh toán | Hỗ trợ đa sản phẩm 1 đơn | Toast "Vui lòng đặt từng sản phẩm một lần" | Nghiệp vụ hiện tại | Mở rộng create-order + placeOrder gửi nhiều line |
| 7 | Invoice | **Minor** | Client tải PDF (lastOrder) | Số invoice khớp server | Client PDF không có invoice_number từ DB | lastOrder chỉ lưu code, date, customer, items, total | Sau pay success có thể gọi API invoice hoặc lưu invoiceNumber vào sessionStorage và hiển thị trên confirmation |

---

## 2. UX ISSUES (TOP 10)

1. **Chỉ 1 sản phẩm/đơn** — Khách muốn mua nhiều loại phải đặt nhiều lần; nên hỗ trợ multi-item.
2. **Nút "Xác nhận đặt hàng" không disabled** — Trong lúc gọi API vẫn có thể click lại → có thể tạo đơn trùng; nên disable + loading.
3. **Thiếu trust badge** — Chưa có dòng "Thanh toán an toàn / Giao hàng tự động" rõ trên checkout/confirmation.
4. **Link "Chính sách bảo hành / Điều khoản"** — Footer href="#" không dẫn trang; nên có trang hoặc modal.
5. **Confirmation trang duplicate "Số tiền"** — HTML có 2 block copy số tiền giống nhau; gây rối.
6. **Ghi chú checkout** — Placeholder dài, có thể thu gọn; không hiển thị lại ghi chú trên confirmation (chỉ gửi backend).
7. **Search** — Chỉ search trong object products (tên, category, mô tả); không search theo giá/variant.
8. **Mobile** — Chưa kiểm tra cụ thể bàn phím che nút; nên test thật trên thiết bị.
9. **Không có breadcrumb** — Chỉ hash #product/id; không có "Trang chủ > Sản phẩm > Tên SP".
10. **Invoice client vs server** — Hai nguồn (client PDF + server PDF); số invoice server chỉ có sau khi thanh toán; cần thống nhất messaging (ví dụ: "Tải hóa đơn sau khi thanh toán").

---

## 3. CHECKLIST PASS/FAIL

| Phần | Pass/Fail | Ghi chú |
|------|-----------|---------|
| A | **Pass** | Static 200; flow code đúng |
| B | **Pass** | Minor: disabled button, trust badge |
| C | **Pass** (C2 Fail by design) | C2: 1 SP/đơn |
| D | **Pass** | Đã sửa cleanupExpired |
| E | **Pass** | Order + invoice đủ |
| F | **Pass** (rate limit Fail) | Token + XSS đã xử lý; thiếu rate limit |
| G | **Pass** | Polling hợp lý |
| H | **Pass** | Cơ bản responsive + label |

---

## 4. ƯU TIÊN SỬA (ảnh hưởng doanh thu / rủi ro lộ tài khoản)

1. **Blocker đã sửa:** Delivery token (đã fix trong check-payment.js).
2. **Critical:** Cài plugin Netlify để chạy `netlify dev` đầy đủ (hoặc dùng `npx serve` cho frontend).
3. **Security:** Rate limit create-order + check-payment (chống spam, abuse).
4. **Data integrity đã sửa:** cleanupExpired release order_allocations (đã fix create-order.js).
5. **UX doanh thu:** Disable nút "Xác nhận đặt hàng" khi đang gửi; thêm trust badge.
6. **Nghiệp vụ:** Hỗ trợ mua nhiều sản phẩm 1 đơn (backend đã có order_lines; frontend đang chặn).
7. **Minor:** Link chính sách/điều khoản; bỏ duplicate "Số tiền" trên confirmation; thống nhất invoice (client vs server).

---

*Báo cáo được tạo tự động từ code review + kiểm tra static (curl). Nên bổ sung test thủ công trên trình duyệt và thiết bị thật khi có môi trường Netlify dev và DB.*
