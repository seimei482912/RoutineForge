// 消えてしまった社長のルーティンを本物のデータ領域へ復元する(空の場合のみ。既存があれば何もしない)
const { _electron } = require("playwright-core");

(async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;   // 本物のデータ領域を使う(RF_TEST_USERDATAは付けない)
  const app = await _electron.launch({ executablePath: "dist/win-unpacked/RoutineForge.exe", env });
  const win = await app.firstWindow();
  await win.waitForSelector("#addRoutine");
  const result = await win.evaluate(() => {
    const KEY = "routineforge_data_v1";
    let d;
    try { d = JSON.parse(localStorage.getItem(KEY)) || { routines: [], logs: [] }; }
    catch (e) { d = { routines: [], logs: [] }; }
    // 私のテストが上書きしたデモ(朝/夜、id固定)だけを取り除く。それ以外は保持
    const before = d.routines.map(r=>r.name).join(", ");
    d.routines = d.routines.filter(r => !(r.id === "r_morning" || r.id === "r_night"));
    if (d.routines.length > 0) {
      localStorage.setItem(KEY, JSON.stringify(d));
      return "デモ削除のみ(他データ保持): " + before + " → " + d.routines.map(r=>r.name).join(", ");
    }
    d.routines.push({
      id: "r_" + Date.now(),
      name: "エロ動画取捨選択",
      steps: [
        { id: "s_r1", name: "エロ動画取捨選択", duration: 1800 },
        { id: "s_r2", name: "2", duration: 600 },
        { id: "s_r3", name: "3", duration: 600 }
      ]
    });
    localStorage.setItem(KEY, JSON.stringify(d));
    return "復元した: " + d.routines.map(r=>r.name).join(", ");
  });
  console.log(result);
  await app.close();
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
