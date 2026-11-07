// Klava — раскладки, уроки, слова и генератор текстов упражнений.
window.KLAVA = (() => {
  // Палец для каждой физической клавиши (по латинской подписи US/«польской программистской»).
  const FINGER = {
    "`": "lp", "1": "lp", "2": "lr", "3": "lm", "4": "li", "5": "li", "6": "ri", "7": "ri", "8": "rm", "9": "rr", "0": "rp", "-": "rp", "=": "rp",
    q: "lp", w: "lr", e: "lm", r: "li", t: "li", y: "ri", u: "ri", i: "rm", o: "rr", p: "rp", "[": "rp", "]": "rp", "\\": "rp",
    a: "lp", s: "lr", d: "lm", f: "li", g: "li", h: "ri", j: "ri", k: "rm", l: "rr", ";": "rp", "'": "rp",
    z: "lp", x: "lr", c: "lm", v: "li", b: "li", n: "ri", m: "ri", ",": "rm", ".": "rr", "/": "rp"
  };
  const HOME = { lp: "a", lr: "s", lm: "d", li: "f", ri: "j", rm: "k", rr: "l", rp: ";" };
  const ROWS = [
    "` 1 2 3 4 5 6 7 8 9 0 - =".split(" "),
    "q w e r t y u i o p [ ] \\".split(" "),
    "a s d f g h j k l ; '".split(" "),
    "z x c v b n m , . /".split(" ")
  ];

  // ---------- раскладки ----------
  // map: символ -> {pos: физическая клавиша, shift, altgr}
  function makeLayout(id, label, ruMap) {
    const map = {}, labels = {};
    const put = (ch, pos, mods = {}) => { if (!(ch in map)) map[ch] = { pos, shift: !!mods.shift, altgr: !!mods.altgr }; };
    if (id === "pl") {
      ROWS.flat().forEach(k => { labels[k] = k; put(k, k); if (/[a-z]/.test(k)) put(k.toUpperCase(), k, { shift: true }); });
      const PLL = { "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n", "ó": "o", "ś": "s", "ź": "x", "ż": "z" };
      Object.entries(PLL).forEach(([ch, k]) => { put(ch, k, { altgr: true }); put(ch.toUpperCase(), k, { altgr: true, shift: true }); });
      put("!", "1", { shift: true }); put("?", "/", { shift: true }); put(":", ";", { shift: true });
    } else {
      Object.entries(ruMap).forEach(([k, ch]) => { labels[k] = ch; put(ch, k); if (/[а-яё]/.test(ch)) put(ch.toUpperCase(), k, { shift: true }); });
      ROWS.flat().forEach(k => { if (!labels[k]) labels[k] = k; if (!(k in ruMap) && /[0-9\-=]/.test(k)) put(k, k); });
      put(",", "/", { shift: true }); put("!", "1", { shift: true }); put("?", "7", { shift: true }); put(":", "6", { shift: true });
    }
    put(" ", " ");
    return { id, label, map, labels };
  }
  const RU_MAP = {
    "`": "ё", q: "й", w: "ц", e: "у", r: "к", t: "е", y: "н", u: "г", i: "ш", o: "щ", p: "з", "[": "х", "]": "ъ",
    a: "ф", s: "ы", d: "в", f: "а", g: "п", h: "р", j: "о", k: "л", l: "д", ";": "ж", "'": "э",
    z: "я", x: "ч", c: "с", v: "м", b: "и", n: "т", m: "ь", ",": "б", ".": "ю", "/": "."
  };
  const LAYOUTS = { pl: makeLayout("pl", "Polski", null), ru: makeLayout("ru", "Русский", RU_MAP) };

  // ---------- уроки ----------
  // keys — новые символы урока; kind: letters | caps | sentences
  const LESSONS = {
    pl: [
      { keys: "asdfjkl", title: "Rząd domowy" },
      { keys: "gh", title: "G i H" },
      { keys: "ei", title: "E i I" },
      { keys: "ru", title: "R i U" },
      { keys: "ow", title: "O i W" },
      { keys: "ty", title: "T i Y" },
      { keys: "nm", title: "N i M" },
      { keys: "cp", title: "C i P" },
      { keys: "zb", title: "Z i B" },
      { keys: "vxq,.", title: "V, X, Q, przecinek i kropka" },
      { keys: "ąęó", title: "Ą, Ę i Ó", tip: "Prawy Alt (AltGr) + litera. Alt trzyma kciuk prawej ręki." },
      { keys: "łśż", title: "Ł, Ś i Ż", tip: "AltGr + L daje Ł, AltGr + S — Ś, AltGr + Z — Ż." },
      { keys: "ćńź", title: "Ć, Ń i Ź", tip: "AltGr + C, AltGr + N, AltGr + X (tak, X!) daje Ź." },
      { kind: "caps", keys: "", title: "Wielkie litery", tip: "Shift naciska mały palec drugiej ręki: litera po lewej — prawy Shift, po prawej — lewy." },
      { kind: "sentences", keys: "!?", title: "Całe zdania" }
    ],
    ru: [
      { keys: "фываолдж", title: "Основной ряд" },
      { keys: "пр", title: "П и Р" },
      { keys: "ен", title: "Е и Н" },
      { keys: "кг", title: "К и Г" },
      { keys: "мт", title: "М и Т" },
      { keys: "иь", title: "И и Ь" },
      { keys: "уш", title: "У и Ш" },
      { keys: "сб", title: "С и Б" },
      { keys: "яю", title: "Я и Ю" },
      { keys: "цщч", title: "Ц, Щ и Ч" },
      { keys: "йзх", title: "Й, З и Х" },
      { keys: "эъё.", title: "Э, Ъ, Ё и точка" },
      { kind: "caps", keys: "", title: "Заглавные буквы", tip: "Shift нажимает мизинец другой руки: буква слева — правый Shift, справа — левый." },
      { kind: "sentences", keys: ",!?", title: "Целые предложения" }
    ]
  };

  const WORDS = {
    pl: `las sad kasa kask lalka jajka fala sala skala flaga dal lada alfa
gaj hak hala saga gala halka
lis ile dla kij lek list lilia kisiel lekki dziki
ser rak rek kura ruch sukienka rude guzik rura dzieci rekin rzeka kurek fura sukces reguła
okno owca kot dom woda sowa lody kawa wilk worek lato oko ogród
tata kto tak tor ty my wy tydzień to tort teraz kotek lotto
noga mama nos nic nie on ona one mleko miś mówi most ma my noc niebo
cukier park pies piesek pole pora pociąg pomoc piłka czapka cytryna
zebra bal babcia bajka bęben buty brat zabawa zupa zima zamek koza
mój kot dobry dzień zielony ładny pada śnieg góra ręka łąka róża żaba
ćma koń dźwięk źle słoń kość pięć sześć gęś miód mąka książka łódka żółw
szkoła klasa kolega koleżanka ławka zeszyt kredka ołówek plecak lekcja
słońce chmura deszcz wiatr morze rzeka jezioro plaża piasek fala muszla
jabłko gruszka banan truskawka malina wiśnia arbuz marchewka pomidor
kot pies koń krowa świnia kura kaczka gęś owca koza królik chomik papuga
rower piłka lalka klocki gra zabawka balon latawiec hulajnoga
czytam piszę liczę rysuję biegam skaczę pływam tańczę śpiewam gram
dom pokój okno drzwi stół krzesło łóżko szafa lampa dywan obraz
mama tata brat siostra babcia dziadek ciocia wujek rodzina przyjaciel
rano wieczór dzisiaj jutro wczoraj lato zima wiosna jesień tydzień
duży mały nowy stary wesoły smutny szybki wolny ciepły zimny cichy`,
    ru: `два вода дал жал ода лад вал овал лов жало ждал дала вдова
пар рад раз пол пора ровно прав папа пролаз двор дорога правда
ель нет она оно мне все день лето небо нора нож перо фен
кот кора год гора гол нога река рука кино книга ноги долг крот волк
мама там кот тома мост море марка метро мел том тело тепло
мир миг мина пить мать лить жить ночь дочь
ухо утро шар шум шина каша мышь кошка шапка лошадь душа
сад сон сок нос бал бак баба бабушка собака сапог сосна суп снег
я мяч моя юла юбка юг яблоко ягода ястреб янтарь
цирк цвет птица курица щука щенок овощи чай час чашка ночь мяч
йод зайка зима зуб звезда хлеб хор хвост ухо муха храм
эхо это поэт съел ёж ёлка ёжик мёд лёд
кот собака корова лошадь курица утка гусь овца коза кролик хомяк попугай
дом комната окно дверь стол стул кровать шкаф лампа ковёр картина
мама папа брат сестра бабушка дедушка тётя дядя семья друг подруга
школа класс урок тетрадь ручка карандаш рюкзак парта учитель доска
солнце облако дождь ветер море река озеро пляж песок волна ракушка
яблоко груша банан клубника малина вишня арбуз морковь помидор
велосипед мяч кукла кубики игра игрушка шарик змей самокат
читаю пишу считаю рисую бегаю прыгаю плаваю танцую пою играю
утро вечер сегодня завтра вчера лето зима весна осень неделя
большой малый новый старый весёлый грустный быстрый тёплый тихий`
  };
  const SENTENCES = {
    pl: ["Ala ma kota, a kot ma Alę.", "Lubię czytać książki wieczorem.", "Pies biega po zielonej łące.",
      "Mój brat gra w piłkę na podwórku.", "Jutro pojedziemy nad morze.", "W lesie mieszka mądra sowa.",
      "Mama piecze pyszne ciasto.", "Słońce świeci, a ptaki śpiewają.", "Zebra ma czarne i białe paski.",
      "Kto pierwszy, ten lepszy!", "Czy masz ochotę na lody?", "Moja ulubiona pora roku to lato.",
      "Żółw idzie powoli, ale zawsze dochodzi.", "Gęś i kaczka pływają w stawie.", "Dziś piszę szybciej niż wczoraj!"],
    ru: ["Мама мыла раму.", "Кот спит на тёплой печке.", "Летом мы поедем на море.",
      "В лесу живёт мудрая сова.", "Собака бежит по зелёному лугу.", "Я люблю читать книги вечером.",
      "Солнце светит, и птицы поют.", "Кто первый, тот и молодец!", "Хочешь мороженое?",
      "Зима пришла, и выпал снег.", "Мой брат играет в футбол.", "Ёжик несёт яблоко домой.",
      "Черепаха идёт медленно, но верно.", "Сегодня я печатаю быстрее, чем вчера!", "Где живёт белый медведь?"]
  };

  const EX_NAMES = {
    pl: ["Nowe klawisze", "Mieszanka", "Słowa", "Słowa i powtórka"],
    ru: ["Новые клавиши", "Смесь", "Слова", "Слова и повторение"]
  };

  // ---------- помощники ----------
  const rnd = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rnd(arr.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = a => [...new Set(a)];
  const wordsOf = lang => uniq(WORDS[lang].split(/\s+/).filter(Boolean));

  function allowedSet(lang, idx) {
    let s = new Set();
    LESSONS[lang].slice(0, idx + 1).forEach(l => [...l.keys].forEach(c => s.add(c)));
    return s;
  }
  const isLetter = c => /\p{L}/u.test(c);
  function fits(word, set) { return [...word].every(c => set.has(c)); }
  function fill(parts, target) { // склеить части через пробел до нужной длины
    let out = []; let len = 0; let i = 0;
    while (len < target && parts.length) { const p = parts[i % parts.length]; out.push(p); len += p.length + 1; i++; if (i % parts.length === 0) parts = shuffle(parts); }
    return out.join(" ");
  }
  function homeOf(lang, ch) {
    const L = LAYOUTS[lang]; const m = L.map[ch]; if (!m) return null;
    const h = HOME[FINGER[m.pos]]; return h ? L.labels[h] : null;
  }

  // Текст упражнения ex (0..3) урока idx.
  function exerciseText(lang, idx, ex) {
    const lesson = LESSONS[lang][idx];
    const set = allowedSet(lang, idx);
    const newKeys = [...lesson.keys].filter(isLetter);
    const words = wordsOf(lang);

    if (lesson.kind === "sentences") {
      const s = shuffle(SENTENCES[lang]);
      return s.slice(0, ex < 2 ? 2 : 3).join(" ");
    }
    if (lesson.kind === "caps") {
      const ok = shuffle(words.filter(w => fits(w, set))).slice(0, 40);
      const cap = w => w[0].toUpperCase() + w.slice(1);
      if (ex === 0) return fill(ok.slice(0, 12).map(cap), 55);
      if (ex === 1) return fill(ok.map((w, i) => i % 2 ? w : cap(w)), 70);
      return fill(ok.map((w, i) => i % 3 ? w : cap(w)), 90);
    }
    const lettersAllowed = [...set].filter(isLetter);
    if (ex === 0) { // новые клавиши + «домашняя» клавиша того же пальца
      const parts = [];
      newKeys.forEach(k => {
        const h = homeOf(lang, k) || k;
        parts.push(k + k + k, h + k + h, k + h + k);
      });
      if (newKeys.length > 1) for (let i = 0; i < 4; i++) parts.push(shuffle(newKeys).slice(0, 2).join("") + pick(newKeys));
      return fill(shuffle(parts), 50);
    }
    const withNew = words.filter(w => fits(w, set) && newKeys.some(k => w.includes(k)));
    const any = words.filter(w => fits(w, set) && w.length > 1);
    const syll = () => { // слог: новая буква + разрешённые
      const k = pick(newKeys.length ? newKeys : lettersAllowed);
      const n = 2 + rnd(3); const arr = [k];
      while (arr.length < n) arr.push(pick(lettersAllowed));
      return shuffle(arr).join("");
    };
    if (ex === 1) {
      const parts = []; for (let i = 0; i < 16; i++) parts.push(syll());
      shuffle(withNew).slice(0, 4).forEach(w => parts.push(w));
      return fill(shuffle(parts), 65);
    }
    if (ex === 2) {
      const pool = withNew.length >= 5 ? withNew : withNew.concat(Array.from({ length: 8 }, syll));
      return fill(shuffle(pool), 75);
    }
    const pool = any.length >= 8 ? any : any.concat(Array.from({ length: 10 }, syll));
    let text = fill(shuffle(pool), 95);
    if (set.has(",") && set.has(".")) text = text.replace(/ /g, (m, i) => (i % 5 === 3 ? ", " : " ")) + ".";
    return text;
  }

  return { FINGER, HOME, ROWS, LAYOUTS, LESSONS, EX_NAMES, exerciseText, EXERCISES_PER_LESSON: 4 };
})();
