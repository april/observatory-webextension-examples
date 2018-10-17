var currentTab;

// /*
//  * Switches currentTab and currentBookmark to reflect the currently active tab
//  */
function updateActiveTab(tabs) {

  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
    }
  }

  var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then(updateTab);
}

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// update when the extension loads initially
updateActiveTab();

// This defines a different listener
function setIcon(grade) {

  grade_path = "./icons/".concat(grade).concat('.svg');

  browser.browserAction.setIcon({
    path: grade_path,
    tabId: currentTab.id
  });
  return {};
}

// Invoke scan
function invokeScan(host, callback) {
    $.post("https://http-observatory.security.mozilla.org/api/v1/analyze?host=".concat(host), callback);
}

// Check scan
function checkScan(host, callback) {
    $.get("https://http-observatory.security.mozilla.org/api/v1/analyze?host=".concat(host), callback)
}

// Poll for results
function observatoryScan(details) {
  hostname = new URL(details.url).hostname;

  invokeScan(hostname, function(data) {
    function doCheckPoll() {
        checkScan(hostname, function(data) {
            if (data.state == "FINISHED") {
              setIcon(data.grade);
            } else {
                // wait for 1 sec, then retry
                setTimeout(doCheckPoll, 1000);
            }
        })
    }
    doCheckPoll();
  });
}

browser.webRequest.onCompleted.addListener(
  observatoryScan,
  {urls: ["*://*/*"], types: ["main_frame"]}
);
