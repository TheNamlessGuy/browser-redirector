
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

  getManualOptions: async function() {
    return (await BackgroundPage.send('get-manual-options')).result;
  },

  moveToManualOption: async function(to) {
    await BackgroundPage.send('move-to-manual-option', {to});
  },
};

window.addEventListener('DOMContentLoaded', async () => {
  BackgroundPage.init();

  const select = document.getElementById('which');
  const options = await BackgroundPage.getManualOptions();
  for (const option of options) {
    const element = document.createElement('option');
    element.value = option.to;
    element.innerText = option.alias;
    select.append(element);
  }

  document.getElementById('go-btn').addEventListener('click', () => {
    BackgroundPage.moveToManualOption(select.value);
    window.close();
  });
});