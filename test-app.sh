#!/bin/bash

# Script test để kiểm tra app có chạy được không

cd /Users/tranphilong/Desktop/dark-observatory

echo "🔍 Kiểm tra setup..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js chưa được cài đặt"
    echo "💡 Cài đặt: brew install node hoặc tải từ https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm chưa được cài đặt"
    exit 1
fi
echo "✅ npm: $(npm --version)"

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules chưa có, đang cài đặt..."
    npm install
fi
echo "✅ Dependencies đã cài đặt"

# Check Electron
if [ ! -d "node_modules/electron" ]; then
    echo "⚠️  Electron chưa có, đang cài đặt..."
    npm install
fi
echo "✅ Electron đã sẵn sàng"

# Check electron main file
if [ ! -f "electron/main.js" ]; then
    echo "❌ Không tìm thấy electron/main.js"
    exit 1
fi
echo "✅ electron/main.js tồn tại"

echo ""
echo "✅ Tất cả đã sẵn sàng!"
echo "🚀 Chạy app bằng: npm run electron:dev"
echo "   hoặc double-click vào TPB Manage.app trên Desktop"
