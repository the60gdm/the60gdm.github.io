/* ============================================================
   60GDM — Enhancement JS
   1) Marketing-icon cursor (replaces the round cursor)
   2) 3D mouse-parallax on the founder portrait
   3) Showreel mute toggle
   ============================================================ */
(function () {
  "use strict";
  var CAN_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lerp = function (a, b, n) { return a + (b - a) * n; };

  /* ---------- 1. ICON CURSOR ---------- */
  function initIconCursor() {
    if (!CAN_HOVER) return;
    // marketing service glyphs (24x24 stroke icons)
    var ICONS = [
      '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/>',            // megaphone
      '<path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="4" width="3" height="13"/>', // bar chart up
      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>', // target
      '<path d="M5 3l14 8-6 2-2 6-6-16z"/>',                                                   // cursor click
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',              // email
      '<path d="M10 3L8 21"/><path d="M16 3l-2 18"/><path d="M3 9h18"/><path d="M2 15h18"/>',   // hashtag
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>' // share
    ];
    var el = document.createElement("div");
    el.id = "cursor-ic";
    el.innerHTML = '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">' + ICONS[0] + "</svg>";
    document.body.appendChild(el);
    var svg = el.firstChild;

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, cx = mx, cy = my;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function raf() {
      cx = lerp(cx, mx, 0.22); cy = lerp(cy, my, 0.22);
      el.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(raf);
    })();

    // reveal + cycle icons
    setTimeout(function () { el.classList.add("show"); }, 400);
    var idx = 0;
    setInterval(function () {
      idx = (idx + 1) % ICONS.length;
      svg.style.opacity = "0";
      setTimeout(function () { svg.innerHTML = ICONS[idx]; svg.style.opacity = "1"; }, 220);
    }, 2400);

    // enlarge over interactive targets
    var big = 'a,button,[data-cursor],[data-magnetic],.svc__row,input,textarea,.reel__mute';
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(big)) el.classList.add("big");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(big) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(big))) el.classList.remove("big");
    });
  }

  /* ---------- 2. PORTRAIT 3D PARALLAX ---------- */
  function initPortraitParallax() {
    if (!CAN_HOVER || REDUCED) return;
    var ph = document.querySelector(".cin-ph");
    if (!ph) return;
    var img = ph.querySelector("img");
    var tx = 0, ty = 0, rx = 0, ry = 0;
    ph.style.transition = "none";

    window.addEventListener("mousemove", function (e) {
      var nx = (e.clientX / window.innerWidth) * 2 - 1;   // -1..1
      var ny = (e.clientY / window.innerHeight) * 2 - 1;
      tx = nx; ty = ny;
    }, { passive: true });

    (function raf() {
      rx = lerp(rx, tx, 0.06); ry = lerp(ry, ty, 0.06);
      ph.style.transform = "rotateY(" + (rx * 7) + "deg) rotateX(" + (-ry * 6) + "deg)";
      if (img) img.style.transform = "translate3d(" + (rx * -16) + "px," + (-ry * 12) + "px,0) scale(1.06)";
      requestAnimationFrame(raf);
    })();
  }

  /* ---------- 3. SHOWREEL MUTE TOGGLE ---------- */
  function initReel() {
    var btn = document.querySelector(".reel__mute");
    var vid = document.querySelector(".reel__frame video");
    if (!btn || !vid) return;
    btn.addEventListener("click", function () {
      vid.muted = !vid.muted;
      btn.textContent = vid.muted ? "🔇" : "🔊";
      if (!vid.muted) vid.play().catch(function () {});
    });
  }

  function boot() { initIconCursor(); initPortraitParallax(); initReel(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
