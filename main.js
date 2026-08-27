const { app, BrowserWindow } = require("electron");
const path = require("path");

// 二重起動防止(複数ウインドウが並ぶとキー入力先が分からなくなるため)
if (!app.requestSingleInstanceLock()) {
  app.quit();
}
app.on("second-instance", () => {
  const w = BrowserWindow.getAllWindows()[0];
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    title: "RoutineForge",
    icon: path.join(__dirname, "icons", "icon-256.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile("desktop.html");
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
