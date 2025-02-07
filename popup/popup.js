// Prediction list management
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  loadPredictions();
  setupFilterListeners();
});

function setupFilterListeners() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentFilter = e.target.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      loadPredictions();
    });
  });
}

function loadPredictions() {
  chrome.storage.local.get(null, (items) => {
    const predictions = Object.entries(items)
      .filter(([key]) => key.startsWith('prediction_'))
      .map(([key, value]) => ({...value, id: key}))
      .filter(prediction => filterPrediction(prediction))
      .sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));

    renderPredictions(predictions);
  });
}

function filterPrediction(prediction) {
  switch(currentFilter) {
    case 'pending':
      return !prediction.verified && !prediction.incorrect;
    case 'verified':
      return prediction.verified;
    case 'incorrect':
      return prediction.incorrect;
    default:
      return true;
  }
}

function renderPredictions(predictions) {
  const container = document.getElementById('predictions-list');
  container.innerHTML = '';

  if (predictions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No predictions found${currentFilter !== 'all' ? ' for selected filter' : ''}.</p>
        <p>Click "Track" on LinkedIn comments to start tracking predictions.</p>
      </div>
    `;
    return;
  }

  predictions.forEach(prediction => {
    container.appendChild(createPredictionCard(prediction));
  });
}

function createPredictionCard(prediction) {
  const card = document.createElement('div');
  card.className = 'prediction-card';
  
  const date = new Date(prediction.timestamp || prediction.capturedAt);
  const deadlineDate = prediction.deadline ? new Date(prediction.deadline) : null;
  const isOverdue = deadlineDate && deadlineDate < new Date();
  
  card.innerHTML = `
    <div class="prediction-header">
      <span class="author">${prediction.author || 'Unknown author'}</span>
      <span class="timestamp">${date.toLocaleDateString()}</span>
    </div>
    <div class="prediction-text">${prediction.text}</div>
    ${deadlineDate ? `
      <div class="deadline ${isOverdue ? 'deadline-warning' : ''}">
        <span>📅 Due: ${deadlineDate.toLocaleDateString()}</span>
      </div>
    ` : ''}
    <div class="actions">
      <button class="action-btn ${prediction.verified ? 'verified' : ''}" 
        onclick="updatePrediction('${prediction.id}', 'verified')">
        ✓ Verified
      </button>
      <button class="action-btn ${prediction.incorrect ? 'incorrect' : ''}"
        onclick="updatePrediction('${prediction.id}', 'incorrect')">
        ✗ Incorrect
      </button>
      <button class="action-btn" onclick="openLinkedIn('${prediction.url}')">
        View on LinkedIn
      </button>
      <button class="action-btn" onclick="deletePrediction('${prediction.id}')">
        🗑️ Delete
      </button>
    </div>
  `;
  
  return card;
}

function updatePrediction(id, status) {
  chrome.storage.local.get(id, (result) => {
    const prediction = result[id];
    prediction.verified = status === 'verified';
    prediction.incorrect = status === 'incorrect';
    prediction.verifiedAt = new Date().toISOString();
    
    chrome.storage.local.set({ [id]: prediction }, loadPredictions);
  });
}

function deletePrediction(id) {
  if (confirm('Delete this prediction?')) {
    chrome.storage.local.remove(id, loadPredictions);
  }
}

function openLinkedIn(url) {
  chrome.tabs.create({ url });
}

// Export functions for global access
window.updatePrediction = updatePrediction;
window.deletePrediction = deletePrediction;
window.openLinkedIn = openLinkedIn;