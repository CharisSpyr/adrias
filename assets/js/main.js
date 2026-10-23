/* ADRIAS — shared page behaviour */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* years since founding (2004) + current year */
  const year = new Date().getFullYear();
  $$("[data-years]").forEach((el) => (el.textContent = year - 2004));
  $$("[data-year]").forEach((el) => (el.textContent = year));

  /* header */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("solid", window.scrollY > 30 || document.body.classList.contains("menu-open"));
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  const burger = $(".burger");
  if (burger) {
    const setMenu = (open) => {
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open);
      if (header) header.classList.toggle("solid", open || window.scrollY > 30);
    };
    burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    $$(".main-nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  }

  /* reveal on scroll */
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => {
    const sib = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains("reveal")) : [];
    el.style.transitionDelay = Math.min(sib.indexOf(el), 4) * 80 + "ms";
    io.observe(el);
  });

  /* count-up numbers */
  const cio = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, end = parseInt(el.textContent, 10); if (isNaN(end) || reduce) return;
    const t0 = performance.now(), dur = 1400;
    const tick = (now) => { const k = Math.min(1, (now - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  $$(".count").forEach((el) => cio.observe(el));

  /* construction stepper */
  const stepper = $(".stepper");
  if (stepper) {
    const items = $$(".step-list li", stepper), imgs = $$(".step-photo img", stepper);
    const num = $(".step-photo .num", stepper), bar = $(".progress i", stepper);
    let cur = 0, timer, t0;
    function show(i, user) {
      cur = (i + items.length) % items.length;
      items.forEach((li, k) => li.classList.toggle("on", k === cur));
      imgs.forEach((im, k) => im.classList.toggle("on", k === cur));
      if (num) num.textContent = `${cur + 1} / ${items.length}`;
      if (user) clearInterval(timer);
      t0 = performance.now();
    }
    items.forEach((li, k) => $("button", li).addEventListener("click", () => show(k, true)));
    show(0);
    if (!reduce) {
      const DUR = 4200;
      const anim = (now) => {
        if (bar) bar.style.width = Math.min(100, ((now - t0) / DUR) * 100) + "%";
        requestAnimationFrame(anim);
      };
      const sv = new IntersectionObserver((en) => {
        clearInterval(timer);
        if (en[0].isIntersecting) { t0 = performance.now(); timer = setInterval(() => show(cur + 1), DUR); }
      }, { threshold: 0.4 });
      sv.observe(stepper); requestAnimationFrame(anim);
      items.forEach((li) => li.addEventListener("click", () => { clearInterval(timer); if (bar) bar.parentElement.style.visibility = "hidden"; }));
    }
  }

  /* shapes picker */
  const shapeView = $(".shape-view img");
  if (shapeView) {
    $$(".shape-tabs button").forEach((b) => b.addEventListener("click", () => {
      $$(".shape-tabs button").forEach((x) => x.classList.toggle("on", x === b));
      shapeView.classList.add("swap");
      setTimeout(() => { shapeView.src = b.dataset.src; shapeView.alt = b.textContent; shapeView.onload = () => shapeView.classList.remove("swap"); }, 220);
    }));
  }

  /* gallery filters + lightbox */
  const gallery = $(".masonry");
  if (gallery) {
    const figs = $$("figure", gallery);
    $$(".filters button").forEach((b) => b.addEventListener("click", () => {
      $$(".filters button").forEach((x) => x.classList.toggle("on", x === b));
      const f = b.dataset.f;
      figs.forEach((fig) => fig.classList.toggle("hide", f !== "all" && fig.dataset.cat !== f));
    }));
    const lb = $(".lightbox"), lbImg = $(".lightbox img");
    let idx = 0;
    const visibleFigs = () => figs.filter((f) => !f.classList.contains("hide"));
    const open = (fig) => { const v = visibleFigs(); idx = v.indexOf(fig); set(v[idx]); lb.classList.add("open"); document.body.style.overflow = "hidden"; };
    const set = (fig) => { const im = $("img", fig); lbImg.src = im.src; lbImg.alt = im.alt; };
    const close = () => { lb.classList.remove("open"); document.body.style.overflow = ""; };
    const go = (d) => { const v = visibleFigs(); idx = (idx + d + v.length) % v.length; set(v[idx]); };
    figs.forEach((f) => f.addEventListener("click", () => open(f)));
    $(".lb-close").addEventListener("click", close);
    $(".lb-prev").addEventListener("click", (e) => { e.stopPropagation(); go(-1); });
    $(".lb-next").addEventListener("click", (e) => { e.stopPropagation(); go(1); });
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close(); if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1);
    });
  }

  /* HVAC building diagram */
  const dataEl = $("#hvac-data");
  if (dataEl) {
    const data = JSON.parse(dataEl.textContent);
    const panel = $(".info-panel"), list = $(".hot-list");
    const hots = $$(".hot");
    data.forEach((d, i) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = d.short; b.dataset.i = i; list.appendChild(b);
      b.addEventListener("click", () => pick(i));
    });
    function pick(i) {
      const d = data[i];
      hots.forEach((h) => h.classList.toggle("on", +h.dataset.i === i));
      $$("button", list).forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
      panel.innerHTML = `<div class="fade"><span class="k">${d.k}</span><h3>${d.title}</h3><p>${d.text}</p>${d.points ? "<ul>" + d.points.map((p) => `<li>${p}</li>`).join("") + "</ul>" : ""}</div>`;
    }
    hots.forEach((h) => {
      h.addEventListener("click", () => pick(+h.dataset.i));
      h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(+h.dataset.i); } });
    });
    pick(0);
  }

  /* hero canvases */
  if (window.mountWater) $$("canvas[data-water]").forEach((c) => window.mountWater(c, { target: c.closest("[data-fx-target]") || c }));
  if (window.mountAir) $$("canvas[data-air]").forEach((c) => window.mountAir(c, { target: c.closest("[data-fx-target]") || c }));
})();
