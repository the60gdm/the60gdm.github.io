/* ============================================================
   60GDM — Enhancement JS (creative / 3D scroll layer)
   1) Marketing-icon cursor
   2) Floating founder character (mouse parallax + scroll float)
   3) Rotating circular scroll-text badge
   4) 3D floating orbs parallax (scroll + mouse)
   5) Dynamic scroll shade (moving light / shifting darkness)
   ============================================================ */
(function () {
  "use strict";
  var CAN_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lerp = function (a, b, n) { return a + (b - a) * n; };
  var pointer = { x: 0, y: 0 };          // -1..1
  window.addEventListener("mousemove", function (e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------- 1. ICON CURSOR ---------- */
  function initIconCursor() {
    if (!CAN_HOVER) return;
    var ICONS = [
      '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/>',
      '<path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="4" width="3" height="13"/>',
      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
      '<path d="M5 3l14 8-6 2-2 6-6-16z"/>',
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
      '<path d="M10 3L8 21"/><path d="M16 3l-2 18"/><path d="M3 9h18"/><path d="M2 15h18"/>',
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'
    ];
    var el = document.createElement("div");
    el.id = "cursor-ic";
    el.innerHTML = '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">' + ICONS[0] + "</svg>";
    document.body.appendChild(el);
    var svg = el.firstChild;
    var cx = innerWidth / 2, cy = innerHeight / 2, mx = cx, my = cy;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function raf() { cx = lerp(cx, mx, 0.22); cy = lerp(cy, my, 0.22);
      el.style.transform = "translate3d(" + cx + "px," + cy + "px,0)"; requestAnimationFrame(raf); })();
    setTimeout(function () { el.classList.add("show"); }, 400);
    var idx = 0;
    setInterval(function () { idx = (idx + 1) % ICONS.length; svg.style.opacity = "0";
      setTimeout(function () { svg.innerHTML = ICONS[idx]; svg.style.opacity = "1"; }, 220); }, 2400);
    var big = 'a,button,[data-cursor],[data-magnetic],.svc__row,input,textarea,.cin-cap,.cin-card';
    document.addEventListener("mouseover", function (e) { if (e.target.closest(big)) el.classList.add("big"); });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(big) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(big))) el.classList.remove("big");
    });
  }

  /* ---------- 2. FLOATING CHARACTER ---------- */
  function initCharacter() {
    var el = document.querySelector(".cin-char");
    if (!el) return;
    var img = el.querySelector(".cin-char__img");
    var rx = 0, ry = 0, floatY = 0;
    (function raf() {
      // mouse parallax (desktop only)
      if (CAN_HOVER && !REDUCED) { rx = lerp(rx, pointer.x, 0.06); ry = lerp(ry, pointer.y, 0.06); }
      // scroll float: figure drifts up/down as its section moves through the viewport
      if (!REDUCED) {
        var r = el.getBoundingClientRect();
        var prog = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // ~ -1..1
        floatY = lerp(floatY, prog * -60, 0.1);   // up-down "football" travel
      }
      el.style.transform = "translateY(" + floatY.toFixed(2) + "px) rotateY(" + (rx * 8) + "deg) rotateX(" + (-ry * 5) + "deg)";
      if (img) img.style.transform = "translate3d(" + (rx * -14) + "px," + (-ry * 10) + "px,0)";
      requestAnimationFrame(raf);
    })();
  }

  /* ---------- 3. ROTATING SCROLL BADGE ---------- */
  function initBadges() {
    var badges = [].slice.call(document.querySelectorAll(".scroll-badge svg"));
    if (!badges.length) return;
    function upd() { var y = window.scrollY;
      badges.forEach(function (b) { b.style.transform = "rotate(" + (y * 0.12) + "deg)"; }); }
    window.addEventListener("scroll", upd, { passive: true }); upd();
  }

  /* ---------- 4. ORB PARALLAX ---------- */
  function initOrbs() {
    var orbs = [].slice.call(document.querySelectorAll("[data-orb]"));
    if (!orbs.length || REDUCED) return;
    var ox = orbs.map(function () { return 0; });
    function raf() {
      orbs.forEach(function (o, i) {
        var sp = parseFloat(o.getAttribute("data-orb")) || 0.15;
        var r = o.parentElement.getBoundingClientRect();
        var prog = (innerHeight - r.top) * sp;
        ox[i] = lerp(ox[i], prog + pointer.x * sp * 40, 0.08);
        o.style.transform = "translate3d(" + (pointer.x * sp * 30).toFixed(1) + "px," + (-ox[i] * 0.25).toFixed(1) + "px,0)";
      });
      requestAnimationFrame(raf);
    }
    raf();
  }

  /* ---------- 5. DYNAMIC SCROLL SHADE (light / dark shifts) ---------- */
  function initShade() {
    if (REDUCED) return;
    var shade = document.createElement("div");
    shade.id = "scroll-shade";
    document.body.appendChild(shade);
    function upd() {
      var h = document.documentElement.scrollHeight - innerHeight;
      var pr = h > 0 ? window.scrollY / h : 0;             // 0..1
      var inten = 0.5 + 0.5 * Math.sin(pr * Math.PI * 5);  // waves of light
      shade.style.setProperty("--ly", (12 + pr * 76).toFixed(1) + "%");
      shade.style.setProperty("--li", inten.toFixed(3));
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd); upd();
  }

  function boot() { initIconCursor(); initCharacter(); initBadges(); initOrbs(); initShade(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
