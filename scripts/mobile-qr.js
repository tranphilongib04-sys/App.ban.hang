const qrcode = require('qrcode-terminal');
const os = require('os');
const { networkInterfaces } = require('os');

function getLocalExternalIp() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

const tunnelUrl = process.argv[2];
const tunnelPassword = process.argv[3];

const hostname = os.hostname();
const port = 3210;

// 1. Construct Stable Local URL (Best for Home Screen)
// Use .local if available, otherwise fallback to IP
let localUrl = `http://${hostname}:${port}`;
// Ensure it has .local if not present (simple heuristic)
if (!hostname.includes('.')) {
    localUrl = `http://${hostname}.local:${port}`;
}

// Fallback IP (in case mDNS fails)
const ip = getLocalExternalIp();
const ipUrl = `http://${ip}:${port}`;

console.clear();
console.log('\n\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║               🌟 KẾT NỐI ĐIỆN THOẠI THÀNH CÔNG                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\n');

console.log('👇 [CÁCH 1 - KHUYÊN DÙNG] DÙNG KHI Ở NHÀ (Cùng Wifi) 👇');
console.log('   ✅ Tốc độ siêu nhanh');
console.log('   ✅ Link cố định - Dùng để "Thêm vào màn hình chính"');
console.log('------------------------------------------------------------------');
console.log(`🔗 Link Local: ${localUrl}`);
console.log('(Nếu không vào được, thử Link IP: ' + ipUrl + ')');
console.log('\n');

// Generate QR for Local URL (Priority)
qrcode.generate(localUrl, { small: true });

console.log('\n');
console.log('👇 [CÁCH 2] DÙNG KHI RA NGOÀI (Dùng 4G/Wifi quán cafe) 👇');
console.log('   ⚠️ Tốc độ chậm hơn');
console.log('   ⚠️ Link sẽ ĐỔI mỗi khi bật lại máy (Không nên lưu Bookmark)');
console.log('------------------------------------------------------------------');

if (tunnelUrl) {
    console.log(`🔗 Link Internet: ${tunnelUrl}`);
    console.log('   (Dùng khi ở quán Cafe, 4G, Wifi Khách)');

    if (tunnelUrl.includes('serveo.net')) {
        console.log('   ✅ Link Cố Định - Có thể Thêm vào MH Chính!');
    } else {
        console.log('   ⚠️ Link Ngẫu nhiên - Sẽ đổi khi tắt máy.');
    }

    if (tunnelPassword) {
        console.log(`🔑 Mật khẩu Tunnel: ${tunnelPassword}`);
    } else {
        console.log(`🔑 Mật khẩu Tunnel: (Nhập IP máy tính nếu được hỏi)`);
    }
} else {
    console.log('❌ Không kết nối được Server Internet. Hãy dùng Cách 1.');
}

console.log('\n');
console.log('==================================================================');
console.log('📲 HƯỚNG DẪN CÀI APP (Chỉ dùng Cách 1):');
console.log('   1. Mở Camera iPad/iPhone -> Quét mã QR ở trên');
console.log('   2. Mở link bằng Safari');
console.log('   3. Bấm nút Chia sẻ (Share Icon)');
console.log('   4. Chọn "Thêm vào MH chính" (Add to Home Screen)');
console.log('==================================================================');
console.log('\n');
console.log('⚠️  Đừng đóng cửa sổ này để App tiếp tục chạy.');
console.log('⌨️  Bấm Ctrl+C để thoát.');
console.log('\n');
