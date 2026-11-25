// Card Studio — portable Windows desktop shell.
// Loads the same index.html as the web version. No install and no administrator rights are needed.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_ROOT = path.join(__dirname, '..');
const INDEX_FILE = path.join(APP_ROOT, 'index.html');

// Keep designs, templates and settings in a folder next to the app so they travel with it
// (for example on a USB stick). If that folder can't be written to, Electron's default
// per-user folder (%APPDATA%\Card Studio) is used instead, which also needs no admin rights.
function portableDataDir() {
  // Set by the single-file portable .exe; points at the folder the .exe was started from.
  const base = process.env.PORTABLE_EXECUTABLE_DIR || (app.isPackaged ? path.dirname(process.execPath) : null);
  if (!base) return null;
  const dir = path.join(base, 'Card Studio Data');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch {
    return null;
  }
}

const dataDir = portableDataDir();
if (dataDir) app.setPath('userData', dataDir);

// One window at a time, so two copies never write to the same saved design.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let mainWindow = null;

  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1000,
      minHeight: 680,
      show: false,
      title: 'Card Studio',
      backgroundColor: '#f4f7f5',
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
      },
    });

    // The app never navigates away from index.html; open any web link in the normal browser instead.
    const isAppPage = (url) => {
      try {
        const target = new URL(url);
        return target.protocol === 'file:' && path.normalize(decodeURIComponent(target.pathname).replace(/^\/+/, '')) === path.normalize(INDEX_FILE);
      } catch {
        return false;
      }
    };
    const openExternally = (url) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    };
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      openExternally(url);
      return { action: 'deny' };
    });
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (isAppPage(url)) return;
      event.preventDefault();
      openExternally(url);
    });

    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
    mainWindow.loadFile(INDEX_FILE);
  }

  Menu.setApplicationMenu(null);
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
