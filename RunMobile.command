#!/bin/bash
cd "$(dirname "$0")"

# Reset color
RESET='\033[0m'
GREEN='\033[0;32m'

echo -e "${GREEN}=== KHỞI ĐỘNG ỨNG DỤNG MOBILE ===${RESET}"

# 1. Kill old port 3210
lsof -ti:3210 | xargs kill -9 2>/dev/null

# 2. Start Next.js App (Production Mode for Stability)
echo -e "${GREEN}Đang tối ưu hoá ứng dụng (Mất khoảng 1-2 phút lần đầu)...${RESET}"
echo -e "Vui lòng đợi..."

echo -e "${GREEN}Đang dọn dẹp cache cũ...${RESET}"
rm -rf .next
rm -f build.log

if npm run build > build.log 2>&1; then
    # Revert to standard start for stability (handles assets better)
    npm run start -- -H 0.0.0.0 -p 3210 > server.log 2>&1 &
    # if [ -f ".next/standalone/server.js" ]; then
    #    PORT=3210 HOSTNAME=0.0.0.0 node .next/standalone/server.js > server.log 2>&1 &
    # else
    #    npm run start -- -H 0.0.0.0 -p 3210 > server.log 2>&1 &
    # fi
    SERVER_PID=$!
else
    echo -e "\033[0;31mBuild thất bại. Cố gắng chạy chế độ Dev... (Có thể chậm)\033[0m"
    cat build.log
    echo -e "----------------------------------------"
    npm run dev -- -H 0.0.0.0 -p 3210 > server.log 2>&1 &
    SERVER_PID=$!
fi

# 3. Start Tunnel (Internet Access - Priority Fixed Link)
echo -e "${GREEN}Đang kết nối Server Internet (Link Cố Định)...${RESET}"
rm -f tunnel.log

# PREFERRED: Serveo with Custom Alias (long-tpb-manager)
# This keeps the link THE SAME every time: https://long-tpb-manager.serveo.net
ssh -R long-tpb-manager:80:localhost:3210 serveo.net -o StrictHostKeyChecking=no > tunnel.log 2>&1 &
TUNNEL_PID=$!

TUNNEL_URL=""
for i in {1..10}; do
    if grep -q "Forwarding HTTP traffic from" tunnel.log; then
        TUNNEL_URL=$(grep "Forwarding HTTP traffic from" tunnel.log | awk '{print $5}')
        break
    fi
    sleep 1
done

# Fallback: Localhost.run (Random Link) if Serveo fails
if [ -z "$TUNNEL_URL" ]; then
    echo -e "${GREEN}Server VIP 1 bận. Chuyển sang Server dự phòng (Link Ngẫu nhiên)...${RESET}"
    kill $TUNNEL_PID 2>/dev/null
    rm -f tunnel.log
    
    ssh -R 80:localhost:3210 nokey@localhost.run -o StrictHostKeyChecking=no > tunnel.log 2>&1 &
    TUNNEL_PID=$!

    for i in {1..10}; do
        if grep -q "Connect to your tunnel at" tunnel.log; then
            TUNNEL_URL=$(grep "Connect to your tunnel at" tunnel.log | awk '{print $6}')
            break
        fi
        sleep 1
    done
fi

# Fallback 2: LocalTunnel
if [ -z "$TUNNEL_URL" ]; then
    echo -e "${GREEN}Server VIP bận, đang chuyển sang Server dự phòng (Localtunnel)...${RESET}"
    kill $TUNNEL_PID 2>/dev/null
    rm -f lt.log
    npx localtunnel --port 3210 > lt.log 2>&1 &
    TUNNEL_PID=$!
    
    for i in {1..10}; do
        TUNNEL_URL=$(grep -h "your url is" lt.log | awk '{print $4}')
        if [ ! -z "$TUNNEL_URL" ]; then
            echo -e "${GREEN}Đang lấy Tunnel Password...${RESET}"
            TUNNEL_PASS=$(curl -s https://loca.lt/mytunnelpassword)
            if [ -z "$TUNNEL_PASS" ]; then TUNNEL_PASS=$(curl -s https://api.ipify.org); fi
            break
        fi
        sleep 1
    done
fi

# 4. Show QR Code
node scripts/mobile-qr.js "$TUNNEL_URL" "$TUNNEL_PASS"

# 5. Keep alive and show server logs on error
echo -e "${GREEN}App đang chạy...${RESET}"
echo -e "⚠️  LƯU Ý QUAN TRỌNG:"
echo -e "   1. Ứng dụng chạy TRÊN MÁY TÍNH này. Nếu tắt máy, App trên điện thoại sẽ mất kết nối."
echo -e "   2. Script này sẽ tự động ngăn máy NHỦ (Sleep) khi màn hình tắt."
echo -e "   3. Tuy nhiên: Nếu bạn GẬP MÁY (Close Lid), Apple bắt buộc máy phải ngủ trừ khi đang cắm sạc + nối màn hình ngoài."
echo -e "   👉 Tóm lại: Hãy CẮM SẠC và để máy đó, đừng gập nắp (hoặc dùng phần mềm Amphetamine nếu muốn gập)."
echo -e "----------------------------------------"
echo -e "Log hệ thống (Gửi cho Developer nếu lỗi):"

tail -f server.log &
TAIL_PID=$!

# caffeinate: -i (prevent idle sleep), -m (prevent disk sleep), -s (prevent system sleep)
caffeinate -ims wait $SERVER_PID
kill $TAIL_PID
