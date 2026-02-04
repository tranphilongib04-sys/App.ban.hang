#!/bin/bash

# Script để tạo desktop application và đặt trên Desktop

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DESKTOP_PATH="$HOME/Desktop"

echo "🔨 Đang build desktop application..."

cd "$SCRIPT_DIR"

# Cài đặt dependencies nếu chưa có
if [ ! -d "node_modules" ]; then
    echo "📦 Đang cài đặt dependencies..."
    npm install
fi

# Build Next.js app
echo "🏗️  Đang build Next.js app..."
npm run build

# Build Electron app
echo "📱 Đang build Electron app..."
npm run electron:pack

# Tìm app đã build
APP_PATH=$(find "$SCRIPT_DIR/dist/mac" -name "*.app" -type d 2>/dev/null | head -n 1)

if [ -z "$APP_PATH" ]; then
    echo "⚠️  Không tìm thấy app đã build trong dist/mac"
    echo "💡 Kiểm tra lại build process hoặc chạy: npm run electron:pack"
    exit 1
fi

# Copy app lên Desktop
APP_NAME=$(basename "$APP_PATH")
DESKTOP_APP="$DESKTOP_PATH/$APP_NAME"

echo "📋 Đang copy app lên Desktop..."
rm -rf "$DESKTOP_APP"
cp -R "$APP_PATH" "$DESKTOP_APP"

echo "✅ Hoàn tất!"
echo "📱 Desktop app đã được tạo tại: $DESKTOP_APP"
echo "🎉 Bạn có thể double-click vào app trên Desktop để sử dụng!"
