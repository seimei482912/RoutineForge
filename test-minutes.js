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
  await win.waitForSelector("#addRoutine");

  // 新規ルーティン → ステップ追加 → 初期値が「10」(分)か
  await win.click("#addRoutine");
  await win.waitForSelector("#fName");
  await win.fill("#fName", "分単位テスト");
  await win.click("#addStep");
  const durVal = await win.locator(".dur").last().inputValue();
  console.log("new step default (should be 10):", durVal);
  await win.locator('[data-field="name"]').last().fill("ステップA");
  await win.click("#saveRoutine");
  await win.waitForTimeout(300);

  // 保存されたdurationが600秒か
  const saved = await win.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("routineforge_data_v1"));
    const r = d.routines.find(x => x.name === "分単位テスト");
    return r ? r.steps.map(s => s.duration).join(",") : "NOT FOUND";
  });
  console.log("saved durations (should be 600):", saved);

  // タイマー起動 → 10:00表示か、プレビューが「10分」表記か
  const card = win.locator(".rcard", { hasText: "分単位テスト" });
  await card.dblclick();
  await win.waitForSelector("#cd");
  console.log("countdown (should be 10:00):", await win.locator("#cd").innerText());
  console.log("preview row:", (await win.locator(".step-preview .row").first().innerText()).trim());

  // +1分ボタン → 11:00
  await win.click("#tPlus");
  console.log("after +1分 (should be 11:00):", await win.locator("#cd").innerText());

  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
