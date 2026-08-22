/* ============================================================
   60GDM — interaction layer
   Depends on globals: gsap, ScrollTrigger, Lenis (loaded via CDN)
   All features are guarded so the page still works if one fails.
   ============================================================ */
(function () {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CAN_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  const hasLenis = typeof window.Lenis !== "undefined";

  if (hasST) gsap.registerPlugin(ScrollTrigger);

  const $ = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));

  /* ---------------------------------------------------------
     SMOOTH SCROLL (Lenis)
  --------------------------------------------------------- */
  let lenis = null;
  function initSmoothScroll() {
    if (!hasLenis || REDUCED) return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    if (hasST) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollTo(target) {
    if (lenis) lenis.scrollTo(target, { offset: 0 });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
    else { const el = document.querySelector(target); if (el) el.scrollIntoView({ behavior: "smooth" }); }
  }

  /* ---------------------------------------------------------
     PRELOADER
  --------------------------------------------------------- */
  function initPreloader() {
    const pre = $("#preloader");
    const countEl = $("#preloader-count");
    const barEl = $("#preloader-progress");
    if (!pre) { document.body.classList.remove("is-locked"); revealHero(); return; }

    document.body.classList.add("is-locked");
    const duration = REDUCED ? 0.2 : 1.7;

    const done = () => {
      document.body.classList.remove("is-locked");
      if (hasGSAP && !REDUCED) {
        gsap.to(pre, {
          yPercent: -100, duration: 1, ease: "expo.inOut",
          onComplete: () => { pre.style.display = "none"; },
        });
      } else {
        pre.style.transition = "opacity .5s ease";
        pre.style.opacity = "0";
        setTimeout(() => (pre.style.display = "none"), 500);
      }
      revealHero();
    };

    const state = { v: 0 };
    if (hasGSAP) {
      gsap.to(state, {
        v: 100, duration, ease: "power2.inOut",
        onUpdate: () => {
          const val = Math.round(state.v);
          if (countEl) countEl.textContent = val;
          if (barEl) barEl.style.width = val + "%";
        },
        onComplete: done,
      });
    } else {
      // Fallback: simple interval
      let v = 0;
      const iv = setInterval(() => {
        v += 4;
        if (countEl) countEl.textContent = Math.min(v, 100);
        if (barEl) barEl.style.width = Math.min(v, 100) + "%";
        if (v >= 100) { clearInterval(iv); done(); }
      }, 40);
    }
  }

  /* ---------------------------------------------------------
     HERO INTRO
  --------------------------------------------------------- */
  function revealHero() {
    const bits = [$(".hero__eyebrow"), $(".hero__tag"), $(".hero__actions"), $(".hero__meta--tl"), $(".hero__meta--tr"), $(".hero__scroll")].filter(Boolean);
    if (hasGSAP && !REDUCED) {
      gsap.set(bits, { opacity: 0, y: 24 });
      gsap.to(bits, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: "expo.out", delay: 0.3 });
    } else {
      bits.forEach((b) => { b.style.opacity = 1; b.style.transform = "none"; });
    }
  }

  /* ---------------------------------------------------------
     CUSTOM CURSOR + MAGNETIC
  --------------------------------------------------------- */
  function initCursor() {
    if (!CAN_HOVER) return;
    const ring = $("#cursor");
    const dot = $("#cursor-dot");
    if (!ring || !dot) return;

    let setRingX, setRingY, setDotX, setDotY;
    if (hasGSAP) {
      setRingX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
      setRingY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
      setDotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
      setDotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
    }

    window.addEventListener("mousemove", (e) => {
      if (hasGSAP) { setRingX(e.clientX); setRingY(e.clientY); setDotX(e.clientX); setDotY(e.clientY); }
      else {
        ring.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
        dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      }
    });

    $$("[data-cursor]").forEach((el) => {
      const type = el.getAttribute("data-cursor");
      el.addEventListener("mouseenter", () => {
        ring.classList.toggle("is-hover", type === "hover");
        ring.classList.toggle("is-view", type === "view");
      });
      el.addEventListener("mouseleave", () => { ring.classList.remove("is-hover", "is-view"); });
    });

    // Magnetic
    if (hasGSAP) {
      $$("[data-magnetic]").forEach((el) => {
        const strength = 0.35;
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - (r.left + r.width / 2)) * strength;
          const y = (e.clientY - (r.top + r.height / 2)) * strength;
          gsap.to(el, { x, y, duration: 0.5, ease: "power3" });
        });
        el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" }));
      });
    }
  }

  /* ---------------------------------------------------------
     NAV behaviour
  --------------------------------------------------------- */
  function initNav() {
    const nav = $("#nav");
    if (!nav) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 40);
      if (y > lastY && y > 400) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     MOBILE MENU
  --------------------------------------------------------- */
  function initMenu() {
    const burger = $("#burger");
    const menu = $("#menu");
    if (!burger || !menu) return;
    const toggle = (open) => {
      burger.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("is-locked", open);
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener("click", () => toggle(!menu.classList.contains("is-open")));
    $$("[data-menu-link]").forEach((a) =>
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        toggle(false);
        if (href && href.startsWith("#")) { e.preventDefault(); setTimeout(() => scrollTo(href), 350); }
      })
    );
  }

  /* ---------------------------------------------------------
     ANCHOR links -> smooth scroll
  --------------------------------------------------------- */
  function initAnchors() {
    $$('a[href^="#"]').forEach((a) => {
      if (a.hasAttribute("data-menu-link")) return;
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || href === "#") return;
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        scrollTo(href);
      });
    });
    const top = $("#to-top");
    if (top) top.addEventListener("click", () => scrollTo(0));
  }

  /* ---------------------------------------------------------
     SERVICES accordion
  --------------------------------------------------------- */
  function initServices() {
    const items = $$("[data-svc]");
    items.forEach((item, i) => {
      const row = $(".svc__row", item);
      const open = () => {
        items.forEach((o) => o !== item && o.classList.remove("is-open"));
        item.classList.toggle("is-open");
      };
      if (row) row.addEventListener("click", open);
    });
    if (items[0]) items[0].classList.add("is-open");
  }

  /* ---------------------------------------------------------
     SPLIT TEXT (word reveal)
  --------------------------------------------------------- */
  function splitWords(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const parent = node.parentNode;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((word) => {
        if (word.trim() === "") { frag.appendChild(document.createTextNode(word)); return; }
        const outer = document.createElement("span");
        outer.className = "split-word";
        const inner = document.createElement("span");
        inner.textContent = word;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      parent.replaceChild(frag, node);
    });
    return $$(".split-word > span", el);
  }

  function initReveals() {
    // Split-text targets
    $$("[data-split]").forEach((el) => {
      if (REDUCED) return;
      const inners = splitWords(el);
      inners.forEach((s, i) => {
        s.style.transition = `transform .9s cubic-bezier(0.16,1,0.3,1) ${i * 0.03}s`;
      });
      el._splitInners = inners;
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-in");
        if (el._splitInners) el._splitInners.forEach((s) => (s.style.transform = "translateY(0)"));
        if (el.hasAttribute("data-count")) animateCount(el);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    $$(".reveal-fade, [data-reveal], [data-split], [data-count]").forEach((el) => io.observe(el));
  }

  function animateCount(el) {
    const target = parseFloat(el.getAttribute("data-count")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    if (REDUCED || !hasGSAP) { el.textContent = target + suffix; return; }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 2, ease: "power2.out",
      onUpdate: () => { el.textContent = Math.round(obj.v) + (suffix.startsWith(".") ? "" : suffix); },
      onComplete: () => { el.textContent = target + suffix; },
    });
  }

  /* ---------------------------------------------------------
     SCROLL animations (parallax / marquee direction)
  --------------------------------------------------------- */
  function initScrollFX() {
    if (!hasST || REDUCED) return;
    // Fade the fixed WebGL canvas out as the hero leaves
    const canvas = $("#hero-canvas");
    if (canvas) {
      gsap.to(canvas, {
        opacity: 0.12, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "bottom bottom", end: "bottom top", scrub: true },
      });
    }
  }

  /* ---------------------------------------------------------
     CONTACT FORM -> WhatsApp / Email
  --------------------------------------------------------- */
  function initForm() {
    const form = $("#contact-form");
    if (!form) return;
    const nameEl = $("#f-name"), emailEl = $("#f-email"), msgEl = $("#f-msg");

    const buildText = () => {
      const n = (nameEl.value || "").trim();
      const em = (emailEl.value || "").trim();
      const m = (msgEl.value || "").trim();
      return { n, em, m,
        text: `New enquiry for 60GDM%0A%0AName: ${encodeURIComponent(n)}%0AEmail: ${encodeURIComponent(em)}%0A%0A${encodeURIComponent(m)}` };
    };
    const valid = () => {
      let ok = true;
      [nameEl, emailEl, msgEl].forEach((f) => {
        if (!f.value.trim()) { f.style.borderColor = "#e0645f"; ok = false; }
        else f.style.borderColor = "";
      });
      return ok;
    };

    const send = (mode) => {
      if (!valid()) return;
      const { text, em, n, m } = buildText();
      if (mode === "whatsapp") {
        window.open(`https://wa.me/923333611566?text=${text}`, "_blank", "noopener");
      } else {
        const subject = encodeURIComponent(`New enquiry from ${n}`);
        const body = encodeURIComponent(`Name: ${n}\nEmail: ${em}\n\n${m}`);
        window.location.href = `mailto:the60gdm@gmail.com?subject=${subject}&body=${body}`;
      }
    };

    form.addEventListener("submit", (e) => { e.preventDefault(); send("whatsapp"); });
    $$("[data-send]").forEach((btn) =>
      btn.addEventListener("click", (e) => { e.preventDefault(); send(btn.getAttribute("data-send")); })
    );
  }

  /* ---------------------------------------------------------
     MISC
  --------------------------------------------------------- */
  function initMisc() {
    const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------
     BOOT
  --------------------------------------------------------- */
  function boot() {
    initSmoothScroll();
    initCursor();
    initNav();
    initMenu();
    initAnchors();
    initServices();
    initReveals();
    initScrollFX();
    initForm();
    initMisc();
    initPreloader();
    if (hasST) window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
