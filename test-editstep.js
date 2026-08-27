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
  await win.evaluate(() => { localStorage.clear(); location.reload(); });
  await win.waitForSelector(".rcard");

  // ルーティン開始 → 一時停止 → ステップ2の名前をクリック
  await win.locator(".rcard").first().dblclick();
  await win.waitForSelector("#cd");
  await win.keyboard.press("p");
  await win.waitForTimeout(200);
  await win.click('[data-editstep="1"]');
  await win.waitForSelector(".inline-edit");
  // 元テキストを消して差し替え(実キー入力は外部から)
  await win.locator(".inline-edit").selectText();
  console.log("READY_FOR_KEYS pid=" + (await app.evaluate(() => process.pid)));
  await win.waitForTimeout(8000);   // 外部からSendKeysで 'STEP2 NEW{ENTER}' が飛ぶ

  const doneCount = await win.locator(".step-preview .row.done").count();
  const row2 = (await win.locator(".step-preview .row").nth(1).innerText()).trim().replace(/\s+/g," ");
  const persisted = await win.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("routineforge_data_v1"));
    return d.routines[0].steps[1].name;
  });
  console.log("row2 text:", JSON.stringify(row2));
  console.log("persisted name:", JSON.stringify(persisted));
  console.log("steps completed during typing (should be 0):", doneCount);

  // 編集確定後はショートカット復活: Spaceでステップ1完了
  await win.keyboard.press("Space");
  await win.waitForTimeout(300);
  console.log("done rows after Space (should be 1):", await win.locator(".step-preview .row.done").count());

  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
