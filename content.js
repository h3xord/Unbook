(() => {
  'use strict';

  const HIDDEN_ATTR = 'data-unbook-hidden';
  const FB_SVG_PATH_PREFIX = 'M8.909 15.445';
  const FB_LABELS = new Set(['facebook', 'go to facebook', 'open facebook']);

  function isInsideChatContent(el) {
    return Boolean(el.closest('[role="main"], [role="grid"], [role="log"]'));
  }

  function isFacebookHomeUrl(href) {
    if (!href) return false;
    try {
      const url = new URL(href, window.location.origin);
      const host = url.hostname.toLowerCase();
      if (host !== 'facebook.com' && host !== 'www.facebook.com' && host !== 'm.facebook.com') {
        return false;
      }
      // Match root/home links (e.g. "/", "/?ref=...") without matching random shared posts
      return url.pathname === '/' || url.pathname === '';
    } catch {
      return false;
    }
  }

  function hideElement(el) {
    if (!el || el.getAttribute(HIDDEN_ATTR) === 'true') return;
    el.setAttribute(HIDDEN_ATTR, 'true');
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('tabindex', '-1');
    el.style.setProperty('display', 'none', 'important');
  }

  function resolveButtonContainer(el) {
    const interactive = el.closest('a, [role="link"], [role="button"]');
    if (interactive) {
      // If wrapped in a single-purpose list item, hide the list item to avoid empty spacing
      const parent = interactive.parentElement;
      if (parent && parent.tagName === 'LI' && parent.children.length === 1) {
        return parent;
      }
      return interactive;
    }
    return el.closest('div') || el;
  }

  function scanAndHide(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    // 1. Primary signal: exact Facebook "f" logo SVG path
    const svgPaths = root.querySelectorAll(`svg[viewBox="0 0 16 16"] path[d^="${FB_SVG_PATH_PREFIX}"]`);
    for (const path of svgPaths) {
      const target = resolveButtonContainer(path);
      hideElement(target);
    }

    // 2. Secondary signal: navigation links pointing to Facebook home or labeled "Facebook"
    const navLinks = root.querySelectorAll('a[href*="facebook.com"], [role="navigation"] a, [role="navigation"] [role="link"], [role="navigation"] [role="button"]');
    for (const el of navLinks) {
      if (el.getAttribute(HIDDEN_ATTR) === 'true') continue;
      if (isInsideChatContent(el)) continue;

      const label = (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().toLowerCase();
      const href = el.getAttribute('href') || '';

      if (FB_LABELS.has(label) || isFacebookHomeUrl(href)) {
        hideElement(resolveButtonContainer(el));
      }
    }
  }

  // Batch DOM mutations to avoid unnecessary work during rapid chat updates
  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      scanAndHide(document);
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        scheduleScan();
        return;
      }
    }
  });

  function start() {
    scanAndHide(document);
    const target = document.documentElement || document;
    observer.observe(target, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
    // Also observe immediately if documentElement is already available
    if (document.documentElement) {
      start();
    }
  } else {
    start();
  }
})();
