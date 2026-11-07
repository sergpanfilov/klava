// Klava — страница для семьи: план занятий, скорость, точность, уроки.
(() => {
  const K = window.KLAVA, C = window.KLAVA_CONFIG;
  const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey);
  const $ = id => document.getElementById(id);
  const SESSION_MIN = 10, WEEK_PLAN = 3;
  const LANG = { pl: "польский", ru: "русский" };
  const SER = [{ id: "pl", name: "Польский", c: "var(--s-pl)" }, { id: "ru", name: "Русский", c: "var(--s-ru)" }];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const fromKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const ddmm = d => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const say = (t) => { $("msg").textContent = t; $("msg").hidden = !t; };

  $("loginBtn").addEventListener("click", () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } }));
  $("logoutBtn").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });

  async function start() {
    const { data: { session } } = await sb.auth.getSession();
    const user = session && session.user;
    $("loginBtn").hidden = !!user; $("logoutBtn").hidden = !user;
    if (!user) { say("Войдите через Google той почтой, которая есть в списке семьи."); return; }
    $("who").hidden = false; $("who").textContent = user.email;
    const me = await sb.from("family").select("role").eq("email", user.email.toLowerCase()).maybeSingle();
    if (!me.data) { say("Эта страница только для семьи. Ваша почта не в списке."); return; }
    const st = await sb.from("family").select("email,nick").eq("role", "student").limit(1).maybeSingle();
    if (!st.data) { say("Не нашёл ученицу в списке семьи."); return; }
    const nick = st.data.nick ? st.data.nick[0].toUpperCase() + st.data.nick.slice(1) : "Ученица";
    const res = await sb.from("results").select("lang,lesson,exercise,stars,cpm,accuracy,errors,seconds,created_at")
      .eq("email", st.data.email).order("created_at").limit(20000);
    if (res.error) { say("Не удалось загрузить результаты: " + res.error.message); return; }
    say(""); $("main").hidden = false;
    render(nick, res.data);
  }

  function render(nick, R) {
    $("title").textContent = `${nick}: как идут занятия`;
    const byDay = {}; const byDayLang = {};
    R.forEach(r => {
      const k = dayKey(r.created_at);
      byDay[k] = (byDay[k] || 0) + r.seconds;
      const kl = k + "|" + r.lang; (byDayLang[kl] = byDayLang[kl] || []).push(r);
    });
    const isSession = k => (byDay[k] || 0) >= SESSION_MIN * 60;

    // неделя
    const mon = monday(new Date()); const today = dayKey(new Date());
    const names = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]; let cnt = 0;
    $("days").innerHTML = names.map((n, i) => {
      const k = dayKey(addDays(mon, i)); const m = Math.floor((byDay[k] || 0) / 60); if (isSession(k)) cnt++;
      return `<div class="day ${isSession(k) ? "hit" : ""} ${k === today ? "today" : ""}">${n}<b>${m}</b>мин</div>`;
    }).join("");
    $("weekPill").innerHTML = cnt >= WEEK_PLAN ? `<span class="pill good">✓ план выполнен: ${cnt} из ${WEEK_PLAN}</span>` : `<span class="pill warn">${cnt} из ${WEEK_PLAN} занятий</span>`;

    // плитки
    const sessions = Object.keys(byDay).filter(isSession).length;
    const totalMin = Math.round(R.reduce((s, r) => s + r.seconds, 0) / 60);
    const passed = l => K.LESSONS[l].filter((_, i) => [1, 2, 3, 4].every(ex => R.some(r => r.lang === l && r.lesson === i + 1 && r.exercise === ex))).length;
    const recent = l => { const xs = R.filter(r => r.lang === l).slice(-12); return xs.length ? Math.round(xs.reduce((s, r) => s + r.cpm, 0) / xs.length) : "–"; };
    $("tiles").innerHTML = [
      [sessions, "занятий всего"], [totalMin, "минут печати всего"],
      [`${passed("pl")} / ${K.LESSONS.pl.length}`, "уроков польского"], [`${passed("ru")} / ${K.LESSONS.ru.length}`, "уроков русского"],
      [recent("pl"), "знаков/мин, польский (последние)"], [recent("ru"), "знаков/мин, русский (последние)"]
    ].map(([v, k]) => `<div class="tile"><span class="v">${v}</span><span class="k">${k}</span></div>`).join("");

    // графики
    const days = [...new Set(R.map(r => dayKey(r.created_at)))].sort().slice(-60);
    const series = f => SER.map(s => ({ ...s, pts: days.map(k => { const xs = byDayLang[k + "|" + s.id]; return xs ? { k, v: Math.round(xs.reduce((a, r) => a + f(r), 0) / xs.length) } : null; }).filter(Boolean) }));
    const lg = SER.map(s => `<span><i style="background:${s.c}"></i>${s.name}</span>`).join("");
    $("lg1").innerHTML = lg; $("lg2").innerHTML = lg;
    chart($("chSpeed"), days, series(r => r.cpm), { unit: "зн/мин", min: 0 });
    chart($("chAcc"), days, series(r => r.accuracy), { unit: "%", min: null, max: 100 });

    // по неделям
    const weeks = []; for (let i = 7; i >= 0; i--) weeks.push(addDays(mon, -7 * i));
    $("weeks").innerHTML = `<tr><th>Неделя</th><th class="n">Занятий</th><th class="n">Минут</th><th>План</th></tr>` +
      weeks.reverse().map(w => {
        let n = 0, s = 0; for (let i = 0; i < 7; i++) { const k = dayKey(addDays(w, i)); s += byDay[k] || 0; if (isSession(k)) n++; }
        const cur = dayKey(w) === dayKey(mon);
        const plan = n >= WEEK_PLAN ? `<span class="pill good">✓ выполнен</span>` : cur ? `<span class="pill warn">идёт неделя</span>` : `<span class="pill warn">не выполнен</span>`;
        return `<tr><td>${ddmm(w)}–${ddmm(addDays(w, 6))}</td><td class="n">${n}</td><td class="n">${Math.round(s / 60)}</td><td>${plan}</td></tr>`;
      }).join("");

    // уроки
    const rows = [];
    ["pl", "ru"].forEach(l => K.LESSONS[l].forEach((ls, i) => {
      const best = [1, 2, 3, 4].map(ex => R.reduce((m, r) => (r.lang === l && r.lesson === i + 1 && r.exercise === ex ? Math.max(m, r.stars) : m), 0));
      const passes = Math.min(...[1, 2, 3, 4].map(ex => R.filter(r => r.lang === l && r.lesson === i + 1 && r.exercise === ex).length));
      const stars = best.reduce((a, b) => a + b, 0); const done = best.every(b => b > 0); const started = best.some(b => b > 0);
      if (!started && !(i === 0 || rows.length < 1)) return;
      rows.push(`<tr><td>${LANG[l]}</td><td class="n">${i + 1}</td><td>${esc(ls.title)}</td><td class="n">${stars} / 12 ★</td><td class="n">${passes}</td><td>${done ? '<span class="pill good">пройден</span>' : started ? "в процессе" : "—"}</td></tr>`);
    }));
    $("lessonsTbl").innerHTML = `<tr><th>Язык</th><th class="n">№</th><th>Урок</th><th class="n">Звёзды</th><th class="n">Пройден раз</th><th>Статус</th></tr>` +
      (rows.length ? rows.join("") : `<tr><td colspan="6" class="muted">Пока ни одного урока.</td></tr>`);

    // последние
    const last = R.slice(-15).reverse();
    $("recent").innerHTML = `<tr><th>Когда</th><th>Язык</th><th>Урок · упр.</th><th class="n">Зн/мин</th><th class="n">Точность</th><th class="n">Звёзды</th></tr>` +
      (last.length ? last.map(r => { const d = new Date(r.created_at);
        return `<tr><td>${ddmm(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}</td><td>${LANG[r.lang]}</td><td>${r.lesson} · ${r.exercise}</td><td class="n">${r.cpm}</td><td class="n">${r.accuracy}%</td><td class="n">${"★".repeat(r.stars)}</td></tr>`; }).join("")
        : `<tr><td colspan="6" class="muted">Пока пусто — появится после первых упражнений.</td></tr>`);
  }

  // Линейный график по дням: две серии, точки, подписи на концах, перекрестие с подсказкой.
  function chart(box, days, series, o) {
    box.innerHTML = "";
    if (!days.length) { box.innerHTML = `<p class="muted small">Пока нет данных — появятся после первых упражнений.</p>`; return; }
    const W = Math.max(300, box.clientWidth || 600), H = 220, pl = 40, pr = 34, pt = 12, pb = 26;
    const vals = series.flatMap(s => s.pts.map(p => p.v));
    let lo = o.min != null ? o.min : Math.max(0, Math.floor((Math.min(...vals) - 5) / 10) * 10);
    let hi = o.max != null ? o.max : Math.max(10, Math.ceil(Math.max(...vals) * 1.1 / 10) * 10);
    if (hi <= lo) hi = lo + 10;
    const step = niceStep((hi - lo) / 4); hi = Math.ceil(hi / step) * step; lo = Math.floor(lo / step) * step;
    const xi = k => days.indexOf(k);
    const X = i => days.length === 1 ? (pl + W - pr) / 2 : pl + i * (W - pl - pr) / (days.length - 1);
    const Y = v => pt + (hi - v) * (H - pt - pb) / (hi - lo);
    let g = "";
    for (let v = lo; v <= hi + 1e-9; v += step) g += `<line class="ax" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
    const every = Math.max(1, Math.ceil(days.length / Math.floor((W - pl - pr) / 54)));
    days.forEach((k, i) => { if (i % every === 0 || i === days.length - 1) g += `<text x="${X(i)}" y="${H - 6}" text-anchor="middle">${ddmm(fromKey(k))}</text>`; });
    series.forEach(s => {
      if (!s.pts.length) return;
      const d = s.pts.map((p, j) => `${j ? "L" : "M"}${X(xi(p.k)).toFixed(1)},${Y(p.v).toFixed(1)}`).join("");
      g += `<path class="ln" d="${d}" style="stroke:${s.c}"/>`;
      s.pts.forEach(p => { g += `<circle cx="${X(xi(p.k))}" cy="${Y(p.v)}" r="4" style="fill:${s.c};stroke:var(--surface);stroke-width:2"/>`; });
      const lp = s.pts[s.pts.length - 1];
      g += `<text x="${X(xi(lp.k)) + 8}" y="${Y(lp.v) + 4}" style="font-weight:800">${s.id.toUpperCase()}</text>`;
    });
    g += `<line class="cross" id="x" y1="${pt}" y2="${H - pb}" visibility="hidden"/><rect x="${pl}" y="0" width="${W - pl - pr}" height="${H}" fill="transparent"/>`;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="График по дням">${g}</svg><div class="tip" hidden></div>`;
    const svg = box.querySelector("svg"), tip = box.querySelector(".tip"), cross = svg.querySelector("#x");
    const move = ev => {
      const r = svg.getBoundingClientRect(); const x = (ev.clientX - r.left) * W / r.width;
      let i = days.length === 1 ? 0 : Math.round((x - pl) / ((W - pl - pr) / (days.length - 1))); i = Math.max(0, Math.min(days.length - 1, i));
      const k = days[i]; cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("visibility", "visible");
      const lines = series.map(s => { const p = s.pts.find(p => p.k === k); return p ? `<div><i style="background:${s.c}"></i>${s.name}: ${p.v} ${o.unit}</div>` : ""; }).join("");
      tip.innerHTML = `<div class="muted">${ddmm(fromKey(k))}</div>${lines || '<div class="muted">нет занятий</div>'}`; tip.hidden = false;
      const px = X(i) * r.width / W; tip.style.left = Math.min(Math.max(0, px + 12), r.width - tip.offsetWidth) + "px"; tip.style.top = "8px";
    };
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerleave", () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
  }
  function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(x))); const m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }

  start();
})();
