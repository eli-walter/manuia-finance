// electron/preload.js
// Exposes a safe subset of Electron APIs to the renderer process.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  // Add any future IPC channels here, e.g.:
  // onUpdate: (cb) => ipcRenderer.on('update-available', cb),
});
