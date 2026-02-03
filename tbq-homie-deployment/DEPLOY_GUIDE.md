# Deployment Guide

This guide covers everything from setting up the database to deploying to production.

## 1. Database Setup (Turso)

1.  Create a database on Turso.
2.  Get the Database URL and Auth Token.
3.  Run the migration script to create tables:
    ```bash
    npm run migrate
    ```

## 2. Environment Variables

You need the following variables in `.env` (local) and Netlify Dashboard (production):

| Variable | Description |
| :--- | :--- |
| `TURSO_DATABASE_URL` | Check your Turso dashboard |
| `TURSO_AUTH_TOKEN` | Check your Turso dashboard |
| `DELIVERY_SECRET` | Secret key for delivery emails/webhooks. Generate with `npm run generate-secret` |
| `ADMIN_API_TOKEN` | (Optional) For accessing admin endpoints |

## 3. Product Setup (SQL)

If you need to manually insert products, use the Database Client or these SQL commands:

```sql
INSERT INTO products (code, name, base_price) VALUES 
('netflix_1m', 'Netflix Premium 1 Month', 70000),
('spotify_1y', 'Spotify Premium 1 Year', 300000);
```

To add stock:
```sql
INSERT INTO stock_units (product_id, content, status) 
VALUES (1, 'email:pass|profile', 'available');
```

## 4. Testing

### Local Testing
Run the local server:
```bash
netlify dev
```

Run the quick API test:
```bash
npm run test-api
```

### Production Testing
After deploying, make a test purchase using the "Transfer Note" or "Order Code" to verify the flow. 

## 5. Troubleshooting

- **500 Internal Server Error:** Check Netlify Function Logs. Usually missing Environment Variables.
- **Database Error:** Ensure `turso` migration ran successfully.
