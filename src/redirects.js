const RedirectTypes = {
  REGEX: 'regex',
  INTERNAL: 'internal',
};

const Redirects = {
  _redirects: {
    automatic: [],
    manualSwap: [],
    manualOneWay: [],
  },
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

  _formatFunctions: {
    lowercase: (x)    => x.toLowerCase(),
    uppercase: (x)    => x.toUpperCase(),
    trim:      (x, c) => Redirects._formatFunctions.ltrim(Redirects._formatFunctions.rtrim(x, c), c),
    ltrim:     (x, c) => {
      c = c ?? ' ';
      let start = 0;
      while (start < x.length && x[start] === c) { start += 1; }
      return start > 0 ? x.substring(start) : x;
    },
    rtrim:     (x, c) => {
      c = c ?? ' ';
      let end = x.length;
      while (end > start && x[end - 1] === c) { end -= 1; }
      return end < x.length ? x.substring(0, end) : x;
    },
  },

  _formatRedirect: function(urlStr, to, matches, idx, windowID) {
    if (Redirects._exceptions[windowID]?.includes(idx)) { return null; }

    let retval = to.url;

    for (let i = 1; i < matches.length; ++i) {
      while (true) {
        const start = retval.indexOf(`{{${i}`);
        if (start === -1) { break; }

        const end = retval.substring(start).indexOf('}}') + start + 2;
        const match = retval.substring(start, end);
        const split = match.substring(2, match.length - 2).split(':');
        let result = matches[i] == null ? '' : matches[i];

        for (let j = 1; j < split.length; ++j) {
          let params = [result];

          const paramStart = split[j].indexOf('(');
          if (paramStart !== -1) {
            params = params.concat(split[j].substring(paramStart + 1, split[j].length - 1).split(',').map(x => x.trim()));
            split[j] = split[j].substring(0, paramStart);
          }

          if (split[j] in Redirects._formatFunctions) {
            result = Redirects._formatFunctions[split[j]](...params);
          }
        }

        retval = retval.replaceAll(match, result);
      }
    }

    if (to.type === RedirectTypes.INTERNAL) {
      retval += `?url=${urlStr}&idx=${idx}`;
    }

    if (retval === urlStr) {
      return null; // Don't redirect to the same page
    }

    return {
      url: retval,
      loadReplace: true,
    };
  },

  getAutomaticRedirect: function(url, windowID) {
    if (url.startsWith('moz-extension://')) { return null; } // Internal page, no redirect from there

    for (let i = 0; i < Redirects._redirects.automatic.length; ++i) {
      const redirect = Redirects._redirects.automatic[i];
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

  getManualOneWayRedirect: function(url) {
    if (!url || url.startsWith('moz-extension://')) { return null; } // Internal page, no redirect from there

    for (let i = 0; i < Redirects._redirects.manualOneWay.length; ++i) {
      const redirect = Redirects._redirects.manualOneWay[i];
      if (!redirect.active) { continue; }

      if (url.match(redirect.from)) {
        return redirect;
      }
    }

    return null;
  },

  getManualSwapRedirect: function(url) {
    if (!url || url.startsWith('moz-extension://')) { return null; } // Internal page, no redirect from there

    for (let i = 0; i < Redirects._redirects.manualSwap.length; ++i) {
      const redirect = Redirects._redirects.manualSwap[i];
      if (!redirect.active) { continue; }
      if (redirect.urls.length === 1) { continue; } // What's the point?

      const match = redirect.urls.find(x => url.match(x.from));
      if (match != null) {
        return redirect;
      }
    }

    return null;
  },

  getManualSwapRedirectOptionsForCurrentTab: async function() {
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    const redirect = Redirects.getManualSwapRedirect(tab.url);
    return {
      currentAlias: redirect?.urls.filter(x => tab.url.match(x.from) != null)[0].alias ?? '',
      options: redirect?.urls.filter(x => tab.url.match(x.from) == null) ?? [],
    };
  },

  getManualOneWayRedirectForCurrentTab: async function() {
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    return Redirects.getManualOneWayRedirect(tab.url);
  },

  doManualSwapRedirectOnCurrentTabTo: async function(_to) {
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    const redirect = Redirects.getManualSwapRedirect(tab.url);

    const from = redirect.urls.find(x => tab.url.match(x.from));
    const to = redirect.urls.find(x => x.to === _to);

    let newURL = to.to;
    const match = tab.url.match(from.from);
    for (let i = 1; i < match.length; ++i) {
      newURL = newURL.replaceAll(`{{${i}}}`, match[i] ?? '');
    }

    await browser.tabs.update(tab.id, {url: newURL});
  },

  doManualOneWayRedirectOnCurrentTab: async function() {
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    const redirect = Redirects.getManualOneWayRedirect(tab.url);

    const newURL = Redirects._formatRedirect(tab.url, {url: redirect.to}, tab.url.match(redirect.from), -1, -1).url;
    await browser.tabs.update(tab.id, {url: newURL, loadReplace: false});
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
    await browser.browserAction.setTitle({title: 'Redirector processing'});
    await browser.browserAction.setIcon({
      path: {
        16: '/res/icons/processing/16.gif',
        19: '/res/icons/processing/19.gif',
        32: '/res/icons/processing/32.gif',
        38: '/res/icons/processing/38.gif',
        48: '/res/icons/processing/48.gif',
      },
    });
  },

  _deactivateProcessing: async function() {
    Redirects.processing = false;
    await browser.browserAction.setTitle({title: 'Redirector'});
    await browser.browserAction.setIcon({
      path: {
        16: '/res/icons/redirector/16.png',
        19: '/res/icons/redirector/19.png',
        32: '/res/icons/redirector/32.png',
        38: '/res/icons/redirector/38.png',
        48: '/res/icons/redirector/48.png',
      },
    });
  },

  generateRedirects: async function() {
    await Redirects._activateProcessing();

    Redirects._exceptions = {};
    Redirects._redirects.automatic = [];
    Redirects._redirects.manualSwap = [];
    Redirects._redirects.manualOneWay = [];
    const opts = await Opts.get();
    for (const redirect of opts.redirects) {
      if (redirect.type === 'automatic') {
        Redirects._redirects.automatic.push({
          from: new RegExp(redirect.from.url),
          to: JSON.parse(JSON.stringify(redirect.to)),
          active: redirect.active,
        });
      } else if (redirect.type === 'manual-swap') {
        const data = {
          urls: [],
          active: redirect.active,
        };

        for (const url of redirect.urls) {
          data.urls.push({
            from: new RegExp(url.from),
            to: url.to,
            alias: url.alias,
          });
        }

        Redirects._redirects.manualSwap.push(data);
      } else if (redirect.type === 'manual-oneway') {
        Redirects._redirects.manualOneWay.push({
          from: new RegExp(redirect.from.url),
          to: redirect.to.url,
          active: redirect.active,
          toAlias: redirect.toAlias,
        });
      }
    }

    await Redirects._deactivateProcessing();
    await Background.toggleManualRedirectForCurrentTab();
  },

  init: async function() {
    await Redirects.generateRedirects();

    browser.windows.onRemoved.addListener(function(windowID) { delete Redirects._exceptions[windowID]; });
  },
};