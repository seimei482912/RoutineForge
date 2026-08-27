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
  await win.evaluate(() => { localStorage.clear(); location.reload(); });
  await win.waitForSelector(".rcard");

  // 開始 → 一時停止 → ステップ2名クリック → 入力欄が出る
  await win.locator(".rcard").first().dblclick();
  await win.waitForSelector("#cd");
  await win.keyboard.press("p");
  await win.waitForTimeout(200);
  await win.click('[data-editstep="1"]');
  await win.waitForSelector(".inline-edit");

  // 編集中にSpace/P/Sを押してもショートカットが発火しないこと
  await win.keyboard.press("Space");
  await win.keyboard.press("p");
  await win.keyboard.press("s");
  await win.waitForTimeout(200);
  const doneDuringEdit = await win.locator(".step-preview .row.done").count();
  const stillPaused = await win.locator(".pause-label").count();
  console.log("shortcuts suppressed while editing (done=0, paused=1):", doneDuringEdit, stillPaused);

  // 名前を入れ替えてEnter確定
  await win.locator(".inline-edit").fill("");
  await win.locator(".inline-edit").type("薬を飲む チェック");
  await win.keyboard.press("Enter");
  await win.waitForTimeout(300);
  const row2 = (await win.locator(".step-preview .row").nth(1).innerText()).trim().replace(/\s+/g," ");
  const persisted = await win.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("routineforge_data_v1"));
    return d.routines[0].steps[1].name;
  });
  console.log("row2:", JSON.stringify(row2));
  console.log("persisted:", JSON.stringify(persisted));

  // Escでキャンセルできること
  await win.click('[data-editstep="2"]');
  await win.waitForSelector(".inline-edit");
  await win.locator(".inline-edit").fill("これは破棄されるはず");
  await win.keyboard.press("Escape");
  await win.waitForTimeout(300);
  const row3 = (await win.locator(".step-preview .row").nth(2).innerText()).trim().replace(/\s+/g," ");
  console.log("row3 after Esc (unchanged):", JSON.stringify(row3));

  // 確定後はショートカット復活(P→再開、Space→完了)
  await win.keyboard.press("p");
  await win.waitForTimeout(200);
  await win.keyboard.press("Space");
  await win.waitForTimeout(300);
  console.log("done rows after resume+Space (should be 1):", await win.locator(".step-preview .row.done").count());
  const curName = await win.locator(".step-name").innerText();
  console.log("current step now (should be 薬を飲む チェック):", JSON.stringify(curName));

  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
