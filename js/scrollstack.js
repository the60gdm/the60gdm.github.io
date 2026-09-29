/* ============================================================
   60GDM — ScrollStack (vanilla)
   A deck of cards that pin near the top of the viewport and stack
   up with a subtle scale as you scroll. Ported from the React
   "react-bits" ScrollStack to plain JS. Uses the page's own scroll
   (no second smooth-scroll instance), so it rides the existing
   Lenis from main.js. Degrades to a normal spaced list when
   reduced-motion is requested.
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initScrollStack(scroller, opts) {
    opts = opts || {};
    var itemDistance      = opts.itemDistance      != null ? opts.itemDistance      : 24;   // px gap between cards
    var itemScale         = opts.itemScale         != null ? opts.itemScale         : 0.035; // scale added per card
    var itemStackDistance = opts.itemStackDistance != null ? opts.itemStackDistance : 28;   // px offset per stacked card
    var stackPositionPct  = opts.stackPosition     != null ? opts.stackPosition     : 0.15;  // where cards lock (fraction of vh)
    var scaleEndPct       = opts.scaleEndPosition  != null ? opts.scaleEndPosition  : 0.08;  // where scaling completes
    var baseScale         = opts.baseScale         != null ? opts.baseScale         : 0.88;

    var cards = Array.prototype.slice.call(scroller.querySelectorAll(".scroll-stack-card"));
    var endEl = scroller.querySelector(".scroll-stack-end");
    if (!cards.length) return;

    // reduced motion → just space them and bail
    if (REDUCED) { return; }

    var initialTops = [];
    var lastT = [];

    cards.forEach(function (card, i) {
      card.style.zIndex = String(i + 1);
      if (i < cards.length - 1) card.style.marginBottom = itemDistance + "px";
      card.style.willChange = "transform, filter";
      card.style.transformOrigin = "top center";
      card.style.backfaceVisibility = "hidden";
    });

    function measure() {
      // record natural top of each card AFTER margins are applied
      initialTops = cards.map(function (card) {
        // strip any transform so we read the true flow position
        var prev = card.style.transform;
        card.style.transform = "";
        var top = card.getBoundingClientRect().top + window.scrollY;
        card.style.transform = prev;
        return top;
      });
    }

    function clamp01(v, a, b) { if (v < a) return 0; if (v > b) return 1; return (v - a) / (b - a); }

    var ticking = false;
    function update() {
      ticking = false;
      var scrollTop = window.scrollY;
      var vh = window.innerHeight;
      var stackPx = stackPositionPct * vh;
      var scaleEndPx = scaleEndPct * vh;
      var endTop = endEl ? (endEl.getBoundingClientRect().top + window.scrollY) : 0;
      var pinEnd = endTop - vh / 2;

      cards.forEach(function (card, i) {
        var cardTop = initialTops[i] || 0;
        var triggerStart = cardTop - stackPx - itemStackDistance * i;
        var triggerEnd = cardTop - scaleEndPx;
        var pinStart = triggerStart;

        var scaleProgress = clamp01(scrollTop, triggerStart, triggerEnd);
        var targetScale = baseScale + i * itemScale;
        var scale = 1 - scaleProgress * (1 - targetScale);

        var translateY = 0;
        if (scrollTop >= pinStart && scrollTop <= pinEnd) {
          translateY = scrollTop - cardTop + stackPx + itemStackDistance * i;
        } else if (scrollTop > pinEnd) {
          translateY = pinEnd - cardTop + stackPx + itemStackDistance * i;
        }

        translateY = Math.round(translateY * 100) / 100;
        scale = Math.round(scale * 1000) / 1000;

        var last = lastT[i];
        if (!last || Math.abs(last.y - translateY) > 0.1 || Math.abs(last.s - scale) > 0.001) {
          card.style.transform = "translate3d(0," + translateY + "px,0) scale(" + scale + ")";
          lastT[i] = { y: translateY, s: scale };
        }
      });
    }

    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    var resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { lastT = []; measure(); update(); }, 150);
    }

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", function () { measure(); update(); });
    // re-measure a few times while fonts / preloader settle layout
    [400, 900, 1600, 2600].forEach(function (ms) {
      setTimeout(function () { lastT = []; measure(); update(); }, ms);
    });
  }

  function boot() {
    Array.prototype.slice.call(document.querySelectorAll("[data-scroll-stack]")).forEach(function (el) {
      initScrollStack(el, {
        itemDistance: 22, itemScale: 0.035, itemStackDistance: 28,
        stackPosition: 0.15, scaleEndPosition: 0.06, baseScale: 0.88,
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
