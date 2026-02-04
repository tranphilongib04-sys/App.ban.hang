#!/bin/bash

# Script để tạo shortcut trên Desktop cho TPB Manage

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DESKTOP_PATH="$HOME/Desktop"
APP_NAME="TPB Manage.app"
APP_PATH="$DESKTOP_PATH/$APP_NAME"

echo "🔨 Đang tạo shortcut trên Desktop..."

# Tạo thư mục app bundle
mkdir -p "$APP_PATH/Contents/MacOS"
mkdir -p "$APP_PATH/Contents/Resources"

# Tạo Info.plist
cat > "$APP_PATH/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TPB-Manage</string>
    <key>CFBundleIdentifier</key>
    <string>com.tpb.manage.launcher</string>
    <key>CFBundleName</key>
    <string>TPB Manage</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>icon</string>
</dict>
</plist>
EOF

# Tạo executable script
cat > "$APP_PATH/Contents/MacOS/TPB-Manage" << 'SCRIPT'
#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")/dark-observatory"

# Kiểm tra thư mục project
if [ ! -d "$PROJECT_DIR" ]; then
    osascript -e 'display dialog "Không tìm thấy thư mục project!" buttons {"OK"} default button "OK" with title "TPB Manage"'
    exit 1
fi

cd "$PROJECT_DIR"

# Kiểm tra xem node_modules có tồn tại không
if [ ! -d "node_modules" ]; then
    osascript -e 'display notification "Đang cài đặt dependencies..." with title "TPB Manage"'
    npm install
fi

# Chạy Electron app
osascript << APPLESCRIPT
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && npm run electron:dev"
end tell
APPLESCRIPT
SCRIPT

# Cấp quyền thực thi
chmod +x "$APP_PATH/Contents/MacOS/TPB-Manage"

echo "✅ Đã tạo shortcut tại: $APP_PATH"
echo "📱 Bạn có thể double-click vào TPB Manage.app trên Desktop để chạy app"
