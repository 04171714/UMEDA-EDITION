/* UMEDA Edition — サイト本体
   記事・キャスト・広告・設定は /data/site.json（公開時に build.js が content/ から作る）から読み込む */
"use strict";

/* ===== 定数 ===== */
const CAT_GROUPS = [
  {label:"CAST", items:[["umeda","UMEDA"],["annex","ANNEX"],["prince","Prince"]]},
  {label:"INTERVIEW", items:[["special","SPECIAL ISSUE"],["popular","人気記事まとめ"]]},
  {label:"WORK", items:[["serve","接客術・コミュニケーション"],["mind","人間関係・考え方"],["career","セカンドキャリア"],["beauty","美容・メイク・愛用品"],["fashion","ファッション"]]}
];
const CATS = Object.fromEntries(CAT_GROUPS.flatMap(g=>g.items));
const SHOP_CAT = {"ATOM UMEDA":"umeda","ATOM ANNEX":"annex","Prince":"prince"};
const RANK_COLORS = ["#A88E5E","#8D9196","#8A6A55"];

/* ===== 状態 ===== */
let SITE = {issues:[], people:[], ads:[], settings:{}};
let ISSUES = [], PEOPLE = [], ADS = [];
let rankOpen = false, castFilter = "all", searchQ = "", slideTimer = null, adTimers = [];

/* ===== 便利関数 ===== */
const esc = v => String(v ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nl = v => esc(v).replace(/\r?\n/g,"<br>");
const ymd = d => String(d||"").slice(0,10).replace(/-/g,"/");
const safeUrl = u => /^https?:\/\//i.test(String(u||"")) ? String(u) : "";
const safeImg = u => (typeof u==="string" && (/^\/[^\s"'<>]*$/.test(u) || /^https:\/\/[^\s"'<>]+$/.test(u))) ? u : "";
const igUrl = h => { const s = String(h||"").trim(); if(/^https?:\/\//.test(s)) return safeUrl(s); const u = s.replace(/^@/,""); return /^[A-Za-z0-9._]{1,30}$/.test(u) ? "https://www.instagram.com/"+u+"/" : ""; };
const person = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4.5"/><path d="M3 22c0-5 4-8 9-8s9 3 9 8z"/></svg>';
const img = (src, alt="") => src ? `<img class="pimg" src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : "";
const noImg = (label="UMEDA Edition") => `<div class="noimg"><span>${esc(label)}</span></div>`;
const stamp = a => Date.parse(a.date || "") || 0;
const byNew = () => ISSUES.slice().sort((x,y)=>stamp(y)-stamp(x));
const find = id => ISSUES.find(a=>a.id===id);

/* ===== データの整形 ===== */
function normIssue(d){
  const p = PEOPLE.find(x=>x.id===d.cast) || null;
  const type = ["cast","special","feature"].includes(d.type) ? d.type : "cast";
  const images = (Array.isArray(d.images)?d.images:[]).map(x=>safeImg(typeof x==="string"?x:x&&x.image)).filter(Boolean).slice(0,4);
  const qa = (Array.isArray(d.qa)?d.qa:[]).filter(x=>x&&String(x.q||"").trim()&&String(x.a||"").trim()).slice(0,3).map(x=>({q:String(x.q).replace(/\s*\n\s*/g," ").trim(), a:String(x.a).trim()}));
  let cats = (Array.isArray(d.cats)?d.cats:[]).filter(k=>CATS[k]);
  if(p && SHOP_CAT[p.shop] && !cats.includes(SHOP_CAT[p.shop])) cats.unshift(SHOP_CAT[p.shop]);
  if(type==="special" && !cats.includes("special")) cats.push("special");
  return {
    id:d.id, type, no:String(d.no||""), title:String(d.title||"（無題）"), date:String(d.date||""),
    person:p, name: p ? p.name : "", nameEn: p ? (p.nameEn||"") : "",
    cats:[...new Set(cats)], banner:safeImg(d.banner), cover:safeImg(d.cover), images, lead:String(d.lead||""),
    qa, quote:String(d.quote||""), rank: Number(d.rank)>0 ? Number(d.rank) : 0, body:String(d.body||"")
  };
}
function load(data){
  SITE = data || SITE;
  PEOPLE = (SITE.people||[]).filter(p=>p && p.active!==false).map(p=>({...p, photo:safeImg(p.photo)})).sort((a,b)=>(a.order||0)-(b.order||0));
  ADS = (SITE.ads||[]).filter(a=>a && a.active!==false && safeImg(a.image) && safeUrl(a.link)).sort((a,b)=>(a.order||0)-(b.order||0));
  ISSUES = (SITE.issues||[]).filter(d=>d && d.id && d.draft!==true).map(normIssue);
  const s = SITE.settings||{};
  if(s.tagline) document.getElementById("tagline").textContent = s.tagline;
  if(igUrl(s.instagram)) document.getElementById("footIg").href = igUrl(s.instagram);
}

/* ===== 画像 ===== */
const coverSrc = a => a.cover || a.banner || (a.person && a.person.photo) || "";
const bannerSrc = a => a.banner || a.cover || (a.person && a.person.photo) || "";
const thumb = a => `<div class="ph">${coverSrc(a) ? img(coverSrc(a), a.title) : noImg()}</div>`;
const labelOf = a => a.type==="special" ? "SPECIAL ISSUE "+esc(a.no) : a.type==="feature" ? "FEATURE "+esc(a.no) : "No."+esc(a.no);

/* ===== 部品 ===== */
function crow(a){
  return `<a class="crow" href="#${esc(a.id)}">${thumb(a)}<div><div class="meta"><span>${esc(ymd(a.date))}</span><span class="sep"></span>${person}<span>${esc(a.name||"編集部")}</span></div><p class="t">${nl(a.title)}${a.name?"　"+esc(a.name):""}</p><span class="chips">${a.cats.slice(0,2).map(k=>`<span class="chip">${esc(CATS[k])}</span>`).join("")}</span></div></a>`;
}
function slideHTML(a,i){
  const src = bannerSrc(a);
  return `<a class="slide" href="#${esc(a.id)}" aria-label="${esc(a.title)}"><div class="ph">${src?img(src,a.title):noImg()}</div><div class="ov"></div><div class="st"><span class="lab">${i===0?"NEW　":""}${labelOf(a)}</span><h2>${nl(a.title)}</h2>${a.name?`<span class="nm">${esc(a.nameEn)}　/　${esc(a.name)}</span>`:""}</div></a>`;
}
function pickCard(a){
  return `<a class="pickcard" href="#${esc(a.id)}"><div class="pc-img">${thumb(a)}</div><div class="pc-txt"><span class="s">${labelOf(a)}</span><h3>${nl(a.title)}</h3>${a.name?`<span class="nm">${esc(a.name)}</span>`:""}<p>${esc(a.lead)}</p><span class="go">READ MORE</span></div></a>`;
}
function rankRow(a,i){
  return `<div class="rrow"><a class="thumb" href="#${esc(a.id)}"><span class="badge" style="background:${RANK_COLORS[i]||"#2B2B2B"}">${i+1}</span>${thumb(a)}</a><div><h3><a href="#${esc(a.id)}">${nl(a.title)}${a.name?"　"+esc(a.name):""}</a></h3><p>${esc(a.lead)}</p><a class="readmore" href="#${esc(a.id)}">続きを読む</a></div></div>`;
}
function ranking(){ const r = ISSUES.filter(a=>a.rank>0).sort((x,y)=>x.rank-y.rank); return r.length ? r : byNew(); }
function carousel(items, cls=""){
  if(!items.length) return "";
  return `<div class="adslot ${cls}" data-adslot>${cls.includes("ad")?'<span class="adlabel">AD</span>':""}<div class="adtrack">${items.join("")}</div>${items.length>1?`<div class="addots">${items.map((_,i)=>`<button type="button" data-ad="${i}" aria-label="${i+1}枚目" aria-current="${i===0}"></button>`).join("")}</div>`:""}</div>`;
}
function adSlot(slot){
  const list = ADS.filter(a=>a.slot===slot || a.slot==="both" || !a.slot);
  return carousel(list.map(a=>`<a class="adcard" href="${esc(safeUrl(a.link))}" target="_blank" rel="sponsored noopener" aria-label="広告：${esc(a.title||"")}">${img(safeImg(a.image), a.title||"広告")}</a>`), "ad");
}
const snsIcons = s => {
  const links = [
    ["x", safeUrl(s.x), '<svg viewBox="0 0 24 24"><path fill="#111" d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.3l4.4 5.9zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg>', "X"],
    ["ig", igUrl(s.instagram), '<svg viewBox="0 0 24 24" fill="none" stroke="#C13584" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1" fill="#C13584"/></svg>', "Instagram"],
    ["tt", safeUrl(s.tiktok), '<svg viewBox="0 0 24 24"><path fill="#111" d="M16.5 2c.3 2.3 1.7 3.9 4 4.1v3.1c-1.5.1-2.8-.4-4-1.2v6.6c0 4-3.4 6.5-6.8 5.9-3.6-.6-5.4-4.5-3.9-7.6 1.1-2.3 3.5-3.4 6-3v3.3c-1.4-.4-2.9.3-3.3 1.6-.5 1.5.6 3 2.2 3 1.4 0 2.4-1 2.4-2.5V2z"/></svg>', "TikTok"],
    ["yt", safeUrl(s.youtube), '<svg viewBox="0 0 42 30" style="width:52px"><rect width="42" height="30" rx="8" fill="#FF0033"/><path d="M17 9 L28 15 L17 21 Z" fill="#fff"/></svg>', "YouTube"]
  ].filter(x=>x[1]);
  return links.length ? `<h2 class="h-sec">Official SNS</h2><div class="sns">${links.map(([,u,svg,l])=>`<a href="${esc(u)}" target="_blank" rel="noopener" aria-label="${l}">${svg}</a>`).join("")}</div>` : "";
};
const searchForm = (id, q="") => `<form class="sbox" id="${id}" role="search"><input type="search" value="${esc(q)}" placeholder="キーワード検索" aria-label="キーワード検索"><button type="submit" aria-label="検索"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></button></form>`;

/* ===== 画面 ===== */
function viewTop(){
  const news = byNew();
  if(!news.length) return `<div class="wrap mx"><h2 class="h-sec">New Column</h2><p class="empty-msg">まだ記事がありません。</p></div>`;
  const rk = ranking().slice(0, rankOpen?10:3);
  const picks = ISSUES.filter(a=>a.type!=="cast").slice(0,6);
  const count = k => ISSUES.filter(a=>a.cats.includes(k)).length;
  return `<section class="slider" aria-label="最新記事"><div class="slides" id="slides">${news.slice(0,5).map(slideHTML).join("")}</div>
      ${news.length>1?`<div class="dots">${news.slice(0,5).map((_,i)=>`<button type="button" data-slide="${i}" aria-label="${i+1}枚目" aria-current="${i===0}"></button>`).join("")}</div>`:""}</section>
    <div class="wrap mx">
      <h2 class="h-sec">New Column</h2>
      <div class="clist">${news.slice(0,3).map(crow).join("")}</div>
      <a class="btn-wide" href="#columns">コラム一覧へ</a>
      ${adSlot("a")}
      ${picks.length?`<h2 class="h-sec">Pick Up Column</h2>${carousel(picks.map(pickCard),"pickslot")}`:""}
      <h2 class="h-sec">Today's Ranking</h2>
      <div>${rk.map(rankRow).join("")}</div>
      ${ranking().length>3?`<button class="morecircle" type="button" id="rankMore" aria-expanded="${rankOpen}">${rankOpen?"Close":"More"}<svg viewBox="0 0 44 20" fill="none" stroke="#fff" stroke-width="2"><path d="${rankOpen?"M2 18 L22 2 L42 18":"M2 2 L22 18 L42 2"}"/></svg></button>`:""}
    </div>
    ${PEOPLE.length?`<section class="circles" aria-label="登場人物"><div class="row">${PEOPLE.map(p=>{ const art = news.find(a=>a.person===p); return `<a href="${art?"#"+esc(art.id):"#cast"}"><div class="ph">${p.photo?img(p.photo,p.name):noImg(p.name)}</div><span class="nm">${esc(p.name)}</span></a>`; }).join("")}</div></section>`:""}
    <div class="wrap mx">
      <h2 class="h-sec">Category</h2>
      <div class="catgroups">${CAT_GROUPS.map(g=>`<p class="catcap">ー ${g.label} ー</p><ul class="catlist">${g.items.map(([k,l])=>`<li><a href="#cat-${k}">${esc(l)} (${count(k)})</a></li>`).join("")}</ul>`).join("")}</div>
      <h2 class="h-sec">Search</h2>
      <div class="search-sec">${searchForm("topSearch")}</div>
      ${adSlot("b")}
      ${snsIcons(SITE.settings||{})}
    </div>`;
}
function viewColumns(kind, key){
  let list = byNew(), title = "Column", sub = "すべてのコラム（新しい順）";
  if(kind==="cat"){ list = list.filter(a=>a.cats.includes(key)); title = "Category"; sub = esc(CATS[key]||"")+"の記事"; }
  if(kind==="cast"){ list = list.filter(a=>a.type!=="feature" && (castFilter==="all" || a.type===castFilter)); title = "People"; sub = "登場した人物の記事"; }
  if(kind==="special"){ list = list.filter(a=>a.type==="special"); title = "Special Issue"; sub = "それぞれの分野で結果を重ねてきた人だけが、私服で登場する特別号"; }
  if(kind==="search"){ const q = searchQ.trim().toLowerCase(); list = q ? list.filter(a=>[a.title,a.name,a.nameEn,a.lead,a.qa.map(x=>x.q+" "+x.a).join(" "),a.body,a.cats.map(k=>CATS[k]).join(" ")].join(" ").toLowerCase().includes(q)) : []; title = "Search"; sub = q ? `「${esc(searchQ)}」の検索結果：${list.length}件` : "キーワードを入力してください"; }
  return `<div class="wrap mx"><h1 class="h-sec">${title}</h1><div class="lp-head"><p>${sub}</p>${kind==="search"?searchForm("pageSearch", searchQ):""}
    ${kind==="cast"?`<div class="filters" role="group" aria-label="絞り込み" style="justify-content:center;margin-top:12px"><button type="button" data-f="all" aria-pressed="${castFilter==="all"}">ALL</button><button type="button" data-f="cast" aria-pressed="${castFilter==="cast"}">SUIT</button><button type="button" data-f="special" aria-pressed="${castFilter==="special"}">SPECIAL ISSUE</button></div>`:""}</div>
    <div class="clist">${list.map(crow).join("") || '<p class="empty-msg">該当する記事はありません。</p>'}</div></div>`;
}
function bodyQA(a){
  const fig = src => `<figure class="inline-ph"><div class="ph natural">${img(src, a.title)}</div></figure>`;
  const parts = a.qa.map((x,i)=>`<section class="qa"><h2><span class="q">Q${i+1}</span><span class="qt">${esc(x.q)}</span></h2>${x.a.split(/\n\s*\n/).map(p=>`<p>${nl(p)}</p>`).join("")}</section>${i===0&&a.quote?`<blockquote class="pull">${nl(a.quote)}</blockquote>`:""}${a.images[i]?fig(a.images[i]):""}`);
  return parts.join("") + a.images.slice(a.qa.length).map(fig).join("");
}
function bodyFeature(a){
  // 特集本文：段落と「## 見出し」に対応する簡易表示
  const blocks = a.body.split(/\n\s*\n/).map(t=>t.trim()).filter(Boolean);
  return blocks.map(b=> b.startsWith("## ") ? `<h2 class="fe-h">${esc(b.slice(3))}</h2>` : `<p>${nl(b)}</p>`).join("") + a.images.map(src=>`<figure class="inline-ph"><div class="ph natural">${img(src, a.title)}</div></figure>`).join("");
}
function shareBox(a){
  const url = location.origin + location.pathname + "#" + a.id;
  return `<div class="sharebox"><p>この記事をシェアする</p><div class="sb-btns"><a class="sb-line" href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}" target="_blank" rel="noopener">LINEで送る</a><button class="sb-copy" type="button" data-share="${esc(url)}" data-title="${esc(a.title.replace(/\n/g," "))}">シェアする</button></div><span class="sb-msg" role="status"></span></div>`;
}
function profile(a){
  const p = a.person; if(!p) return "";
  const ig = igUrl(p.ig);
  const rows = [["生年月日",p.birth],["身長",p.height],["血液型",p.blood],["出身地",p.hometown],["在籍店",p.shop?`『${p.shop}』`:""]].filter(([,v])=>v);
  return `<section class="profile" aria-label="プロフィール"><div class="pf-top"><div class="pf-ph">${p.photo?img(p.photo,p.name):noImg(p.name)}</div>
    <div class="pf-name"><span class="pf-n">${person}${esc(p.name)}</span>${ig?`<a class="pf-ig" href="${esc(ig)}" target="_blank" rel="noopener" aria-label="${esc(p.name)}のInstagram"><svg viewBox="0 0 24 24" fill="none" stroke="#C13584" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1" fill="#C13584" stroke="none"/></svg></a>`:""}</div></div>
    ${rows.length?`<dl class="pf-list">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`:""}</section>`;
}
function rankingBlock(a){
  const rk = ranking().filter(x=>x.id!==a.id).slice(0,5);
  return rk.length ? `<div class="wrap mx"><h2 class="h-sec">Today's Ranking</h2><div>${rk.map(rankRow).join("")}</div></div>` : "";
}
function viewIssue(a){
  const crumb = `<div class="crumb"><a href="#top">TOP</a><span>/</span><a href="#${a.type==="special"?"special":a.type==="feature"?"columns":"cast"}">${a.type==="special"?"SPECIAL ISSUE":a.type==="feature"?"COLUMN":"PEOPLE"}</a><span>/</span><span>${esc(a.no)}</span></div>`;
  const chips = `<div class="a-tags"><span>${esc(ymd(a.date))}</span>${a.cats.map(k=>`<a class="chip" href="#cat-${k}">${esc(CATS[k])}</a>`).join("")}</div>`;
  const body = a.type==="feature" ? bodyFeature(a) : bodyQA(a);
  if(a.type==="cast"){
    return `<div class="wrap">${crumb}
      <section class="a-cover"><div class="ph">${coverSrc(a)?img(coverSrc(a),a.title):noImg()}</div>
        <div class="a-meta">${chips}<span class="a-no">No.${esc(a.no)}</span><h1>${nl(a.title)}</h1><div class="a-name"><b>${esc(a.name)}</b><span>${esc(a.nameEn)}</span></div>${a.lead?`<p class="lead">${nl(a.lead)}</p>`:""}</div>
      </section><div class="a-body">${body}</div>${shareBox(a)}${profile(a)}</div>${rankingBlock(a)}`;
  }
  const src = bannerSrc(a);
  return `<section class="sp-head"><div class="wrap">${crumb}
      <div class="sp-hero"><div class="ph">${src?img(src,a.title):noImg()}</div><div class="ov"></div><div class="st"><span class="lab">${labelOf(a)}</span><h1>${nl(a.title)}</h1>${a.name?`<span class="nm">${esc(a.nameEn)}　/　${esc(a.name)}</span>`:""}</div></div></div></section>
    <div class="wrap"><div class="a-body" style="padding-top:20px">${chips}${a.lead?`<p class="lead" style="margin-top:16px">${nl(a.lead)}</p>`:""}${body}</div>${shareBox(a)}${profile(a)}</div>${rankingBlock(a)}`;
}
function viewAbout(){
  return `<div class="wrap"><article class="about"><h1>ABOUT</h1>
    <p>UMEDA Editionは、梅田で働く男たち一人ひとりを主役に、その装いと美学を記録していくWebマガジンです。</p>
    <h2>ドレスコード</h2><div class="tw"><table><thead><tr><th></th><th>SUIT</th><th>SPECIAL ISSUE</th></tr></thead><tbody>
      <tr><th>対象</th><td>登場する全員</td><td>それぞれの分野で結果を重ねてきた人</td></tr>
      <tr><th>色</th><td>黒・チャコールグレー・ダークネイビー</td><td>黒・白・ベージュ・グレー基調</td></tr>
      <tr><th>背景</th><td>白またはグレーのスタジオ</td><td>スタジオ、またはラウンジ・建築空間でのロケ</td></tr>
    </tbody></table></div>
    <h2>Instagram</h2><p>1投稿のカルーセルで1人を紹介し、フルインタビューはこのサイトに掲載しています。</p>
  </article></div>`;
}

/* ===== 動き ===== */
function startCarousels(){
  adTimers.forEach(clearInterval); adTimers = [];
  const auto = (track, n, ms, onIdx) => {
    let idx = 0, paused = false;
    track.addEventListener("scroll", ()=>{ const i = Math.round(track.scrollLeft / track.clientWidth); if(i!==idx){ idx=i; onIdx(i); } }, {passive:true});
    track.addEventListener("pointerdown", ()=>paused=true);
    track.addEventListener("pointerenter", ()=>paused=true); track.addEventListener("pointerleave", ()=>paused=false);
    if(n<2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    adTimers.push(setInterval(()=>{ if(!paused && document.body.contains(track)) track.scrollTo({left:((idx+1)%n)*track.clientWidth, behavior:"smooth"}); }, ms));
  };
  const slides = document.getElementById("slides");
  if(slides) auto(slides, slides.children.length, 5000, i=>document.querySelectorAll("[data-slide]").forEach((b,j)=>b.setAttribute("aria-current", i===j)));
  document.querySelectorAll("[data-adslot]").forEach(slot=>{
    const tr = slot.querySelector(".adtrack");
    auto(tr, tr.children.length, 4000, i=>slot.querySelectorAll("[data-ad]").forEach((b,j)=>b.setAttribute("aria-current", i===j)));
    slot.querySelectorAll("[data-ad]").forEach(b=>b.addEventListener("click", ()=>tr.scrollTo({left:+b.dataset.ad*tr.clientWidth, behavior:"smooth"})));
  });
}
function fitQuestions(){
  document.querySelectorAll(".qa h2 .qt").forEach(el=>{
    el.style.fontSize = ""; let size = parseFloat(getComputedStyle(el).fontSize) || 17, g = 0;
    while(el.scrollWidth > el.clientWidth + 1 && size > 10 && g++ < 30){ size -= .5; el.style.fontSize = size+"px"; }
  });
}
function renderNav(cur){
  const items = [["top","トップ","TOP"],["columns","コラム一覧","COLUMN"],["cast","人物一覧","PEOPLE"],["special","特別号","SPECIAL ISSUE"],["about","UMEDA Editionについて","ABOUT"]];
  document.getElementById("nav").innerHTML = items.map(([h,ja,en])=>`<a href="#${h}" ${cur===h?'aria-current="page"':""}>${ja}<span class="en">${en}</span></a>`).join("")
    + CAT_GROUPS.map(g=>`<span class="cap">ー ${g.label} ー</span>`+g.items.map(([k,l])=>`<a href="#cat-${k}">${esc(l)}</a>`).join("")).join("");
}
function setDrawer(open){
  document.getElementById("drawer").hidden = !open;
  document.getElementById("menuBtn").setAttribute("aria-expanded", open);
  if(open) setTimeout(()=>document.getElementById("drawerQ").focus({preventScroll:true}), 50);
}
function route(keep){
  const h = (location.hash||"#top").slice(1);
  const app = document.getElementById("app");
  let cur = h, title = "UMEDA Edition";
  if(h==="columns") app.innerHTML = viewColumns("all");
  else if(h==="cast") app.innerHTML = viewColumns("cast");
  else if(h==="special") app.innerHTML = viewColumns("special");
  else if(h==="search") app.innerHTML = viewColumns("search");
  else if(h.startsWith("cat-") && CATS[h.slice(4)]) app.innerHTML = viewColumns("cat", h.slice(4));
  else if(h==="about") app.innerHTML = viewAbout();
  else if(find(h)){ const a = find(h); app.innerHTML = viewIssue(a); title = (a.name?a.name+"｜":"")+a.title.replace(/\n/g," ")+"｜UMEDA Edition"; }
  else { app.innerHTML = viewTop(); cur = "top"; }
  document.title = title;
  renderNav(cur); setDrawer(false);
  startCarousels();
  requestAnimationFrame(fitQuestions);
  if(!keep) window.scrollTo(0,0);
}

/* ===== 操作 ===== */
document.addEventListener("click", e=>{
  const f = e.target.closest("[data-f]"); if(f){ castFilter = f.dataset.f; route(true); return; }
  const sl = e.target.closest("[data-slide]"); if(sl){ const box = document.getElementById("slides"); box.scrollTo({left:+sl.dataset.slide*box.clientWidth, behavior:"smooth"}); return; }
  if(e.target.closest("#rankMore")){ rankOpen = !rankOpen; const y = scrollY; route(true); scrollTo(0,y); return; }
  const sh = e.target.closest("[data-share]");
  if(sh){
    const m = sh.closest(".sharebox").querySelector(".sb-msg"), url = sh.dataset.share;
    if(navigator.share){ navigator.share({title: sh.dataset.title, url}).catch(()=>{}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(()=>m.textContent="記事のリンクをコピーしました。", ()=>m.textContent=url);
    return;
  }
  if(e.target.closest(".drawer a") || e.target.id==="drawer") setDrawer(false);
});
document.addEventListener("submit", e=>{
  if(["drawerSearch","topSearch","pageSearch"].includes(e.target.id)){
    e.preventDefault(); searchQ = e.target.querySelector("input").value;
    if(location.hash==="#search") route(); else location.hash = "search";
  }
});
document.addEventListener("keydown", e=>{ if(e.key==="Escape") setDrawer(false); });
document.addEventListener("error", e=>{ const t=e.target; if(t && t.classList && t.classList.contains("pimg")) t.style.visibility="hidden"; }, true);
document.getElementById("menuBtn").addEventListener("click", ()=>setDrawer(document.getElementById("drawer").hidden));
document.getElementById("searchBtn").addEventListener("click", ()=>setDrawer(true));
window.addEventListener("hashchange", ()=>route());
window.addEventListener("resize", ()=>{ clearTimeout(window.__fq); window.__fq = setTimeout(fitQuestions, 150); });

/* ===== 起動 ===== */
fetch("/data/site.json", {cache:"no-cache"})
  .then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
  .then(d=>{ load(d); route(true); })
  .catch(()=>{ document.getElementById("app").innerHTML = '<p class="empty-msg">記事を読み込めませんでした。時間をおいてもう一度開いてください。</p>'; });
