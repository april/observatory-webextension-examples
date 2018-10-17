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

async function openHTTPObsResultsPage() {
    // Should change this to make a request to HTTP Observatory scan result
    let url = await browser.tabs.query({currentWindow: true, active: true})
    browser.tabs.create({
      url: "https://observatory.mozilla.org/analyze/" + new URL(url[0].url).hostname
    });
  }

browser.browserAction.onClicked.addListener(openHTTPObsResultsPage);

function sendToHTTPObsAPI(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = reject;
        xhr.open('POST', url);
        xhr.send();
    });
}


function scanListener(details) {
    sendToHTTPObsAPI("https://http-observatory.security.mozilla.org/api/v1/analyze?host=" + new URL(details.url).hostname).then(function(result) {

       tab_grade = result['grade'];
       switch (tab_grade){
           case "A+":
               icon_path = "icons/A+.svg";
               break;
           case 'A':
               icon_path = "icons/A.svg";
               break;
           case 'A-':
               icon_path = "icons/A-.svg";
               break;
           case "B+":
               icon_path = "icons/B+.svg";
               break;
           case 'B':
               icon_path = "icons/B.svg";
               break;
           case 'B-':
               icon_path = "icons/B-.svg";
               break;
           case 'C+':
               icon_path = "icons/C+.svg";
               break;     
           case 'C':
               icon_path = "icons/C.svg"; 
               break;
           case 'C-':
               icon_path = "icons/C-.svg";
               break; 
           case 'D+':
               icon_path = "icons/D+.svg";
               break;
           case 'D':
               icon_path = "icons/D.svg"; 
               break;
           case 'D-':
               icon_path = "icons/D-.svg"; 
               break;
           case 'F':
               icon_path = "icons/F.svg"; 
               break;
       }
    
       browser.browserAction.setIcon({path: icon_path, tabId: currentTab.id})
    
       console.log(result['grade'])
    }).catch(function(err) {
       console.log("Error: " + err.message);
});
 
}

browser.webRequest.onBeforeRequest.addListener(
      scanListener,
      {urls: ["*://*/*"], types: ["main_frame"]}
    );

