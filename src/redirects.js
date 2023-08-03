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