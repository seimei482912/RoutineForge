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

  // 新規ルーティン画面を開いて名前欄へ入力を試みる
  await win.click("#addRoutine");
  await win.waitForSelector("#fName");
  await win.click("#fName");
  const focused = await win.evaluate(() =>
    (document.activeElement ? document.activeElement.tagName + "#" + document.activeElement.id : "none"));
  await win.keyboard.type("abcテスト");
  const val = await win.inputValue("#fName");
  console.log("STEP1 focused:", focused);
  console.log("STEP1 typed value:", JSON.stringify(val));

  // 追加診断: keydownイベントがinputに届いているか
  const diag = await win.evaluate(() => {
    return new Promise((resolve) => {
      const inp = document.getElementById("fName");
      let got = [];
      const h = (e) => got.push(e.type + ":" + e.key + (e.defaultPrevented ? "(prevented)" : ""));
      inp.addEventListener("keydown", h);
      inp.addEventListener("input", () => got.push("input-event"));
      setTimeout(() => resolve(got.join(", ") || "no-events"), 800);
      // フォーカスを当て直す
      inp.focus();
    });
  });
  await win.keyboard.type("XY");
  await win.waitForTimeout(300);
  const val2 = await win.inputValue("#fName");
  console.log("STEP2 events:", diag);
  console.log("STEP2 value after refocus+type:", JSON.stringify(val2));

  // alert後に入力が死ぬ既知バグの確認
  await win.evaluate(() => { window.__alertDone = false; setTimeout(()=>{ alert("test"); window.__alertDone = true; }, 0); });
  await win.waitForTimeout(800);
  await win.click("#fName");
  await win.keyboard.type("Z");
  const val3 = await win.inputValue("#fName");
  console.log("STEP3 value after alert:", JSON.stringify(val3));

  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
