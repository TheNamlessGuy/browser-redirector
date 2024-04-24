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

async function _getData() {
  const opts = await BackgroundPage.getOptions();
  opts.redirects = [];
  const extras = {
    saveUsingBookmarkOverride: document.getElementById('general--save-using-bookmark').checked,
  };

  const areas = Area.all();
  for (const area of areas) {
    area.errors.clear();

    for (const redirect of area.redirects) {
      redirect.errors.clear();
    }
  }

  let success = true;
  const names = [];
  for (const area of areas) {
    if (!area.validate()) {
      success = false;
      continue;
    }

    const name = area.name;
    if (names.includes(name)) {
      area.errors.addError(`Cannot have two areas with the same name`);
      success = false;
      continue;
    }
    names.push(name);

    for (const redirect of area.redirects) {
      if (!redirect.validate()) {
        success = false;
        continue;
      }

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

  if (success) {
    return {opts, extras};
  }

  return {opts: null, extras: null};
}

function load(opts, extras) {
  document.getElementById('general--save-using-bookmark').checked = extras.saveUsingBookmarkOverride;

  for (const redirect of opts.redirects) {
    Area.get(redirect.area).addRedirect(redirect);
  }
}

async function save() {
  document.getElementById('errors').clear();

  const {opts, extras} = await _getData();
  if (opts != null) {
    await BackgroundPage.setOptions(opts, extras);
    await BackgroundPage.generateRedirects();
  }
}

async function exportSettings() {
  const {opts, extras} = await _getData();
  prompt('The text below is an export of your settings, as they are displayed on this page (which might differ from what settings you have saved)', JSON.stringify(opts));
}

async function importSettings() {
  const errors = document.getElementById('errors');
  errors.clear();

  const {opts, extras} = await _getData();
  let data = prompt('Input the exported settings data below. Note that this will overwrite anything currently on the page');
  try {
    data = JSON.parse(data);
  } catch (e) {
    errors.addError('Could not parse the given data as a JSON. Nothing was imported');
    return;
  }

  const areas = Area.all();
  for (const area of areas) {
    Area.remove(area);
  }

  load(data, extras);
  errors.addWarning("Settings have been imported, but not saved. Don't forget to press the 'Save' button!");
}

window.addEventListener('DOMContentLoaded', async () => {
  BackgroundPage.init();
  Area.init();

  const opts = await BackgroundPage.getOptions();
  load(opts, {saveUsingBookmarkOverride: await BackgroundPage.saveUsingBookmark()});

  document.getElementById('save-btn').addEventListener('click', save);
  document.getElementById('add-new-area-btn').addEventListener('click', () => Area.add(null));
  document.getElementById('collapse-all-areas-btn').addEventListener('click', () => {
    const areas = Area.all();
    const atLeastOneIsOpen = areas.some(x => !x.isCollapsed());
    areas.forEach(x => x.toggleCollapse(atLeastOneIsOpen));
  });

  document.getElementById('general--export-settings').addEventListener('click', () => exportSettings());
  document.getElementById('general--import-settings').addEventListener('click', () => importSettings());
});