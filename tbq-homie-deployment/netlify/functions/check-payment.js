const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const { orderCode, amount } = event.queryStringParameters;
    const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

    if (!orderCode) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing orderCode' })
        };
    }

    try {
        // Call SePay API to get transaction list
        // Documentation: https://my.sepay.vn/userapi/transactions/list
        const url = `https://my.sepay.vn/userapi/transactions/list?limit=20`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Fallback for demo if no API token is present or error occurs
            if (!SEPAY_API_TOKEN) {
                console.log("No SEPAY_API_TOKEN provided. Returning pending status.");
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ status: 'pending', message: 'No API Token configured' })
                };
            }
            throw new Error(`SePay API responded with ${response.status}`);
        }

        const data = await response.json();
        const transactions = data.transactions || [];

        // Find a matching transaction
        // We match by order code content in the description
        // SePay content usually contains the order code if the user entered it
        const paidTransaction = transactions.find(t => {
            const content = (t.transaction_content || '').toUpperCase();
            const code = orderCode.toUpperCase();
            // Check if description contains order code
            const isContentMatch = content.includes(code);
            // Optional: Check amount if provided (allow small deviation or exact match)
            const isAmountMatch = amount ? parseFloat(t.amount_in) >= parseFloat(amount) : true;

            return isContentMatch && isAmountMatch;
        });

        if (paidTransaction) {
            // ---------------------------------------------------------
            // AUTO-DELIVERY LOGIC (SIMULATED)
            // In a real app, you would fetch this from a Database (Supabase/Turso)
            // and mark the account as 'sold'.
            // ---------------------------------------------------------
            let deliveryInfo = null;

            // Extract product ID from order code (assuming format TBQ... usually needs mapping)
            // For demo, we return generic accounts based on amount or random

            const mockStock = {
                netflix: "user: netflix@tbq.com | pass: 123456",
                spotify: "Link upgrade: https://spotify.com/invite/...",
                youtube: "Invite sent to your email.",
                default: "Please contact Admin to receive your account."
            };

            // Simple logic: return a specific generic account for demo
            deliveryInfo = "Tài khoản: demo@tbq.com | Pass: 123456 (Demo Auto-Delivery)";

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: 'paid',
                    transaction: paidTransaction,
                    delivery: deliveryInfo
                })
            };
        } else {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: 'pending' })
            };
        }

    } catch (error) {
        console.error('Check payment error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
