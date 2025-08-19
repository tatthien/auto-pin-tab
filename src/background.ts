let autoPinEnabled = true

chrome.runtime.onInstalled.addListener(() => {
  loadSettings()
})

chrome.runtime.onStartup.addListener(() => {
  loadSettings()
})

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['settings'])
    if (result.settings && result.settings.autoPinTabs !== undefined) {
      autoPinEnabled = result.settings.autoPinTabs
    } else {
      autoPinEnabled = true
      await chrome.storage.sync.set({
        settings: {
          theme: 'light',
          notifications: true,
          autoRefresh: false,
          refreshInterval: 30,
          autoPinTabs: true
        }
      })
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

chrome.tabs.onCreated.addListener(async (tab) => {
  if (!autoPinEnabled) return
  
  try {
    if (tab.id && !tab.pinned) {
      await chrome.tabs.update(tab.id, { pinned: true })
    }
  } catch (error) {
    console.error('Error pinning tab:', error)
  }
})

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings?.newValue) {
    const newSettings = changes.settings.newValue
    if (newSettings.autoPinTabs !== undefined) {
      autoPinEnabled = newSettings.autoPinTabs
    }
  }
})