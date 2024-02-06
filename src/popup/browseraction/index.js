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

  getOpts: async function() {
    return (await BackgroundPage.send('get-options')).opts;
  },

  setOpts: async function(opts) {
    await BackgroundPage.send('set-options', {opts, extras: {}});
  },

  generateRedirects: async function() {
    await BackgroundPage.send('generate-redirects');
  },
};

const Area = {
  _container: null,

  init: function() {
    Area._container = document.getElementById('area-container');
  },

  add: function(name) {
    const area = document.createElement('c-area');
    area.name = name;
    area.addEventListener('do-save', () => save());

    Area._container.appendChild(area);
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

  getAll: function() {
    return Area._areas;
  },

  none: function() {
    Area._container.innerText = 'No redirects found. Go to the options page and create some';
    Area._container.style.fontStyle = 'italic';
  }
};

async function save() {
  for (let i = 0; i < opts.redirects.length; ++i) {
    opts.redirects[i].active = Area.get(opts.redirects[i].area).getRedirectActiveStatus(opts.redirects[i]);
  }

  await BackgroundPage.setOpts(opts);
  await BackgroundPage.generateRedirects();
}

let opts = null;
window.addEventListener('DOMContentLoaded', async () => {
  BackgroundPage.init();
  Area.init();

  opts = await BackgroundPage.getOpts();
  if (!opts?.redirects?.length) {
    Area.none();
  } else {
    for (const redirect of opts.redirects) {
      Area.get(redirect.area).addRedirect(redirect);
    }
  }

  document.getElementById('collapse-all-btn').addEventListener('click', () => {
    const areas = Area.getAll();
    const atLeastOneIsOpen = areas.some(x => !x.isCollapsed());
    areas.forEach(x => x.toggleCollapse(atLeastOneIsOpen));
  });
});