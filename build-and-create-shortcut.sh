#!/bin/bash

# Script để build production app và tạo shortcut trên Desktop

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DESKTOP_PATH="$HOME/Desktop"

echo "🔨 Đang build TPB Manage desktop application..."

cd "$SCRIPT_DIR"

# Cài đặt dependencies nếu chưa có
if [ ! -d "node_modules" ]; then
    echo "📦 Đang cài đặt dependencies..."
    npm install
fi

# Build Next.js app
echo "🏗️  Đang build Next.js app..."
npm run build

# Build Electron app (pack mode - tạo .app file)
echo "📱 Đang build Electron app..."
npm run electron:pack

# Tìm app đã build
# Tìm app đã build (tìm trong mọi thư mục con của dist/)
APP_PATH=$(find "$SCRIPT_DIR/dist" -name "*.app" -type d 2>/dev/null | head -n 1)

if [ -z "$APP_PATH" ]; then
    echo "⚠️  Không tìm thấy app đã build trong dist/mac"
    echo "💡 Tạo shortcut development mode thay thế..."
    
    # Tạo shortcut development mode
    mkdir -p "$DESKTOP_PATH/TPB Manage.app/Contents/MacOS"
    mkdir -p "$DESKTOP_PATH/TPB Manage.app/Contents/Resources"
    
    cat > "$DESKTOP_PATH/TPB Manage.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TPB-Manage</string>
    <key>CFBundleIdentifier</key>
    <string>com.tpb.manage</string>
    <key>CFBundleName</key>
    <string>TPB Manage</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
</dict>
</plist>
EOF

    cat > "$DESKTOP_PATH/TPB Manage.app/Contents/MacOS/TPB-Manage" << 'SCRIPT'
#!/bin/bash
cd "$(dirname "$0")/../../.."
PROJECT_DIR="$(pwd)/dark-observatory"
cd "$PROJECT_DIR"

# Chạy Electron
npm run electron:dev
SCRIPT

    chmod +x "$DESKTOP_PATH/TPB Manage.app/Contents/MacOS/TPB-Manage"
    
    echo "✅ Đã tạo shortcut development mode tại: $DESKTOP_PATH/TPB Manage.app"
    echo "📱 Double-click để chạy app (development mode)"
    exit 0
fi

# Copy app lên Desktop
APP_NAME=$(basename "$APP_PATH")
DESKTOP_APP="$DESKTOP_PATH/$APP_NAME"

echo "📋 Đang copy app lên Desktop..."
rm -rf "$DESKTOP_APP"
cp -R "$APP_PATH" "$DESKTOP_APP"

echo ""
echo "✅ Hoàn tất!"
echo "📱 Desktop app đã được tạo tại: $DESKTOP_APP"
echo "🎉 Bạn có thể double-click vào app trên Desktop để sử dụng!"
echo ""
echo "💡 Đây là desktop application thực sự, không phải web app!"
