// Google Chat Image Viewer - High Quality Image Modal
(function() {
  'use strict';

  const DEBUG = false; // Set to false to disable console logs
  function log(...args) {
    if (DEBUG) console.log('[GChat Image Viewer]', ...args);
  }

  // Create modal overlay
  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'gchat-image-modal';
    modal.innerHTML = `
      <div class="gchat-modal-backdrop">
        <div class="gchat-modal-content">
          <button class="gchat-modal-close">&times;</button>
          <img class="gchat-modal-image" src="" alt="Full size image">
          <div class="gchat-modal-loading">Loading...</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  // Get high quality image URL
  function getHighQualityUrl(imgElement) {
    let src = imgElement.src || imgElement.getAttribute('src');
    log('Original src:', src);

    // Check if image is inside a download link
    const parentLink = imgElement.closest('a[href*="chat.usercontent.google.com/download"]');
    if (parentLink) {
      src = parentLink.href;
      log('Found download link in parent:', src);
      return src;
    }

    // Check for download link pattern in src
    if (src?.includes('chat.usercontent.google.com/download')) {
      log('Already a download URL:', src);
      return src;
    }

    if (!src) {
      // Try to find src in parent elements or data attributes
      const parent = imgElement.closest('a, div[data-id]');
      if (parent && parent.tagName === 'A' && parent.href) {
        src = parent.href;
        log('Found src in parent link:', src);
      } else if (parent) {
        const bgImage = window.getComputedStyle(parent).backgroundImage;
        if (bgImage && bgImage !== 'none') {
          src = bgImage.slice(5, -2); // Remove url(" and ")
          log('Found src in background:', src);
        }
      }
    }

    // Try data-src attributes
    if (!src) {
      src = imgElement.getAttribute('data-src') ||
            imgElement.getAttribute('data-original-src') ||
            imgElement.getAttribute('data-full-src');
      log('Found src in data attribute:', src);
    }

    if (!src) {
      log('No src found');
      return null;
    }

    // If it's already a chat download URL, use it as-is
    if (src.includes('chat.usercontent.google.com/download')) {
      log('Download URL (from attributes):', src);
      return src;
    }

    // Remove Google's image resize parameters to get full quality
    let originalSrc = src;

    // Remove parameters like =w500-h400, =w500, etc.
    src = src.replace(/=[wh]\d+-?[wh]?\d*/g, '');
    src = src.replace(/=s\d+/g, ''); // Remove =s[size] parameter
    src = src.replace(/-[wh]\d+/g, ''); // Remove -w500 or -h400
    src = src.replace(/\/w\d+-h\d+\//g, '/'); // Remove /w500-h400/

    // Clean up any remaining parameters before adding s0
    if (src.includes('googleusercontent.com') && !src.includes('/download')) {
      // Remove all parameters after the image path
      const urlParts = src.split('=');
      src = urlParts[0] + '=s0'; // s0 means original size
    }

    log('High quality URL:', src);
    return src;
  }

  // Show modal with image
  function showImage(imgUrl) {
    let modal = document.getElementById('gchat-image-modal');
    if (!modal) {
      modal = createModal();
      setupModalEvents(modal);
    }

    const modalImg = modal.querySelector('.gchat-modal-image');
    const loading = modal.querySelector('.gchat-modal-loading');

    modal.style.display = 'flex';
    loading.style.display = 'block';
    modalImg.style.display = 'none';
    modalImg.src = '';

    // Load high quality image
    const img = new Image();
    img.onload = function() {
      modalImg.src = imgUrl;
      modalImg.style.display = 'block';
      loading.style.display = 'none';
    };
    img.onerror = function() {
      loading.textContent = 'Error loading image';
      setTimeout(() => closeModal(), 2000);
    };
    img.src = imgUrl;
  }

  // Close modal
  function closeModal() {
    const modal = document.getElementById('gchat-image-modal');
    if (modal) {
      modal.style.display = 'none';
      const modalImg = modal.querySelector('.gchat-modal-image');
      modalImg.src = '';
    }
  }

  // Setup modal event listeners
  function setupModalEvents(modal) {
    const closeBtn = modal.querySelector('.gchat-modal-close');
    const backdrop = modal.querySelector('.gchat-modal-backdrop');

    closeBtn.addEventListener('click', closeModal);

    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    });

    // Prevent right-click download on modal image
    modal.querySelector('.gchat-modal-image').addEventListener('contextmenu', function(e) {
      // Allow default behavior so user can save the high quality image
    });
  }

  // Handle image clicks
  function handleImageClick(e) {
    const img = e.target;

    // Check if it's an image in Google Chat
    if (img.tagName === 'IMG') {
      const highQualityUrl = getHighQualityUrl(img);

      if (highQualityUrl) {
        e.preventDefault();
        e.stopPropagation();
        showImage(highQualityUrl);
      }
    }
  }

  // Check if image is emoji or avatar
  function isEmojiOrAvatar(img) {
    // Check size
    const width = img.width || img.naturalWidth || 0;
    const height = img.height || img.naturalHeight || 0;
    if ((width > 0 && width < 40) || (height > 0 && height < 40)) {
      return true;
    }

    // Check alt text
    if (img.alt && (
      img.alt.toLowerCase().includes('emoji') ||
      img.alt.toLowerCase().includes('icon') ||
      img.alt.toLowerCase().includes('sticker')
    )) {
      return true;
    }

    // Check src
    if (img.src && (
      img.src.includes('emoji') ||
      img.src.includes('photo.jpg') ||
      img.src.includes('/photo/') ||
      img.src.includes('avatar')
    )) {
      return true;
    }

    // Check class names
    const className = img.className || '';
    if (className.includes('emoji') || className.includes('avatar')) {
      return true;
    }

    // Check parent elements
    if (img.closest('[data-emoji]') ||
        img.closest('.emoji') ||
        img.closest('.avatar')) {
      return true;
    }

    return false;
  }

  // Create download button for image
  function createDownloadButton(img) {
    if (img.dataset.gchatDownloadBtn) return; // Already has button

    // Don't add button to emojis or avatars
    if (isEmojiOrAvatar(img)) {
      log('Skipping emoji/avatar');
      return;
    }

    log('Creating download button for image');

    const parent = img.parentElement;
    if (!parent) {
      log('No parent element, skipping');
      return;
    }

    // Make parent position relative if it's not already
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === 'static') {
      parent.style.position = 'relative';
    }

    // Create download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'gchat-download-btn';
    downloadBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    `;
    downloadBtn.title = 'Download image';

    // Handle download button click
    downloadBtn.addEventListener('click', async function(e) {
      log('Download button clicked!');
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const imageUrl = getHighQualityUrl(img);
      log('Download URL:', imageUrl);

      if (!imageUrl) {
        log('No URL found');
        return false;
      }

      try {
        // Fetch the image as blob
        log('Fetching image...');
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        log('Image fetched, size:', blob.size);

        // Create blob URL
        const blobUrl = URL.createObjectURL(blob);

        // Create download link
        const tempLink = document.createElement('a');
        tempLink.href = blobUrl;
        tempLink.download = `image-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);

        // Trigger download
        tempLink.click();
        log('Download triggered!');

        // Cleanup
        document.body.removeChild(tempLink);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      } catch (error) {
        log('Download error:', error);
        // Fallback: open in new tab
        window.open(imageUrl, '_blank');
      }

      return false;
    }, true);

    // Add mousedown listener too
    downloadBtn.addEventListener('mousedown', function(e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true);

    parent.appendChild(downloadBtn);
    img.dataset.gchatDownloadBtn = 'true';
    log('Download button created and added');
  }

  // Attach click listener to an image
  function attachImageListener(img) {
    if (img.dataset.gchatListenerAttached) return; // Already attached

    img.dataset.gchatListenerAttached = 'true';

    // Add download button (will check for emoji/avatar internally)
    createDownloadButton(img);

    // Multiple event types to catch different scenarios
    ['click', 'mousedown', 'mouseup'].forEach(eventType => {
      img.addEventListener(eventType, function(e) {
        log(`${eventType} event on image:`, img.src?.substring(0, 80));

        // Very lenient filtering - only skip obvious non-chat images
        const isLogo = img.alt?.toLowerCase().includes('google workspace') ||
                      img.alt?.toLowerCase().includes('logo') ||
                      img.src?.includes('ssl.gstatic.com/ui/');

        const isTinyEmoji = (img.width > 0 && img.width < 30) ||
                           (img.height > 0 && img.height < 30);

        const isProfilePhoto = img.src?.includes('photo.jpg') ||
                              img.classList.contains('avatar');

        if (isLogo || isTinyEmoji || isProfilePhoto) {
          log('Filtered out:', { isLogo, isTinyEmoji, isProfilePhoto });
          return;
        }

        log('INTERCEPTING CLICK - Opening in modal');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const highQualityUrl = getHighQualityUrl(img);
        if (highQualityUrl) {
          showImage(highQualityUrl);
        }

        return false;
      }, true); // Capture phase
    });

    log('Listener attached to image:', img.src?.substring(0, 50) + '...');
  }

  // Attach click listener to a link
  function attachLinkListener(link) {
    if (link.dataset.gchatLinkListenerAttached) return;
    link.dataset.gchatLinkListenerAttached = 'true';

    link.addEventListener('click', function(e) {
      log('Download link clicked (via listener):', link.href);
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showImage(link.href);
      return false;
    }, true);

    log('Listener attached to link');
  }

  // Scan for images and attach listeners
  function scanAndAttachListeners() {
    // Get ALL images - use document.images which includes all img elements
    const images = Array.from(document.images);
    const totalImages = images.length;

    let attachedCount = 0;
    images.forEach(img => {
      // Skip if already has listener
      if (img.dataset.gchatListenerAttached) return;

      // Skip if no src
      if (!img.src) return;

      const width = img.width || img.naturalWidth || 0;
      const height = img.height || img.naturalHeight || 0;

      // Only skip VERY obvious non-chat images
      const isLogo = img.alt?.toLowerCase().includes('google workspace') ||
                    img.alt?.toLowerCase().includes('logo') ||
                    img.src?.includes('ssl.gstatic.com/ui/') ||
                    img.src?.includes('/logo');

      const isTinyEmoji = (width > 0 && width < 30) || (height > 0 && height < 30);
      const isProfilePhoto = img.src?.includes('photo.jpg') || img.src?.includes('/photo/');

      if (isLogo || isTinyEmoji || isProfilePhoto) {
        return;
      }

      // Attach listener to everything else
      attachImageListener(img);
      attachedCount++;
    });

    // Also scan for download links directly
    const downloadLinks = document.querySelectorAll('a[href*="chat.usercontent.google.com"], a[href*="download"], a[download]');
    downloadLinks.forEach(link => {
      if (!link.dataset.gchatLinkListenerAttached && link.href?.includes('usercontent')) {
        attachLinkListener(link);
        attachedCount++;
      }
    });

    if (attachedCount > 0) {
      log('✅ Attached listeners to', attachedCount, 'new images/links (total images in page:', totalImages + ')');
    }
  }

  // Initialize - use MutationObserver for dynamically loaded images
  function init() {
    log('Extension loaded and initialized');

    // Initial scan
    scanAndAttachListeners();

    // Watch for new images - VERY AGGRESSIVE
    const observer = new MutationObserver(function(mutations) {
      let shouldScan = false;

      mutations.forEach(function(mutation) {
        // Check for added nodes
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              // If it's an image or contains images, scan immediately
              if (node.tagName === 'IMG' || node.querySelector?.('img')) {
                shouldScan = true;
              }
            }
          });
        }

        // Check for attribute changes on img elements
        if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
          shouldScan = true;
        }
      });

      if (shouldScan) {
        log('🔄 DOM changed, rescanning...');
        scanAndAttachListeners();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href']
    });

    // Also try general click listener as fallback
    document.addEventListener('click', function(e) {
      if (e.target.tagName === 'IMG' && e.target.src) {
        log('Fallback click detected on:', e.target.src?.substring(0, 100));

        const width = e.target.width || e.target.naturalWidth || 0;
        const height = e.target.height || e.target.naturalHeight || 0;
        const isSmall = width < 100 || height < 100;
        const isEmoji = e.target.alt?.includes('emoji');
        const isAvatar = e.target.src?.includes('photo.jpg');

        log('Image info:', { width, height, isSmall, isEmoji, isAvatar });

        if (!isSmall && !isEmoji && !isAvatar) {
          log('Opening in modal!');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const highQualityUrl = getHighQualityUrl(e.target);
          if (highQualityUrl) {
            showImage(highQualityUrl);
          }
        }
      }
    }, true);

    // Also intercept clicks on download links directly
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[href*="chat.usercontent.google.com/download"]');
      if (link) {
        log('Download link clicked:', link.href);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Find image inside the link
        const img = link.querySelector('img');
        if (img) {
          log('Found image in link, opening modal');
          showImage(link.href);
        } else {
          log('No image in link, opening URL directly');
          showImage(link.href);
        }
        return false;
      }
    }, true);

    // Frequent re-scan for images that are lazy-loaded
    setInterval(scanAndAttachListeners, 500); // Every 500ms

    log('Listeners attached, monitoring for new images');
  }

  // Check if feature is enabled before initializing
  function checkAndInit() {
    chrome.storage.sync.get(['imageViewerEnabled'], function(result) {
      // Default to true if not set
      const enabled = result.imageViewerEnabled !== false;

      if (enabled) {
        log('Image viewer is enabled, initializing...');
        init();
      } else {
        log('Image viewer is disabled in settings');
      }
    });
  }

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
  } else {
    checkAndInit();
  }

  // Listen for settings changes and reinitialize if needed
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.imageViewerEnabled) {
      const newValue = changes.imageViewerEnabled.newValue;
      log('Settings changed, image viewer enabled:', newValue);

      if (newValue) {
        // Reload the page to reinitialize
        location.reload();
      } else {
        // Reload to remove listeners
        location.reload();
      }
    }
  });
})();
