# Desktop App - TBQ Homie Admin

Admin application cho quản lý TBQ Homie system (Desktop Electron app).

## Tech Stack
- **Electron** - Desktop app framework
- **Next.js** - React framework for admin UI
- **SQLite** (better-sqlite3) - Local database
- **Turso/libSQL** - Cloud sync
- **TypeScript** - Type safety

## Development

```bash
# Install dependencies
npm install

# Run dev server (Next.js only)
npm run dev

# Run electron app
npm run electron:dev

# Build for production
npm run electron:build
```

## Features
- 📦 Inventory management
- 👥 Customer management  
- 📊 Sales reports
- 🔄 Cloud sync (Turso)
- 📱 Offline-first support

## Folder Structure
```
desktop-app/
├── electron/       # Electron main process
├── src/            # Next.js app
│   ├── app/        # App routes
│   ├── components/ # UI components
│   └── lib/        # Utilities
├── data/           # SQLite database
├── scripts/        # Helper scripts
└── docs/           # Documentation
```

## Database
- **Local**: `data/tpb-manage.db` (SQLite)
- **Cloud**: Turso/libSQL (sync)

## Documentation
See `docs/` folder for detailed guides:
- `WEB_ADMIN_SETUP.md` - Setup instructions
- `WEB_ADMIN_COMPLETE.md` - Feature overview
- `CHANGELOG_WEB_ADMIN.md` - Change history
# Trigger redeploy
