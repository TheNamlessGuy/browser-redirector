const Errors = {
  element: null,

  init: function() {
    Errors.element = document.getElementById('errors');
  },

  show: function(msg) {
    Errors.element.classList.remove('hidden');
    Errors.element.innerText = msg;
  },

  hide: function() {
    Errors.element.classList.add('hidden');
    Errors.element.innerText = '';
  }
};

const Area = {
  container: null,

  init: function() {
    Area.container = document.getElementById('area-container');
  },

  add: function(name) {
    const area = document.createElement('redirection-area');
    area.name = name;
    area.addEventListener('remove-me', () => Area.remove(area));

    Area.container.appendChild(area);
    Area._areas.push(area);
    return area;
  },

  _areas: [],
  get: function(name) {
    for (const area of Area._areas) {
      if (area.name === name) {
        return area;
      }
    }

    return Area.add(name);
  },

  remove: function(area) {
    const idx = Area._areas.findIndex((x) => x === area);
    Area._areas.splice(idx, 1);
    area.remove();
  },

  all: function() {
    return this._areas.slice();
  }
};

const BackgroundPage = {
  _port: null,

  init: function() {
    BackgroundPage._port = browser.runtime.connect();
  },

  send: function(action, extras = {}) {
    return new Promise((resolve) => {
      const listener = (response) => {
        if (response.response === action) {
          BackgroundPage._port.onMessage.removeListener(listener);
          resolve(response);
        }
      };

      BackgroundPage._port.onMessage.addListener(listener);
      BackgroundPage._port.postMessage({action: action, ...JSON.parse(JSON.stringify(extras))});
    });
  },

  getOptions: async function() {
    return (await BackgroundPage.send('get-options')).opts;
  },

  setOptions: async function(opts, extras) {
    await BackgroundPage.send('set-options', {opts, extras});
  },

  generateRedirects: async function() {
    await BackgroundPage.send('generate-redirects');
  },

  saveUsingBookmark: async function() {
    return (await BackgroundPage.send('save-using-bookmark')).result;
  },
};

async function save() {
  Errors.hide();

  const opts = await BackgroundPage.getOptions();
  opts.redirects = [];
  const extras = {
    saveUsingBookmarkOverride: document.getElementById('general--save-using-bookmark').checked,
  };

  const areas = Area.all();
  const names = [];
  for (const area of areas) {
    const name = area.name;
    if (names.includes(name)) {
      Errors.show(`Cannot have two areas with the same name. Hint: duplicate name is '${name ?? ''}'`);
      return;
    }
    names.push(name);

    for (const redirect of area.redirects) {
      const data = {
        area: name,
        active: redirect.active,
        type: redirect.type,
        alias: redirect.alias,
      };

      if (data.type === 'automatic') {
        data.from = {url: redirect.fromURL};
        data.to = {
          type: redirect.toType,
          url: redirect.toURL,
        };
      } else if (data.type === 'manual-swap') {
        data.urls = redirect.manualURLs;
      } else if (data.type === 'manual-oneway') {
        data.from = {url: redirect.fromURL};
        data.to = {url: redirect.toURL};
        data.toAlias = redirect.toAlias;
      }

      opts.redirects.push(data);
    }
  }

  await BackgroundPage.setOptions(opts, extras);
  await BackgroundPage.generateRedirects();
}

window.addEventListener('DOMContentLoaded', async () => {
  BackgroundPage.init();
  Errors.init();
  Area.init();

  document.getElementById('general--save-using-bookmark').checked = await BackgroundPage.saveUsingBookmark();

  const opts = await BackgroundPage.getOptions();
  for (const redirect of opts.redirects) {
    Area.get(redirect.area).addRedirect(redirect);
  }

  document.getElementById('save-btn').addEventListener('click', save);
  document.getElementById('add-new-area-btn').addEventListener('click', () => Area.add(null));
  document.getElementById('collapse-all-areas-btn').addEventListener('click', () => {
    const areas = Area.all();
    const atLeastOneIsOpen = areas.some(x => !x.isCollapsed());
    areas.forEach(x => x.toggleCollapse(atLeastOneIsOpen));
  });
});