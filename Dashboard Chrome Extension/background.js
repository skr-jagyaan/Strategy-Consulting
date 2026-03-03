// This script listens for the user to click the Chrome Extension icon.
// Because the dashboard is a full-screen experience, this opens it in a new, secure tab 
// instead of a tiny popup window.

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "index.html" });
});
