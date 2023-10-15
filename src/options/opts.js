const Opts = {
  _default: {
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

  init: async function() {
    let {opts, changed} = await BookmarkOpts.init(Opts._default);

    // Fix "redirects" if needed
    for (let i = 0; i < opts.redirects.length; ++i) {
      if (!('type' in opts.redirects[i])) {
        opts.redirects[i].type = 'automatic';
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

      if (opts.redirects[i].type === 'automatic') {
        if ('internal' in opts.redirects[i].to) {
          opts.redirects[i].to.type = opts.redirects[i].internal ? RedirectTypes.INTERNAL : RedirectTypes.REGEX;
          delete opts.redirects[i].to.internal;
          changed = true;
        }

        if (opts.redirects[i].to.type === RedirectTypes.INTERNAL && opts.redirects[i].to.url === '/src/helper-pages/blocked.html') {
          opts.redirects[i].to.url = '/src/helper-pages/soft-blocked.html';
          changed = true;
        }
      }
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