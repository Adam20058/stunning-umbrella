// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (items) => {
    if (Object.keys(items).length === 0) {
      chrome.storage.local.set({ predictions: [] });
    }
  });
});

// Check predictions periodically
setInterval(checkPredictions, 1000 * 60 * 60); // Every hour

function checkPredictions() {
  chrome.storage.local.get(null, (items) => {
    const now = new Date();
    Object.entries(items).forEach(([key, prediction]) => {
      if (key.startsWith('prediction_') && 
          !prediction.notified && 
          prediction.deadline && 
          new Date(prediction.deadline) <= now) {
        
        notifyPredictionDue(prediction);
        markNotified(key, prediction);
      }
    });
  });
}

function notifyPredictionDue(prediction) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Prediction Due',
    message: `Time to verify: "${prediction.text.slice(0, 100)}..."`,
    buttons: [
      { title: 'View Prediction' }
    ]
  });
}

function markNotified(key, prediction) {
  chrome.storage.local.set({
    [key]: { ...prediction, notified: true }
  });
}

// Handle notification clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // "View Prediction" clicked
    chrome.storage.local.get(notificationId, (result) => {
      const prediction = result[notificationId];
      if (prediction?.url) {
        chrome.tabs.create({ url: prediction.url });
      }
    });
  }
});