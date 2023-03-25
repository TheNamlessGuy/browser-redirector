const Redirects = {
  _redirects: [],
  processing: false,

  _formatRedirect: function(urlStr, to, match) {
    const url = new URL(urlStr);
    let retval = to.url;

    for (let i = 1; i < match.length; ++i) {
      retval = retval.replaceAll(`{{${i}}}`, match[i] == null ? '' : match[i]);
    }

    if (to.internal) {
      retval += `?url=${urlStr}`;
    }

    return {
      url: retval,
    };
  },

  getRedirect: function(url) {
    if (url.startsWith('moz-extension://')) { return null; } // Internal page, no redirect from there

    for (const redirect of Redirects._redirects) {
      const match = url.match(redirect.from);
      if (match != null) {
        const formatted = Redirects._formatRedirect(url, redirect.to, match);
        if (formatted.url !== url) {
          return formatted;
        }
      }
    }

    return null;
  },

  _defaultRedirects: [
    {from: {url: '^(http|https)://(www\\.)?youtube\\.com/shorts/(.+)'}, to: {internal: false, url: '{{1}}://{{2}}youtube.com/watch?v={{3}}'}},
    {from: {url: '^(http|https)://(www\\.)?reddit\\.com'},              to: {internal: true,  url: '/src/helper-pages/blocked.html'}},
  ],
  _initOptions: async function() {
    const opts = await Redirects.getOptions();
    if (!('redirects' in opts)) {
      opts.redirects = Redirects._defaultRedirects;
      await Redirects.setOptions(opts);
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

    Redirects._redirects = [];
    const opts = await Redirects.getOptions();
    for (const redirect of opts.redirects) {
      Redirects._redirects.push({
        from: new RegExp(redirect.from.url),
        to: redirect.to,
      });
    }

    await Redirects._deactivateProcessing(currentTabID);
  },

  init: async function() {
    await this._initOptions();
    await this.generateRedirects();
  },
};

function getRedirects() {
  return Redirects;
}