# TBQ Homie System

Hệ thống bán hàng tự động với quản lý offline-first và auto-delivery.

## Projects

### 🖥️ Desktop App
**Path:** `desktop-app/`

Admin desktop application (Electron + Next.js) cho quản lý offline với cloud sync.

```bash
cd desktop-app
npm install
npm run electron:dev
```

[📖 Desktop App README](desktop-app/README.md)

---

### 🌐 Web Store
**Path:** `web-store/`

Public e-commerce website với SePay integration và auto-delivery (deployed on Netlify).

```bash
cd web-store
npm install
netlify dev
```

[📖 Web Store README](web-store/README.md)

---

## Quick Start

### Desktop App (Local Admin)
```bash
cd desktop-app && npm run electron:dev
```

### Web Store (Public Site)
```bash
cd web-store && netlify dev
```

## Architecture

```
┌─────────────────┐
│  Desktop App    │ ◄── Offline-first admin
│  (Electron)     │     with local SQLite
└────────┬────────┘
         │ Sync
         ▼
  ┌──────────────┐
  │    Turso     │ ◄── Cloud database
  │   (libSQL)   │
  └──────┬───────┘
         │
         ▼
┌─────────────────┐
│   Web Store     │ ◄── Public Netlify site
│  (Netlify Fns)  │     with SePay payment
└─────────────────┘
```

## Tech Stack

- **Frontend**: HTML/CSS/JS (Web), React/Next.js (Desktop)
- **Backend**: Netlify Functions (Serverless)
- **Database**: SQLite (local), Turso/libSQL (cloud)
- **Desktop**: Electron
- **Payment**: SePay
- **Deployment**: Netlify (web), Electron Builder (desktop)

## Development Workflow

1. **Local dev:** Desktop app với SQLite local
2. **Sync:** Desktop app sync to Turso cloud
3. **Web store:** Reads from Turso, processes payments
4. **Auto-delivery:** Webhook triggers delivery after payment

## Documentation

- `desktop-app/docs/` - Desktop app docs
- `web-store/docs/` - Web store & deployment docs

## Testing

```bash
# Desktop app
cd desktop-app && npm run dev

# Web store
cd web-store && netlify dev

# Critical tests
cd web-store/tests && node critical-tests.js all
```

## Deployment

### Web Store
Auto-deploys to Netlify on push to `main` branch.

### Desktop App
```bash
cd desktop-app
npm run electron:build
```

## Contributing

Each project has its own `package.json` and dependencies. Always run commands from the project folder.

## License

Private - TBQ Homie Internal Use Only
