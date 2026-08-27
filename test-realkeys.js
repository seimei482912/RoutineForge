const { _electron } = require("playwright-core");

(async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  env.RF_TEST_USERDATA = require("path").join(require("os").tmpdir(), "routineforge-testdata");
  const app = await _electron.launch({
    executablePath: "dist/win-unpacked/RoutineForge.exe",
    env
  });
  const win = await app.firstWindow();
  await win.waitForSelector("#addRoutine");
  await win.click("#addRoutine");
  await win.waitForSelector("#fName");
  await win.click("#fName");
  console.log("READY_FOR_KEYS");   // ここで外部からSendKeysが飛んでくるのを待つ
  await win.waitForTimeout(8000);
  const val = await win.inputValue("#fName");
  const focused = await win.evaluate(() =>
    document.activeElement ? document.activeElement.tagName + "#" + document.activeElement.id : "none");
  console.log("FOCUSED:", focused);
  console.log("VALUE:", JSON.stringify(val));
  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
