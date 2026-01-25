const qrcode = require('qrcode-terminal');
const { networkInterfaces } = require('os');

function getLocalExternalIp() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Check if URL is provided as argument
const customUrl = process.argv[2];
const tunnelPassword = process.argv[3];

const ip = getLocalExternalIp();
const port = 3210;
const url = customUrl || `http://${ip}:${port}`;

console.clear();
console.log('\n\n');
console.log('📱 QUÉT MÃ NÀY ĐỂ MỞ APP TRÊN ĐIỆN THOẠI');
console.log('========================================');
console.log(`🔗 Link: ${url}`);
if (tunnelPassword) {
    console.log('\n🔒 TUNNEL PASSWORD (Nhập nếu được hỏi):');
    console.log(`   👉 ${tunnelPassword}`);
    console.log('\n');
} else {
    console.log('\n🔒 TUNNEL PASSWORD: Không lấy được tự động.');
    console.log('   👉 Truy cập https://www.whatismyip.com/ để xem Public IP của bạn.');
    console.log('   👉 Đó chính là mật khẩu.');
    console.log('\n');
}

if (!customUrl) {
    console.log('   (Hãy đảm bảo điện thoại và máy tính dùng chung Wifi)');
} else {
    console.log('   (Link Internet - Dùng được cả 4G/5G)');
}
console.log('========================================');
console.log('📲 HƯỚNG DẪN:');
if (tunnelPassword) {
    console.log('   0. Nếu thấy màn hình hỏi "Tunnel Password", nhập số ở trên vào.');
}
console.log('   1. Mở Camera -> Quét mã QR');
console.log('   2. Mở bằng Safari (iPhone)');
console.log('   3. Bấm nút Chia sẻ (Share)');
console.log('   4. Chọn "Thêm vào MH chính" (Add to Home Screen)');
console.log('   --> Xong! App đã được cài đặt.');
console.log('========================================\n');

qrcode.generate(url, { small: true });

console.log('\n');
console.log('⚠️  Giữ cửa sổ này mở để app hoạt động.');
console.log('⌨️  Bấm Ctrl+C để thoát.');
console.log('\n');
