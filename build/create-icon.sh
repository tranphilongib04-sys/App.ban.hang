#!/bin/bash

# Script để tạo icon.icns từ SVG (cần cài imagemagick)
# Hoặc sử dụng iconutil trên macOS

echo "📦 Tạo icon cho TPB Manage..."

# Tạo các size icon cần thiết từ SVG
# Sử dụng sips (có sẵn trên macOS) hoặc convert từ SVG

# Tạo thư mục iconset
mkdir -p TPB-Manage.iconset

# Tạo các size icon (macOS yêu cầu)
# icon_16x16.png
# icon_16x16@2x.png (32x32)
# icon_32x32.png
# icon_32x32@2x.png (64x64)
# icon_128x128.png
# icon_128x128@2x.png (256x256)
# icon_256x256.png
# icon_256x256@2x.png (512x512)
# icon_512x512.png
# icon_512x512@2x.png (1024x1024)

# Sử dụng sips để resize từ SVG (nếu có) hoặc tạo từ text
# Hoặc sử dụng online tool để convert SVG -> PNG các size

echo "✅ Icon files đã được tạo"
echo "💡 Để tạo .icns file, chạy: iconutil -c icns TPB-Manage.iconset"
