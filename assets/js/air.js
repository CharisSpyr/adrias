/* ADRIAS — interactive airflow.
   Particles ride a smooth, time-varying flow field: cool supply air enters
   from the left, mixes and warms toward the right. The pointer acts like a
   fan that blows air outward. */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COOL = [60, 200, 230], MID = [235, 240, 250], WARM = [255, 146, 70];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const NB = 20, colors = [];
  for (let i = 0; i < NB; i++) {
    const t = i / (NB - 1);
    const c = t < 0.5 ? mix(COOL, MID, t * 2) : mix(MID, WARM, (t - 0.5) * 2);
    colors.push([`rgba(${c},0.18)`, `rgba(${c},0.85)`]);
  }

  window.mountAir = function (canvas, opts) {
    opts = Object.assign({ density: 900, bg: ["#0d1838", "#1d1530"] }, opts || {});
    const ctx = canvas.getContext("2d");
    let W, H, dpr, P = [], visible = true, t = 0, lastW = 0, lastH = 0;
    const fan = { x: -999, y: -999, on: false, vx: 0, vy: 0 };
    const TR = 18;

    function spawn(p, any) {
      p.x = any || Math.random() < 0.6 ? Math.random() * W : -10;
      p.y = Math.random() * H; p.age = 0; p.life = 160 + Math.random() * 260;
      p.T = Math.min(1, Math.max(0, p.x / W - 0.15 + (Math.random() - 0.5) * 0.25));
      p.tx = [p.x]; p.ty = [p.y];
      return p;
    }
    function setup() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height); lastW = W; lastH = H;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(1600, (W * H) / 1000) * (opts.density / 900));
      P = []; for (let i = 0; i < n; i++) P.push(spawn({}, true));
    }
    function field(x, y) {
      const s = 0.0026;
      const a = Math.sin(x * s * 1.3 + t * 0.006) + Math.sin(y * s * 2.1 - t * 0.004) * 0.9 + Math.sin((x + y) * s * 0.7 + t * 0.003) * 0.6;
      const ang = a * 0.75;
      let u = Math.cos(ang) * 1.1 + 0.55, v = Math.sin(ang) * 1.1;
      if (fan.on) {
        const dx = x - fan.x, dy = y - fan.y, r2 = dx * dx + dy * dy, R = 150;
        if (r2 < R * R * 4) {
          const f = Math.exp(-r2 / (R * R)) * 3.2, r = Math.sqrt(r2) + 1;
          u += (dx / r) * f + fan.vx * 0.06 * f; v += (dy / r) * f + fan.vy * 0.06 * f;
        }
      }
      return [u, v];
    }
    function frame() {
      if (reduce && t > 60) return;
      requestAnimationFrame(frame);
      if (!visible) return;
      t++;
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, opts.bg[0]); g.addColorStop(1, opts.bg[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // soft warm / cool glows
      const rg1 = ctx.createRadialGradient(W * 0.08, H * 0.35, 0, W * 0.08, H * 0.35, W * 0.45);
      rg1.addColorStop(0, "rgba(47,184,201,0.22)"); rg1.addColorStop(1, "rgba(47,184,201,0)");
      ctx.fillStyle = rg1; ctx.fillRect(0, 0, W, H);
      const rg2 = ctx.createRadialGradient(W * 0.92, H * 0.7, 0, W * 0.92, H * 0.7, W * 0.5);
      rg2.addColorStop(0, "rgba(240,138,60,0.22)"); rg2.addColorStop(1, "rgba(240,138,60,0)");
      ctx.fillStyle = rg2; ctx.fillRect(0, 0, W, H);

      const buckets = colors.map(() => []);
      const sp = Math.max(0.9, W / 900);
      for (const p of P) {
        const [u, v] = field(p.x, p.y);
        p.x += u * sp; p.y += v * sp; p.age++;
        p.T = Math.min(1, p.T + 0.0022 + (p.x / W) * 0.0016);
        p.tx.push(p.x); p.ty.push(p.y); if (p.tx.length > TR) { p.tx.shift(); p.ty.shift(); }
        if (p.age > p.life || p.x > W + 20 || p.y < -20 || p.y > H + 20 || p.x < -30) { spawn(p); continue; }
        if (p.tx.length > 2) buckets[Math.round(p.T * (NB - 1))].push(p);
      }
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 1.4;
      for (let c = 0; c < NB; c++) {
        const s = buckets[c]; if (!s.length) continue;
        for (let pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = colors[c][pass]; ctx.beginPath();
          for (const p of s) {
            const n = p.tx.length, mid = n >> 1, a = pass ? mid : 0, b = pass ? n - 1 : mid;
            ctx.moveTo(p.tx[a], p.ty[a]);
            for (let k = a + 1; k <= b; k++) ctx.lineTo(p.tx[k], p.ty[k]);
          }
          ctx.stroke();
        }
      }
      fan.vx *= 0.9; fan.vy *= 0.9;
    }
    const target = opts.target || canvas;
    let last = null;
    target.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (last) { fan.vx = x - last[0]; fan.vy = y - last[1]; }
      last = [x, y]; fan.x = x; fan.y = y; fan.on = true;
    });
    target.addEventListener("pointerleave", () => { fan.on = false; last = null; });
    new IntersectionObserver((en) => (visible = en[0].isIntersecting)).observe(canvas);
    let rt; window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { const r = canvas.getBoundingClientRect(); if (Math.abs(r.width - lastW) > 40 || Math.abs(r.height - lastH) > 140) setup(); }, 250);
    });
    setup();
    frame();
  };
})();
