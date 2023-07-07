const RedirectTypes = {
  REGEX: 'regex',
  INTERNAL: 'internal',
};
function getRedirectTypes() { return RedirectTypes; }

const Redirects = {
  _redirects: [],
  processing: false,

  _exceptions: [],
  addException: function(idx) {
    idx = parseInt(idx, 10);
    if (!Redirects._exceptions.includes(idx)) {
      Redirects._exceptions.push(idx);
    }
  },

  _formatRedirect: function(urlStr, to, match, idx) {
    if (Redirects._exceptions.includes(idx)) { return null; }

    let retval = to.url;

    for (let i = 1; i < match.length; ++i) {
      retval = retval.replaceAll(`{{${i}}}`, match[i] == null ? '' : match[i]);
    }

    if (to.type === RedirectTypes.INTERNAL) {
      retval += `?url=${urlStr}&idx=${idx}`;
    }

    return {
      url: retval,
      loadReplace: true,
    };
  },

  getRedirect: function(url) {
    if (url.startsWith('moz-extension://')) { return null; } // Internal page, no redirect from there

    for (let i = 0; i < Redirects._redirects.length; ++i) {
      const redirect = Redirects._redirects[i];
      if (!redirect.active) { continue; }

      const match = url.match(redirect.from);
      if (match != null) {
        const formatted = Redirects._formatRedirect(url, redirect.to, match, i);
        if (formatted.url !== url) {
          return formatted;
        }
      }
    }

    return null;
  },

  _defaultRedirects: [
    {from: {url: '^(http|https)://(www\\.)?youtube\\.com/shorts/(.+)'}, to: {type: RedirectTypes.REGEX,     url: '{{1}}://{{2}}youtube.com/watch?v={{3}}'}, area: null, active: true},
    {from: {url: '^(http|https)://(www\\.)?reddit\\.com'},              to: {type: RedirectTypes.INTERNAL,  url: '/src/helper-pages/hard-blocked.html'},    area: null, active: true},
  ],
  _initOptions: async function() {
    const opts = await Redirects.getOptions();
    let changed = false;
    if (!('redirects' in opts)) {
      opts.redirects = Redirects._defaultRedirects;
      changed = true;
    }

    // Fix "redirects" if needed
    for (let i = 0; i < opts.redirects.length; ++i) {
      if ('internal' in opts.redirects[i].to) {
        opts.redirects[i].to.type = opts.redirects[i].internal ? RedirectTypes.INTERNAL : RedirectTypes.REGEX;
        delete opts.redirects[i].to.internal;
        changed = true;
      }

      if (opts.redirects[i].to.type === RedirectTypes.INTERNAL && opts.redirects[i].to.url === '/src/helper-pages/blocked.html') {
        opts.redirects[i].to.url = '/src/helper-pages/soft-blocked.html';
        changed = true;
      }

      if (!('area' in opts.redirects[i])) {
        opts.redirects[i].area = null;
        changed = true;
      }

      if (!('active' in opts.redirects[i])) {
        opts.redirects[i].active = true;
        changed = true;
      }
    }

    if (changed) {
      Redirects.setOptions(opts);
    }
  },

  getOptions: async function() {
    return await browser.storage.local.get();
  },

  setOptions: async function(opts) {
    await browser.storage.local.set(opts);
  },

  showProcessingIcon: async function(tabID, processing = null) {
    if (tabID == null) { return; }
    if (processing == null) { processing = Redirects.processing; }

    if (processing) {
      await browser.pageAction.show(tabID);
    } else {
      await browser.pageAction.hide(tabID);
    }
  },

  _activateProcessing: async function() {
    Redirects.processing = true;
    const currentTabID = (await browser.tabs.query({active: true}))?.id;
    await Redirects.showProcessingIcon(currentTabID);
    return currentTabID;
  },

  _deactivateProcessing: async function(previousCurrentTabID) {
    Redirects.processing = false;
    await Redirects.showProcessingIcon(previousCurrentTabID);
    const currentTabID = (await browser.tabs.query({active: true}))?.id;
    await Redirects.showProcessingIcon(currentTabID);
  },

  generateRedirects: async function() {
    const currentTabID = await Redirects._activateProcessing();

    Redirects._exceptions = [];
    Redirects._redirects = [];
    const opts = await Redirects.getOptions();
    for (const redirect of opts.redirects) {
      Redirects._redirects.push({
        from: new RegExp(redirect.from.url),
        to: JSON.parse(JSON.stringify(redirect.to)),
        active: redirect.active,
      });
    }

    await Redirects._deactivateProcessing(currentTabID);
  },

  init: async function() {
    await this._initOptions();
    await this.generateRedirects();
  },
};
function getRedirects() { return Redirects; }