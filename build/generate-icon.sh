#!/bin/bash

# Script để tạo icon.icns cho TPB Manage
# Sử dụng SVG và convert sang các size cần thiết

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ICONSET_DIR="$SCRIPT_DIR/TPB-Manage.iconset"
SVG_FILE="$SCRIPT_DIR/../public/icon.svg"

echo "🎨 Đang tạo icon cho TPB Manage..."

# Tạo iconset directory
rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

# Kiểm tra xem có sips không (có sẵn trên macOS)
if ! command -v sips &> /dev/null; then
    echo "❌ Sips không tìm thấy. Vui lòng cài đặt hoặc sử dụng tool khác để convert SVG."
    echo "💡 Bạn có thể sử dụng online tool để convert SVG sang PNG các size:"
    echo "   - icon_16x16.png (16x16)"
    echo "   - icon_16x16@2x.png (32x32)"
    echo "   - icon_32x32.png (32x32)"
    echo "   - icon_32x32@2x.png (64x64)"
    echo "   - icon_128x128.png (128x128)"
    echo "   - icon_128x128@2x.png (256x256)"
    echo "   - icon_256x256.png (256x256)"
    echo "   - icon_256x256@2x.png (512x512)"
    echo "   - icon_512x512.png (512x512)"
    echo "   - icon_512x512@2x.png (1024x1024)"
    echo ""
    echo "Sau đó chạy: iconutil -c icns TPB-Manage.iconset"
    exit 1
fi

# Tạo một file PNG tạm từ SVG (nếu có rsvg-convert hoặc inkscape)
# Hoặc tạo icon đơn giản bằng cách tạo PNG từ text

# Tạm thời, tạo icon đơn giản bằng cách sử dụng sips với một file PNG có sẵn
# Hoặc tạo icon từ text sử dụng ImageMagick (nếu có)

if command -v convert &> /dev/null; then
    # Sử dụng ImageMagick để tạo icon từ SVG
    echo "📐 Đang convert SVG sang các size icon..."
    convert -background none "$SVG_FILE" -resize 16x16 "$ICONSET_DIR/icon_16x16.png"
    convert -background none "$SVG_FILE" -resize 32x32 "$ICONSET_DIR/icon_16x16@2x.png"
    convert -background none "$SVG_FILE" -resize 32x32 "$ICONSET_DIR/icon_32x32.png"
    convert -background none "$SVG_FILE" -resize 64x64 "$ICONSET_DIR/icon_32x32@2x.png"
    convert -background none "$SVG_FILE" -resize 128x128 "$ICONSET_DIR/icon_128x128.png"
    convert -background none "$SVG_FILE" -resize 256x256 "$ICONSET_DIR/icon_128x128@2x.png"
    convert -background none "$SVG_FILE" -resize 256x256 "$ICONSET_DIR/icon_256x256.png"
    convert -background none "$SVG_FILE" -resize 512x512 "$ICONSET_DIR/icon_256x256@2x.png"
    convert -background none "$SVG_FILE" -resize 512x512 "$ICONSET_DIR/icon_512x512.png"
    convert -background none "$SVG_FILE" -resize 1024x1024 "$ICONSET_DIR/icon_512x512@2x.png"
    
    # Convert iconset thành .icns
    iconutil -c icns "$ICONSET_DIR" -o "$SCRIPT_DIR/TPB-Manage.icns"
    
    echo "✅ Icon đã được tạo: $SCRIPT_DIR/TPB-Manage.icns"
else
    echo "⚠️  ImageMagick không được cài đặt."
    echo "💡 Vui lòng cài đặt ImageMagick: brew install imagemagick"
    echo "   Hoặc tạo icon thủ công và đặt vào build/TPB-Manage.icns"
fi
