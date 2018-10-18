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


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


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

async function pollObservatory(hostname) {
  observatoryAPIUrl = "https://http-observatory.security.mozilla.org/api/v1/analyze?host=" + hostname;
  $.post(observatoryAPIUrl);  //kickoff a scan

  counter = 0;
  MAX_TRIES = 50

  while (counter < MAX_TRIES) {       // try MAX_TRIES times
    counter += 1;

    $.get(observatoryAPIUrl, function( data ) {   // pickup scan results
    
      if (data.state == 'FINISHED') {
        updateIcon(data.grade);
        updateTooltip(hostname, data.grade);
        counter = MAX_TRIES;        // don't loop any more
      }
    });
    console.log('Sleeping on ' + hostname);
    await sleep(2000);    //wait 2 seconds
  }
}


function runObservatoryScan(requestDetails) {
  hostname = new URL(requestDetails.url).hostname;
  console.log("Launching background scan: " + hostname);
  pollObservatory(hostname);
}

// when a page loads, immediately start an observatory scan
browser.webRequest.onCompleted.addListener(
  runObservatoryScan,
  {urls: ["*://*/*"], types: ["main_frame"]}
  );

// if a user clicks, load the Observatory page with full results
browser.browserAction.onClicked.addListener(
  loadObservatory
  );
