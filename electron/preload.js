const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cardStudioDesktop', {
  printPages: (pages, title, intent) => ipcRenderer.invoke('card-studio:print-pages', { pages, title, intent }),
});
