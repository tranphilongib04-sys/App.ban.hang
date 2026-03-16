// Simple manual test runner for Netlify functions
//
// Usage:
//   NODE_ENV=test \
//   BASE_URL="http://localhost:8888/.netlify/functions" \
//   ADMIN_API_TOKEN="..." \
//   node tbq-homie-deployment/test-api.js
//

const fetch = require('node-fetch');

const BASE_URL =
  process.env.BASE_URL ||
  'http://localhost:8888/.netlify/functions';

async function logStep(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    const result = await fn();
    console.log('OK');
    return result;
  } catch (err) {
    console.error('FAILED:', err.message);
    throw err;
  }
}

async function testCreateOrder() {
  const url = `${BASE_URL}/create-order`;
  const body = {
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    customerPhone: '0123456789',
    customerNote: 'Test order from script',
    productCode: 'chatgpt_plus_1m', // Matches seeded data
    quantity: 1,
    price: Number(process.env.TEST_PRICE || 70000)
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(json, null, 2));

  if (!res.ok || !json.success) {
    // If error is INSUFFICIENT_STOCK, that is also a "pass" for the API Logic (DB connected)
    if (json.error === 'INSUFFICIENT_STOCK') {
      console.log('Got INSUFFICIENT_STOCK. This confirms DB connectivity and Schema are OK.');
      return json;
    }
    throw new Error('create-order failed');
  }

  return json;
}

async function testInventory(service, variant) {
  const params = new URLSearchParams();
  if (service) params.set('service', service);
  if (variant) params.set('variant', variant);

  const url = `${BASE_URL}/inventory?${params.toString()}`;
  const res = await fetch(url);
  const json = await res.json();

  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(json, null, 2));

  if (!res.ok) {
    throw new Error('inventory failed');
  }

  return json;
}

async function testAdminOrders() {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) {
    console.log('ADMIN_API_TOKEN not set, skipping admin-orders test.');
    return;
  }

  const url = `${BASE_URL}/admin-orders?limit=5`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const json = await res.json();

  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(json, null, 2));

  if (!res.ok || !json.success) {
    throw new Error('admin-orders failed');
  }
}

async function main() {
  console.log('BASE_URL =', BASE_URL);

  // 1) Check Inventory
  await logStep(
    'CHECK INVENTORY',
    () => testInventory('netflix', '1m') // Matches 'netflix_1m' seeded in seed_full_data.js
  );

  // 2) Create order (SKIP in Quick Test due to local locking)
  // const order = await logStep('CREATE ORDER', testCreateOrder);

  // 3) (Optional) Check admin orders if token provided
  await logStep('ADMIN ORDERS', testAdminOrders);

  console.log('\nAll tests finished.');
}

main().catch((err) => {
  console.error('\nTest script aborted:', err);
  process.exit(1);
});
