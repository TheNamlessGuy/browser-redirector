const RedirectTypes = {
  REGEX: 'regex',
  INTERNAL: 'internal',
};

const Redirects = {
  _redirects: [],
  processing: false,

  _exceptions: {},

  addException: function(idx, windowID) {
    idx = parseInt(idx, 10);

    if (windowID in Redirects._exceptions) {
      Redirects._exceptions[windowID].push(idx);
    } else {
      Redirects._exceptions[windowID] = [idx];
    }
  },

  _formatRedirect: function(urlStr, to, match, idx, windowID) {
    if (Redirects._exceptions[windowID]?.includes(idx)) { return null; }

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

  getRedirect: function(url, windowID) {
    if (url.startsWith('moz-extension://')) { return null; } // Internal page, no redirect from there

    for (let i = 0; i < Redirects._redirects.length; ++i) {
      const redirect = Redirects._redirects[i];
      if (!redirect.active) { continue; }

      const match = url.match(redirect.from);
      if (match != null) {
        const formatted = Redirects._formatRedirect(url, redirect.to, match, i, windowID);
        if (formatted.url !== url) {
          return formatted;
        }
      }
    }

    return null;
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

    Redirects._exceptions = {};
    Redirects._redirects = [];
    const opts = await Opts.get();
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
    await Redirects.generateRedirects();

    browser.windows.onRemoved.addListener(function(windowID) { delete Redirects._exceptions[windowID]; });
  },
};