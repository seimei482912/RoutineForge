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

  const head = (await win.locator(".ip-head").innerText()).replace(/\s+/g," ").trim();
  console.log("head:", JSON.stringify(head));
  const rows = await win.locator(".idle-steps .irow").count();
  console.log("row count (should be 3):", rows);
  for (let i = 0; i < rows; i++) {
    console.log("row" + i + ":", JSON.stringify((await win.locator(".idle-steps .irow").nth(i).innerText()).replace(/\s+/g," ").trim()));
  }

  // トップ画面でステップ名をインライン編集
  await win.click('[data-idleedit="1"]');
  await win.waitForSelector(".inline-edit");
  await win.locator(".inline-edit").fill("LINEの返事(改)");
  await win.keyboard.press("Enter");
  await win.waitForTimeout(300);
  console.log("row1 after edit:", JSON.stringify((await win.locator(".idle-steps .irow").nth(1).innerText()).replace(/\s+/g," ").trim()));
  console.log("persisted:", await win.evaluate(() =>
    JSON.parse(localStorage.getItem("routineforge_data_v1")).routines[0].steps[1].name));

  // Escでキャンセル
  await win.click('[data-idleedit="2"]');
  await win.waitForSelector(".inline-edit");
  await win.locator(".inline-edit").fill("破棄されるはず");
  await win.keyboard.press("Escape");
  await win.waitForTimeout(300);
  console.log("row2 after Esc (unchanged):", JSON.stringify((await win.locator(".idle-steps .irow").nth(2).innerText()).replace(/\s+/g," ").trim()));

  // 開始ボタンが機能し、タイマーに入るか
  await win.click("#idleStart");
  await win.waitForSelector("#cd");
  console.log("timer countdown:", await win.locator("#cd").innerText());
  await win.keyboard.press("Escape");
  await win.waitForSelector(".idle-panel");
  console.log("back to idle with panel: OK");

  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
