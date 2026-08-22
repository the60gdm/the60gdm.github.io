# 60GDM — 3D Portfolio Website

Ek premium, single-page 3D portfolio for **60GDM (Sixty — The Group of Digital Marketing)**.
Liquid-chrome aesthetic, ek **3D "60GDM" logo** jo mouse follow karta hai aur scroll pe rotate/move/scale hota hai (Bee-style), smooth scroll, custom cursor, aur minimal premium copy.

100% free tech — GitHub Pages pe bina kisi cost ke deploy ho jayega.

---

## 📁 File structure

```
60gdm-portfolio/
├── index.html          # saara content + sections
├── css/
│   └── style.css       # poori styling (chrome theme, responsive, dark)
├── js/
│   ├── main.js         # cursor, smooth scroll, reveals, menu, form
│   └── scene.js        # 3D chrome logo (Three.js) + scroll animation
├── assets/
│   ├── favicon.svg     # browser tab icon (60 monogram)
│   └── og-image.svg    # social share card
└── README.md
```

Libraries CDN se load hoti hain (Three.js, GSAP, Lenis) — kuch install karne ki zaroorat nahi.

---

## 🖥️ Locally kaise dekhein

Sirf `index.html` double-click karne se 3D module CDN se load nahi hoga (browser security).
Isliye ek chhota local server chalao:

```bash
cd 60gdm-portfolio
python -m http.server 5757
```

Phir browser mein kholo: `http://localhost:5757`

(Ya `npx serve` bhi chalega agar Node installed hai.)

---

## 🚀 GitHub Pages pe FREE deploy (step by step)

1. **GitHub account** bana lo → https://github.com (free).
2. Naya **repository** banao — naam: `portfolio` (Public rakho).
3. Is `60gdm-portfolio` folder ke **saare files** us repo mein upload karo
   (GitHub website pe "Add file → Upload files" → drag & drop → Commit).
   > ⚠️ `index.html` repo ke **root** mein hona chahiye (folder ke andar nahi).
   > Yaani `index.html`, `css/`, `js/`, `assets/` sab top level pe.
4. Repo → **Settings → Pages**.
5. "Build and deployment" → Source: **Deploy from a branch** → Branch: **main** → **/root** → **Save**.
6. 1–2 minute wait karo. Tumhari site live ho jayegi:
   `https://<tumhara-username>.github.io/portfolio/`

SSL (https) automatically free milta hai. ✅

### Custom domain (optional, ~$10/year)
Settings → Pages → "Custom domain" mein apna domain daalo (e.g. `60gdm.com`) aur domain provider pe DNS point kar do.

---

## ✏️ Customize kaise karein

Sab kuch plain text hai — koi build step nahi. Bas file edit karke re-upload.

| Kya badalna hai | Kahan |
|---|---|
| Headlines / tagline / copy | `index.html` |
| Stats (150+, 40+, 12+…) | `index.html` → `data-count` values **← ye placeholder hain, apne real numbers daalo** |
| Services / sub-services | `index.html` → `.svc` blocks |
| Case studies / work cards | `index.html` → `.work__grid` aur `.work__cases` |
| Email / phone / WhatsApp | `index.html` mein `the60gdm@gmail.com` aur `923333611566` search karo |
| Social links | `index.html` → footer ke `<a href="https://...">` **← generic hain, apne actual IG/FB/LinkedIn URL daalo** |
| Colors / theme | `css/style.css` → top mein `:root` variables |
| 3D logo text ("60GDM") | `js/scene.js` → `new TextGeometry("60GDM", ...)` |
| 3D look (metal/shine/bloom) | `js/scene.js` → `material` values aur `UnrealBloomPass` |

### Work images add karna
Abhi work cards gradient placeholders use karte hain. Real screenshots dikhane ke liye:
1. Apni project images `assets/` mein daalo.
2. `css/style.css` mein `.wcard__media--1` etc. ka `background` badal ke `background-image: url("../assets/your-image.jpg"); background-size: cover;` kar do.

### Contact form ko real banana (optional)
Abhi form "Send via WhatsApp / Email" buttons se pre-filled message kholta hai (zero backend, GitHub Pages pe perfect).
Agar direct inbox mein mail chahiye:
1. https://formspree.io pe free account banao → ek form ID lo.
2. `index.html` mein `<form id="contact-form" ...>` ko `action="https://formspree.io/f/YOUR_ID" method="POST"` de do.

---

## 🎨 Design notes
- **Palette:** near-black `#060606`, platinum text, chrome/silver metallics + subtle iridescence — 60GDM ki black/white/silver branding se match.
- **Fonts:** Syne (display), Instrument Serif (accents), Manrope (body) — Google Fonts se.
- **Accessibility:** `prefers-reduced-motion` respect karta hai (animations off ho jaate hain), keyboard-friendly, semantic HTML.
- **Performance:** 3D mobile pe lighter chalti hai (kam particles, no bloom), tab hidden hone pe render pause.

---

Made with intent for 60GDM. From clicks to conversions. ✦
