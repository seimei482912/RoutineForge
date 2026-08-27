const { app, BrowserWindow } = require("electron");
const path = require("path");

// テスト実行時は本物のユーザーデータと完全に分離した保存領域を使う
// (テストが実データを消す事故の再発防止)
if (process.env.RF_TEST_USERDATA) {
  app.setPath("userData", process.env.RF_TEST_USERDATA);
}

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
