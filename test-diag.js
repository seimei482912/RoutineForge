const { _electron } = require("playwright-core");

(async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await _electron.launch({
    executablePath: "dist/win-unpacked/RoutineForge.exe",
    env
  });
  const win = await app.firstWindow();
  await win.waitForSelector("#addRoutine");

  // main process側で before-input-event を観測
  await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0];
    global.__mainKeys = [];
    w.webContents.on("before-input-event", (e, input) => {
      global.__mainKeys.push(input.type + ":" + input.key);
    });
  });

  await win.click("#addRoutine");
  await win.waitForSelector("#fName");
  await win.click("#fName");

  // renderer側で全キーイベントを観測
  await win.evaluate(() => {
    window.__ev = [];
    ["keydown","keypress","input","compositionstart","textInput"].forEach(t=>{
      document.addEventListener(t, (e)=>{
        window.__ev.push(t + ":" + (e.key||e.data||"") + (e.defaultPrevented?"(prevented)":""));
      }, true);
    });
  });

  console.log("READY_FOR_KEYS pid=" + (await app.evaluate(() => process.pid)));
  await win.waitForTimeout(8000);

  const rendererEvents = await win.evaluate(() => window.__ev);
  const mainKeys = await app.evaluate(() => global.__mainKeys);
  const val = await win.inputValue("#fName");
  const hasFocus = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFocused());
  console.log("MAIN-PROCESS KEYS:", JSON.stringify(mainKeys));
  console.log("RENDERER EVENTS:", JSON.stringify(rendererEvents));
  console.log("WINDOW FOCUSED:", hasFocus);
  console.log("VALUE:", JSON.stringify(val));
  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
