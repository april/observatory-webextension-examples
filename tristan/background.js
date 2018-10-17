async function loadObservatory() {

  let allTabs = await browser.tabs.query({currentWindow: true, active: true});
  hostname = new URL(allTabs[0].url).hostname;
  console.log('current tab hostname is ', hostname)

  browser.tabs.create({
    url: "https://observatory.mozilla.org/analyze/" + hostname

    // url: "https://http-observatory.security.mozilla.org/api/v1/analyze?host=" + hostname
  });
}

browser.browserAction.onClicked.addListener(loadObservatory);