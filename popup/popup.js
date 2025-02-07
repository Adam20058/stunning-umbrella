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
    const card = createPredictionCard(prediction);
    container.appendChild(card);
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
      <button class="action-btn verify-btn ${prediction.status === 'verified' ? 'verified' : ''}" data-id="${prediction.id}">
        ✓ Verified
      </button>
      <button class="action-btn incorrect-btn ${prediction.status === 'incorrect' ? 'incorrect' : ''}" data-id="${prediction.id}">
        ✗ Incorrect
      </button>
      <button class="action-btn view-btn" data-url="${prediction.url}">
        View on LinkedIn
      </button>
      <button class="action-btn delete-btn" data-id="${prediction.id}">
        🗑️ Delete
      </button>
    </div>
  `;

  // Add event listeners
  card.querySelector('.verify-btn').addEventListener('click', () => {
    updatePredictionStatus(prediction.id, 'verified');
  });

  card.querySelector('.incorrect-btn').addEventListener('click', () => {
    updatePredictionStatus(prediction.id, 'incorrect');
  });

  card.querySelector('.view-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: prediction.url });
  });

  card.querySelector('.delete-btn').addEventListener('click', () => {
    if (confirm('Delete this prediction?')) {
      deletePrediction(prediction.id);
    }
  });
  
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
  chrome.storage.local.remove(id, () => {
    loadPredictions();
  });
}