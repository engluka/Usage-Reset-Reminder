// --- Timer definitions ---
const TIMERS = {
  session: {
    resetMs: 5 * 60 * 60 * 1000, // 5 hours
    alarmName: 'claude-session-alarm',
    notificationId: 'claude-session-notification',
    storageKeys: { start: 'sessionStart', reset: 'sessionReset' },
    title: 'Session Limit Reset',
    message: 'Claude session limit has reset. You can start working.'
  },
  allModels: {
    resetMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    alarmName: 'claude-allmodels-alarm',
    notificationId: 'claude-allmodels-notification',
    storageKeys: { start: 'allModelsStart', reset: 'allModelsReset' },
    title: 'All Models Limit Reset',
    message: 'Claude all-models limit has reset. You can start working.'
  }
};

// Called when the content script detects a new message sent
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MESSAGE_SENT') {
    handleMessageSent().then(() => sendResponse({ ok: true }));
    return true; // async response
  }
});

async function handleMessageSent() {
  const allKeys = Object.values(TIMERS).flatMap(t => [t.storageKeys.start, t.storageKeys.reset]);
  const data = await chrome.storage.local.get(allKeys);
  const now = Date.now();

  for (const timer of Object.values(TIMERS)) {
    const startVal = data[timer.storageKeys.start];
    const resetVal = data[timer.storageKeys.reset];

    // If a timer exists and hasn't expired, skip (don't reset mid-window)
    if (startVal && resetVal && now < resetVal) {
      continue;
    }

    // Start a new window for this timer
    const resetTime = now + timer.resetMs;

    await chrome.storage.local.set({
      [timer.storageKeys.start]: now,
      [timer.storageKeys.reset]: resetTime
    });

    await chrome.alarms.clear(timer.alarmName);
    await chrome.alarms.create(timer.alarmName, { when: resetTime });
  }
}

// When an alarm fires, send the corresponding notification
chrome.alarms.onAlarm.addListener(async (alarm) => {
  for (const timer of Object.values(TIMERS)) {
    if (alarm.name === timer.alarmName) {
      await fireNotification(timer);
      return;
    }
  }
});

async function fireNotification(timer) {
  chrome.notifications.create(timer.notificationId, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: timer.title,
    message: timer.message,
    buttons: [{ title: 'Open Claude.ai' }],
    priority: 2,
    requireInteraction: true
  });

  // Clear this timer's data so next message starts a fresh window
  await chrome.storage.local.remove([timer.storageKeys.start, timer.storageKeys.reset]);
  await chrome.alarms.clear(timer.alarmName);
}

// Handle notification button click — open claude.ai
chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
  for (const timer of Object.values(TIMERS)) {
    if (notifId === timer.notificationId && buttonIndex === 0) {
      chrome.tabs.create({ url: 'https://claude.ai' });
      chrome.notifications.clear(notifId);
      return;
    }
  }
});

// Handle notification body click — also open claude.ai
chrome.notifications.onClicked.addListener((notifId) => {
  for (const timer of Object.values(TIMERS)) {
    if (notifId === timer.notificationId) {
      chrome.tabs.create({ url: 'https://claude.ai' });
      chrome.notifications.clear(notifId);
      return;
    }
  }
});

// On service worker startup, check if any resets were missed while browser was closed
chrome.runtime.onStartup.addListener(async () => {
  await checkMissedResets();
});

// Also check on install/update
chrome.runtime.onInstalled.addListener(async () => {
  await checkMissedResets();
});

async function checkMissedResets() {
  const allKeys = Object.values(TIMERS).flatMap(t => [t.storageKeys.start, t.storageKeys.reset]);
  const data = await chrome.storage.local.get(allKeys);
  const now = Date.now();

  for (const timer of Object.values(TIMERS)) {
    const resetVal = data[timer.storageKeys.reset];
    if (resetVal && now >= resetVal) {
      await fireNotification(timer);
    }
  }
}
