# TBQ Homie Services

A serverless e-commerce platform for selling digital products (Netflix, Spotify, ChatGPT, etc.) with automated stock reservation and QR payment integration.

## Features
- **Serverless Backend:** Netlify Functions + Turso (libSQL).
- **Atomic Inventory:** Prevents overselling with database-level transactions.
- **Cart Persistence:** LocalStorage support.
- **QR Payments:** TPBank QR integration.

## Getting Started

See [QUICK_START.md](QUICK_START.md) for a 5-minute setup.
See [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) for detailed deployment instructions.

## Project Structure
- `js/app.js`: Frontend logic (Cart, Products, UI).
- `netlify/functions/`: Backend logic.
- `scripts/`: Maintenance and setup scripts.
