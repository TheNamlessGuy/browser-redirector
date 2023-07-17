const Communication = {
  init: function() {
    browser.runtime.onConnect.addListener(Communication._onConnect);
  },

  _onConnect: function(port) {
    port.onMessage.addListener(async (msg) => {
      if (!(msg.action in Communication._map)) {
        return; // What?
      }

      const response = (await Communication._map[msg.action](msg)) ?? {};
      port.postMessage({response: msg.action, ...JSON.parse(JSON.stringify(response))});
    });
  },

  _map: {
    'get-options': async function() { return {opts: await Opts.get()}; },
    'set-options': async function(msg) { await Opts.set(msg.opts, msg.extras); },
    'generate-redirects': async function() { await Redirects.generateRedirects(); },
    'get-redirect-types': async function() { return {types: RedirectTypes}; },
    'move-current-tab-to': async function(msg) { await Background.moveCurrentTabTo(msg.url, msg.replaceState); },
    'add-exception': async function(msg) { await Background.addException(msg.url, msg.idx); },
    'save-using-bookmark': async function() { return {result: BookmarkOpts._saveUsingBookmark}; },
  },
};