// content/ の記事・キャスト・広告・設定をまとめて data/site.json を作る（Netlifyが公開のたびに実行）
const fs = require("fs");
const path = require("path");
const read = dir => {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter(f => f.endsWith(".json")).map(f => {
    try { return { id: f.replace(/\.json$/, ""), ...JSON.parse(fs.readFileSync(path.join(full, f), "utf8")) }; }
    catch (e) { console.warn("読み込めないファイルを飛ばしました:", dir + "/" + f); return null; }
  }).filter(Boolean);
};
const people = read("content/people").map(p => ({ ...p, id: p.id || "" }));
const settingsFile = path.join(__dirname, "content/settings.json");
const site = {
  issues: read("content/issues"),
  people,
  ads: read("content/ads"),
  settings: fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile, "utf8")) : {},
  builtAt: new Date().toISOString()
};
fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "data/site.json"), JSON.stringify(site));
console.log(`data/site.json を作成：記事${site.issues.length}件、キャスト${people.length}人、広告${site.ads.length}件`);
