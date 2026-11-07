/**
 * Runs inside the page before Halaga's own scripts (context.addInitScript). It stands in for the
 * iOS app's WKWebView bridge (ios/MoneyTracker/NativeBridge.swift), so the web bundle runs in its
 * native mode: body.native, data in the bridge's key-value store instead of IndexedDB, the Add
 * sheet with scan options, Face ID lock settings and so on. Replies match NativeBridge.swift.
 * Every call is recorded in window.__halagaNative.calls for assertions.
 *
 * Things that need real iOS hardware or services (camera scan, Claude, share sheet) reply with
 * an error or "not available", as the app would without them.
 */
function installHalagaNativeBridge(options) {
  const store = {};
  const calls = [];
  let lockEnabled = false;
  const replies = {
    kvGet: ({ key }) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    kvSet: ({ key, value }) => {
      if (value == null) delete store[key];
      else store[key] = value;
      return true;
    },
    share: () => false,
    lockStatus: () => ({ available: options.lockAvailable, enabled: lockEnabled, biometry: options.biometry }),
    setLock: ({ enabled }) => {
      lockEnabled = Boolean(enabled) && options.lockAvailable;
      return lockEnabled;
    },
    scan: () => {
      throw new Error('Scanning needs the camera on a real iPhone or the simulator.');
    },
    claudeStatus: () => ({ hasKey: false }),
    claudeSetKey: () => ({ hasKey: false }),
    claudeDeleteKey: () => ({ hasKey: false }),
    claudeAsk: () => {
      throw new Error('Claude is not available in tests.');
    },
    log: () => true,
    notify: () => ({ granted: true }),
    reminders: () => ({ granted: true }),
    setIcon: () => 'changed'
  };

  window.__halagaNative = { calls, store };
  window.webkit = window.webkit || {};
  window.webkit.messageHandlers = window.webkit.messageHandlers || {};
  window.webkit.messageHandlers.native = {
    postMessage(message) {
      const { type, ...body } = message || {};
      calls.push({ type, body });
      const handler = replies[type];
      if (!handler) return Promise.reject(new Error('bad message'));
      try {
        return Promise.resolve(handler(body));
      } catch (error) {
        return Promise.reject(error);
      }
    }
  };
}

module.exports = {
  installHalagaNativeBridge
};
