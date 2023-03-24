const Background = {
  onTabUpdate: async function(tabID, changeInfo, tabInfo) {
    if (changeInfo.url == null) { return; }

    const to = Redirects.getRedirect(changeInfo.url);
    if (to != null) {
      browser.tabs.update(tabID, to);
    }
  },

  onTabActivation: function(activeInfo) {
    Redirects.showProcessingIcon(activeInfo.previousTabId, false);
    Redirects.showProcessingIcon(activeInfo.tabId);
  },

  init: async function() {
    browser.tabs.onUpdated.addListener(Background.onTabUpdate);
    browser.tabs.onActivated.addListener(Background.onTabActivation);
    await Redirects.init();
  },
};

Background.init();