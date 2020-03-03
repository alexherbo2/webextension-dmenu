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

// dmenu
const dmenu = (id, menu) => {
  return new Promise((resolve, reject) => {
    const input = Object.keys(menu).join('\n')
    shell.port.postMessage({
      id,
      input,
      command: settings.dmenu.command,
      arguments: settings.dmenu.arguments
    })
    shell.port.onMessage.addListener((response) => {
      if (response.id !== id) {
        reject(response.id)
      } else {
        const keys = response.output.split('\n')
        const results = keys.flatMap((key) => {
          const item = menu[key]
          return item
            ? [item]
            : []
        })
        resolve(results)
      }
    })
  })
}

const getTabMenu = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, (tabs) => {
      const menu = {}
      for (const tab of tabs) {
        const key = `${tab.title} ${tab.url} ${tab.id}`
        menu[key] = tab
      }
      resolve(menu)
    })
  })
}

const getBookmarkMenu = () => {
  return new Promise(async (resolve, reject) => {
    const bookmarks = await getBookmarks()
    const menu = {}
    for (const bookmark of bookmarks) {
      const bookmarks = bookmark.leaves()
      for (const bookmark of bookmarks) {
        const key = `${bookmark.content.title} ${bookmark.content.url}`
        menu[key] = bookmark
      }
    }
    resolve(menu)
  })
}

const getHistoryMenu = () => {
  return new Promise((resolve, reject) => {
    chrome.history.search({ text: '' }, (history) => {
      const menu = {}
      for (const item of history) {
        const key = `${item.title} ${item.url}`
        menu[key] = item
      }
      resolve(menu)
    })
  })
}

// Bookmarks ───────────────────────────────────────────────────────────────────

const getBookmarks = () => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((bookmarks) => {
      bookmarks = bookmarks.map((bookmark) => {
        return Node.parse(bookmark, (bookmark) => ({
          id: bookmark.id,
          content: {
            url: bookmark.url,
            title: bookmark.title
          },
          nodes: bookmark.children || []
        }))
      })
      resolve(bookmarks)
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
  const [tab] = await dmenu('tab-search', menu)
  if (! tab) {
    return
  }
  // Does not affect whether the window is focused
  chrome.tabs.update(tab.id, { active: true })
  chrome.windows.update(tab.windowId, { focused: true })
}

// Bring tab
commands['bring-tab'] = async () => {
  const menu = await getTabMenu()
  const [targetTab] = await dmenu('bring-tab', menu)
  if (! targetTab) {
    return
  }
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
}

// Open bookmark
commands['open-bookmark'] = async () => {
  const menu = await getBookmarkMenu()
  const [bookmark] = await dmenu('open-bookmark', menu)
  if (! bookmark) {
    return
  }
  chrome.tabs.update(undefined, { url: bookmark.content.url })
}

// Search history
commands['search-history'] = async () => {
  const menu = await getHistoryMenu()
  const [historyItem] = await dmenu('search-history', menu)
  if (! historyItem) {
    return
  }
  chrome.tabs.update(undefined, { url: historyItem.url })
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
external.requests['open-bookmark'] = commands['open-bookmark']
external.requests['search-history'] = commands['search-history']
