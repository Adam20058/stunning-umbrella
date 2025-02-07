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
      return prediction.status === 'pending';
    case 'verified':
      return prediction.status === 'verified';
    case 'incorrect':
      return prediction.status === 'incorrect';
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
        <p>Click "Track" on LinkedIn posts to start tracking predictions.</p>
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
  
  card.innerHTML = `
    <div class="prediction-header">
      <span class="author">${prediction.author || 'Unknown author'}</span>
      <span class="timestamp">${date.toLocaleDateString()}</span>
    </div>
    <div class="prediction-text">${prediction.text}</div>
    <div class="actions">
      <button class="action-btn ${prediction.status === 'verified' ? 'verified' : ''}" 
        onclick="updatePredictionStatus('${prediction.id}', 'verified')">
        ✓ Verified
      </button>
      <button class="action-btn ${prediction.status === 'incorrect' ? 'incorrect' : ''}"
        onclick="updatePredictionStatus('${prediction.id}', 'incorrect')">
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

function updatePredictionStatus(id, status) {
  chrome.storage.local.get(id, (result) => {
    const prediction = result[id];
    if (prediction) {
      prediction.status = status;
      chrome.storage.local.set({ [id]: prediction }, () => {
        loadPredictions();
      });
    }
  });
}

function deletePrediction(id) {
  if (confirm('Delete this prediction?')) {
    chrome.storage.local.remove(id, () => {
      loadPredictions();
    });
  }
}

function openLinkedIn(url) {
  chrome.tabs.create({ url });
}

// Export functions for global access
window.updatePredictionStatus = updatePredictionStatus;
window.deletePrediction = deletePrediction;
window.openLinkedIn = openLinkedIn;