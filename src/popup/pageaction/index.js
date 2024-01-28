
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

  getManualSwapOptions: async function() {
    return (await BackgroundPage.send('get-manual-swap-options')).result;
  },

  getManualOneWay: async function() {
    return (await BackgroundPage.send('get-manual-oneway')).result;
  },

  moveToManualSwapOption: async function(to) {
    await BackgroundPage.send('move-to-manual-swap-option', {to});
  },

  moveToManualOneWay: async function() {
    await BackgroundPage.send('move-to-manual-oneway');
  },
};

window.addEventListener('DOMContentLoaded', async () => {
  BackgroundPage.init();

  let type = null;

  const display = document.getElementById('display');
  const select = document.getElementById('which');
  const options = await BackgroundPage.getManualSwapOptions();
  if (options.options.length > 0) {
    type = 'manual-swap';
    display.innerText = `Redirect from '${options.currentAlias}' to...`;

    for (const option of options.options) {
      const element = document.createElement('option');
      element.value = option.to;
      element.innerText = option.alias;
      select.append(element);
    }
  } else {
    type = 'manual-oneway';

    const redirect = await BackgroundPage.getManualOneWay();
    display.innerText = `Redirect to '${redirect.toAlias}'?`;
    select.style.display = 'none';
  }

  document.getElementById('go-btn').addEventListener('click', () => {
    if (type === 'manual-swap') {
      BackgroundPage.moveToManualSwapOption(select.value);
    } else if (type === 'manual-oneway') {
      BackgroundPage.moveToManualOneWay();
    }

    window.close();
  });
});