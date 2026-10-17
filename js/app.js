/* Storybook — shared functionality for all pages */
(function () {
  "use strict";

  /* ---------- storage ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ } }
  };

  const GENRES = [
    { name: "Romance", emoji: "💌", color: "linear-gradient(135deg,#d6416f,#7a2250)" },
    { name: "Fantasy", emoji: "🐉", color: "linear-gradient(135deg,#7b4fd6,#2e1a66)" },
    { name: "Horror", emoji: "👻", color: "linear-gradient(135deg,#7a2b2b,#1c0d0d)" },
    { name: "Mystery", emoji: "🔍", color: "linear-gradient(135deg,#2f7d9c,#14364a)" },
    { name: "Thriller", emoji: "⚡", color: "linear-gradient(135deg,#3f5a8f,#161f38)" },
    { name: "Science Fiction", emoji: "🚀", color: "linear-gradient(135deg,#17a3a3,#0c3a4a)" },
    { name: "Adventure", emoji: "🧭", color: "linear-gradient(135deg,#e07b25,#7a3b0e)" },
    { name: "Comedy", emoji: "😂", color: "linear-gradient(135deg,#e9b524,#a1620f)" },
    { name: "Drama", emoji: "🎭", color: "linear-gradient(135deg,#2f9c78,#124a3a)" }
  ];

  const books = (window.BOOKS || []).map((b, i) => Object.assign({ order: i + 1 }, b));
  const byId = Object.fromEntries(books.map(b => [b.id, b]));
  const params = new URLSearchParams(location.search);
  const page = document.body.dataset.page;

  const getLikes = () => store.get("sb-likes", []);
  const getSaved = () => store.get("sb-saved", []);
  const getProgress = () => store.get("sb-progress", {});
  const isLiked = id => getLikes().includes(id);
  const isSaved = id => getSaved().includes(id);
  const likeCount = b => b.likes + (isLiked(b.id) ? 1 : 0);

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const coverSrc = b => `images/covers/${b.id}.svg`;
  const sceneSrc = b => `images/scenes/${b.id}.svg`;
  const imgFallback = "this.onerror=null;this.src='images/fallback.svg'";

  /* ---------- theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.textContent = t === "dark" ? "☀️" : "🌙";
      btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }
  const prefersDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  let theme = store.get("sb-theme", prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------- header / footer ---------- */
  function renderChrome() {
    const links = [["index.html", "Home", "home"], ["explore.html", "Explore", "explore"], ["genres.html", "Genres", "genres"], ["about.html", "About", "about"]];
    const header = document.getElementById("site-header");
    if (header) {
      header.innerHTML = `<div class="container nav">
        <a class="logo" href="index.html" aria-label="Storybook home"><span aria-hidden="true">📖</span><span>Story<b>book</b></span></a>
        <nav aria-label="Main navigation">
          <ul class="nav-links" id="nav-links">
            ${links.map(l => `<li><a href="${l[0]}" class="${page === l[2] ? "active" : ""}" ${page === l[2] ? 'aria-current="page"' : ""}>${l[1]}</a></li>`).join("")}
          </ul>
        </nav>
        <div style="display:flex;gap:8px">
          <button class="icon-btn" id="theme-toggle" type="button"></button>
          <button class="icon-btn menu-toggle" id="menu-toggle" type="button" aria-label="Toggle menu" aria-expanded="false">☰</button>
        </div></div>`;
    }
    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML = `<div class="container footer-grid">
        <div><strong class="logo" style="font-size:1.1rem"><span aria-hidden="true">📖</span><span>Story<b>book</b></span></strong>
        <p class="muted">A cozy place to read short stories. School project, ${new Date().getFullYear()}.</p></div>
        <ul>${links.map(l => `<li><a href="${l[0]}">${l[1]}</a></li>`).join("")}</ul></div>`;
    }
    applyTheme(theme);
    document.getElementById("theme-toggle").addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      store.set("sb-theme", theme); applyTheme(theme);
    });
    const mt = document.getElementById("menu-toggle"), nl = document.getElementById("nav-links");
    mt.addEventListener("click", () => {
      const open = nl.classList.toggle("open");
      mt.setAttribute("aria-expanded", open); mt.textContent = open ? "✕" : "☰";
    });
  }

  /* ---------- components ---------- */
  function bookCard(b) {
    const saved = isSaved(b.id);
    return `<article class="book-card">
      <a class="cover" href="book.html?id=${b.id}" aria-label="View details for ${esc(b.title)}">
        <img src="${coverSrc(b)}" alt="Cover of ${esc(b.title)}" loading="lazy" onerror="${imgFallback}"></a>
      <div class="card-body">
        <span class="badge">${esc(b.genre)}</span>
        <h3><a href="book.html?id=${b.id}">${esc(b.title)}</a></h3>
        <p class="author">by ${esc(b.author)}</p>
        <div class="card-actions">
          <a class="btn" href="read.html?id=${b.id}">Read Story</a>
          <button class="save-btn" type="button" data-save="${b.id}" aria-pressed="${saved}" aria-label="${saved ? "Remove bookmark" : "Save"} ${esc(b.title)}" title="${saved ? "Saved" : "Save to library"}">${saved ? "★" : "☆"}</button>
        </div>
      </div></article>`;
  }
  const renderGrid = (el, list) => { el.innerHTML = list.map(bookCard).join(""); };

  /* Global delegated handlers for like / save buttons */
  let onChange = () => {};
  document.addEventListener("click", e => {
    const saveBtn = e.target.closest("[data-save]");
    if (saveBtn) {
      const id = saveBtn.dataset.save, list = getSaved();
      const i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1); else list.push(id);
      store.set("sb-saved", list);
      toast(i >= 0 ? "Removed from your saved books" : "Saved to your library ★");
      syncButtons(); onChange();
    }
    const likeBtn = e.target.closest("[data-like]");
    if (likeBtn) {
      const id = likeBtn.dataset.like, list = getLikes();
      const i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1); else list.push(id);
      store.set("sb-likes", list);
      syncButtons(); onChange();
    }
  });
  function syncButtons() {
    document.querySelectorAll("[data-save]").forEach(btn => {
      const s = isSaved(btn.dataset.save), b = byId[btn.dataset.save];
      btn.setAttribute("aria-pressed", s);
      if (btn.classList.contains("save-btn")) { btn.textContent = s ? "★" : "☆"; btn.setAttribute("aria-label", (s ? "Remove bookmark " : "Save ") + b.title); }
      else btn.textContent = s ? "★ Saved" : "☆ Save";
    });
    document.querySelectorAll("[data-like]").forEach(btn => {
      const b = byId[btn.dataset.like], l = isLiked(b.id);
      btn.setAttribute("aria-pressed", l);
      btn.classList.toggle("active", l);
      btn.innerHTML = `${l ? "❤️" : "🤍"} ${l ? "Liked" : "Like"} · <span>${likeCount(b)}</span>`;
    });
  }

  /* ---------- filtering ---------- */
  function filterBooks({ q = "", genre = "All", sort = "recent", savedOnly = false }) {
    q = q.trim().toLowerCase();
    let list = books.filter(b =>
      (genre === "All" || b.genre === genre) &&
      (!savedOnly || isSaved(b.id)) &&
      (!q || (b.title + " " + b.author + " " + b.genre).toLowerCase().includes(q)));
    const sorters = {
      az: (a, b) => a.title.localeCompare(b.title),
      za: (a, b) => b.title.localeCompare(a.title),
      recent: (a, b) => b.order - a.order,
      popular: (a, b) => likeCount(b) - likeCount(a)
    };
    return list.sort(sorters[sort] || sorters.recent);
  }

  function genreChips(container, active, { link = false, onPick } = {}) {
    const all = ["All"].concat(GENRES.map(g => g.name));
    container.innerHTML = all.map(g => link
      ? `<a class="chip" href="explore.html${g === "All" ? "" : "?genre=" + encodeURIComponent(g)}">${g}</a>`
      : `<button type="button" class="chip" data-genre="${g}" aria-pressed="${g === active}">${g}</button>`).join("");
    if (!link) container.addEventListener("click", e => {
      const c = e.target.closest("[data-genre]"); if (!c) return;
      container.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x === c));
      onPick(c.dataset.genre);
    });
  }

  /* ---------- pages ---------- */
  const pages = {
    home() {
      const feat = byId["b05"] || books[0];
      document.getElementById("hero-feature").innerHTML = `
        <a class="cover" href="book.html?id=${feat.id}"><img src="${coverSrc(feat)}" alt="Cover of ${esc(feat.title)}" onerror="${imgFallback}"></a>
        <div><span class="badge">Featured · ${esc(feat.genre)}</span>
        <h3>${esc(feat.title)}</h3><p class="author">by ${esc(feat.author)}</p>
        <p>${esc(feat.synopsis)}</p>
        <a class="btn" href="read.html?id=${feat.id}">Read Story</a></div>`;
      document.getElementById("hero-search").addEventListener("submit", e => {
        e.preventDefault();
        const q = document.getElementById("hero-q").value.trim();
        location.href = "explore.html" + (q ? "?q=" + encodeURIComponent(q) : "");
      });
      genreChips(document.getElementById("home-chips"), "All", { link: true });
      const featuredIds = ["b01", "b08", "b13", "b18", "b22", "b29"];
      renderGrid(document.getElementById("featured-grid"), featuredIds.map(i => byId[i]).filter(Boolean));
      const rerender = () => {
        renderGrid(document.getElementById("popular-grid"), filterBooks({ sort: "popular" }).slice(0, 6));
        renderGrid(document.getElementById("recent-grid"), filterBooks({ sort: "recent" }).slice(0, 6));
        renderGrid(document.getElementById("featured-grid"), featuredIds.map(i => byId[i]).filter(Boolean));
        // continue reading
        const prog = getProgress();
        const cont = Object.keys(prog).filter(id => byId[id] && prog[id].pct > 2 && prog[id].pct < 99)
          .sort((a, b) => (prog[b].t || 0) - (prog[a].t || 0)).slice(0, 6);
        const sec = document.getElementById("continue-section");
        sec.hidden = !cont.length;
        document.getElementById("continue-grid").innerHTML = cont.map(id => `<article class="book-card">
          <a class="cover" href="read.html?id=${id}"><img src="${coverSrc(byId[id])}" alt="Cover of ${esc(byId[id].title)}" onerror="${imgFallback}"></a>
          <div class="card-body"><h3>${esc(byId[id].title)}</h3><p class="author">${Math.round(prog[id].pct)}% read</p>
          <div class="card-actions"><a class="btn" href="read.html?id=${id}">Continue</a></div></div></article>`).join("");
      };
      onChange = rerender; rerender();
    },

    explore() {
      const state = { q: params.get("q") || "", genre: params.get("genre") || "All", sort: params.get("sort") || "recent", savedOnly: params.get("saved") === "1" };
      if (!["All"].concat(GENRES.map(g => g.name)).includes(state.genre)) state.genre = "All";
      const qEl = document.getElementById("q"), sortEl = document.getElementById("sort"),
        grid = document.getElementById("results"), count = document.getElementById("count"),
        empty = document.getElementById("empty"), savedBtn = document.getElementById("saved-toggle");
      qEl.value = state.q; sortEl.value = state.sort;
      const render = () => {
        const list = filterBooks(state);
        renderGrid(grid, list);
        grid.hidden = !list.length; empty.hidden = !!list.length;
        const parts = [];
        if (state.genre !== "All") parts.push(state.genre);
        if (state.savedOnly) parts.push("saved");
        count.textContent = `Showing ${list.length} of ${books.length} stories${parts.length ? " · " + parts.join(", ") : ""}${state.q ? ` · “${state.q}”` : ""}`;
        const emptyMsg = state.savedOnly && !state.q && state.genre === "All"
          ? ["No saved books yet", "Tap the ☆ on any book to save it here."]
          : ["No books found", "Try a different title, author, or genre, or clear your filters."];
        empty.querySelector("h3").textContent = emptyMsg[0];
        empty.querySelector("p").textContent = emptyMsg[1];
        savedBtn.setAttribute("aria-pressed", state.savedOnly);
        savedBtn.textContent = state.savedOnly ? "★ Saved books" : "☆ Saved books";
        const u = new URLSearchParams();
        if (state.q) u.set("q", state.q);
        if (state.genre !== "All") u.set("genre", state.genre);
        if (state.sort !== "recent") u.set("sort", state.sort);
        if (state.savedOnly) u.set("saved", "1");
        history.replaceState(null, "", u.toString() ? "?" + u : location.pathname);
      };
      genreChips(document.getElementById("genre-chips"), state.genre, { onPick: g => { state.genre = g; render(); } });
      qEl.addEventListener("input", () => { state.q = qEl.value; render(); });
      document.getElementById("search-form").addEventListener("submit", e => e.preventDefault());
      sortEl.addEventListener("change", () => { state.sort = sortEl.value; render(); });
      savedBtn.addEventListener("click", () => { state.savedOnly = !state.savedOnly; render(); });
      document.getElementById("reset").addEventListener("click", () => {
        Object.assign(state, { q: "", genre: "All", savedOnly: false }); qEl.value = "";
        document.querySelectorAll("#genre-chips .chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.genre === "All"));
        render();
      });
      onChange = render; render();
    },

    genres() {
      document.getElementById("genre-tiles").innerHTML = GENRES.map(g => {
        const n = books.filter(b => b.genre === g.name).length;
        return `<a class="genre-tile" style="background:${g.color}" href="explore.html?genre=${encodeURIComponent(g.name)}">
          <span class="emoji" aria-hidden="true">${g.emoji}</span><h3>${g.name}</h3><span>${n} ${n === 1 ? "story" : "stories"}</span></a>`;
      }).join("");
      const rerender = () => {
        const list = books.filter(b => isSaved(b.id));
        document.getElementById("saved-empty").hidden = !!list.length;
        renderGrid(document.getElementById("saved-grid"), list);
      };
      onChange = rerender; rerender();
    },

    book() {
      const b = byId[params.get("id")];
      const root = document.getElementById("book-root");
      if (!b) {
        root.innerHTML = `<div class="empty" style="margin:40px 0"><h3>Book not found</h3><p class="muted">We couldn't find that story.</p><p><a class="btn" href="explore.html">Browse all books</a></p></div>`;
        return;
      }
      document.title = `${b.title} — Storybook`;
      root.innerHTML = `
        <p class="crumbs"><a href="index.html">Home</a> / <a href="explore.html">Explore</a> / <a href="explore.html?genre=${encodeURIComponent(b.genre)}">${esc(b.genre)}</a></p>
        <article class="details">
          <div class="cover"><img src="${coverSrc(b)}" alt="Cover of ${esc(b.title)}" onerror="${imgFallback}"></div>
          <div>
            <span class="badge">${esc(b.genre)}</span>
            <h1>${esc(b.title)}</h1>
            <p class="muted">by <strong>${esc(b.author)}</strong></p>
            <div class="meta"><span><strong>Chapter:</strong> ${esc(b.chapterTitle)}</span><span><strong>Chapters:</strong> 1</span><span><strong>Reading time:</strong> ~${Math.max(2, Math.round(b.story.split(/\s+/).length / 200))} min</span></div>
            <section class="synopsis" aria-labelledby="syn-h">
              <h2 id="syn-h" style="font-size:1.1rem;margin-bottom:6px">Synopsis</h2>
              <p id="syn-text">${esc(b.synopsis)}</p>
              <button type="button" class="link-btn" id="syn-toggle" aria-expanded="true" aria-controls="syn-text">Hide synopsis</button>
            </section>
            <div class="actions">
              <a class="btn" href="read.html?id=${b.id}">📖 Read Story</a>
              <button class="btn outline" type="button" data-like="${b.id}" aria-pressed="false"></button>
              <button class="btn outline" type="button" data-save="${b.id}" aria-pressed="false"></button>
            </div>
            <div class="scene"><img src="${sceneSrc(b)}" alt="Illustration for ${esc(b.title)}" loading="lazy" onerror="${imgFallback}"></div>
          </div>
        </article>
        <section class="section" aria-labelledby="more-h"><div class="section-head"><h2 id="more-h">More in ${esc(b.genre)}</h2></div><div class="book-grid" id="more-grid"></div></section>`;
      const syn = document.getElementById("syn-text"), tg = document.getElementById("syn-toggle");
      tg.addEventListener("click", () => {
        const hidden = syn.hidden = !syn.hidden;
        tg.textContent = hidden ? "Show synopsis" : "Hide synopsis";
        tg.setAttribute("aria-expanded", !hidden);
      });
      const more = books.filter(x => x.genre === b.genre && x.id !== b.id).slice(0, 4);
      const renderMore = () => renderGrid(document.getElementById("more-grid"), more);
      renderMore(); syncButtons();
      onChange = renderMore;
    },

    read() {
      const b = byId[params.get("id")];
      const root = document.getElementById("reader-root");
      if (!b) {
        root.innerHTML = `<div class="empty" style="margin:40px 0"><h3>Story not found</h3><p class="muted">We couldn't find that story.</p><p><a class="btn" href="explore.html">Browse all books</a></p></div>`;
        return;
      }
      document.title = `${b.title} — Reading — Storybook`;
      const paras = b.story.split(/\n\s*\n/).map(p => `<p>${esc(p.trim())}</p>`).join("");
      root.innerHTML = `
        <div class="reader-wrap">
          <header class="reader-top">
            <a class="cover" href="book.html?id=${b.id}"><img src="${coverSrc(b)}" alt="Cover of ${esc(b.title)}" onerror="${imgFallback}"></a>
            <div><span class="badge">${esc(b.genre)}</span><h1>${esc(b.title)}</h1><p class="muted">by ${esc(b.author)}</p></div>
          </header>
          <div class="reader-tools">
            <button class="btn outline small" type="button" id="font-down" aria-label="Decrease text size">A−</button>
            <button class="btn outline small" type="button" id="font-up" aria-label="Increase text size">A+</button>
            <button class="btn outline small" type="button" id="focus-toggle" aria-pressed="false">Focus mode</button>
            <button class="btn outline small" type="button" data-save="${b.id}" aria-pressed="false"></button>
            <span class="progress-label" id="progress-label">0% read</span>
          </div>
          <article id="story-article">
            <h2 class="chapter-title">Chapter 1: ${esc(b.chapterTitle)}</h2>
            <div class="story" id="story">${paras}</div>
            <div class="reader-scene"><img src="${sceneSrc(b)}" alt="Illustration for ${esc(b.title)}" loading="lazy" onerror="${imgFallback}"></div>
            <p class="end-mark" aria-hidden="true">✦ ✦ ✦</p>
            <p class="muted" style="text-align:center">End of Chapter 1 · This book has 1 chapter</p>
          </article>
          <nav class="chapter-nav" aria-label="Chapter navigation">
            <button class="btn outline disabled" type="button" disabled>← Previous Chapter</button>
            <a class="btn outline" href="book.html?id=${b.id}">Back to Book Details</a>
            <button class="btn outline disabled" type="button" disabled>Next Chapter →</button>
          </nav>
        </div>`;
      document.getElementById("progress-bar").hidden = false;

      /* font size */
      let size = store.get("sb-fontsize", 1.2);
      const applySize = () => document.documentElement.style.setProperty("--reader-size", size + "rem");
      applySize();
      document.getElementById("font-up").addEventListener("click", () => { size = Math.min(1.8, +(size + .1).toFixed(2)); store.set("sb-fontsize", size); applySize(); });
      document.getElementById("font-down").addEventListener("click", () => { size = Math.max(.9, +(size - .1).toFixed(2)); store.set("sb-fontsize", size); applySize(); });

      /* focus mode */
      const fb = document.getElementById("focus-toggle");
      fb.addEventListener("click", () => {
        const on = document.body.classList.toggle("focus");
        fb.setAttribute("aria-pressed", on); fb.textContent = on ? "Exit focus mode" : "Focus mode";
      });

      /* progress */
      const art = document.getElementById("story-article"), bar = document.getElementById("progress-bar"), label = document.getElementById("progress-label");
      const calc = () => {
        const top = art.getBoundingClientRect().top + window.scrollY, h = art.offsetHeight;
        const read = window.scrollY + window.innerHeight - top;
        return Math.max(0, Math.min(100, (read / h) * 100));
      };
      let saveTimer;
      const update = () => {
        const pct = calc();
        bar.style.width = pct + "%";
        label.textContent = pct >= 99 ? "✓ Finished" : Math.round(pct) + "% read";
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const p = getProgress();
          p[b.id] = { pct: pct >= 99 ? 100 : pct, scroll: window.scrollY, t: Date.now() };
          store.set("sb-progress", p);
        }, 250);
      };
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      const saved = getProgress()[b.id];
      if (saved && saved.scroll > 200 && saved.pct < 99) {
        window.scrollTo(0, saved.scroll);
        toast("Welcome back! Resuming where you left off.");
      }
      update(); syncButtons();
    },

    about() { /* static page */ }
  };

  /* ---------- init ---------- */
  renderChrome();
  if (pages[page]) pages[page]();
  syncButtons();
})();