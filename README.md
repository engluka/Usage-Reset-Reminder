# Claude Usage Reset Reminder

A Chrome extension that tracks your Claude.ai usage and notifies you when your limits reset.

## Timers

| Timer | Window | Triggers |
|-------|--------|----------|
| **Session** | 5 hours from first message | Per-session rate limit |
| **All Models** | 7 days from first message | Weekly all-models usage cap |

Both timers start independently when you send your first message. Neither resets mid-window if you keep chatting.

## Features

- Detects outgoing messages on claude.ai automatically
- Popup shows both countdowns with start time and reset time
- Browser notification fires at each reset mark
- Missed resets (browser was closed) fire immediately on next launch
- All data stored locally — no accounts, no backend, no external calls

## Install

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select this folder (`Usage Reset Reminder`)
5. The extension icon will appear in your toolbar

## Usage

1. Go to [claude.ai](https://claude.ai) and send a message
2. Click the extension icon to see both timers and their countdowns
3. You'll get a notification when each limit resets
4. Click the notification to open claude.ai

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration (Manifest V3) |
| `background.js` | Service worker — manages alarms and notifications for both timers |
| `content.js` | Content script — detects messages sent on claude.ai |
| `popup.html/js` | Popup UI — shows both timers with countdowns |
| `icons/` | Extension icons |
