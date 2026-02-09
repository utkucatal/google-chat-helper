// Options page script for Google Chat Helper

// Load saved settings when page opens
document.addEventListener('DOMContentLoaded', function() {
  loadSettings();

  // Listen for toggle changes
  const toggle = document.getElementById('imageViewerToggle');
  toggle.addEventListener('change', function() {
    saveSettings();
  });
});

// Load settings from chrome.storage
function loadSettings() {
  chrome.storage.sync.get(['imageViewerEnabled'], function(result) {
    const toggle = document.getElementById('imageViewerToggle');
    // Default to true if not set
    toggle.checked = result.imageViewerEnabled !== false;
  });
}

// Save settings to chrome.storage
function saveSettings() {
  const toggle = document.getElementById('imageViewerToggle');
  const enabled = toggle.checked;

  chrome.storage.sync.set({
    imageViewerEnabled: enabled
  }, function() {
    // Show success message
    showStatusMessage();
  });
}

// Show status message
function showStatusMessage() {
  const message = document.getElementById('statusMessage');
  message.classList.add('show');

  setTimeout(function() {
    message.classList.remove('show');
  }, 2000);
}
