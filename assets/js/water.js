/* ADRIAS — interactive pool water.
   A 2-D wave-equation height field refracts a procedural mosaic-tile floor,
   with a specular highlight from the surface slope. Move / tap to make ripples. */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function makeFloor(w, h, cell) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    // deep → light aqua gradient
    const grd = g.createLinearGradient(0, 0, w * 0.4, h);
    grd.addColorStop(0, "#5fd0f2"); grd.addColorStop(0.55, "#2aa7e0"); grd.addColorStop(1, "#1d6fb8");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // mosaic tiles
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const v = Math.random();
        g.fillStyle = v < 0.08 ? "rgba(255,255,255,0.13)" : v < 0.2 ? "rgba(10,60,120,0.10)" : "rgba(255,255,255,0.03)";
        g.fillRect(x + 0.6, y + 0.6, cell - 1.2, cell - 1.2);
      }
    }
    // grout
    g.strokeStyle = "rgba(220,245,255,0.28)"; g.lineWidth = 0.6;
    g.beginPath();
    for (let x = 0; x <= w; x += cell) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); }
    for (let y = 0; y <= h; y += cell) { g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); }
    g.stroke();
    // lane stripes (dark mosaic band), like a real pool floor
    g.fillStyle = "rgba(16, 40, 100, 0.16)";
    const lanes = Math.max(2, Math.round(h / (cell * 9)));
    for (let i = 1; i < lanes; i++) {
      const y = Math.round((h * i) / lanes / cell) * cell;
      g.fillRect(cell * 3, y, w - cell * 6, cell);
      g.fillRect(cell * 3, y - cell, cell, cell * 3);
    }
    return g.getImageData(0, 0, w, h).data;
  }

  window.mountWater = function (canvas, opts) {
    opts = Object.assign({ scale: 3, drops: true }, opts || {});
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas"), octx = off.getContext("2d");
    let W, H, w, h, A, B, tex, img, visible = true, raf, t = 0;
    const pointer = { x: -1, y: -1, px: -1, py: -1, on: false };

    function setup() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      const sc = W < 700 ? Math.max(2, opts.scale - 1) : opts.scale;
      w = Math.ceil(W / sc); h = Math.ceil(H / sc);
      off.width = w; off.height = h;
      A = new Float32Array(w * h); B = new Float32Array(w * h);
      tex = makeFloor(w, h, Math.max(5, Math.round(26 / sc)));
      img = octx.createImageData(w, h);
      // seed a few ripples so the first frame already moves
      for (let i = 0; i < 6; i++) drop(Math.random() * w, Math.random() * h, 3, 260);
    }

    function drop(x, y, r, s) {
      x = x | 0; y = y | 0;
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        const xx = x + i, yy = y + j;
        if (xx < 1 || yy < 1 || xx >= w - 1 || yy >= h - 1) continue;
        const d = Math.sqrt(i * i + j * j); if (d > r) continue;
        A[yy * w + xx] += s * (Math.cos((d / r) * Math.PI) + 1) * 0.5;
      }
    }

    function step() {
      for (let y = 1; y < h - 1; y++) {
        let i = y * w + 1;
        for (let x = 1; x < w - 1; x++, i++) {
          const v = (A[i - 1] + A[i + 1] + A[i - w] + A[i + w]) * 0.5 - B[i];
          B[i] = v * 0.984;
        }
      }
      const tmp = A; A = B; B = tmp;
    }

    function render() {
      const d = img.data;
      for (let y = 1; y < h - 1; y++) {
        let i = y * w + 1;
        for (let x = 1; x < w - 1; x++, i++) {
          const dx = A[i - 1] - A[i + 1], dy = A[i - w] - A[i + w];
          let sx = (x + (dx * 0.09)) | 0, sy = (y + (dy * 0.09)) | 0;
          if (sx < 0) sx = 0; else if (sx >= w) sx = w - 1;
          if (sy < 0) sy = 0; else if (sy >= h) sy = h - 1;
          const ti = (sy * w + sx) * 4, o = i * 4;
          const light = (dx + dy) * 0.22;
          const spec = light > 6 ? (light - 6) * 2.2 : 0;
          d[o] = tex[ti] + light + spec;
          d[o + 1] = tex[ti + 1] + light + spec;
          d[o + 2] = tex[ti + 2] + light * 0.7 + spec;
          d[o + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 1, 1, w - 2, h - 2, 0, 0, canvas.width, canvas.height);
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      t++;
      if (opts.drops && t % 22 === 0) drop(Math.random() * w, Math.random() * h, 2 + (Math.random() * 3) | 0, 120 + Math.random() * 220);
      // a gentle "breeze" that keeps caustics alive
      const bx = (Math.sin(t * 0.004) * 0.45 + 0.5) * w, by = (Math.cos(t * 0.0031) * 0.4 + 0.5) * h;
      if (t % 3 === 0) drop(bx, by, 2, 26);
      if (pointer.on && pointer.px >= 0) {
        const dist = Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py);
        const n = Math.min(6, Math.ceil(dist / 3));
        for (let k = 1; k <= n; k++) drop(pointer.px + ((pointer.x - pointer.px) * k) / n, pointer.py + ((pointer.y - pointer.py) * k) / n, 3, 60);
      }
      pointer.px = pointer.x; pointer.py = pointer.y;
      step(); render();
    }

    function toSim(e) {
      const r = canvas.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * w, ((e.clientY - r.top) / r.height) * h];
    }
    const target = opts.target || canvas;
    target.addEventListener("pointermove", (e) => { const [x, y] = toSim(e); pointer.x = x; pointer.y = y; if (!pointer.on) { pointer.px = x; pointer.py = y; } pointer.on = true; });
    target.addEventListener("pointerleave", () => { pointer.on = false; pointer.px = -1; });
    target.addEventListener("pointerdown", (e) => { const [x, y] = toSim(e); drop(x, y, 6, 700); });

    new IntersectionObserver((en) => (visible = en[0].isIntersecting)).observe(canvas);
    let rt; window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { const r = canvas.getBoundingClientRect(); if (Math.abs(r.width - W) > 40 || Math.abs(r.height - H) > 140) setup(); }, 250);
    });
    setup();
    if (reduce) { for (let i = 0; i < 30; i++) step(); render(); return; }
    frame();
  };
})();
