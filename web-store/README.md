# Web Store - TBQ Homie Public Site

Public-facing e-commerce website với auto-delivery system (deployed on Netlify).

## Tech Stack
- **Static HTML/CSS/JS** - Frontend
- **Netlify Functions** - Serverless backend
- **Turso/libSQL** - Cloud database
- **SePay** - Payment gateway

## Development

```bash
# Install dependencies
npm install

# Run local dev server
netlify dev

# Test webhook
npm run test-webhook

# Run critical tests
cd tests && node critical-tests.js all
```

## Features

## Getting Started

See [QUICK_START.md](QUICK_START.md) for a 5-minute setup.
See [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) for detailed deployment instructions.

## Project Structure
- `js/app.js`: Frontend logic (Cart, Products, UI).
- `netlify/functions/`: Backend logic.
- `scripts/`: Maintenance and setup scripts.
