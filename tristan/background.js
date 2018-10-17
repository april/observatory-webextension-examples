var currentTab;

// /*
//  * Switches currentTab and currentBookmark to reflect the currently active tab
//  */
async function updateActiveTab(tabs) {

  let gettingActiveTab = await browser.tabs.query({active: true, currentWindow: true});
  if (gettingActiveTab[0]) {
      currentTab = gettingActiveTab[0];
    }
}

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// update when the extension loads initially
updateActiveTab();



function loadObservatory() {
  hostname = new URL(currentTab.url).hostname;
//  console.log('current tab hostname is ', hostname)

  browser.tabs.create({
    url: "https://observatory.mozilla.org/analyze/" + hostname
  });
}

function updateIcon(grade) {
  iconPath = "";

  if (grade == undefined) {
    iconPath = "icons/default.png";
  }
  else {
    iconPath = "icons/" + grade + ".svg";
  }

  browser.browserAction.setIcon({
    path: iconPath,
    tabId: currentTab.id
  });
}

function updateTooltip(hostname, grade) {
  if (grade == undefined) {
    grade = 'Scanning...'
  }

  browser.browserAction.setTitle({
    title: hostname + " - " + grade,
    tabId: currentTab.id
  });

}

function pollObservatory() {
  observatoryAPIUrl = "https://http-observatory.security.mozilla.org/api/v1/analyze?host=" + hostname;
  
  $.get(observatoryAPIUrl,function( data ) {
    updateTooltip(hostname, data.grade);

    if (data.state == 'FINISHED') {
      updateIcon(data.grade);
    }
    else {
      setTimeout(pollObservatory,1000);
    }
  });
}

function runObservatoryScan(requestDetails) {
  hostname = new URL(requestDetails.url).hostname;
  console.log("Launching background scan: " + hostname);
  pollObservatory(hostname);
}

browser.webRequest.onCompleted.addListener(
  runObservatoryScan,
  {urls: ["*://*/*"], types: ["main_frame"]}
  );
browser.browserAction.onClicked.addListener(
  loadObservatory
  );
