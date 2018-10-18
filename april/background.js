const OBSERVATORY_API = 'https://http-observatory.security.mozilla.org/api/v1';
const OBSERVATORY_SITE = 'https://observatory.mozilla.org';

// all the Observatory scores
const scores = {};


// sleep for any number of milliseconds
const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};


// this updates the icon to show the letter grade and score, as well as
// sets the text that you get on hovering to the full Observatory result
// object
const updateIcon = async (results, tabId) => {
  const colors = {
    'A': {
      background: 'rgb(45, 136, 45)',
      color: 'rgb(255, 255, 255)',
    },
    'B': {
      background: 'rgb(170, 170, 57)',
      color: 'rgb(255, 255, 255)',
    },
    'C': {
      background: 'rgb(170, 112, 57)',
      color: 'rgb(255, 255, 255)',
    },
    'D': {
      background: 'rgb(101, 39, 112)',
      color: 'rgb(255, 255, 255)',
    },
    'F': {
      background: 'rgb(170, 57, 57)',
      color: 'rgb(255, 255, 255)',
    }
  };

  // update the badge and its color, reset the spinner, and add the hover text
  await Promise.all([
    browser.browserAction.setBadgeBackgroundColor({
      color: colors[results.grade[0]].background,
      tabId: tabId,
    }),

    browser.browserAction.setBadgeText({
      text: results.grade,
      tabId: tabId,
    }),

    browser.browserAction.setBadgeTextColor({
      color: colors[results.grade[0]].color,
      tabId: tabId,
    }),

    browser.browserAction.setIcon({
      path: undefined,
      tabId: tabId,
    }),

    browser.browserAction.setTitle({
      title: `The full results are:\n\n${JSON.stringify(results, null, 2)}`,
      tabId: tabId,
    })
  ]);

}


// this is the function that goes out to the Observatory and makes the scan
const scan = async (hostname) => {
  const formData = new FormData();
  formData.append('hidden', 'true');
  formData.append('rescan', 'false');

  const response = await fetch(`${OBSERVATORY_API}/analyze?host=${hostname}`, {
    body: formData,
    method: 'POST',
  });

  return await response.json();
};


// this is the handler that will continue to contact the r
const scanHandler = async (hostname, tabId) => {
  let count = 0;
  const MAX_ATTEMPTS = 20;
  const SLEEP_TIME_MILLISECONDS = 1000;


  // we'll only scan MAX_ATTEMPTS time, sleeping SLEEP_TIME_MS between each scan
  while (count < MAX_ATTEMPTS) {
    count += 1;
    results = await scan(hostname);

    if (['ABORTED', 'FAILED', 'FINISHED'].includes(results.state)) {
      if (results.state == 'FINISHED') {
        updateIcon(results, tabId); // only if the scan had successfully finished
      }

      break;
    }

    // if the scan hasn't finished, let's sleep for a little bit and try again
    await sleep(SLEEP_TIME_MILLISECONDS);
  }
};


// when we get the first response back from the website, initiate the scan
browser.webRequest.onResponseStarted.addListener(
  async (details) => {
    // update to spinner icon
    await browser.browserAction.setIcon({
      path: 'icons/spinner.svg',
      tabId: details.tabId,
    });

    scanHandler(new URL(details.url).hostname, details.tabId);
  },
  {urls: ["http://*/*", "https://*/*"], types: ["main_frame"]}
);


// here is the handler for clicking the browserAction (aka the icon)
browser.browserAction.onClicked.addListener(async (details) => {
  // get the current tab hostname
  if (details.url !== undefined) {
    const hostname = new URL(details.url).hostname;

    browser.tabs.create({
      url: `${OBSERVATORY_SITE}/analyze/${hostname}`,
    })
  }
});
