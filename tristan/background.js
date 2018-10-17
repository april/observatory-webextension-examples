// var script = document.createElement('script');
// script.src = 'https://code.jquery.com/jquery-3.3.1.js';
// script.type = 'text/javascript';
// document.getElementsByTagName('head')[0].appendChild(script);



async function loadObservatory() {

  let allTabs = await browser.tabs.query({currentWindow: true, active: true});
  hostname = new URL(allTabs[0].url).hostname;
  console.log('current tab hostname is ', hostname)

  browser.tabs.create({
    url: "https://observatory.mozilla.org/analyze/" + hostname

    // url: "https://http-observatory.security.mozilla.org/api/v1/analyze?host=" + hostname
  });
}

function updateIcon() {


}

function updateTooltip(hostname, grade) {
  browser.browserAction.setTitle(
    {title: hostname + " - " + grade}

    );

}

function runObservatoryScan(requestDetails) {
  console.log("Scanning: " + requestDetails.url);
  hostname = new URL(requestDetails.url).hostname;
  observatoryAPIUrl = "https://http-observatory.security.mozilla.org/api/v1/analyze?host=" + hostname;
  
  $.get(observatoryAPIUrl,function( data ) {

    console.log(hostname - data.grade);

    updateIcon(data.grade);
    updateTooltip(hostname, data.grade);
  });

}

browser.webRequest.onCompleted.addListener(
  runObservatoryScan,
  {urls: ["*://*/*"], types: ["main_frame"]}
  );
browser.browserAction.onClicked.addListener(
  loadObservatory
  );
