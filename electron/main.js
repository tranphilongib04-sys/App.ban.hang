const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const APP_PORT = process.env.TPB_MANAGE_PORT || '3210';

// Set user data path for database
// This will be available to Next.js via environment variable
process.env.ELECTRON_USER_DATA = app.getPath('userData');

let mainWindow;
let nextServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f9fafb',
    show: false,
    icon: path.join(__dirname, '../build/TPB-Manage.icns'),
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      // mainWindow.webContents.openDevTools();
    }
  });

  // Load the app
  if (isDev) {
    // Development: connect to Next.js dev server
    mainWindow.loadURL(`http://localhost:${APP_PORT}`);
  } else {
    // Production: start Next.js server and load
    startNextServer();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startNextServer() {
  const appPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app')
    : app.getAppPath();

  // Try to use standalone server if available
  const standalonePath = path.join(appPath, '.next/standalone');
  const serverPath = path.join(standalonePath, 'server.js');

  let serverProcess;
  const env = {
    ...process.env,
    PORT: APP_PORT,
    HOSTNAME: 'localhost',
    NODE_ENV: 'production',
    ELECTRON_USER_DATA: app.getPath('userData'), // Pass user data path to Next.js
  };

  if (require('fs').existsSync(serverPath)) {
    // Use standalone server
    serverProcess = spawn('node', [serverPath], {
      cwd: standalonePath,
      env: env,
      stdio: 'inherit',
    });
  } else {
    // Fallback: use next start
    const nextBin = path.join(appPath, 'node_modules/.bin/next');
    serverProcess = spawn('node', [nextBin, 'start'], {
      cwd: appPath,
      env: env,
      stdio: 'inherit',
    });
  }

  nextServer = serverProcess;

  serverProcess.on('error', (error) => {
    console.error('Failed to start Next.js server:', error);
    app.quit();
  });

  // Wait for server to be ready
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(`http://localhost:${APP_PORT}`);
    }
  }, 3000);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (nextServer) {
    nextServer.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextServer) {
    nextServer.kill();
  }
});
