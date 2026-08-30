/* ============================================================
   AUX WING — interactions
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preloader ---------- */
  const preloader = document.querySelector(".preloader");
  // Safety net: if the reveal transition is throttled (background tab,
  // low-power mode), snap the hero title visible after the animation window.
  const settleHero = () => {
    setTimeout(() => {
      document.querySelectorAll(".hero__title .line > span").forEach((s) => {
        s.style.transform = "none";
      });
    }, 2200);
  };
  const finishLoad = () => {
    document.body.classList.add("loaded");
    if (preloader) preloader.classList.add("done");
    try { sessionStorage.setItem("aw-visited", "1"); } catch (e) {}
    settleHero();
  };
  if (preloader) {
    let seen = false;
    try { seen = sessionStorage.getItem("aw-visited") === "1"; } catch (e) {}
    if (reduceMotion || seen) {
      // Skip the ceremony on repeat page views within the session
      preloader.style.display = "none";
      requestAnimationFrame(() => document.body.classList.add("loaded"));
      try { sessionStorage.setItem("aw-visited", "1"); } catch (e) {}
      settleHero();
    } else {
      window.addEventListener("load", () => setTimeout(finishLoad, 1500));
      // Safety: never trap the user behind the preloader
      setTimeout(finishLoad, 3800);
    }
  } else {
    requestAnimationFrame(() => document.body.classList.add("loaded"));
    settleHero();
  }

  /* ---------- Custom cursor ---------- */
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (dot && ring && finePointer && !reduceMotion) {
    let mx = -100, my = -100, rx = -100, ry = -100, raf;
    const move = (e) => {
      mx = e.clientX; my = e.clientY;
      if (!document.body.classList.contains("cursor-on")) {
        document.body.classList.add("cursor-on");
        rx = mx; ry = my;
      }
    };
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move, { passive: true });
    loop();
    const hoverables = "a, button, .btn, input, textarea, select, .proj-card, .svc-row";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverables)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverables)) document.body.classList.remove("cursor-hover");
    });
    document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
  }

  /* ---------- Nav: scrolled state + hide on scroll down ---------- */
  const nav = document.querySelector(".nav");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle("scrolled", y > 30);
      if (y > 420 && y > lastY && !document.body.classList.contains("menu-open")) {
        nav.classList.add("hidden");
      } else {
        nav.classList.remove("hidden");
      }
    }
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Fullscreen menu ---------- */
  const burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.style.overflow = open ? "hidden" : "";
    });
    document.querySelectorAll(".menu a").forEach((a) =>
      a.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
        document.documentElement.style.overflow = "";
      })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
        document.documentElement.style.overflow = "";
      }
    });
  }

  /* ---------- Scroll reveals ---------- */
  const revealEls = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const animate = (el) => {
      const target = parseFloat(el.getAttribute("data-count"));
      const dur = 2000;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        el.firstChild.textContent = Math.round(target * ease(p)).toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(tick);
      };
      if (reduceMotion) { el.firstChild.textContent = target.toLocaleString("en-US"); return; }
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            animate(en.target);
            cio.unobserve(en.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Parallax orbs / hero arc ---------- */
  const pxEls = document.querySelectorAll("[data-px]");
  if (pxEls.length && !reduceMotion) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          pxEls.forEach((el) => {
            const f = parseFloat(el.getAttribute("data-px")) || 0.1;
            el.style.transform = "translateY(" + y * f + "px)";
          });
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnet]").forEach((el) => {
      const strength = 22;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
        const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
        el.style.transform = "translate(" + x + "px," + y + "px)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
        el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ---------- Project filters ---------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  if (filterBtns.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const f = btn.getAttribute("data-filter");
        document.querySelectorAll(".proj-card[data-cat]").forEach((card) => {
          const show = f === "all" || card.getAttribute("data-cat") === f;
          card.classList.toggle("hide", !show);
        });
      });
    });
  }

  /* ---------- Contact form (posts to send.php) ---------- */
  const form = document.getElementById("contact-form");
  if (form) {
    // Some hosts (Bluehost) guard PHP endpoints with a cookie challenge:
    // they answer 409 with a script that sets a cookie and reloads. A static
    // site never picks that cookie up, so satisfy it once and retry.
    function postEnquiry(data, retried) {
      return fetch("send.php", {
        method: "POST",
        body: data,
        credentials: "same-origin"
      }).then(function (res) {
        if (res.status === 409 && !retried) {
          return res.text().then(function (txt) {
            const m = txt.match(/document\.cookie\s*=\s*["']([^"']+)["']/);
            if (m) {
              document.cookie = m[1] + "; path=/";
              return postEnquiry(data, true);
            }
            return { ok: false };
          });
        }
        return res.json().catch(function () { return { ok: false }; });
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const status = form.querySelector(".form-status");
      const btn = form.querySelector('button[type="submit"]');
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const msg = (data.get("message") || "").toString().trim();

      if (!name || !email || !msg) {
        if (status) status.textContent = "Please complete the required fields.";
        return;
      }

      if (btn) btn.disabled = true;
      if (status) status.textContent = "Sending\u2026";

      postEnquiry(data, false)
        .then(function (out) {
          if (out && out.ok) {
            form.reset();
            if (status) status.textContent =
              "Thank you \u2014 your enquiry has been sent. We reply within one business day.";
          } else {
            if (status) status.textContent =
              (out && out.error) || "Something went wrong. Please email info@rti-sa.com directly.";
          }
        })
        .catch(function () {
          if (status) status.textContent =
            "Network error. Please email info@rti-sa.com directly.";
        })
        .finally(function () {
          if (btn) btn.disabled = false;
        });
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
