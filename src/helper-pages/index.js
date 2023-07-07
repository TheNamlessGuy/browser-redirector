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

  moveCurrentTabTo: async function(url, replaceState = true) {
    await BackgroundPage.send('move-current-tab-to', {url: url, replaceState: replaceState});
  },

  addException: async function(url, idx) {
    await BackgroundPage.send('add-exception', {url: url, idx: idx});
  },
};

window.addEventListener('DOMContentLoaded', async () => {
  BackgroundPage.init();

  const url = new URL(window.location.href);

  url.searchParams.forEach((value, key) => {
    const elem = document.getElementById(key);
    if (elem != null) {
      elem.innerText = value;
      elem.classList.add('filled');
    }
  });

  document.getElementById('reload-url-btn')?.addEventListener('click', () => {
    BackgroundPage.moveCurrentTabTo(url.searchParams.get('url'));
  });

  document.getElementById('add-exception-btn')?.addEventListener('click', () => {
    BackgroundPage.addException(url.searchParams.get('url'), url.searchParams.get('idx'));
  });
});