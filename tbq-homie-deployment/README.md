# TBQ Homie - Premium Service Shop

Website bán hàng tự động cho các dịch vụ Premium (ChatGPT, Netflix, Spotify, etc.) với giao diện hiện đại và tích hợp thanh toán tự động qua SePay.

## 🚀 Tính năng nổi bật

*   **Giao diện V2.0**: Thiết kế hiện đại, animation mượt mà, tối ưu UX.
*   **Hash Routing**: Điều hướng nhanh, không load lại trang (SPA feel).
*   **Thanh toán tự động**: Tích hợp Netlify Functions kiểm tra giao dịch qua SePay API.
*   **Giao hàng tự động**: (Mô phỏng) Hiển thị tài khoản ngay sau khi thanh toán thành công.
*   **Tính năng tiện ích**:
    *   Giỏ hàng & Checkout.
    *   Tìm kiếm sản phẩm (Real-time).
    *   Toast Notifications (Thông báo đẹp mắt).
    *   Hóa đơn PDF (jspdf).
    *   Copy info 1 chạm.

## 🛠️ Công nghệ sử dụng

*   **Frontend**: HTML5, CSS3, Vanilla JavaScript (Không framework nặng).
*   **Backend**: Netlify Functions (Node.js) cho API kiểm tra thanh toán via SePay.
*   **Deployment**: Netlify (Linked to GitHub).
*   **Libraries**: `jspdf` (Invoice), `node-fetch` (API calls).

## 📂 Cấu trúc dự án

```
.
├── index.html              # Trang chủ (Single Entry Point)
├── css/
│   └── style.css           # Toàn bộ Style & Design System
├── js/
│   └── app.js              # Logic ứng dụng: Routing, Cart, API
├── netlify/
│   └── functions/
│       └── check-payment.js # API Serverless kiểm tra thanh toán
├── netlify.toml            # Cấu hình Netlify Build
└── package.json            # Quản lý dependencies
```

## 📦 Cài đặt & Chạy Local

Để chạy dự án trên máy cá nhân:

1.  **Clone repo:**
    ```bash
    git clone https://github.com/tranphilongib04-sys/App.ban.hang.git
    cd App.ban.hang
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```

3.  **Chạy test (Cần Netlify CLI):**
    ```bash
    npm install netlify-cli -g
    netlify dev
    ```
    *Hoặc chỉ cần mở file `index.html` để xem giao diện frontend.*

## 🚀 Deployment (Tự động)

Dự án này được cấu hình **Continuous Deployment (CD)** với Netlify.
Mọi thay đổi đẩy lên branch `main` trên GitHub sẽ tự động được deploy.

1.  **Push code:**
    ```bash
    git add .
    git commit -m "Update feature..."
    git push origin main
    ```
2.  Netlify sẽ tự động build và update sau 15-30s.

## 🔑 Các biến môi trường (Environment Variables)

Trên Netlify, cần cấu hình:
- `SEPAY_API_TOKEN`: Token API lấy từ my.sepay.vn

## 📝 Liên hệ

*   **Dev**: TBQ Homie Team
*   **Support**: Zalo 0988428496
