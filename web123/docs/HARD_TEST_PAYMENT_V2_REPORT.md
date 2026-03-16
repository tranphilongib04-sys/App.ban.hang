# Hard Test Payment V2 — Webhook-first + Auto Delivery

**Role:** Senior QA Engineer (Payments/Reliability)  
**Phạm vi:** Kiến trúc thanh toán mới (Webhook + Polling, finalize không phụ thuộc user quay lại, idempotency, inventory reserve→sold).  
**Phương pháp:** Code review + logic flow + script verify_webhook (idempotency); không chạy E2E thật với tiền/SePay.

---

## 0. Thông tin cần cho test (suy ra từ codebase)

| # | Thông tin | Nguồn / Giá trị |
|---|-----------|------------------|
| 1 | Link staging/prod | Local: `npx serve -p 8888` → http://localhost:8888; Netlify: deploy URL. Functions: `/.netlify/functions/create-order`, `webhook-sepay`, `check-payment`, `delivery`, `release-expired` |
| 2 | Sản phẩm còn hàng | DB `products` + `stock_units` (status=available). create-order dùng `productCode` (vd: netflix_1m, capcut_*). Cần seed data hoặc admin kiểm tra inventory. |
| 3 | Tài khoản test | Không login; chỉ cần email/SĐT/tên khi checkout. |
| 4 | Xem Order / Payment / Delivery | Order: admin-orders (nếu có) hoặc DB. Payment: bảng `payments`. Delivery: GET `/.netlify/functions/delivery?token=xxx&order=TBQxxx` (token từ fulfillment). |
| 5 | TTL reserve | **30 phút** (create-order: `expiresAt = now + 30*60*1000`). |
| 6 | Webhook received / status | `webhook-sepay.js` log console; `webhook-logs.js` GET (cần bảng `webhook_logs` nếu có). Không có dashboard “webhook received” sẵn. |

---

## 1. Bảng kết quả test

### PHẦN A — Sanity (Webhook-first)

| Test case | Pass/Fail | Evidence | Notes |
|-----------|-----------|----------|--------|
| **A1. Webhook-first proof** (đóng tab → thanh toán → sau 2–3 phút mở lại → Paid + Delivered) | **Pass** (code) | webhook-sepay.js: nhận POST → tìm order theo content → nếu status !== 'fulfilled' gọi fulfillOrder(). Không phụ thuộc user trên site. | Cần test thật: tạo đơn → đóng tab → chuyển khoản → đợi webhook (hoặc polling từ thiết bị khác) → mở lại xem order/delivery. |
| **A2. Return URL chỉ là UI** (không bấm “quay về shop”, sau 2–3 phút vào web bình thường → vẫn Paid + Delivered) | **Pass** (code) | Finalize do webhook hoặc polling check-payment; return URL chỉ để redirect user. | Frontend polling mỗi 3s khi còn ở confirmation; nếu đóng tab thì chỉ còn webhook. |

### PHẦN B — Idempotency

| Test case | Pass/Fail | Evidence | Notes |
|-----------|-----------|----------|--------|
| **B1. Webhook retry storm** (webhook gửi nhiều lần → 1 delivery, không duplicate payment/order status) | **Pass** (code) | webhook-sepay: `if (order.status === 'fulfilled') return { success: true, message: 'Already fulfilled' }` trước khi fulfill. Chỉ 1 lần gọi fulfillOrder cho mỗi order. | Bảng `payments` không có UNIQUE(transaction_id): nếu có race giữa webhook và check-payment có thể 2 row (hiếm). Nên thêm UNIQUE(provider, transaction_id). |
| **B2. Refresh spam “processing”** (F5 10–20 lần → không tạo thêm order/payment/delivery) | **Pass** (code) | Order đã tạo 1 lần; confirmation chỉ poll GET check-payment. Không gọi lại create-order khi F5. | Polling dùng orderCode+amount từ URL/state đã có; không tạo order mới. |
| **B3. Spam click Pay** (click Pay 10 lần → 1 order, UI disable + loading) | **Pass** (code) | placeOrder: submitBtn.disabled = true, textContent = '⏳ Đang xử lý...' trước fetch; chỉ re-enable khi lỗi hoặc sau khi chuyển hash. | Đã có disable; nếu mạng chậm user có thể refresh và thử lại → có thể 2 order. Rate limit create-order khuyến nghị. |

### PHẦN C — Trạng thái & đồng bộ

| Test case | Pass/Fail | Evidence | Notes |
|-----------|-----------|----------|--------|
| **C1. Status machine** (created→reserved→pending_payment→paid/fulfilled; fail: expired/canceled; có timestamp/actor) | **Pass** (code) | orders: pending_payment → fulfilled (webhook/check-payment); expired (create-order cleanupExpired + release-expired cron). Không có cột “actor” riêng; updated_at có. | Thiếu log “order status history” (bảng audit). inventory_logs có cho unit. |
| **C2. Inventory integrity** (reserved giảm khi create-order; sold tăng khi paid; reserved trả khi expired; không oversell) | **Pass** (code) | create-order: reserve stock_units (available→reserved), order_lines + order_allocations. fulfillOrder: reserved→sold. cleanupExpired / release-expired: reserved→available, order expired. Transaction (BEGIN/COMMIT) trong create-order và fulfillment. | release-expired đã sửa: release order_allocations theo orders.status='expired' (vì reserved_until trên allocations có thể NULL). |

### PHẦN D — Offline & Network chaos

| Test case | Pass/Fail | Evidence | Notes |
|-----------|-----------|----------|--------|
| **D1. Mất mạng sau khi pay** (tắt wifi 2–3 phút, bật lại → Paid + Delivered) | **Pass** (code) | Webhook từ SePay không phụ thuộc client. Khi bật lại, user vào order/delivery (qua link hoặc poll) thấy đã fulfilled. | Phụ thuộc SePay gửi webhook đúng. |
| **D2. Slow webhook / delayed settlement** (webhook về chậm → UI “đang xác nhận”, sau khi webhook tới auto paid + deliver) | **Pass** (code) | Frontend polling 3s; khi check-payment thấy SePay có giao dịch thì fulfill. Webhook khi tới cũng fulfill. Không cần thao tác tay. | Nếu webhook chậm, polling có thể fulfill trước (cùng fulfillOrder). |

### PHẦN E — Double payment & mismatch

| Test case | Pass/Fail | Evidence | Notes |
|-----------|-----------|----------|--------|
| **E1. Double payment (cùng đơn)** (trả 2 lần cùng nội dung → không giao thêm, order delivered 1 lần) | **Pass** (code) | fulfillOrder chỉ chạy khi order.status !== 'fulfilled'. Lần 2 webhook/poll thấy fulfilled → return sớm. Chỉ 1 lần chuyển reserved→sold. | Extra tiền chưa có policy rõ (refund/manual review); chỉ đảm bảo không giao 2 lần. |
| **E2. Amount mismatch** (thanh toán thiếu/thừa → không Paid, không giao; có payment_mismatch/needs_review) | **Pass** (code) | webhook-sepay: `if (amountIn < order.amount_total * 0.95) return { success: false, message: 'Insufficient amount' }`. check-payment: match theo tolerance 95%/99%. | Không có trạng thái “payment_mismatch” trong DB; chỉ từ chối và giữ pending_payment. Có thể bổ sung status hoặc log. |

### PHẦN F — Reconciliation (cron cứu khi webhook rớt)

| Test case | Pass/Fail | Evidence | Notes |
|-----------|-----------|----------|--------|
| **F. Reconciliation cron** (webhook fail → sau vài phút cron verify provider và finalize, có log “reconciled”) | **Fail** (chưa có) | release-expired chỉ expire đơn quá TTL và release kho; không gọi SePay API để tìm giao dịch chưa match. check-payment chỉ chạy khi user mở trang (polling). | **Rủi ro:** Webhook SePay lỗi + user đóng tab → đơn có thể kẹt pending dù đã chuyển tiền. Cần job định kỳ: với orders pending_payment (và chưa quá TTL), gọi SePay list và fulfill nếu có match. |

---

## 2. Top 5 rủi ro còn lại

1. **Không có reconciliation job**  
   Webhook rớt hoặc SePay không gửi → đơn đã thanh toán vẫn pending. Cần cron (vd 1–5 phút) query SePay API cho các order pending_payment và fulfill nếu có giao dịch khớp.

2. **Bảng `payments` không UNIQUE(transaction_id)**  
   Race hiếm giữa webhook và check-payment có thể tạo 2 bản ghi payment cho cùng 1 giao dịch. Nên thêm UNIQUE(provider, transaction_id) và INSERT ... ON CONFLICT DO NOTHING.

3. **Webhook SePay chưa verify chữ ký/token**  
   webhook-sepay đọc token từ header/body nhưng không validate mạnh; có thể bị giả mạo request. Nên verify signature/token theo tài liệu SePay.

4. **Rate limit create-order**  
   Chưa rate limit (hoặc chỉ phía Netlify). Spam tạo đơn có thể tốn tài nguyên và tạo nhiều order rác. Nên giới hạn theo IP/session.

5. **Order status history / audit**  
   Chưa có bảng “order_status_history” (created_at, status, actor). Khó truy vết khi nào chuyển trạng thái. Nên ghi log mỗi lần đổi status.

---

## 3. Kết luận GO/NO-GO

**Điều kiện GO:** Hệ thống đủ an toàn để bán tự động (không mất tiền, không mất hàng, không giao trùng, không oversell) khi:
- Webhook SePay ổn định và được gọi sau mỗi giao dịch, **hoặc**
- Có reconciliation job dự phòng khi webhook fail.

**Hiện trạng:**  
- Webhook-first + idempotency (fulfilled chỉ 1 lần), inventory reserve→sold, amount check, double-payment không giao thêm: **đạt**.  
- Thiếu reconciliation: nếu webhook rớt, đơn có thể kẹt.

**Kết luận:** **NO-GO** cho chạy ads/scale lớn cho đến khi có **reconciliation job** (và khuyến nghị: UNIQUE payments, verify webhook, rate limit, audit status).  
**GO** có thể chấp nhận được nếu: chỉ chạy thử nghiệm, lượng đơn ít, và có thể xử lý tay các đơn “đã chuyển tiền nhưng chưa giao” (vd qua admin hoặc check-payment thủ công).

---

## 4. Blocker/Critical cần fix trước khi chạy ads

| Mức | Hạng mục | Hành động |
|-----|----------|-----------|
| **Blocker** | Reconciliation job | Cron (vd mỗi 2–5 phút): lấy danh sách orders status=pending_payment (và reserved_until còn hiệu lực), gọi SePay API list transactions, match orderCode + amount, gọi fulfillOrder nếu có. Ghi log “reconciled”. |
| **Critical** | Webhook verification | Verify chữ ký/token SePay theo tài liệu; từ chối request không hợp lệ. |
| **Major** | Payments idempotency | Thêm UNIQUE(provider, transaction_id) (hoặc tương đương), INSERT ON CONFLICT DO NOTHING để tránh duplicate. |
| **Major** | Rate limit create-order | Giới hạn số lần tạo đơn theo IP (vd 5–10/phút). |
| **Minor** | Order status audit | Bảng order_status_history hoặc tương đương; ghi mỗi lần đổi status + timestamp + actor. |

---

## 5. Đã sửa trong đợt test

- **release-expired.js:** Release `order_allocations` theo orders đã expired (subquery), vì `order_allocations.reserved_until` có thể NULL nên điều kiện cũ không release được.

---

*Báo cáo dựa trên code review và flow logic. Nên bổ sung test E2E thật (webhook gửi từ SePay sandbox, polling, đóng tab, reconciliation) khi có môi trường và tài khoản test.*
