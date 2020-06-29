# [dmenu] for [Chrome] and [Firefox] – [WebExtensions]

[dmenu]: https://tools.suckless.org/dmenu/
[Chrome]: https://google.com/chrome/
[Firefox]: https://mozilla.org/firefox/
[WebExtensions]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions

Tab search, selection and beyond with a [dmenu] filter program.

[![webextension-dmenu](https://img.youtube.com/vi_webp/tgrmss3u2aE/maxresdefault.webp)](https://youtube.com/playlist?list=PLdr-HcjEDx_nLeC2_aQwpTQrWZ1un1nAZ "YouTube – webextension-dmenu")
[![YouTube Play Button](https://www.iconfinder.com/icons/317714/download/png/16)](https://youtube.com/playlist?list=PLdr-HcjEDx_nLeC2_aQwpTQrWZ1un1nAZ) · [webextension-dmenu](https://youtube.com/playlist?list=PLdr-HcjEDx_nLeC2_aQwpTQrWZ1un1nAZ)

## Dependencies

- [jq]
- [Zip]

[jq]: https://stedolan.github.io/jq/
[Zip]: http://infozip.sourceforge.net/Zip.html

###### Extensions

- [Shell]

[Shell]: https://github.com/alexherbo2/webextension-shell

## Installation

###### Chrome

``` sh
make chrome
```

Open the _Extensions_ page by navigating to `chrome://extensions`, enable _Developer mode_ then _Load unpacked_ to select the extension directory: `target/chrome`.

###### Firefox

``` sh
make firefox
```

- Open `about:config`, change `xpinstall.signatures.required` to `false`.
- Open `about:addons` ❯ _Extensions_, click _Install add-on from file_ and select the package file: `target/firefox/package.zip`.

## Configuration

###### Chrome

Open `chrome://extensions/configureCommands` to configure the keyboard shortcuts.

###### Firefox

Open `about:addons` ❯ _Extensions_ and click _Manage extension shortcuts_ in the menu.

## Usage

- Press <kbd>Control</kbd> + <kbd>q</kbd> to tab search.
- Press <kbd>Control</kbd> + <kbd>Q</kbd> to bring a tab.
- Press <kbd>Alt</kbd> + <kbd>q</kbd> to open a bookmark.
- Press <kbd>Alt</kbd> + <kbd>Q</kbd> to search history.

## Commands

###### `tab-search`

Tab search.
Default: <kbd>Control</kbd> + <kbd>q</kbd>.

###### `bring-tab`

Bring tab.
Default: <kbd>Control</kbd> + <kbd>Q</kbd>.

###### `open-bookmark`

Open bookmark.
Default: <kbd>Alt</kbd> + <kbd>q</kbd>.

###### `search-history`

Search history.
Default: <kbd>Alt</kbd> + <kbd>Q</kbd>.

## Options

###### `dmenu`

Pipe tabs through the given external filter program.
Default:

``` json
{
  "command": "dmenu",
  "arguments": ["-l", "20", "-i"]
}
```

**Example** – Run with [fzf] and [Alacritty]:

``` json
{
  "command": "sh",
  "arguments": [
    "-c",
    "
      # Create IO files
      state=$(mktemp -d)
      input=$state/input
      output=$state/output
      trap 'rm -Rf \"$state\"' EXIT
      # Get input from /dev/stdin
      cat > \"$input\"
      # Run fzf with Alacritty
      alacritty --class 'Alacritty · Floating' --command sh -c 'fzf < \"$1\" > \"$2\"' -- \"$input\" \"$output\"
      # Write output to /dev/stdout
      cat \"$output\"
      # Exit code
      if test ! -s \"$output\"; then
        exit 1
      fi
    "
  ]
}
```

[fzf]: https://github.com/junegunn/fzf
[Alacritty]: https://github.com/alacritty/alacritty

## Cross-extension messaging

``` javascript
// Environment variables
switch (true) {
  case (typeof browser !== 'undefined'):
    var PLATFORM = 'firefox'
    var DMENU_EXTENSION_ID = 'dmenu@alexherbo2.github.com'
    break
  case (typeof chrome !== 'undefined'):
    var PLATFORM = 'chrome'
    var DMENU_EXTENSION_ID = 'gonendiemfggilnopogmkafgadobkoeh'
    break
}

// Initialization
const dmenu = {}
dmenu.port = chrome.runtime.connect(DMENU_EXTENSION_ID)
dmenu.send = (command, ...arguments) => {
  dmenu.port.postMessage({ command, arguments })
}

// Usage
dmenu.send('tab-search')
```

You can find some examples in [Krabby].

[Krabby]: https://krabby.netlify.app

See the [source](src) for a complete reference.
