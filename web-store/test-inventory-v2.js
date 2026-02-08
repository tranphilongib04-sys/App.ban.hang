
const { handler: adminHandler } = require('./netlify/functions/admin-inventory');
const { handler: importHandler } = require('./netlify/functions/import-stock');

async function test() {
    try {
        console.log("--- Test 1: Admin Inventory (Before) ---");
        const res1 = await adminHandler({ httpMethod: 'GET' });
        const inv1 = JSON.parse(res1.body).inventory;
        console.log('Total SKUs:', inv1.length);
        console.log('First SKU:', inv1[0]);

        console.log("\n--- Test 2: Import Stock ---");
        const res2 = await importHandler({
            httpMethod: 'POST',
            body: JSON.stringify({
                items: [
                    { sku_code: 'chatgpt_plus_1m', account_info: 'test_auto_1@gmail.com', secret_key: 'pw1', note: 'auto test' },
                    { sku_code: 'chatgpt_plus_1m', account_info: 'test_auto_2@gmail.com', secret_key: 'pw2' },
                    { sku_code: 'not_exist_sku', account_info: 'fail@gmail.com' }
                ]
            })
        });
        const importRes = JSON.parse(res2.body);
        console.log('Import Result:', importRes);

        console.log("\n--- Test 3: Admin Inventory (After) ---");
        const res3 = await adminHandler({ httpMethod: 'GET' });
        const inv3 = JSON.parse(res3.body).inventory;
        const chatgpt = inv3.find(i => i.sku_code === 'chatgpt_plus_1m');
        console.log(`ChatGPT 1m Stats: Available=${chatgpt.available}, Total=${chatgpt.total}`);

        if (chatgpt.available >= 2 && importRes.inserted === 2) {
            console.log("✅ SUCCESS: Data imported and verifying correctly.");
        } else {
            console.error("❌ FAILURE: Counts mismatch.");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
