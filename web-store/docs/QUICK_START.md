# Quick Start Guide (5 Minutes)

## Prerequisites
- Node.js (v18+)
- Netlify CLI (`npm install -g netlify-cli`)
- A Turso Database (URL & Auth Token)

## 1. Setup Environment
```bash
# Install dependencies
npm install

# Generate Delivery Secret
npm run generate-secret
# Copy the output! You'll need it.
```

## 2. Configure Database
Create a `.env` file:
```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
DELIVERY_SECRET=your-generated-secret
```

Run migration:
```bash
npm run migrate
```

## 3. Local Test
```bash
netlify dev
```
Visit `http://localhost:8888`.

## 4. Deploy to Netlify
```bash
netlify login
netlify init
netlify deploy --prod
```

**Done!** Go to Netlify Dashboard > Site Settings > Environment Variables and add your `TURSO_` credentials and `DELIVERY_SECRET`.
