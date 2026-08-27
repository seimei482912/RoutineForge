const { _electron } = require("playwright-core");

(async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  env.RF_TEST_USERDATA = require("path").join(require("os").tmpdir(), "routineforge-testdata");
  const app = await _electron.launch({
    executablePath: "dist2/win-unpacked/RoutineForge.exe",
    env
  });
  const win = await app.firstWindow();
  await win.waitForSelector("#addRoutine");
  await win.evaluate(() => {
    localStorage.setItem("routineforge_data_v1", JSON.stringify({
      routines: [{ id:"t1", name:"2026/08/27", steps:[
        {id:"a", name:"ペリカの入力", duration:1800},
        {id:"b", name:"LINEの返事", duration:600},
        {id:"c", name:"DMの返事", duration:600}
      ]}],
      logs: []
    }));
    location.reload();
  });
  await win.waitForSelector(".rcard");
  await win.locator(".rcard").first().click();
  await win.waitForSelector(".idle-panel");
  await win.waitForTimeout(400);
  await win.screenshot({ path: require("path").join(require("os").tmpdir(), "rf_idle_shot.png") });
  console.log("screenshot saved");
  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
