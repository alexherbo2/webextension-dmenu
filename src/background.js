// Environment variables ───────────────────────────────────────────────────────

switch (true) {
  case (typeof browser !== 'undefined'):
    var PLATFORM = 'firefox'
    var SHELL_EXTENSION_ID = 'shell@alexherbo2.github.com'
    break
  case (typeof chrome !== 'undefined'):
    var PLATFORM = 'chrome'
    var SHELL_EXTENSION_ID = 'ohgecdnlcckpfnhjepfdcdgcfgebkdgl'
    break
}

// Extensions ──────────────────────────────────────────────────────────────────

// Shell
const shell = {}
shell.port = chrome.runtime.connect(SHELL_EXTENSION_ID)

// Settings ────────────────────────────────────────────────────────────────────

const settings = {}

// Pipe tabs through the given external filter program.
settings.dmenu = {
  command: 'dmenu',
  arguments: ['-l', '20', '-i']
}

// Sync settings
chrome.storage.sync.get(null, (items) => {
  Object.assign(settings, items)
})

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (const key in changes) {
    const storageChange = changes[key]
    settings[key] = storageChange.newValue
  }
})

// dmenu ───────────────────────────────────────────────────────────────────────

const getTabMenu = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, (tabs) => {
      const menu = tabs.map((tab) => `${tab.id} ${tab.title} ${tab.url}`).join('\n')
      resolve(menu)
    })
  })
}

// Commands ────────────────────────────────────────────────────────────────────

// Keyboard shortcuts
// https://developer.chrome.com/extensions/commands
//
// Entry point: Listen for incoming requests.
chrome.commands.onCommand.addListener((name) => {
  const command = commands[name]
  if (command) {
    command()
  }
})

const commands = {}

// Tab search
commands['tab-search'] = async () => {
  const menu = await getTabMenu()
  shell.port.postMessage({
    id: 'tab-search',
    input: menu,
    command: settings.dmenu.command,
    arguments: settings.dmenu.arguments
  })
  shell.port.onMessage.addListener((response) => {
    if (response.id !== 'tab-search') {
      return
    }
    const tabId = parseInt(response.output)
    if (! tabId) {
      return
    }
    // Does not affect whether the window is focused
    chrome.tabs.update(tabId, { active: true })
    chrome.tabs.get(tabId, (tab) => {
      chrome.windows.update(tab.windowId, { focused: true })
    })
  })
}

// Bring tab
commands['bring-tab'] = async () => {
  const menu = await getTabMenu()
  shell.port.postMessage({
    id: 'bring-tab',
    input: menu,
    command: settings.dmenu.command,
    arguments: settings.dmenu.arguments
  })
  shell.port.onMessage.addListener((response) => {
    if (response.id !== 'bring-tab') {
      return
    }
    const targetTabId = parseInt(response.output)
    if (! targetTabId) {
      return
    }
    chrome.tabs.get(targetTabId, (targetTab) => {
      chrome.tabs.query({ currentWindow: true, active: true }, ([currentTab]) => {
        // Handle pinned tabs
        chrome.tabs.update(targetTab.id, { pinned: currentTab.pinned })
        const rightTabIndex =
          targetTab.windowId === currentTab.windowId &&
          targetTab.index < currentTab.index
            ? currentTab.index
            : currentTab.index + 1
        chrome.tabs.move(targetTab.id, { windowId: currentTab.windowId, index: rightTabIndex })
      })
    })
  })
}

// External ────────────────────────────────────────────────────────────────────

// Cross-extension messaging
// https://developer.chrome.com/extensions/messaging#external
//
// Entry point: Listen for incoming requests.
// Each request has the following format:
// {
//   command: String,
//   arguments: Array
// }
chrome.runtime.onConnectExternal.addListener((port) => {
  port.onMessage.addListener((request) => {
    const command = external.requests[request.command]
    const arguments = request.arguments || []
    const self = {
      port
    }
    if (command) {
      command.apply(self, arguments)
    }
  })
})

external = {}

// Requests
external.requests = {}

external.requests['set'] = (items) => {
  chrome.storage.sync.set(items)
}

// Forward to commands
external.requests['tab-search'] = commands['tab-search']
external.requests['bring-tab'] = commands['bring-tab']
