// ============================================
// NIVA — Standalone Jarvis Desktop Assistant Main Process
// ============================================

const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, Notification, screen } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow = null;
let hudWindow = null;
let tray = null;
let isQuitting = false;

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3002';

const ALLOWED_APPS = {
  notepad: 'notepad.exe',
  calculator: 'calc.exe',
  calc: 'calc.exe',
  chrome: 'start chrome',
  browser: 'start chrome',
  vscode: 'code',
  code: 'code',
  explorer: 'explorer.exe',
  cmd: 'start cmd.exe',
  settings: 'start ms-settings:',
};

// Create the Full NIVA Command Center Window (Web App Container)
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    title: 'NIVA — Neural Intelligent Virtual Assistant (Command Center)',
    backgroundColor: '#090d16',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(CLIENT_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Fallback: Ensure window appears even if ready-to-show takes time
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 3500);

  // Retry loading if frontend dev server is still starting up
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('[Desktop] Web frontend warming up, retrying in 2s...');
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.loadURL(CLIENT_URL);
      }
    }, 2000);
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create the Floating Standalone Jarvis Arc Core HUD Window
function createHUDWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  hudWindow = new BrowserWindow({
    width: 340,
    height: 380,
    x: width - 360,
    y: height - 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  hudWindow.loadFile(path.join(__dirname, 'hud.html'));

  hudWindow.once('ready-to-show', () => {
    hudWindow.show();
  });

  hudWindow.on('closed', () => {
    hudWindow = null;
  });
}

// Create Windows System Tray
function createTray() {
  tray = new Tray(createDefaultIcon());
  tray.setToolTip('NIVA — Autonomous AI Assistant (Alt+Space)');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Jarvis Core (HUD)',
      click: () => {
        if (hudWindow) {
          hudWindow.show();
        } else {
          createHUDWindow();
        }
      },
    },
    {
      label: 'Open Full Command Center',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
          mainWindow.show();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Shortcut: Alt+Space',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit NIVA',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      if (!mainWindow) createMainWindow();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createDefaultIcon() {
  const { nativeImage } = require('electron');
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buffer[i * 4] = 56;     // B
    buffer[i * 4 + 1] = 189; // G
    buffer[i * 4 + 2] = 248; // R
    buffer[i * 4 + 3] = 255; // Alpha
  }
  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

// IPC Handlers
ipcMain.on('window:minimize', () => {
  if (hudWindow) hudWindow.hide();
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('window:toggle-full', () => {
  if (!mainWindow) createMainWindow();
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('system:open-app', (_event, appName) => {
  const key = String(appName).toLowerCase().trim();
  const cmd = ALLOWED_APPS[key];
  if (cmd) {
    exec(cmd, (err) => {
      if (err) console.warn('App launch err:', err);
    });
  }
});

// Startup Registry Setting Handler (Auto-launch on laptop boot)
ipcMain.handle('startup:get-status', () => {
  const settings = app.getLoginItemSettings();
  return settings.openAtLogin;
});

ipcMain.handle('startup:set-status', (_event, enabled) => {
  if (enabled) {
    const batPath = path.resolve(__dirname, '..', 'start-laptop.bat');
    app.setLoginItemSettings({
      openAtLogin: true,
      path: 'cmd.exe',
      args: ['/c', `"${batPath}"`],
    });
  } else {
    app.setLoginItemSettings({
      openAtLogin: false,
    });
  }
  return !!enabled;
});

ipcMain.on('system:notify', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title: title || 'NIVA', body }).show();
  }
});

// App Lifecycle
app.whenReady().then(() => {
  // 1. Ensure automatic raw electron boot auto-launch is disabled
  app.setLoginItemSettings({
    openAtLogin: false,
  });

  // 2. Launch both Full Window and Floating HUD
  createMainWindow();
  createHUDWindow();
  createTray();

  // 3. Register Global Hotkey (Alt+Space)
  globalShortcut.register('Alt+Space', () => {
    if (mainWindow && mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      if (!mainWindow) createMainWindow();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Fallback shortcut Ctrl+Alt+N
  globalShortcut.register('CommandOrControl+Alt+N', () => {
    if (hudWindow) {
      if (hudWindow.isVisible()) {
        hudWindow.hide();
      } else {
        hudWindow.show();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createHUDWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Keep alive in tray unless explicitly quit
});
