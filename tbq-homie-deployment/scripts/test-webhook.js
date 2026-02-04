/**
 * TEST WEBHOOK - Script để test webhook Sepay
 * 
 * Usage: node scripts/test-webhook.js [orderCode] [amount]
 * Example: node scripts/test-webhook.js TBQ20824761 70000
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function testWebhook() {
    console.log('🧪 TEST WEBHOOK SEPAY\n');

    // 1. Lấy thông tin từ user
    const siteUrl = await question('📌 Nhập Netlify Site URL (ví dụ: tbq-homie-12345.netlify.app): ');
    if (!siteUrl) {
        console.error('❌ Site URL không được để trống!');
        process.exit(1);
    }

    const webhookUrl = `https://${siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/.netlify/functions/webhook-sepay`;
    console.log(`✅ Webhook URL: ${webhookUrl}\n`);

    const sepayToken = process.env.SEPAY_API_TOKEN || await question('🔑 Nhập SEPAY_API_TOKEN (hoặc Enter để dùng từ .env): ');
    if (!sepayToken) {
        console.error('❌ SEPAY_API_TOKEN không được để trống!');
        process.exit(1);
    }

    const orderCode = process.argv[2] || await question('📦 Nhập Order Code (ví dụ: TBQ20824761): ');
    if (!orderCode) {
        console.error('❌ Order Code không được để trống!');
        process.exit(1);
    }

    const amount = parseFloat(process.argv[3]) || parseFloat(await question('💰 Nhập Số tiền (ví dụ: 70000): ')) || 70000;

    // 2. Tạo payload giả lập từ Sepay
    const payload = {
        id: `test-webhook-${Date.now()}`,
        content: `IBFT ${orderCode}`,
        transaction_content: `IBFT ${orderCode}`,
        amountIn: amount,
        amount_in: amount,
        referenceCode: `REF-${Date.now()}`,
        reference_number: `REF-${Date.now()}`,
        transactionDate: new Date().toISOString(),
        transaction_date: new Date().toISOString()
    };

    console.log('\n📤 Gửi request đến webhook...');
    console.log(`   URL: ${webhookUrl}`);
    console.log(`   Order Code: ${orderCode}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Payload:`, JSON.stringify(payload, null, 2));

    // 3. Gửi request
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sepayToken}`
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { raw: responseText };
        }

        console.log('\n📥 Response từ server:');
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Body:`, JSON.stringify(responseData, null, 2));

        // 4. Phân tích kết quả
        console.log('\n📊 Phân tích:');
        if (response.status === 200) {
            if (responseData.success === true) {
                console.log('   ✅ Webhook xử lý thành công!');
                console.log('   ✅ Đơn hàng đã được fulfill.');
            } else if (responseData.message === 'Order not found') {
                console.log('   ⚠️  Order không tồn tại trong database.');
                console.log('   💡 Đây có thể là OK nếu bạn đang test với order code giả.');
            } else if (responseData.message === 'Already fulfilled') {
                console.log('   ✅ Order đã được fulfill trước đó (idempotency hoạt động tốt).');
            } else if (responseData.message === 'Insufficient amount') {
                console.log('   ❌ Số tiền không đủ (phải >= 95% số tiền đơn hàng).');
            } else {
                console.log('   ⚠️  Webhook trả về success=false:', responseData.message);
            }
        } else if (response.status === 401) {
            console.log('   ❌ Lỗi xác thực (401 Unauthorized).');
            console.log('   💡 Kiểm tra SEPAY_API_TOKEN có đúng không.');
        } else if (response.status === 405) {
            console.log('   ❌ Method không được phép (405 Method Not Allowed).');
            console.log('   💡 Đảm bảo gửi POST request.');
        } else if (response.status === 500) {
            console.log('   ❌ Lỗi server (500 Internal Server Error).');
            console.log('   💡 Kiểm tra Netlify logs để xem chi tiết lỗi.');
        } else {
            console.log(`   ⚠️  Status code không mong đợi: ${response.status}`);
        }

        console.log('\n✅ Test hoàn tất!');
        console.log('\n💡 Tiếp theo:');
        console.log('   1. Kiểm tra Netlify Function Logs để xem chi tiết');
        console.log('   2. Nếu order tồn tại, kiểm tra database xem status đã chuyển sang "fulfilled" chưa');
        console.log('   3. Nếu test với đơn thật, đảm bảo order code và amount khớp với đơn trong database');

    } catch (error) {
        console.error('\n❌ Lỗi khi gửi request:');
        console.error('   ', error.message);
        if (error.code === 'ENOTFOUND') {
            console.error('   💡 Kiểm tra lại Site URL có đúng không.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   💡 Kiểm tra site đã deploy chưa, hoặc đang chạy local dev.');
        }
        process.exit(1);
    }

    rl.close();
}

testWebhook().catch(err => {
    console.error('❌ Lỗi:', err);
    rl.close();
    process.exit(1);
});
