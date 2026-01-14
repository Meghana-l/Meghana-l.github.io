// =====================================
// Page-by-page scroll + keyboard control
// Stable across dark/light switching (full re-init on theme change)
// =====================================

(() => {
  const HEADER_OFFSET = 80;

  const WHEEL_ACCUM_THRESHOLD = 60;
  const WHEEL_RESET_MS = 140;

  const SETTLE_CHECK_MS = 80;
  const SETTLE_REQUIRED_STEPS = 4;

  const MAX_LOCK_MS = 1300;

  let sections = [];
  let currentIndex = 0;

  let locked = false;
  let lockTimer = null;

  let wheelAccum = 0;
  let wheelResetTimer = null;

  let settleStopper = null;

  // keep references so we can remove + re-add cleanly
  let listenersAttached = false;

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

  function clearAllTimers() {
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = null;

    if (wheelResetTimer) clearTimeout(wheelResetTimer);
    wheelResetTimer = null;

    if (settleStopper) {
      settleStopper();
      settleStopper = null;
    }
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

  function waitForSettle() {
    let lastY = window.scrollY;
    let stableSteps = 0;
    let cancelled = false;

    settleStopper = () => { cancelled = true; };

    const check = () => {
      if (cancelled) return;

      const y = window.scrollY;

      if (Math.abs(y - lastY) < 1) stableSteps++;
      else stableSteps = 0;

      lastY = y;

      if (stableSteps >= SETTLE_REQUIRED_STEPS) {
        currentIndex = nearestSectionIndex();
        unlockInput();
        settleStopper = null;
        return;
      }

      setTimeout(check, SETTLE_CHECK_MS);
    };

    setTimeout(check, SETTLE_CHECK_MS);
  }

  function scrollToIndex(idx) {
    if (!sections.length) return;

    // Always base from real viewport position
    currentIndex = nearestSectionIndex();
    currentIndex = clamp(idx, 0, sections.length - 1);

    lockInput();
    sections[currentIndex].scrollIntoView({ behavior: "smooth", block: "start" });
    waitForSettle();
  }

  function next() { scrollToIndex(currentIndex + 1); }
  function prev() { scrollToIndex(currentIndex - 1); }

  // ---------- Handlers (must be stable references) ----------
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

    // Don’t block native scroll unless we will navigate
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

    if (k === "Home") return scrollToIndex(0);
    if (k === "End") return scrollToIndex(sections.length - 1);
  }

  // ---------- Attach / Detach ----------
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

  function syncState() {
    sections = getSections();
    if (!sections.length) return;
    currentIndex = nearestSectionIndex();
  }

  function hardReInit() {
    // Full reset so theme switches never poison the state
    detachListeners();
    clearAllTimers();

    locked = false;
    wheelAccum = 0;

    // allow the theme/layout swap to finish, then re-sync + reattach
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncState();
        attachListeners();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    syncState();
    attachListeners();

    // Keep index accurate when navbar hash links are clicked
    window.addEventListener("hashchange", () => {
      setTimeout(() => { syncState(); }, 350);
    });

    window.addEventListener("resize", () => {
      syncState();
    });

    // ✅ Re-init whenever theme class changes
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "class") {
          hardReInit();
          break;
        }
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    // Extra safety: re-init on toggle change too
    const sw = document.getElementById("themeSwitch");
    if (sw) sw.addEventListener("change", hardReInit);
  });
})();
