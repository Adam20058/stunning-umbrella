const processedComments = new Set();

function injectPredictionButton() {
 const items = document.querySelectorAll('.feed-shared-update-v2, .comments-comment-item, .feed-shared-main-content, .feed-shared-update-v2__content');
 
 items.forEach(item => {
   const itemId = item.getAttribute('data-id') || item.getAttribute('data-urn');
   if (processedComments.has(itemId)) return;
   
   const actionBar = item.querySelector('.social-actions-button, .feed-shared-social-actions, .feed-shared-social-action-bar, .social-details-social-activity__action-buttons');
   if (actionBar) {
     const trackBtn = document.createElement('button');
     trackBtn.className = 'prediction-tracker-btn artdeco-button artdeco-button--muted artdeco-button--2';
     trackBtn.innerHTML = '🎯 Track';
     trackBtn.style.marginLeft = '8px';
     trackBtn.onclick = () => handleTrackClick(item);
     actionBar.appendChild(trackBtn);
     processedComments.add(itemId);
   }
 });
}

function handleTrackClick(element) {
 const prediction = {
   text: element.querySelector('.feed-shared-text, .feed-shared-update-v2__description, .comments-comment-item__main-content, .feed-shared-update-v2__commentary')?.textContent.trim(),
   author: element.querySelector('.feed-shared-actor__name, .comments-post-meta__name-text, .update-components-actor__name')?.textContent.trim(),
   timestamp: element.querySelector('time')?.getAttribute('datetime') || new Date().toISOString(),
   url: window.location.href,
   capturedAt: new Date().toISOString()
 };

 chrome.storage.local.set({
   [`prediction_${Date.now()}`]: prediction
 }, () => {
   showNotification('Prediction tracked! 🎯');
 });
}

function showNotification(message) {
 const notification = document.createElement('div');
 notification.className = 'prediction-tracker-notification';
 notification.textContent = message;
 document.body.appendChild(notification);
 setTimeout(() => notification.remove(), 3000);
}

const observer = new MutationObserver((mutations) => {
 for (const mutation of mutations) {
   if (mutation.addedNodes.length) {
     injectPredictionButton();
   }
 }
});

observer.observe(document.body, {
 childList: true,
 subtree: true
});

const style = document.createElement('style');
style.textContent = `
 .prediction-tracker-notification {
   position: fixed;
   bottom: 20px;
   right: 20px;
   background: #0a66c2;
   color: white;
   padding: 12px 20px;
   border-radius: 4px;
   z-index: 9999;
   box-shadow: 0 2px 8px rgba(0,0,0,0.2);
   animation: slideIn 0.3s ease-out;
 }

 .prediction-tracker-btn {
   margin-left: 8px !important;
 }

 @keyframes slideIn {
   from { transform: translateY(100px); opacity: 0; }
   to { transform: translateY(0); opacity: 1; }
 }
`;
document.head.appendChild(style);

injectPredictionButton();