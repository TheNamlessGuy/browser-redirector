const BookmarkOpts = {
  _defaultLocation: ['menu________', 'Plugin data'],
  _saveUsingBookmark: false,

  _id: function() {
    return browser.runtime.getManifest().browser_specific_settings.gecko.id;
  },

  _url: function(opts) {
    const id = BookmarkOpts._id().split('@');
    const url = `${id[0]}://${id[1]}`;

    if (opts == null) { return url; }
    return `${url}?data=${encodeURIComponent(JSON.stringify(opts))}`;
  },

  _getDefaultLocation: async function(opts) {
    let folder = JSON.parse(JSON.stringify(await browser.bookmarks.getTree()));
    folder = folder[0].children.find(x => x.id === BookmarkOpts._defaultLocation[0]);

    const create = opts.create ?? true;

    for (let i = 1; i < BookmarkOpts._defaultLocation.length; ++i) {
      const entry = BookmarkOpts._defaultLocation[i];
      const match = folder.children.find(x => x.title === entry);

      if (match != null) {
        folder = match;
      } else if (create) {
        folder = await browser.bookmarks.create({
          parentId: folder.id,
          title: entry,
          type: 'folder',
        });

        if (!('children' in folder)) {
          folder.children = [];
        }
      } else {
        return null;
      }
    }

    return folder;
  },

  _createBookmark: async function(opts = {}) {
    const folder = await BookmarkOpts._getDefaultLocation({create: true});

    const bookmark = await browser.bookmarks.create({
      parentId: folder.id,
      title: BookmarkOpts._id(),
      url: BookmarkOpts._url(opts),
      type: 'bookmark',
    });

    return bookmark;
  },

  _getBookmark: async function() {
    const prefix = BookmarkOpts._url(null);
    const bookmarks = await browser.bookmarks.search({query: prefix});
    const bookmark = bookmarks.find(x => x.url.startsWith(prefix));
    return bookmark ?? null;
  },

  _getBookmarkData: async function() {
    const bookmark = await BookmarkOpts._getBookmark();
    if (bookmark == null) {
      return null;
    }

    const url = new URL(bookmark.url);
    return JSON.parse(url.searchParams.get('data'));
  },

  _setBookmarkData: async function(opts, bookmark = null) {
    if (bookmark == null) {
      bookmark = await BookmarkOpts._getBookmark();
      if (bookmark == null) {
        await BookmarkOpts._createBookmark(opts);
        return;
      }
    }

    await browser.bookmarks.update(bookmark.id, {
      url: BookmarkOpts._url(opts),
    });
  },

  init: async function(defaultOpts) {
    BookmarkOpts._saveUsingBookmark = false;

    // If we don't have local storage, try to laod via bookmark
    let opts = await browser.storage.local.get();
    if (Object.keys(opts).length === 0) { opts = null; }

    if (opts == null) {
      opts = await BookmarkOpts._getBookmarkData();
      if (opts != null) {
        BookmarkOpts._saveUsingBookmark = true;
      }
    }

    return {
      opts: opts ?? JSON.parse(JSON.stringify(defaultOpts)),
      changed: opts == null,
    };
  },

  get: async function() {
    if (BookmarkOpts._saveUsingBookmark) {
      return await BookmarkOpts._getBookmarkData();
    }

    return await browser.storage.local.get();
  },

  set: async function(opts, extras = {}) {
    const saveUsingBookmarkOverride = extras.saveUsingBookmarkOverride ?? false;

    if (saveUsingBookmarkOverride || BookmarkOpts._saveUsingBookmark) {
      await BookmarkOpts._setBookmarkData(opts);
      await browser.storage.local.clear(); // This has to be an empty object if we want to load the bookmark data on plugin init
    } else {
      await browser.storage.local.clear();
      await browser.storage.local.set(opts);
    }
  },
};