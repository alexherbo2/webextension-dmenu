// Saves options to chrome.storage.
const saveOptions = () => {
  const dmenu = JSON.parse(document.getElementById('dmenu').value)
  const options = {
    dmenu
  }
  chrome.storage.sync.set(options, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status')
    status.textContent = 'Options saved.'
    setTimeout(() => {
      status.textContent = ''
    }, 750)
  })
}

// Restores options using the preferences stored in chrome.storage.
const restoreOptions = () => {
  const options = {
    dmenu: JSON.stringify({
      command: 'dmenu',
      arguments: ['-l', '20', '-i']
    })
  }
  chrome.storage.sync.get(options, (items) => {
    const dmenu = document.getElementById('dmenu')
    dmenu.value = JSON.stringify(items.dmenu)
  })
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
