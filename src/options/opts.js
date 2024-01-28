const Opts = {
  _default: {
    _v: null,
    redirects: [{
      area: null,
      active: true,
      type: 'automatic',
      from: {
        url: '^(http|https)://(www\\.)?youtube\\.com/shorts/(.+)',
      },
      to: {
        type: RedirectTypes.REGEX,
        url: '{{1}}://{{2}}youtube.com/watch?v={{3}}',
      },
    }, {
      area: null,
      active: true,
      type: 'automatic',
      from: {
        url: '^(http|https)://(www\\.)?reddit\\.com',
      },
      to: {
        type: RedirectTypes.INTERNAL,
        url: '/src/helper-pages/hard-blocked.html',
      },
    }],
  },

  _v: () => browser.runtime.getManifest().version,

  init: async function() {
    Opts._default._v = Opts._v();
    let {opts, changed} = await BookmarkOpts.init(Opts._default);

    const currentVersion = Opts._v();
    const optsVersion = opts._v ?? '0.0.0';

    if (currentVersion > optsVersion) {
      if (optsVersion < '0.4.0') {
        // Fix "redirects" if needed
        for (let i = 0; i < opts.redirects.length; ++i) {
          if (!('type' in opts.redirects[i])) {
            opts.redirects[i].type = 'automatic';
          }

          if (!('area' in opts.redirects[i])) {
            opts.redirects[i].area = null;
          }

          if (!('active' in opts.redirects[i])) {
            opts.redirects[i].active = true;
          }

          if (opts.redirects[i].type === 'automatic') {
            if ('internal' in opts.redirects[i].to) {
              opts.redirects[i].to.type = opts.redirects[i].internal ? RedirectTypes.INTERNAL : RedirectTypes.REGEX;
              delete opts.redirects[i].to.internal;
            }

            if (opts.redirects[i].to.type === RedirectTypes.INTERNAL && opts.redirects[i].to.url === '/src/helper-pages/blocked.html') {
              opts.redirects[i].to.url = '/src/helper-pages/soft-blocked.html';
            }
          }
        }
      }

      if (optsVersion < '0.5.0') {
        for (let i = 0; i < opts.redirects.length; ++i) {
          if (opts.redirects[i].type === 'manual') {
            opts.redirects[i].type = 'manual-swap';
          }

          opts.redirects[i].alias = `${i + 1}`;
        }
      }

      opts._v = currentVersion;
      changed = true;
    }

    if (changed) {
      Opts.set(opts);
    }
  },

  get: async function() {
    const opts = await BookmarkOpts.get();
    if (opts != null && Object.keys(opts).length > 0) {
      return opts;
    }

    await Opts.init();
    return await Opts.get();
  },

  set: async function(opts, extras = {}) {
    await BookmarkOpts.set(opts, extras);
  },
}