let autoPinEnabled = true
let urlPatterns: string[] = []

chrome.runtime.onInstalled.addListener(() => {
  loadSettings()
})

chrome.runtime.onStartup.addListener(() => {
  loadSettings()
})

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['settings'])
    console.log('Loading settings:', result)
    
    if (result.settings && result.settings.autoPinTabs !== undefined) {
      autoPinEnabled = result.settings.autoPinTabs
      urlPatterns = result.settings.urlPatterns || []
    } else {
      autoPinEnabled = true
      urlPatterns = []
      await chrome.storage.sync.set({
        settings: {
          theme: 'light',
          notifications: true,
          autoRefresh: false,
          refreshInterval: 30,
          autoPinTabs: true,
          urlPatterns: []
        }
      })
    }
    
    console.log('Settings loaded - autoPinEnabled:', autoPinEnabled, 'urlPatterns:', urlPatterns)
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

function shouldPinTab(url: string | undefined): boolean {
  if (!url) return false
  
  // Skip chrome:// URLs and extension pages
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return false
  }
  
  // If no patterns are defined, pin all tabs (original behavior)
  if (urlPatterns.length === 0) return true
  
  // Check if URL matches any of the patterns
  return urlPatterns.some(pattern => {
    try {
      const regex = new RegExp(pattern)
      const matches = regex.test(url)
      console.log(`Testing pattern "${pattern}" against URL "${url}": ${matches}`)
      return matches
    } catch (error) {
      console.warn(`Invalid regex pattern: ${pattern}`, error)
      return false
    }
  })
}

async function tryPinTab(tabId: number, url?: string) {
  if (!autoPinEnabled) {
    console.log('Auto-pin disabled, skipping tab:', tabId)
    return
  }
  
  try {
    const tab = await chrome.tabs.get(tabId)
    const urlToCheck = url || tab.url
    
    console.log('Checking if should pin tab:', tabId, 'URL:', urlToCheck, 'already pinned:', tab.pinned)
    
    if (tab && !tab.pinned && shouldPinTab(urlToCheck)) {
      console.log('Pinning tab:', tabId, urlToCheck)
      await chrome.tabs.update(tabId, { pinned: true })
    } else if (tab && tab.pinned) {
      console.log('Tab already pinned:', tabId)
    } else {
      console.log('Should not pin tab:', tabId, urlToCheck)
    }
  } catch (error) {
    console.error('Error pinning tab:', error)
  }
}

chrome.tabs.onCreated.addListener(async (tab) => {
  console.log('Tab created:', tab.id, tab.url, 'autoPinEnabled:', autoPinEnabled, 'patterns:', urlPatterns)
  
  if (!autoPinEnabled) return
  
  // Try to pin immediately if URL is available
  if (tab.id && tab.url && tab.url !== 'chrome://newtab/') {
    console.log('Trying to pin tab on creation:', tab.id, tab.url)
    await tryPinTab(tab.id, tab.url)
  }
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!autoPinEnabled) return
  
  // When URL changes, check if we should pin
  if (changeInfo.url) {
    console.log('Tab URL updated:', tabId, changeInfo.url, 'status:', changeInfo.status)
    await tryPinTab(tabId, changeInfo.url)
  }
  // Also check when tab becomes loading or complete, in case URL was set earlier
  else if (changeInfo.status === 'loading' && tab.url) {
    console.log('Tab loading with URL:', tabId, tab.url)
    await tryPinTab(tabId, tab.url)
  }
})

chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed:', namespace, changes)
  
  if (namespace === 'sync' && changes.settings?.newValue) {
    const newSettings = changes.settings.newValue
    if (newSettings.autoPinTabs !== undefined) {
      autoPinEnabled = newSettings.autoPinTabs
      console.log('Auto-pin enabled changed to:', autoPinEnabled)
    }
    if (newSettings.urlPatterns !== undefined) {
      urlPatterns = newSettings.urlPatterns
      console.log('URL patterns changed to:', urlPatterns)
    }
  }
})