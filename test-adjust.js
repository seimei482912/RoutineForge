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
  // 隔離領域にテスト用ルーティンを用意(実データには一切触れない)
  await win.evaluate(() => {
    localStorage.setItem("routineforge_data_v1", JSON.stringify({
      routines: [{ id:"t1", name:"調整テスト", steps:[{id:"ts1", name:"ステップ", duration:600}] }],
      logs: []
    }));
    location.reload();
  });
  await win.waitForSelector(".rcard");
  await win.locator(".rcard").first().dblclick();
  await win.waitForSelector("#cd");
  await win.keyboard.press("p"); // 一時停止して数値を安定させる
  await win.waitForTimeout(200);

  const cd = async () => await win.locator("#cd").innerText();
  console.log("start:", await cd());                 // 10:00
  await win.click('[data-adj="5"]');   console.log("+5分:", await cd());   // 15:00
  await win.click('[data-adj="10"]');  console.log("+10分:", await cd());  // 25:00
  await win.click('[data-adj="-10"]'); console.log("−10分:", await cd());  // 15:00
  await win.click('[data-adj="-5"]');  console.log("−5分:", await cd());   // 10:00
  await win.click('[data-adj="-1"]');  console.log("−1分:", await cd());   // 09:00
  await win.click('[data-adj="1"]');   console.log("+1分:", await cd());   // 10:00

  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
