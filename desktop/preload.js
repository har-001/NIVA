// ============================================
// NIVA — Desktop Preload Context Bridge
// ============================================

const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('nivaDesktop', {
  isDesktop: true,
  platform: process.platform,
  osVersion: os.release(),
  hostname: os.hostname(),

  // Window Controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  toggleFullWindow: () => ipcRenderer.send('window:toggle-full'),

  // Native Notifications
  notify: (title, body) => ipcRenderer.send('system:notify', { title, body }),

  // Local App Launching
  openApp: (appName) => ipcRenderer.send('system:open-app', appName),

  // Windows Startup Settings
  getStartupSetting: () => ipcRenderer.invoke('startup:get-status'),
  setStartupSetting: (enabled) => ipcRenderer.invoke('startup:set-status', enabled),

  // System Stats
  getQuickStats: () => {
    const total = os.totalmem() / 1024 / 1024 / 1024;
    const free = os.freemem() / 1024 / 1024 / 1024;
    const used = total - free;
    const cpus = os.cpus();
    return {
      usedMem: used.toFixed(1),
      freeMem: free.toFixed(1),
      totalMem: total.toFixed(1),
      cpuModel: cpus.length > 0 ? cpus[0].model : 'CPU',
      battery: '51%',
      uptimeHours: (os.uptime() / 3600).toFixed(1),
    };
  },
});
