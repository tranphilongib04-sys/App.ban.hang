#!/bin/bash
echo "🚀 Bắt đầu quá trình Deploy tự động Website TBQ Homie..."

# 1. Check/Install Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "📦 Đang cài đặt Netlify CLI..."
    npm install -g netlify-cli
else
    echo "✅ Netlify CLI đã được cài đặt."
fi

# 2. Login
echo "🔑 Vui lòng đăng nhập vào Netlify (Trình duyệt sẽ mở)..."
netlify login

# 3. Create/Link Site
echo "🌐 Đang khởi tạo site mới..."
# Try to link or init. Using 'init' is safer for first time.
netlify link 2>/dev/null || netlify init --manual

# 4. Ask for SePay Token (Non-blocking check)
echo ""
echo "💳 Cấu hình SePay Auto-Payment:"
SEPAY_TOKEN="$1"

if [ -z "$SEPAY_TOKEN" ]; then
    echo "⚠️ Không tìm thấy SePay Token trong tham số."
    echo "ℹ️  Bạn có thể cấu hình sau bằng lệnh: netlify env:set SEPAY_API_TOKEN <YOUR_TOKEN>"
else
    echo "⚙️ Đang lưu API Token lên Netlify..."
    netlify env:set SEPAY_API_TOKEN "$SEPAY_TOKEN"
    echo "✅ Đã lưu cấu hình thanh toán."
fi

# 5. Deploy Production
echo ""
echo "🚀 Đang deploy bản chính thức (Production)..."
netlify deploy --prod --dir=.

echo ""
echo "🎉 HOÀN TẤT! Website của bạn đã online."
echo "👉 Hãy vào URL bên trên để kiểm tra."
