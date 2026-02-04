// Electron Main Process
console.log('Electron require:', require('electron'));
const { app, BrowserWindow } = require('electron');
const path = require('path');

const fs = require('fs');

const APP_PORT = '3210';
let mainWindow = null;

// Backup Configuration
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'tpb-manage.db');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

function performBackup(reason) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `tpb-manage.backup.${reason}.${timestamp}.db`;
      const backupPath = path.join(BACKUP_DIR, backupName);

      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`[Backup] Created backup: ${backupPath}`);

      // Clean up old backups (keep last 30)
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.db'))
        .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 30) {
        files.slice(30).forEach(file => {
          fs.unlinkSync(path.join(BACKUP_DIR, file.name));
          console.log(`[Backup] Deleted old backup: ${file.name}`);
        });
      }
    } else {
      console.warn('[Backup] Database file not found, skipping backup.');
    }
  } catch (err) {
    console.error('[Backup] Failed to create backup:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f9fafb',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // In dev, connect to Next.js dev server
  mainWindow.loadURL(`http://127.0.0.1:${APP_PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  performBackup('startup');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  performBackup('quit');
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
