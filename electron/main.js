// Card Studio — portable Windows desktop shell.
// Loads the same index.html as the web version. No install and no administrator rights are needed.
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

// CardPrint.exe prints the finished card pictures through standard Windows printing (see CardPrint.cs).
// It sits outside the app archive so Windows can run it.
const PRINT_HELPER = app.isPackaged ? path.join(process.resourcesPath, 'CardPrint.exe') : path.join(__dirname, 'bin', 'CardPrint.exe');

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
        preload: path.join(__dirname, 'preload.js'),
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

  // Print card pictures (one PNG per page, in order: front, back, front, back …) with CardPrint.exe.
  // It shows the Windows print dialog, where the printer's Preferences set two-sided printing and ribbon options.
  // Resolves to { success, reason, printer }; reason is 'cancelled' when the dialog is closed.
  ipcMain.handle('card-studio:print-pages', async (event, request) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) return { success: false, reason: 'Not allowed' };
    const pages = Array.isArray(request?.pages) ? request.pages : [];
    if (!pages.length || pages.length > 1200 || !pages.every((page) => page instanceof Uint8Array && page.length > 0)) {
      return { success: false, reason: 'Nothing to print' };
    }
    if (process.platform !== 'win32' || !fs.existsSync(PRINT_HELPER)) {
      return { success: false, reason: 'The print helper (CardPrint.exe) is missing from this copy of Card Studio' };
    }
    const folder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'card-studio-print-'));
    try {
      const files = [];
      for (let i = 0; i < pages.length; i++) {
        const file = path.join(folder, `page-${String(i + 1).padStart(4, '0')}.png`);
        await fs.promises.writeFile(file, pages[i]);
        files.push(file);
      }
      const title = String(request.title || 'Card Studio').replace(/[\r\n]/g, ' ').slice(0, 120);
      const intent = request.intent === 'saturation' ? 'saturation' : 'keep';
      return await new Promise((resolve) => {
        execFile(PRINT_HELPER, ['--title', title, '--intent', intent, ...files], { windowsHide: false, timeout: 0 }, (error, stdout, stderr) => {
          const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
          if (code === 0) resolve({ success: true, reason: '', printer: String(stdout).trim() });
          else if (code === 2) resolve({ success: false, reason: 'cancelled' });
          else resolve({ success: false, reason: String(stderr).trim() || String(error?.message || 'Printing failed') });
        });
      });
    } finally {
      fs.promises.rm(folder, { recursive: true, force: true }).catch(() => {});
    }
  });

  Menu.setApplicationMenu(null);
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
