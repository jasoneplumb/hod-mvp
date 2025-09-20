const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow () {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Storage helpers
const dataFile = path.join(app.getPath('userData'), 'decisions.json');

ipcMain.handle('storage:save', async (_event, payload) => {
  try {
    const text = JSON.stringify(payload, null, 2);
    fs.writeFileSync(dataFile, text, 'utf-8');
    return { ok: true, path: dataFile };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('storage:load', async () => {
  try {
    if (!fs.existsSync(dataFile)) return { ok: true, data: null, path: dataFile };
    const text = fs.readFileSync(dataFile, 'utf-8');
    return { ok: true, data: JSON.parse(text), path: dataFile };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});
