"use strict";
/* 통합과학2 OX — 기록은 이 기기(브라우저)에만 저장됩니다. */

const UNITS = [
  { no: "01", title: "지질 시대의 환경과 생물", subs: { A: "화석으로 알아낸 지질 시대", B: "지질 시대의 지구 환경과 생물의 변화", C: "대멸종과 생물다양성" } },
  { no: "02", title: "변이와 자연선택에 의한 생물의 진화", subs: { A: "변이", B: "자연선택의 예", C: "다윈의 자연선택설과 생물의 진화" } },
  { no: "03", title: "생물다양성", subs: { A: "생물다양성", B: "생물다양성의 중요성", C: "생물다양성의 감소 원인과 보전" } },
  { no: "04", title: "산화와 환원", subs: { A: "자연과 인류의 역사에 변화를 가져온 화학 반응", B: "산화·환원 반응", C: "우리 주변의 산화·환원 반응" } },
  { no: "05", title: "산, 염기와 중화 반응", subs: { A: "산과 염기의 성질", B: "중화 반응", C: "중화 반응의 이용" } },
  { no: "06", title: "물질 변화에서 에너지의 출입", subs: { A: "물질 변화와 에너지의 출입", B: "에너지가 출입하는 현상의 예와 이용" } },
  { no: "07", title: "생물과 환경", subs: { A: "생태계를 구성하는 요소", B: "생물과 환경의 상호 관계" } },
  { no: "08", title: "생태계평형", subs: { A: "먹이 관계와 에너지흐름, 생태피라미드", B: "생태계평형 유지 원리", C: "환경 변화와 생태계평형, 생태계보전" } },
  { no: "09", title: "지구 환경 변화와 인간 생활", subs: { A: "지구 열수지와 지구 온난화", B: "엘니뇨와 사막화", C: "미래의 지구 환경 변화와 대처 방안" } },
  { no: "10", title: "태양 에너지의 생성과 전환", subs: { A: "태양 에너지의 생성", B: "태양 에너지의 전환과 흐름" } },
  { no: "11", title: "발전과 에너지원", subs: { A: "전자기 유도", B: "발전기와 전기 에너지의 생산", C: "여러 가지 발전 방식과 인간 생활" } },
  { no: "12", title: "에너지 효율과 신재생 에너지", subs: { A: "에너지 전환과 보존", B: "에너지 효율", C: "신재생 에너지의 활용" } },
  { no: "13", title: "과학 기술의 활용", subs: { A: "감염병 진단과 과학", B: "빅데이터의 활용" } },
  { no: "14", title: "과학 기술의 발전과 쟁점", subs: { A: "사물 인터넷과 인공지능", B: "과학 기술의 유용성과 한계", C: "과학 관련 사회적 쟁점과 과학 윤리" } }
];
const MARKS = ["탐구", "암기해", "주의해", "1등급"];
const LEVELS = ["중요", "일반", "지엽"];
const KEY = "is2-ox-cards-v1";
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const subKey = c => c.slice(0, 4);               // "03-A"
const subName = k => { const u = UNITS.find(u => u.no === k.slice(0, 2)); return u ? u.subs[k[3]] : k; };

let ITEMS = [];
let ST = {
  set: { subs: [], src: "all", cnt: "20", mode: "learn", mark: false, one: true, open: [], lv: ["중요", "일반", "지엽"] },
  stats: {}            // code -> { n: 푼 횟수, ok: 맞힌 횟수, w: 틀린 횟수, s: 연속 정답 }
};
let RUN = null;        // { cards, i, answers:[{c, my, ok}], mode, locked }

/* ---------- 저장 ---------- */
function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d) { ST.set = Object.assign(ST.set, d.set || {}); ST.stats = d.stats || {}; } } catch (e) { } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
const inWrong = c => { const s = ST.stats[c]; return !!(s && s.w > 0 && s.s < 2); };

/* ---------- 홈 ---------- */
function renderStats() {
  const vals = Object.values(ST.stats);
  const tried = vals.length, n = vals.reduce((a, s) => a + s.n, 0), ok = vals.reduce((a, s) => a + s.ok, 0);
  const wrong = ITEMS.filter(it => inWrong(it.c)).length;
  $("#statsBox").innerHTML =
    `<div><b>${tried}</b><span>푼 문항</span></div>` +
    `<div><b>${n ? Math.round(ok / n * 100) + "%" : "–"}</b><span>정답률</span></div>` +
    `<div><b>${wrong}</b><span>오답노트</span></div>`;
}
function renderTree() {
  const cnt = {}; ITEMS.forEach(it => { const k = subKey(it.c); cnt[k] = (cnt[k] || 0) + 1; });
  $("#tree").innerHTML = UNITS.map(u => {
    const ks = Object.keys(u.subs).map(s => u.no + "-" + s);
    const tot = ks.reduce((a, k) => a + (cnt[k] || 0), 0);
    return `<div class="unit${ST.set.open.includes(u.no) ? " open" : ""}" data-u="${u.no}">
      <div class="unit-h"><input type="checkbox" data-unit="${u.no}" aria-label="${esc(u.title)} 전체">
        <button type="button" class="tg" aria-expanded="${ST.set.open.includes(u.no)}"><span>${u.no.replace(/^0/, "")}. ${esc(u.title)}</span><span class="cnt">${tot}문항 <span class="car">›</span></span></button></div>
      <div class="subs">${ks.map(k => `<label class="sub-l"><input type="checkbox" data-sub="${k}"><span>${esc(u.subs[k[3]])}</span><small>${cnt[k] || 0}</small></label>`).join("")}</div></div>`;
  }).join("");
  syncTree();
}
function syncTree() {
  const sel = new Set(ST.set.subs);
  document.querySelectorAll("[data-sub]").forEach(b => b.checked = sel.has(b.dataset.sub));
  document.querySelectorAll("[data-unit]").forEach(b => {
    const ks = Object.keys(UNITS.find(u => u.no === b.dataset.unit).subs).map(s => b.dataset.unit + "-" + s);
    const n = ks.filter(k => sel.has(k)).length;
    b.checked = n === ks.length; b.indeterminate = n > 0 && n < ks.length;
  });
  updatePool();
}
function segInit(id, key) {
  const el = $(id);
  const sync = () => el.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", b.dataset.v === ST.set[key]));
  el.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; ST.set[key] = b.dataset.v; sync(); save(); updatePool(); });
  sync();
}
function pool() {
  const sel = new Set(ST.set.subs);
  return ITEMS.filter(it => sel.has(subKey(it.c))
    && ST.set.lv.includes(it.l)
    && (!ST.set.mark || MARKS.includes(it.k))
    && (ST.set.src === "all" || (ST.set.src === "new" ? !ST.stats[it.c] : inWrong(it.c))));
}
function updatePool() {
  const P = pool(), want = +ST.set.cnt || P.length;
  const btn = $("#startBtn");
  if (!ST.set.subs.length) { $("#poolNote").textContent = "범위를 하나 이상 골라 주세요."; btn.disabled = true; return; }
  if (!ST.set.lv.length) { $("#poolNote").textContent = "구분(중요·일반·지엽)을 하나 이상 골라 주세요."; btn.disabled = true; return; }
  if (!P.length) { $("#poolNote").textContent = ST.set.src === "wrong" ? "이 범위에는 오답노트 문항이 없어요." : ST.set.src === "new" ? "이 범위의 문항은 모두 풀었어요." : "조건에 맞는 문항이 없어요."; btn.disabled = true; return; }
  btn.disabled = false;
  $("#poolNote").textContent = `범위 안 ${P.length}문항 중 ${Math.min(want, P.length)}장${ST.set.one ? " (같은 개념은 한 장만)" : ""}`;
}

/* ---------- 카드 뽑기 ---------- */
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(P, n) {
  const out = [], used = new Set();
  for (const it of shuffle(P)) {
    if (n && out.length >= n) break;
    if (ST.set.one && it.g) { if (used.has(it.g)) continue; used.add(it.g); }
    out.push(it);
  }
  return out;
}
function start(cards) {
  if (!cards.length) return;
  RUN = { cards, i: 0, answers: [], mode: ST.set.mode, locked: false };
  show("play"); renderDeck();
}

/* ---------- 카드 ---------- */
function chipsHtml(it) {
  return `<div class="chips"><span class="chip">${esc(subName(subKey(it.c)))}</span><span class="chip">완자 ${esc(it.p)}</span><span class="chip lv ${esc(it.l)}">${esc(it.l)}</span>` +
    (MARKS.includes(it.k) ? `<span class="chip mk">${esc(it.k)}</span>` : "") +
    (it.b ? `<span class="chip pub">${esc(it.b)} 교과서</span>` : "") + `</div>`;
}
function cardHtml(it, cls) {
  return `<div class="fcard ${cls}"><div class="flip">
    <div class="face front">${chipsHtml(it)}<div class="qtext">${esc(it.q)}</div><div class="qno">${it.c}</div>
      <div class="stamp o">O</div><div class="stamp x">X</div></div>
    <div class="face back"></div></div></div>`;
}
function renderDeck() {
  const { cards, i } = RUN;
  $("#progTxt").textContent = `${i + 1} / ${cards.length}`;
  $("#progBar").style.width = (i / cards.length * 100) + "%";
  $("#deck").innerHTML = (cards[i + 1] ? cardHtml(cards[i + 1], "next") : "") + cardHtml(cards[i], "cur");
  $("#answerBar").hidden = false; $("#nextBar").hidden = true;
  $("#hint").textContent = "카드를 오른쪽으로 밀면 O, 왼쪽으로 밀면 X";
  RUN.locked = false;
  bindSwipe($("#deck .fcard.cur"));
}
function backHtml(it, my, ok) {
  return `<div class="verdict ${ok ? "ok" : "no"}"><div class="vt">${ok ? "맞았어요!" : "틀렸어요"}</div>
    <div class="vs"><span>정답</span><b class="bx ${it.a}">${it.a}</b><span class="sep"></span><span>내 답</span><b class="bx sm ${my}">${my}</b></div></div>
    <div class="q2">${esc(it.q)}</div><div class="ex"><b>해설</b>${esc(it.e)}</div>
    <div class="src">${it.c} · 완자 ${esc(it.p)}${it.b ? " · " + esc(it.b) + " 교과서 내용" : ""}</div>`;
}
function answer(my) {
  if (!RUN || RUN.locked) return;
  RUN.locked = true;
  const it = RUN.cards[RUN.i], ok = my === it.a;
  RUN.answers.push({ c: it.c, my, ok });
  const s = ST.stats[it.c] || (ST.stats[it.c] = { n: 0, ok: 0, w: 0, s: 0 });
  s.n++; if (ok) { s.ok++; s.s++; } else { s.w++; s.s = 0; }
  save();
  const el = $("#deck .fcard.cur");
  if (RUN.mode === "learn") {
    el.style.transition = "transform .25s"; el.style.transform = "";
    el.querySelectorAll(".stamp").forEach(x => x.style.opacity = 0);
    el.querySelector(".back").innerHTML = backHtml(it, my, ok);
    requestAnimationFrame(() => el.classList.add("flipped"));
    $("#answerBar").hidden = true; $("#nextBar").hidden = false;
    $("#hint").textContent = "";
    $("#progBar").style.width = ((RUN.i + 1) / RUN.cards.length * 100) + "%";
    setTimeout(() => $("#nextBtn").focus({ preventScroll: true }), 50);
  } else {
    fly(el, my === "O" ? 1 : -1, next);
  }
}
function fly(el, dir, done) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { done(); return; }
  el.style.transition = "transform .28s ease-in, opacity .28s";
  el.style.transform = `translateX(${dir * 130}vw) rotate(${dir * 18}deg)`;
  el.style.opacity = "0";
  let fired = false; const fin = () => { if (!fired) { fired = true; done(); } };
  el.addEventListener("transitionend", fin, { once: true }); setTimeout(fin, 350);
}
function next() {
  if (!RUN) return;
  RUN.i++;
  if (RUN.i >= RUN.cards.length) { showResult(); return; }
  renderDeck();
}
function goNext() {
  if (!RUN || !RUN.locked) return;
  const el = $("#deck .fcard.cur"), last = RUN.answers[RUN.answers.length - 1];
  fly(el, last && last.my === "O" ? 1 : -1, next);
}

/* ---------- 스와이프 ---------- */
function bindSwipe(el) {
  if (!el) return;
  let x0 = 0, y0 = 0, dx = 0, drag = false, id = null;
  const so = el.querySelector(".stamp.o"), sx = el.querySelector(".stamp.x");
  el.addEventListener("pointerdown", e => {
    if (RUN.locked || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag = true; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = 0;
    el.style.transition = "none";
  });
  el.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== id) return;
    dx = e.clientX - x0; const dy = e.clientY - y0;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { try { el.setPointerCapture(id); } catch (_) { } }
    el.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    so.style.opacity = Math.max(0, Math.min(1, dx / 90));
    sx.style.opacity = Math.max(0, Math.min(1, -dx / 90));
  });
  const end = e => {
    if (!drag || e.pointerId !== id) return; drag = false;
    if (Math.abs(dx) > 90) { answer(dx > 0 ? "O" : "X"); return; }
    el.style.transition = "transform .2s"; el.style.transform = "";
    so.style.opacity = 0; sx.style.opacity = 0;
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

/* ---------- 결과 ---------- */
function showResult() {
  const A = RUN.answers, ok = A.filter(a => a.ok).length;
  show("result");
  $("#scoreN").textContent = ok; $("#scoreT").textContent = A.length;
  $("#scoreRate").textContent = A.length ? `정답률 ${Math.round(ok / A.length * 100)}%` : "";
  $("#resSub").textContent = RUN.mode === "learn" ? "카드마다 해설 보기" : "다 풀고 해설 보기";
  const by = {};
  A.forEach(a => { const k = subKey(a.c); (by[k] || (by[k] = { n: 0, ok: 0 })).n++; if (a.ok) by[k].ok++; });
  $("#bySub").innerHTML = Object.keys(by).sort().map(k => {
    const r = Math.round(by[k].ok / by[k].n * 100);
    return `<div class="sb"><span class="t">${esc(subName(k))}</span><span class="track"><i style="width:${r}%"></i></span><span class="v">${by[k].ok}/${by[k].n}</span></div>`;
  }).join("");
  $("#retryWrong").hidden = ok === A.length;
  $("#onlyWrongList").checked = RUN.mode === "learn" && ok < A.length;
  renderResList();
  window.scrollTo(0, 0);
}
function renderResList() {
  const map = Object.fromEntries(ITEMS.map(it => [it.c, it]));
  const only = $("#onlyWrongList").checked;
  const rows = RUN.answers.map((a, i) => ({ a, i, it: map[a.c] })).filter(r => !only || !r.a.ok);
  $("#resList").innerHTML = rows.length ? rows.map(({ a, i, it }) =>
    `<div class="ri"><div class="ri-h"><span class="mk ${a.ok ? "ok" : "no"}">${i + 1}</span><p>${esc(it.q)}</p></div>
     <div class="ans">정답 <b class="${it.a}">${it.a}</b> · 내 답 <b class="${a.my}">${a.my}</b> · ${it.c} · 완자 ${esc(it.p)}${it.b ? " · " + esc(it.b) + " 교과서" : ""}</div>
     <div class="ex">→ ${esc(it.e)}</div></div>`).join("") : `<div class="empty">모두 맞혔어요!</div>`;
}

/* ---------- 화면 전환 ---------- */
function show(id) {
  ["home", "play", "result"].forEach(s => $("#" + s).hidden = s !== id);
  if (id === "home") { RUN = null; renderStats(); updatePool(); }
}

/* ---------- 기록 백업 ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify({ app: KEY, ST })], { type: "application/json" });
  const u = URL.createObjectURL(blob), l = document.createElement("a");
  l.href = u; l.download = "통합과학2-OX-기록.json"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function importData(file) {
  const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); if (d.app !== KEY || !d.ST) throw 0; ST.set = Object.assign(ST.set, d.ST.set || {}); ST.stats = d.ST.stats || {}; save(); renderTree(); show("home"); alert("기록을 불러왔어요."); } catch (e) { alert("이 앱의 기록 파일이 아니에요."); } };
  r.readAsText(file);
}

/* ---------- 이벤트 ---------- */
function bind() {
  $("#tree").addEventListener("change", e => {
    const t = e.target, sel = new Set(ST.set.subs);
    if (t.dataset.sub) t.checked ? sel.add(t.dataset.sub) : sel.delete(t.dataset.sub);
    if (t.dataset.unit) Object.keys(UNITS.find(u => u.no === t.dataset.unit).subs).forEach(s => t.checked ? sel.add(t.dataset.unit + "-" + s) : sel.delete(t.dataset.unit + "-" + s));
    ST.set.subs = [...sel]; save(); syncTree();
  });
  $("#tree").addEventListener("click", e => {
    const b = e.target.closest(".tg"); if (!b) return;
    const u = b.closest(".unit"); u.classList.toggle("open");
    const open = u.classList.contains("open"); b.setAttribute("aria-expanded", open);
    const s = new Set(ST.set.open); open ? s.add(u.dataset.u) : s.delete(u.dataset.u); ST.set.open = [...s]; save();
  });
  $("#allOn").onclick = () => { ST.set.subs = UNITS.flatMap(u => Object.keys(u.subs).map(s => u.no + "-" + s)); save(); syncTree(); };
  $("#allOff").onclick = () => { ST.set.subs = []; save(); syncTree(); };
  segInit("#srcSeg", "src"); segInit("#cntSeg", "cnt");
  const ci = $("#cntInput"), presets = ["10", "20", "30", "0"];
  ci.value = presets.includes(ST.set.cnt) ? "" : ST.set.cnt;
  ci.addEventListener("input", () => {
    const n = Math.floor(+ci.value);
    if (!ci.value || !(n >= 1)) return;
    ST.set.cnt = String(Math.min(n, 934));
    $("#cntSeg").querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", b.dataset.v === ST.set.cnt));
    save(); updatePool();
  });
  ci.addEventListener("blur", () => { if (!presets.includes(ST.set.cnt)) ci.value = ST.set.cnt; else ci.value = ""; });
  $("#cntSeg").addEventListener("click", () => { ci.value = ""; });
  const lvEl = $("#lvSeg");
  const lvSync = () => lvEl.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", ST.set.lv.includes(b.dataset.v)));
  lvEl.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; const s = new Set(ST.set.lv); s.has(b.dataset.v) ? s.delete(b.dataset.v) : s.add(b.dataset.v); ST.set.lv = LEVELS.filter(x => s.has(x)); lvSync(); save(); updatePool(); });
  lvSync();
  $("#optMark").checked = ST.set.mark; $("#optOne").checked = ST.set.one;
  $("#optMark").onchange = e => { ST.set.mark = e.target.checked; save(); updatePool(); };
  $("#optOne").onchange = e => { ST.set.one = e.target.checked; save(); updatePool(); };
  $("#startBtn").onclick = () => start(pick(pool(), +ST.set.cnt));
  $("#expBtn").onclick = exportData;
  $("#impBtn").onclick = () => $("#impFile").click();
  $("#impFile").onchange = e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ""; };
  $("#resetBtn").onclick = () => { if (confirm("푼 기록과 오답노트를 모두 지울까요? 되돌릴 수 없어요.")) { ST.stats = {}; save(); renderStats(); updatePool(); } };

  document.querySelectorAll(".ans-btn").forEach(b => b.onclick = () => {
    const el = $("#deck .fcard.cur"); const d = b.dataset.ans === "O" ? 1 : -1;
    if (el && !RUN.locked) { el.querySelector(".stamp." + b.dataset.ans.toLowerCase()).style.opacity = 1; el.style.transition = "transform .15s"; el.style.transform = `translateX(${d * 40}px) rotate(${d * 3}deg)`; }
    setTimeout(() => answer(b.dataset.ans), 120);
  });
  $("#nextBtn").onclick = goNext;
  $("#quitBtn").onclick = () => {
    if (RUN && RUN.answers.length && confirm("그만할까요? 지금까지 푼 카드로 결과를 볼게요.")) showResult();
    else if (RUN && !RUN.answers.length) show("home");
  };
  $("#retryWrong").onclick = () => {
    const map = Object.fromEntries(ITEMS.map(it => [it.c, it]));
    const mode = RUN.mode;
    const cards = shuffle(RUN.answers.filter(a => !a.ok).map(a => map[a.c]));
    RUN = null; ST.set.mode = mode; start(cards);
  };
  $("#toHome").onclick = () => show("home");
  $("#onlyWrongList").onchange = renderResList;
  document.addEventListener("keydown", e => {
    if ($("#play").hidden || !RUN) return;
    if (!RUN.locked && e.key === "ArrowRight") answer("O");
    else if (!RUN.locked && e.key === "ArrowLeft") answer("X");
    else if (RUN.locked && RUN.mode === "learn" && (e.key === "Enter" || e.key === " ") && document.activeElement !== $("#nextBtn")) { e.preventDefault(); goNext(); }
  });
}

/* ---------- 시작 ---------- */
load();
fetch("data/items.json").then(r => r.json()).then(d => {
  ITEMS = d; $("#totalN").textContent = d.length;
  renderTree(); bind(); show("home");
}).catch(() => { $("#tree").innerHTML = `<div class="empty">문항을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.</div>`; });

if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
