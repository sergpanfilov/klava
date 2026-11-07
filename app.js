// Klava — тренажёр: вход, план на сегодня, уроки, упражнения, сохранение результатов.
(() => {
  const K = window.KLAVA, C = window.KLAVA_CONFIG;
  const sb = window.supabase && C ? window.supabase.createClient(C.supabaseUrl, C.supabaseKey) : null;
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const DAILY_GOAL_MIN = 15;   // минут чистой печати в день занятия
  const SESSION_MIN = 10;      // день считается занятием от 10 минут
  const WEEK_PLAN = 3;
  const PAUSE_CAP = 5000;      // паузы длиннее 5 с не считаются временем печати

  // ---------- тексты интерфейса ----------
  const T = {
    pl: {
      tagline: "pisanie dziesięcioma palcami", login: "Zaloguj przez Google", logout: "Wyloguj",
      hello: n => n ? `Cześć, ${n}!` : "Cześć!", todayIs: "Dziś ćwiczymy po polsku.", nextTime: "Następnym razem — po rosyjsku.",
      minLbl: "Dzisiaj", week: "Ten tydzień:", weekOf: (a, b) => `${a} z ${b}`,
      cont: l => `Ćwicz: lekcja ${l}`, again: "Powtórka", lessons: "Lekcje po polsku",
      guest: "Ćwiczysz jako gość — wyniki zostają tylko w tej przeglądarce. Zaloguj się, żeby zapisywać postępy.",
      lesson: "Lekcja", back: "← Wszystkie lekcje", start: "Start", enter: "albo Enter",
      ready: "Połóż palce na rzędzie domowym i naciśnij", space: "spacja",
      speed: "znaków/min", errs: "błędów", acc: "dokładność", time: "czas",
      next: "Dalej", nextLesson: "Następna lekcja", toList: "Do listy", repeat: "Jeszcze raz",
      super3: "Super!", good2: "Dobrze!", ok1: "Jest postęp!", lessonDone: "Lekcja skończona!",
      msg3: "Prawie bez błędów. Palce już wiedzą, gdzie mieszkają.",
      msg2: "Kilka pomyłek. Spróbuj trochę wolniej — szybkość przyjdzie sama.",
      msg1: "Nie spiesz się. Lepiej powoli i dokładnie niż szybko z błędami.",
      saved: "Zapisano ✓", savedLater: "Zapiszę, gdy wróci internet.", savedLocal: "Zapisano w tej przeglądarce.",
      look: "Patrz na ekran, nie na klawisze. Klawiatura na dole to ściągawka.", hide: "Schowaj litery", show: "Pokaż litery",
      layoutT: "Masz włączony rosyjski układ klawiatury. Przełącz na polski.",
      layoutS: "Komputer: Win + Spacja albo Alt + Shift. Telefon z klawiaturą: Ctrl + Spacja.",
      caps: "Włączony jest Caps Lock — wyłącz go.", focus: "Kliknij w stronę, żeby znowu pisać.",
      fingers: { lp: "mały palec lewej ręki", lr: "palec serdeczny lewej ręki", lm: "palec środkowy lewej ręki", li: "palec wskazujący lewej ręki",
        rp: "mały palec prawej ręki", rr: "palec serdeczny prawej ręki", rm: "palec środkowy prawej ręki", ri: "palec wskazujący prawej ręki", th: "kciuk — spacja" },
      withShiftL: "+ lewy Shift (mały palec lewej ręki)", withShiftR: "+ prawy Shift (mały palec prawej ręki)", withAltGr: "+ prawy Alt (kciuk prawej ręki)",
      legend: ["mały", "serdeczny", "środkowy", "wskazujący", "kciuk"], spaceKey: "spacja"
    },
    ru: {
      tagline: "печать десятью пальцами", login: "Войти через Google", logout: "Выйти",
      hello: n => n ? `Привет, ${n}!` : "Привет!", todayIs: "Сегодня занимаемся по-русски.", nextTime: "В следующий раз — по-польски.",
      minLbl: "Сегодня", week: "Эта неделя:", weekOf: (a, b) => `${a} из ${b}`,
      cont: l => `Заниматься: урок ${l}`, again: "Повторение", lessons: "Уроки по-русски",
      guest: "Ты занимаешься как гость — результаты остаются только в этом браузере. Войди, чтобы сохранять успехи.",
      lesson: "Урок", back: "← Все уроки", start: "Старт", enter: "или Enter",
      ready: "Положи пальцы на основной ряд и нажми", space: "пробел",
      speed: "знаков/мин", errs: "ошибок", acc: "точность", time: "время",
      next: "Дальше", nextLesson: "Следующий урок", toList: "К списку", repeat: "Ещё раз",
      super3: "Супер!", good2: "Хорошо!", ok1: "Есть прогресс!", lessonDone: "Урок пройден!",
      msg3: "Почти без ошибок. Пальцы уже знают, где живут.",
      msg2: "Немного ошибок. Попробуй чуть медленнее — скорость придёт сама.",
      msg1: "Не торопись. Лучше медленно и точно, чем быстро и с ошибками.",
      saved: "Сохранено ✓", savedLater: "Сохраню, когда появится интернет.", savedLocal: "Сохранено в этом браузере.",
      look: "Смотри на экран, а не на клавиши. Клавиатура внизу — подсказка.", hide: "Спрятать буквы", show: "Показать буквы",
      layoutT: "Сейчас включена латинская раскладка. Переключи на русскую.",
      layoutS: "Компьютер: Win + Пробел или Alt + Shift. Телефон с клавиатурой: Ctrl + Пробел.",
      caps: "Включён Caps Lock — выключи его.", focus: "Нажми на страницу, чтобы снова печатать.",
      fingers: { lp: "мизинец левой руки", lr: "безымянный палец левой руки", lm: "средний палец левой руки", li: "указательный палец левой руки",
        rp: "мизинец правой руки", rr: "безымянный палец правой руки", rm: "средний палец правой руки", ri: "указательный палец правой руки", th: "большой палец — пробел" },
      withShiftL: "+ левый Shift (мизинец левой руки)", withShiftR: "+ правый Shift (мизинец правой руки)", withAltGr: "",
      legend: ["мизинец", "безымянный", "средний", "указательный", "большой"], spaceKey: "пробел"
    }
  };

  // ---------- состояние ----------
  let user = null, nick = null, role = null;
  let results = [];
  let lang = "pl";
  let view = "home", curLesson = 0, curEx = 0, text = "", pos = 0, errors = 0, missAt = new Set();
  let active = 0, lastKey = 0, timer = null, doneAt = 0, playing = false;
  const t = () => T[lang];

  const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const todayKey = () => dayKey(Date.now());
  const weekStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
  const other = l => (l === "pl" ? "ru" : "pl");

  // ---------- данные ----------
  const pendingKey = () => "klava-pending-" + (user ? user.id : "x");
  async function loadResults() {
    if (user && sb) {
      const { data, error } = await sb.from("results")
        .select("lang,lesson,exercise,stars,cpm,accuracy,errors,seconds,created_at")
        .eq("user_id", user.id).order("created_at").limit(10000);
      results = error ? store.get("klava-cache-" + user.id, []) : data;
      if (!error) store.set("klava-cache-" + user.id, data);
      results = results.concat(store.get(pendingKey(), []));
      flushPending();
    } else results = store.get("klava-guest", []);
  }
  async function flushPending() {
    const q = store.get(pendingKey(), []); if (!q.length || !sb || !user) return;
    const rows = q.map(({ created_at, ...r }) => r);
    const { error } = await sb.from("results").insert(rows);
    if (!error) store.set(pendingKey(), []);
  }
  async function saveResult(r) {
    const row = { ...r, created_at: new Date().toISOString() };
    results.push(row);
    if (!user || !sb) { store.set("klava-guest", results); return "local"; }
    const { created_at, ...ins } = row;
    const { error } = await sb.from("results").insert(ins);
    if (error) { const q = store.get(pendingKey(), []); q.push(row); store.set(pendingKey(), q); return "later"; }
    return "ok";
  }

  const bestStars = (l, ls, ex) => results.reduce((m, r) => (r.lang === l && r.lesson === ls + 1 && r.exercise === ex + 1 ? Math.max(m, r.stars) : m), 0);
  const lessonDone = (l, ls) => [0, 1, 2, 3].every(ex => bestStars(l, ls, ex) > 0);
  const nextLesson = l => { const i = K.LESSONS[l].findIndex((_, i) => !lessonDone(l, i)); return i === -1 ? K.LESSONS[l].length - 1 : i; };
  const nextEx = (l, ls) => { const i = [0, 1, 2, 3].findIndex(ex => bestStars(l, ls, ex) === 0); return i === -1 ? 0 : i; };
  function secondsByDay() {
    const m = {}; results.forEach(r => { const k = dayKey(r.created_at); m[k] = (m[k] || 0) + (r.seconds || 0); }); return m;
  }
  function pickLang() {
    const manual = store.get("klava-lang", null);
    if (manual && manual.day === todayKey()) return manual.lang;
    const last = results[results.length - 1];
    if (!last) return manual ? manual.lang : "pl";
    return dayKey(last.created_at) === todayKey() ? last.lang : other(last.lang);
  }

  // ---------- клавиатура ----------
  const keyEls = {}; const fingerEls = [];
  function buildKeyboard() {
    const L = K.LAYOUTS[lang]; const kb = $("kb"); kb.innerHTML = ""; for (const k in keyEls) delete keyEls[k];
    const mk = (row, label, f, w, id, mod) => {
      const el = document.createElement("div");
      el.className = "key f-" + f + (mod ? " mod" : "") + (id === "f" || id === "j" ? " bump" : "");
      if (w) el.style.setProperty("--w", w);
      el.textContent = label; el.dataset.f = f; row.appendChild(el); keyEls[id] = el;
    };
    const rows = [[], [["Tab", "lp", 1.5]], [["Caps", "lp", 1.8]], [["Shift", "lp", 2.3, "ShiftL"]]];
    K.ROWS.forEach((r, ri) => {
      const row = document.createElement("div"); row.className = "row";
      rows[ri].forEach(([lb, f, w, id]) => mk(row, lb, f, w, id || lb, true));
      r.forEach(k => mk(row, L.labels[k] || k, K.FINGER[k], null, k, false));
      if (ri === 0) mk(row, "⌫", "rp", 2, "Backspace", true);
      if (ri === 1) {}
      if (ri === 2) mk(row, "Enter", "rp", 2.2, "Enter", true);
      if (ri === 3) mk(row, "Shift", "rp", 2.7, "ShiftR", true);
      kb.appendChild(row);
    });
    const row = document.createElement("div"); row.className = "row";
    mk(row, "Ctrl", "lp", 1.5, "CtrlL", true); mk(row, "Alt", "th", 1.5, "AltL", true);
    mk(row, t().spaceKey, "th", 7, " ", true); mk(row, "AltGr", "th", 1.5, "AltGr", true); mk(row, "Ctrl", "rp", 1.5, "CtrlR", true);
    kb.appendChild(row);
    if (store.get("klava-hide", false)) kb.classList.add("hide"); else kb.classList.remove("hide");
  }
  function buildHands() {
    const order = { l: ["lp", "lr", "lm", "li", "lt"], r: ["rt", "ri", "rm", "rr", "rp"] };
    const H = { lp: 48, lr: 64, lm: 72, li: 62, ri: 62, rm: 72, rr: 64, rp: 48 };
    ["l", "r"].forEach(s => {
      const el = $(s === "l" ? "handL" : "handR");
      order[s].forEach(f => {
        const d = document.createElement("div"); const th = f === "lt" || f === "rt";
        d.className = "fg f-" + (th ? "th th" : f); if (!th) d.style.height = H[f] + "px";
        d.dataset.f = f; el.appendChild(d); fingerEls.push(d);
      });
    });
  }
  function buildLegend() {
    const cls = ["f-lp", "f-lr", "f-lm", "f-li", "f-th"];
    $("legend").innerHTML = t().legend.map((n, i) => `<span class="${cls[i]}"><i></i>${n}</span>`).join("");
  }
  function showTarget(ch) {
    document.querySelectorAll(".key.target").forEach(k => k.classList.remove("target"));
    fingerEls.forEach(d => d.classList.remove("on"));
    const say = $("say"); say.innerHTML = "";
    if (ch == null) return;
    const m = K.LAYOUTS[lang].map[ch]; if (!m) return;
    const on = f => fingerEls.forEach(d => { if (d.dataset.f === f) d.classList.add("on"); });
    let f;
    if (m.pos === " ") { keyEls[" "].classList.add("target"); on("lt"); on("rt"); f = "th"; }
    else { keyEls[m.pos].classList.add("target"); f = K.FINGER[m.pos]; on(f); }
    let extra = "";
    if (m.shift) { const left = f[0] === "l"; const sk = left ? "ShiftR" : "ShiftL"; keyEls[sk].classList.add("target"); on(left ? "rp" : "lp"); extra += " " + (left ? t().withShiftR : t().withShiftL); }
    if (m.altgr) { keyEls.AltGr.classList.add("target"); on("rt"); extra += " " + t().withAltGr; }
    say.innerHTML = `<i class="f-${f}"></i><span>${t().fingers[f]}${extra}</span>`;
  }
  function flashWrong(ch) {
    const L = K.LAYOUTS[lang]; const m = L.map[ch]; const el = m ? keyEls[m.pos] : null; if (!el) return;
    el.classList.add("wrong"); setTimeout(() => el.classList.remove("wrong"), 220);
  }

  // ---------- экраны ----------
  function show(v) {
    view = v;
    $("vHome").hidden = v !== "home"; $("vLesson").hidden = v !== "lesson";
    $("vPlay").hidden = !(v === "ready" || v === "typing"); $("vDone").hidden = v !== "done";
    $("kbWrap").hidden = !(v === "ready" || v === "typing");
    if (v !== "ready" && v !== "typing") { $("warnFocus").hidden = true; clearInterval(timer); }
    window.scrollTo({ top: 0 });
  }
  function starStr(n, max = 3) { return "<b>" + "★".repeat(n) + "</b>" + "★".repeat(Math.max(0, max - n)); }

  function renderTexts() {
    document.documentElement.lang = lang;
    $("tagline").textContent = t().tagline;
    $("langPl").setAttribute("aria-pressed", lang === "pl"); $("langRu").setAttribute("aria-pressed", lang === "ru");
    $("loginBtn").textContent = t().login; $("logoutBtn").textContent = t().logout;
    $("lsBack").textContent = t().back; $("lsStart").textContent = t().start; $("lsEnter").innerHTML = t().enter.replace("Enter", "<kbd>Enter</kbd>");
    $("sSpeedL").textContent = t().speed; $("sErrL").textContent = t().errs;
    $("rSpeedL").textContent = t().speed; $("rAccL").textContent = t().acc; $("rTimeL").textContent = t().time;
    $("againBtn").textContent = t().repeat; $("lookHint").textContent = t().look;
    $("hideKb").textContent = $("kb").classList.contains("hide") ? t().show : t().hide;
    $("warnLayoutT").textContent = t().layoutT; $("warnLayoutS").textContent = t().layoutS;
    $("warnCaps").textContent = t().caps; $("warnFocus").textContent = t().focus;
    $("guestNote").textContent = t().guest;
    buildLegend();
  }
  function renderAuth() {
    $("loginBtn").hidden = !!user || !sb; $("logoutBtn").hidden = !user;
    $("who").hidden = !user; $("who").textContent = user ? (nick || "") : "";
    $("guestNote").hidden = !!user;
    $("familyLink").hidden = role !== "viewer";
  }
  function renderHome() {
    $("hello").textContent = t().hello(nick);
    const last = results[results.length - 1];
    $("todayLine").textContent = t().todayIs + " " + t().nextTime;
    const byDay = secondsByDay();
    const min = Math.floor((byDay[todayKey()] || 0) / 60);
    $("minLbl").textContent = t().minLbl; $("minVal").textContent = min; $("minGoal").textContent = DAILY_GOAL_MIN;
    $("minBar").style.width = Math.min(100, min / DAILY_GOAL_MIN * 100) + "%";
    const ws = weekStart(); let sessions = 0;
    for (let i = 0; i < 7; i++) { const d = new Date(ws); d.setDate(d.getDate() + i); if ((byDay[dayKey(d)] || 0) >= SESSION_MIN * 60) sessions++; }
    $("week").innerHTML = `<span>${t().week}</span>` + Array.from({ length: Math.max(WEEK_PLAN, sessions) }, (_, i) => `<span class="dot ${i < sessions ? "on" : ""}">${i < sessions ? "✓" : ""}</span>`).join("") + `<span>${t().weekOf(sessions, WEEK_PLAN)}</span>`;
    const nl = nextLesson(lang);
    $("continueBtn").textContent = t().cont(nl + 1);
    $("lessonsH").textContent = t().lessons;
    const box = $("lessons"); box.innerHTML = "";
    K.LESSONS[lang].forEach((ls, i) => {
      const stars = [0, 1, 2, 3].reduce((s, ex) => s + bestStars(lang, i, ex), 0);
      const b = document.createElement("button");
      b.className = "ls" + (i === nl ? " next" : "") + (lessonDone(lang, i) ? " done" : "");
      b.innerHTML = `<span class="num">${i + 1}</span><span class="t">${ls.title}</span><span class="st">${starStr(stars, 12)}</span>`;
      b.addEventListener("click", () => openLesson(i));
      box.appendChild(b);
    });
  }
  function goHome() { show("home"); renderHome(); }

  function openLesson(i) {
    curLesson = i; const ls = K.LESSONS[lang][i];
    $("lsTitle").textContent = `${t().lesson} ${i + 1}. ${ls.title}`;
    $("lsTip").textContent = ls.tip || "";
    const ne = nextEx(lang, i); const list = $("exlist"); list.innerHTML = "";
    K.EX_NAMES[lang].forEach((n, ex) => {
      const b = document.createElement("button"); b.className = "ex" + (ex === ne ? " next" : "");
      b.innerHTML = `<span class="t">${ex + 1}. ${n}</span><span class="st">${starStr(bestStars(lang, i, ex))}</span>`;
      b.addEventListener("click", () => startEx(ex)); list.appendChild(b);
    });
    show("lesson");
  }

  function startEx(ex) {
    curEx = ex; text = K.exerciseText(lang, curLesson, ex);
    pos = 0; errors = 0; missAt = new Set(); active = 0; lastKey = 0;
    const ls = K.LESSONS[lang][curLesson];
    $("exTitle").textContent = `${t().lesson} ${curLesson + 1} · ${K.EX_NAMES[lang][ex]}`;
    $("exTip").textContent = ls.tip || "";
    $("sSpeed").textContent = "–"; $("sErr").textContent = "0"; $("bar").style.width = "0";
    $("ready").innerHTML = `${t().ready} <span class="big">${t().space}</span>`; $("ready").hidden = false;
    const tx = $("text"); tx.innerHTML = "";
    [...text].forEach(c => { const s = document.createElement("span"); s.textContent = c; if (c === " ") s.className = "sp"; tx.appendChild(s); });
    show("ready"); showTarget(" "); paint();
    if (!document.hasFocus()) $("warnFocus").hidden = false;
  }
  function paint() {
    const spans = $("text").children;
    for (let j = 0; j < spans.length; j++) {
      const s = spans[j]; const sp = s.textContent === " ";
      s.className = (sp ? "sp " : "") + (j < pos ? "done" + (missAt.has(j) ? " miss" : "") : j === pos && view === "typing" ? "cur" : "");
    }
    if (view === "typing") showTarget(text[pos]);
    $("bar").style.width = (pos / text.length * 100) + "%";
  }
  const cpm = () => (active > 0 ? Math.round(pos / (active / 60000)) : 0);

  async function finish() {
    clearInterval(timer);
    const acc = Math.round(text.length / (text.length + errors) * 100);
    const speed = cpm(); const secs = Math.max(1, Math.round(active / 1000));
    const stars = acc >= 95 ? 3 : acc >= 85 ? 2 : 1;
    const wasDone = lessonDone(lang, curLesson);
    $("rStars").innerHTML = starStr(stars);
    $("rSpeed").textContent = speed; $("rAcc").textContent = acc + "%";
    $("rTime").textContent = secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : secs + " s";
    $("rMsg").textContent = stars === 3 ? t().msg3 : stars === 2 ? t().msg2 : t().msg1;
    $("saved").textContent = "…";
    doneAt = performance.now();
    show("done");
    const st = await saveResult({ lang, lesson: curLesson + 1, exercise: curEx + 1, cpm: Math.min(speed, 2000), accuracy: acc, errors: Math.min(errors, 10000), seconds: secs, stars });
    $("saved").textContent = st === "ok" ? t().saved : st === "later" ? t().savedLater : t().savedLocal;
    const nowDone = lessonDone(lang, curLesson);
    const lastEx = curEx === 3;
    $("rTitle").textContent = (!wasDone && nowDone) ? t().lessonDone : stars === 3 ? t().super3 : stars === 2 ? t().good2 : t().ok1;
    $("nextBtn").textContent = lastEx ? (curLesson < K.LESSONS[lang].length - 1 ? t().nextLesson : t().toList) : t().next;
    if (stars === 3 || (!wasDone && nowDone)) confetti();
  }
  function goNext() {
    if (curEx < 3) startEx(curEx + 1);
    else if (curLesson < K.LESSONS[lang].length - 1) { openLesson(curLesson + 1); }
    else goHome();
  }

  // ---------- ввод ----------
  const isCyr = c => /[Ѐ-ӿ]/.test(c);
  const isLat = c => /[a-z]/i.test(c);
  document.addEventListener("keydown", e => {
    if (e.metaKey || (e.ctrlKey && !e.altKey)) return;
    const caps = e.getModifierState && e.getModifierState("CapsLock");
    $("warnCaps").hidden = !caps;
    $("warnFocus").hidden = true;
    if (e.key === "Escape") { if (view === "ready" || view === "typing" || view === "done") { e.preventDefault(); openLesson(curLesson); } else if (view === "lesson") goHome(); return; }
    if (view === "home") { if (e.key === "Enter" && !e.target.closest("button")) { e.preventDefault(); openLesson(nextLesson(lang)); } return; }
    if (view === "lesson") { if (e.key === "Enter" && !e.target.closest("button")) { e.preventDefault(); startEx(nextEx(lang, curLesson)); } return; }
    if (view === "done") { if (e.key === "Enter" && performance.now() - doneAt > 600) { e.preventDefault(); goNext(); } return; }
    if (e.key.length !== 1) return;
    e.preventDefault();
    if ((lang === "pl" && isCyr(e.key)) || (lang === "ru" && isLat(e.key))) { $("warnLayout").hidden = false; return; }
    $("warnLayout").hidden = true;
    if (view === "ready") { if (e.key === " ") { $("ready").hidden = true; view = "typing"; paint(); } return; }
    const want = text[pos];
    if (e.key === want) {
      const now = performance.now();
      if (!lastKey) { timer = setInterval(() => { if (pos >= 3) $("sSpeed").textContent = cpm(); }, 700); }
      else active += Math.min(now - lastKey, PAUSE_CAP);
      lastKey = now; pos++;
      if (pos >= text.length) { paint(); finish(); return; }
      paint();
    } else {
      if (caps && e.key.toLowerCase() === want.toLowerCase()) return; // Caps Lock — не ошибка, просто подсказка
      errors++; missAt.add(pos); $("sErr").textContent = errors; flashWrong(e.key);
      const tx = $("text"); tx.classList.remove("shake"); void tx.offsetWidth; tx.classList.add("shake");
    }
  });
  window.addEventListener("blur", () => { if (view === "ready" || view === "typing") $("warnFocus").hidden = false; });
  window.addEventListener("focus", () => { $("warnFocus").hidden = true; });
  document.addEventListener("click", e => { if (e.target.closest("button")) setTimeout(() => document.activeElement && document.activeElement.blur && document.activeElement.blur(), 0); });

  function setLang(l, manual) {
    lang = l; if (manual) store.set("klava-lang", { lang: l, day: todayKey() });
    buildKeyboard(); renderTexts(); goHome();
  }
  $("langPl").addEventListener("click", () => setLang("pl", true));
  $("langRu").addEventListener("click", () => setLang("ru", true));
  $("continueBtn").addEventListener("click", () => openLesson(nextLesson(lang)));
  $("lsBack").addEventListener("click", goHome);
  $("lsStart").addEventListener("click", () => startEx(nextEx(lang, curLesson)));
  $("nextBtn").addEventListener("click", goNext);
  $("againBtn").addEventListener("click", () => startEx(curEx));
  $("hideKb").addEventListener("click", () => { const h = $("kb").classList.toggle("hide"); store.set("klava-hide", h); $("hideKb").textContent = h ? t().show : t().hide; });
  $("loginBtn").addEventListener("click", () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } }));
  $("logoutBtn").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });

  // ---------- конфетти ----------
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = $("confetti"); cv.hidden = false; const ctx = cv.getContext("2d"); const dpr = devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const cols = ["--pinky", "--ring", "--middle", "--index", "--accent"].map(v => cs.getPropertyValue(v).trim());
    const ps = Array.from({ length: 70 }, () => ({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .4, vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2, r: Math.random() * 6, vr: -.1 + Math.random() * .2, c: cols[Math.floor(Math.random() * cols.length)] }));
    const t0 = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-7, -7, 14, 14); ctx.restore(); });
      if (now - t0 < 2200) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, innerWidth, innerHeight); cv.hidden = true; }
    })(t0);
  }

  // ---------- запуск ----------
  async function onUser(u) {
    user = u; nick = null; role = null;
    if (user && sb) {
      const { data } = await sb.from("family").select("nick,role").eq("email", (user.email || "").toLowerCase()).maybeSingle();
      if (data) { nick = data.nick ? data.nick[0].toUpperCase() + data.nick.slice(1) : null; role = data.role; }
      if (!nick) nick = (user.user_metadata && (user.user_metadata.given_name || (user.user_metadata.full_name || "").split(" ")[0])) || null;
    }
    await loadResults();
    lang = pickLang();
    buildKeyboard(); renderTexts(); renderAuth(); goHome();
  }
  buildHands();
  buildKeyboard(); renderTexts(); renderAuth(); goHome();
  if (sb) {
    sb.auth.getSession().then(({ data }) => onUser(data.session ? data.session.user : null));
    sb.auth.onAuthStateChange((ev, session) => { if (ev === "SIGNED_IN" && (!user || user.id !== session.user.id)) onUser(session.user); });
  } else onUser(null);
})();
