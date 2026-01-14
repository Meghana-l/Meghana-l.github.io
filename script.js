// =====================================================
// ONE script to rule them all:
// 1) Theme toggle (dark/light) + persistence
// 2) Page-by-page scroll + keyboard navigation
// 3) Theme-switch safe stabilization (no glitches)
// =====================================================

(() => {
  // ---- Kill any old instance if it exists (prevents duplicates) ----
  if (window.__portfolioController && typeof window.__portfolioController.destroy === "function") {
    window.__portfolioController.destroy();
  }

  // ---------------- THEME ----------------
  const THEME_KEY = "themeMode";

  function applyTheme(mode) {
    document.body.classList.toggle("light", mode === "light");
    localStorage.setItem(THEME_KEY, mode);

    const sw = document.getElementById("themeSwitch");
    if (sw) sw.checked = (mode === "light");

    // after theme swap, stabilize scroll
    stabilizeAfterThemeSwitch();
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved === "light" ? "light" : "dark");

    const sw = document.getElementById("themeSwitch");
    if (!sw) return;

    sw.addEventListener("change", () => {
      applyTheme(sw.checked ? "light" : "dark");
    });
  }

  // ---------------- SCROLL / NAV ----------------
  const HEADER_OFFSET = 80;
  const WHEEL_ACCUM_THRESHOLD = 60;
  const WHEEL_RESET_MS = 140;
  const MAX_LOCK_MS = 900;

  let sections = [];
  let currentIndex = 0;

  let locked = false;
  let lockTimer = null;

  let wheelAccum = 0;
  let wheelResetTimer = null;

  let listenersAttached = false;
  let themeStabilizeTimer = null;

  function getSections() {
    return Array.from(document.querySelectorAll("section[id]"));
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function isOverlayOpen() {
    const viewer = document.getElementById("viewer");
    return viewer && viewer.style.display === "flex";
  }

  function isTyping() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || el.isContentEditable;
  }

  function isInsideScrollable(target) {
    if (!target) return false;

    const projectInfo = target.closest?.(".project-info");
    if (projectInfo && projectInfo.scrollHeight > projectInfo.clientHeight) return true;

    const ta = target.closest?.("textarea");
    if (ta) return true;

    return false;
  }

  function nearestSectionIndex() {
    let bestIdx = 0;
    let bestDist = Infinity;

    sections.forEach((sec, idx) => {
      const rect = sec.getBoundingClientRect();
      const dist = Math.abs(rect.top - HEADER_OFFSET);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });

    return bestIdx;
  }

  function syncState() {
    sections = getSections();
    if (!sections.length) return;
    currentIndex = nearestSectionIndex();
  }

  function clearTimers() {
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = null;

    if (wheelResetTimer) clearTimeout(wheelResetTimer);
    wheelResetTimer = null;
  }

  function lockInput() {
    locked = true;
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = setTimeout(() => {
      locked = false;
    }, MAX_LOCK_MS);
  }

  function unlockInput() {
    locked = false;
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = null;
  }

  function jumpToIndex(idx, behavior = "smooth") {
    if (!sections.length) return;

    currentIndex = nearestSectionIndex();
    currentIndex = clamp(idx, 0, sections.length - 1);

    const targetTop =
      window.scrollY + sections[currentIndex].getBoundingClientRect().top - HEADER_OFFSET;

    lockInput();
    window.scrollTo({ top: targetTop, behavior });

    setTimeout(() => {
      syncState();
      unlockInput();
    }, behavior === "smooth" ? 380 : 140);
  }

  function next() { jumpToIndex(currentIndex + 1, "smooth"); }
  function prev() { jumpToIndex(currentIndex - 1, "smooth"); }

  function onWheel(e) {
    if (isOverlayOpen()) return;
    if (isTyping()) return;
    if (isInsideScrollable(e.target)) return;

    if (locked) {
      e.preventDefault();
      return;
    }

    wheelAccum += e.deltaY;

    if (wheelResetTimer) clearTimeout(wheelResetTimer);
    wheelResetTimer = setTimeout(() => { wheelAccum = 0; }, WHEEL_RESET_MS);

    // don’t block native scroll unless we will navigate
    if (Math.abs(wheelAccum) < WHEEL_ACCUM_THRESHOLD) return;

    e.preventDefault();

    const dir = wheelAccum > 0 ? 1 : -1;
    wheelAccum = 0;

    if (dir === 1) next();
    else prev();
  }

  function onKeyDown(e) {
    if (isOverlayOpen()) return;
    if (isTyping()) return;

    const k = e.key;
    const nextKeys = ["ArrowDown", "PageDown", " "];
    const prevKeys = ["ArrowUp", "PageUp"];

    if (![...nextKeys, ...prevKeys, "Home", "End"].includes(k)) return;

    e.preventDefault();

    if (locked) return;
    if (e.repeat) return;

    if (nextKeys.includes(k)) return next();
    if (prevKeys.includes(k)) return prev();
    if (k === "Home") return jumpToIndex(0, "smooth");
    if (k === "End") return jumpToIndex(sections.length - 1, "smooth");
  }

  function attachListeners() {
    if (listenersAttached) return;
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    listenersAttached = true;
  }

  function detachListeners() {
    if (!listenersAttached) return;
    window.removeEventListener("wheel", onWheel, { passive: false });
    window.removeEventListener("keydown", onKeyDown);
    listenersAttached = false;
  }

  // ✅ Stabilize after theme change (cancel smooth + snap instantly)
  function stabilizeAfterThemeSwitch() {
    if (themeStabilizeTimer) clearTimeout(themeStabilizeTimer);

    themeStabilizeTimer = setTimeout(() => {
      clearTimers();
      wheelAccum = 0;
      unlockInput();

      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }

      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          syncState();
          jumpToIndex(nearestSectionIndex(), "auto");

          setTimeout(() => {
            html.style.scrollBehavior = prevBehavior || "";
            syncState();
            unlockInput();
          }, 220);
        });
      });
    }, 50);
  }

  function initScroll() {
    syncState();
    attachListeners();

    window.addEventListener("resize", syncState);
    window.addEventListener("hashchange", () => setTimeout(syncState, 250));
  }

  function destroy() {
    detachListeners();
    clearTimers();

    window.removeEventListener("resize", syncState);

    if (themeStabilizeTimer) clearTimeout(themeStabilizeTimer);
    themeStabilizeTimer = null;
  }

  window.__portfolioController = { destroy };

  // ---------------- INIT ----------------
  document.addEventListener("DOMContentLoaded", () => {
    initScroll();
    initTheme(); // theme init calls stabilize too
  });
})();
