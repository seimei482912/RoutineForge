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

  // データを既知の状態にリセット(サンプル2件が入った初期状態)
  await win.evaluate(() => { localStorage.clear(); location.reload(); });
  await win.waitForSelector(".rcard");

  // 社長の操作を再現: ルーティンを選択→編集→削除(モーダルではいをクリック)
  await win.locator(".rcard").first().click();
  await win.waitForTimeout(200);
  await win.keyboard.press("e");
  await win.waitForSelector("#delRoutine");
  await win.click("#delRoutine");
  await win.waitForSelector("#mcOk");
  await win.click("#mcOk");
  await win.waitForTimeout(300);
  console.log("deleted one routine, cards left:", await win.locator(".rcard").count());

  // その直後に新規作成→名前欄クリック
  await win.click("#addRoutine");
  await win.waitForSelector("#fName");
  await win.click("#fName");
  console.log("READY_FOR_KEYS pid=" + (await app.evaluate(() => process.pid)));
  await win.waitForTimeout(8000);   // ここで外部から本物のキー入力が飛んでくる

  const val = await win.inputValue("#fName");
  console.log("VALUE:", JSON.stringify(val));

  // 保存まで通す(ステップも入れる)
  if(val){
    await win.click("#addStep");
    await win.locator('[data-field="name"]').last().click();
    await win.keyboard.type("step1");
    await win.click("#saveRoutine");
    await win.waitForTimeout(300);
    console.log("after save, cards:", await win.locator(".rcard").count());
  }
  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
