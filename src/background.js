const Background = {
  onTabUpdate: async function(tabID, changeInfo, tabInfo) {
    if (changeInfo.url == null) { return; }

    const to = Redirects.getRedirect(changeInfo.url, tabInfo.windowId);
    if (to != null) {
      browser.tabs.update(tabID, to);
    }
  },

  addException: async function(url, idx) {
    Redirects.addException(idx, (await browser.windows.getCurrent()).id);
    await Background.moveCurrentTabTo(url);
  },

  moveCurrentTabTo: async function(url, replaceState = true) {
    const tabID = (await browser.tabs.query({currentWindow: true, active: true}))[0].id;
    await browser.tabs.update(tabID, {url: url, loadReplace: replaceState});
  },

  onTabActivation: function(activeInfo) {
    Redirects.showProcessingIcon(activeInfo.previousTabId, false);
    Redirects.showProcessingIcon(activeInfo.tabId);
  },

  init: async function() {
    await Opts.init();
    await Communication.init();
    browser.tabs.onUpdated.addListener(Background.onTabUpdate);
    browser.tabs.onActivated.addListener(Background.onTabActivation);
    await Redirects.init();
  },
};

Background.init();