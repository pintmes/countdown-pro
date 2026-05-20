/* Countdown Pro — storefront runtime.
 *
 * Renders the live countdown in every `[data-cdp-block]` element on the page.
 * Two configuration sources are supported, in priority order:
 *   1. A timer name (data-cdp-timer-name) which is resolved server-side against
 *      timers configured in the Countdown Pro admin via /api/timers.
 *   2. Inline block settings (data-cdp-type, data-cdp-ends-at, etc.) as a
 *      fallback for merchants who don't want a server-managed timer.
 *
 * Three timer modes:
 *   - flash_sale: count down to a fixed Date.
 *   - evergreen:  per-visitor countdown of N seconds, persisted in localStorage.
 *   - daily:      resets at midnight (visitor's local timezone).
 *
 * No external dependencies. Vanilla JS, runs on every modern browser.
 */
(function () {
  "use strict";

  var APP_URL_META = document.querySelector('meta[name="cdp-app-url"]');
  // If the merchant or theme dev exposes the app's URL via a meta tag we'll
  // use it; otherwise we fall back to the conventional `app-proxy` route on
  // the shop's own domain (which Shopify proxies to the app server).
  var DEFAULT_API_URL =
    (APP_URL_META && APP_URL_META.content ? APP_URL_META.content : "") +
    "/api/timers";

  var EVERGREEN_KEY_PREFIX = "cdp.evergreen.";

  function pad2(n) {
    n = Math.max(0, Math.floor(n));
    return n < 10 ? "0" + n : "" + n;
  }

  function computeTargetMs(config) {
    var now = Date.now();
    if (config.type === "flash_sale") {
      if (!config.endsAt) return null;
      var ms =
        typeof config.endsAt === "number"
          ? config.endsAt
          : Date.parse(config.endsAt);
      if (isNaN(ms)) return null;
      return ms;
    }
    if (config.type === "evergreen") {
      var dur = (config.durationSeconds || 0) * 1000;
      if (dur <= 0) return null;
      var key = EVERGREEN_KEY_PREFIX + (config.id || config.name || "default");
      var stored = null;
      try {
        stored = window.localStorage.getItem(key);
      } catch (e) {
        stored = null;
      }
      var startMs = stored ? parseInt(stored, 10) : NaN;
      if (!isFinite(startMs) || startMs > now) {
        startMs = now;
        try {
          window.localStorage.setItem(key, String(startMs));
        } catch (e) {
          /* private mode — ignore */
        }
      }
      return startMs + dur;
    }
    if (config.type === "daily") {
      var endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.getTime();
    }
    return null;
  }

  function render(el, remainingMs, showDays, hideWhenEnded) {
    var ended = remainingMs <= 0;
    var endedEl = el.querySelector("[data-cdp-ended]");
    var digitsEl = el.querySelector("[data-cdp-digits]");
    var headlineEl = el.querySelector("[data-cdp-headline]");
    var subtextEl = el.querySelector("[data-cdp-subtext]");

    if (ended) {
      if (hideWhenEnded) {
        el.style.display = "none";
        return;
      }
      if (digitsEl) digitsEl.hidden = true;
      if (headlineEl) headlineEl.hidden = true;
      if (subtextEl) subtextEl.hidden = true;
      if (endedEl) endedEl.hidden = false;
      return;
    }

    var total = Math.max(0, Math.floor(remainingMs / 1000));
    var days = Math.floor(total / 86400);
    var hours = Math.floor((total % 86400) / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;

    var d = el.querySelector("[data-cdp-days]");
    var h = el.querySelector("[data-cdp-hours]");
    var m = el.querySelector("[data-cdp-minutes]");
    var s = el.querySelector("[data-cdp-seconds]");

    var daysWrap = el.querySelector("[data-cdp-days-wrap]");
    if (daysWrap) daysWrap.hidden = !showDays;

    if (showDays) {
      if (d) d.textContent = pad2(days);
      if (h) h.textContent = pad2(hours);
    } else {
      var totalHours = Math.floor(total / 3600);
      if (h) h.textContent = pad2(totalHours);
    }
    if (m) m.textContent = pad2(minutes);
    if (s) s.textContent = pad2(seconds);
  }

  function start(el, config) {
    var targetMs = computeTargetMs(config);
    if (targetMs == null) {
      // Not enough info — leave default 00:00:00 placeholders.
      return;
    }

    var showDays = config.showDays !== false;
    var hideWhenEnded = !!config.hideWhenEnded;

    function tick() {
      var remaining = targetMs - Date.now();
      render(el, remaining, showDays, hideWhenEnded);
      if (remaining <= 0) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    }

    tick();
    var interval = setInterval(tick, 1000);
  }

  function readInline(el) {
    var ds = el.dataset || {};
    return {
      type: ds.cdpType || "flash_sale",
      endsAt: ds.cdpEndsAt || null,
      durationSeconds: ds.cdpDuration ? parseInt(ds.cdpDuration, 10) : null,
      showDays: ds.cdpShowDays === "true",
      hideWhenEnded: ds.cdpHideWhenEnded === "true",
      name: ds.cdpTimerName || null,
      shop: ds.cdpShop || null,
      productId: ds.cdpProductId || null,
    };
  }

  function shouldShowTimer(timer, inline) {
    // Skip targeting filters when the merchant didn't configure a server timer.
    if (!timer) return true;
    if (timer.targetType === "all") return true;
    if (timer.targetType === "product" && inline.productId) {
      return (timer.targetIds || []).indexOf(inline.productId) !== -1;
    }
    return false;
  }

  function mergeServerTimer(inline, timer) {
    if (!timer) return inline;
    return {
      id: timer.id,
      type: timer.type || inline.type,
      endsAt: timer.endsAt != null ? timer.endsAt : inline.endsAt,
      durationSeconds:
        timer.durationSeconds != null
          ? timer.durationSeconds
          : inline.durationSeconds,
      showDays:
        typeof timer.showDays === "boolean" ? timer.showDays : inline.showDays,
      hideWhenEnded:
        typeof timer.hideWhenEnded === "boolean"
          ? timer.hideWhenEnded
          : inline.hideWhenEnded,
      name: timer.name || inline.name,
      shop: inline.shop,
      productId: inline.productId,
      headline: timer.headline,
      subtext: timer.subtext,
      endedText: timer.endedText,
      backgroundColor: timer.backgroundColor,
      textColor: timer.textColor,
      accentColor: timer.accentColor,
    };
  }

  function applyServerCopy(el, timer) {
    if (!timer) return;
    var h = el.querySelector("[data-cdp-headline]");
    var s = el.querySelector("[data-cdp-subtext]");
    var e = el.querySelector("[data-cdp-ended]");
    if (h && timer.headline) h.textContent = timer.headline;
    if (s && timer.subtext) s.textContent = timer.subtext;
    if (e && timer.endedText) e.textContent = timer.endedText;
    if (timer.backgroundColor) el.style.setProperty("--cdp-bg", timer.backgroundColor);
    if (timer.textColor) el.style.setProperty("--cdp-fg", timer.textColor);
    if (timer.accentColor) el.style.setProperty("--cdp-accent", timer.accentColor);
  }

  function init() {
    var blocks = document.querySelectorAll("[data-cdp-block]");
    if (!blocks.length) return;

    // Group blocks by shop so we only fetch /api/timers once per shop.
    var byShop = {};
    blocks.forEach(function (el) {
      var inline = readInline(el);
      var shop = inline.shop || "";
      if (!byShop[shop]) byShop[shop] = [];
      byShop[shop].push({ el: el, inline: inline });
    });

    Object.keys(byShop).forEach(function (shop) {
      var entries = byShop[shop];
      // Only fetch the server config if at least one block references a named timer.
      var needsServer = entries.some(function (e) {
        return e.inline.name;
      });

      if (!needsServer || !shop) {
        entries.forEach(function (e) {
          start(e.el, e.inline);
        });
        return;
      }

      var url = DEFAULT_API_URL + "?shop=" + encodeURIComponent(shop);
      fetch(url, { credentials: "omit" })
        .then(function (r) {
          return r.ok ? r.json() : { timers: [] };
        })
        .catch(function () {
          return { timers: [] };
        })
        .then(function (data) {
          var timers = (data && data.timers) || [];
          var byName = {};
          timers.forEach(function (t) {
            if (t && t.name) byName[t.name] = t;
          });
          entries.forEach(function (e) {
            var serverTimer = e.inline.name ? byName[e.inline.name] : null;
            if (serverTimer && !shouldShowTimer(serverTimer, e.inline)) {
              e.el.style.display = "none";
              return;
            }
            var merged = mergeServerTimer(e.inline, serverTimer);
            applyServerCopy(e.el, serverTimer);
            start(e.el, merged);
          });
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
