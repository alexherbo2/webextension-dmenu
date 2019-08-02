// Extensions ──────────────────────────────────────────────────────────────────

// Shell
const shell = {}
shell.port = chrome.runtime.connect('ohgecdnlcckpfnhjepfdcdgcfgebkdgl')

// Requests ────────────────────────────────────────────────────────────────────

const requests = {}

requests['tab-search'] = () => {
  chrome.tabs.query({}, (tabs) => {
    const input = tabs.map((tab) => `${tab.id} ${tab.title} ${tab.url}`).join('\n')
    shell.port.postMessage({
      id: 'tab-search',
      command: 'rofi',
      arguments: ['-dmenu', '-i', '-p', 'Tab search'],
      input
    })
  })
}

// Responses ───────────────────────────────────────────────────────────────────

const responses = {}

responses['tab-search'] = (response) => {
  const id = parseInt(response.output)
  if (id) {
    // Does not affect whether the window is focused
    chrome.tabs.update(id, { active: true })
    chrome.tabs.get(id, (tab) => {
      chrome.windows.update(tab.windowId, { focused: true })
    })
  }
}

// Initialization ──────────────────────────────────────────────────────────────

// Commands
chrome.commands.onCommand.addListener((commandRequest) => {
  const command = requests[commandRequest]
  if (command) {
    command()
  }
})

// Requests
chrome.runtime.onConnectExternal.addListener((port) => {
  port.onMessage.addListener((request) => {
    const command = requests[request.command]
    const arguments = request.arguments || []
    if (command) {
      command(...arguments)
    }
  })
})

// Responses
shell.port.onMessage.addListener((response) => {
  const command = responses[response.id]
  if (command) {
    command(response)
  }
})
