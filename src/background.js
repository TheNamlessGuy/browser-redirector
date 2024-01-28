const Background = {
  onTabUpdate: async function(tabID, changeInfo, tab) {
    if (changeInfo.url == null) { return; }

    const to = Redirects.getAutomaticRedirect(changeInfo.url, tab.windowId);
    if (to != null) {
      await browser.tabs.update(tabID, to);
      return;
    }

    await Background._showManualRedirect(changeInfo.url, tabID);
  },

  addException: async function(url, idx) {
    Redirects.addException(idx, (await browser.windows.getCurrent()).id);
    await Background.moveCurrentTabTo(url);
  },

  moveCurrentTabTo: async function(url, replaceState = true) {
    const tabID = (await browser.tabs.query({currentWindow: true, active: true}))[0].id;
    await browser.tabs.update(tabID, {url: url, loadReplace: replaceState});
  },

  onTabActivation: async function(activeInfo) {
    const tab = await browser.tabs.get(activeInfo.tabId);
    await Background._showManualRedirect(tab.url, tab.id);
  },

  toggleManualRedirectForCurrentTab: async function() {
    const tab = (await browser.tabs.query({currentWindow: true, active: true}))[0];
    await Background._showManualRedirect(tab.url, tab.id);
  },

  _showManualRedirect: async function(url, tabID) {
    if (Redirects.processing) { return; }

    const isShown = await browser.pageAction.isShown({tabId: tabID});
    let shouldShow = false;

    let redirect = Redirects.getManualSwapRedirect(url);
    if (redirect != null) {
      await browser.pageAction.setTitle({tabId: tabID, title: 'Redirect to...'});
      shouldShow = true;
    }

    redirect = Redirects.getManualOneWayRedirect(url);
    if (redirect != null) {
      await browser.pageAction.setTitle({tabId: tabID, title: `Redirect to '${redirect.toAlias}'`});
      shouldShow = true;
    }

    if (isShown && !shouldShow) {
      await browser.pageAction.hide(tabID);
    } else if (!isShown && shouldShow) {
      await browser.pageAction.setIcon({
        tabId: tabID,
        path: {
          16: '/res/icons/redirector/16.png',
          19: '/res/icons/redirector/19.png',
          32: '/res/icons/redirector/32.png',
          38: '/res/icons/redirector/38.png',
          48: '/res/icons/redirector/48.png',
        },
      });
      await browser.pageAction.show(tabID);
    }
  },

  onPageActionClicked: async function(tab, info) {
    if (Redirects.processing) { return; }

    browser.pageAction.setPopup({tabId: tab.id, popup: '/src/popup/pageaction/index.html'});
    browser.pageAction.openPopup();
    browser.pageAction.setPopup({tabId: tab.id, popup: ''});
  },

  onBrowserActionClicked: async function(tab, info) {
    if (Redirects.processing) { return; }

    browser.browserAction.setPopup({tabId: tab.id, popup: '/src/popup/browseraction/index.html'});
    browser.browserAction.openPopup();
    browser.browserAction.setPopup({tabId: tab.id, popup: ''});
  },

  init: async function() {
    await Opts.init();
    await Communication.init();
    browser.tabs.onUpdated.addListener(Background.onTabUpdate);
    browser.tabs.onActivated.addListener(Background.onTabActivation);
    browser.pageAction.onClicked.addListener(Background.onPageActionClicked);
    browser.browserAction.onClicked.addListener(Background.onBrowserActionClicked);
    await Redirects.init();
  },
};

Background.init();