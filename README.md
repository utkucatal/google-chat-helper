<div align="center">

# Google Chat Helper

**A Chrome extension that enhances Google Chat with a high-quality image viewer and one-click download.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)

</div>

---

## Features

- **Full-Quality Image Viewer** — Click any image in Google Chat to open it in a clean modal at its original resolution, instead of Google's default compressed preview.
- **One-Click Download** — A download button appears on hover over any image, letting you save it instantly in full quality.
- **Smart Filtering** — Automatically skips emojis, avatars, and UI icons so only real chat images are intercepted.
- **Dynamic Detection** — Uses a MutationObserver to detect lazily-loaded images as the chat updates in real time.
- **Keyboard Support** — Press `Esc` to close the image modal.
- **Toggle On/Off** — Enable or disable the image viewer from the extension popup or options page without reloading Chrome.

## Installation

> No Chrome Web Store listing yet — load it manually as an unpacked extension.

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the project folder.
5. Open [Google Chat](https://chat.google.com) — the extension activates automatically.

## Usage

| Action | Result |
|---|---|
| Click an image | Opens in full-quality modal |
| Hover over an image | Shows download button |
| Click download button | Saves image to your downloads |
| Press `Esc` | Closes the modal |
| Click outside modal | Closes the modal |

## Options

Click the extension icon in the toolbar to toggle the image viewer on or off. You can also access the full options page via the extension settings.

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Saves your enabled/disabled preference |

No data is sent to any external server. Everything runs locally in your browser.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE) — © 2026 Utku Catal
