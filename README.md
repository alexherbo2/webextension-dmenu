# [dmenu] for [Chrome]

> Tab search with [dmenu].

## Dependencies

- [Rofi] ([dmenu] replacement)
- [Inkscape] (Inkscape is used to convert SVG to PNG)

### Extensions

- [Shell] (Chrome API to execute external commands)

## Installation

``` sh
make
```

Open the _Extensions_ page by navigating to `chrome://extensions`, enable _Developer mode_ then _Load unpacked_ to select the extension directory.

![Load extension](https://developer.chrome.com/static/images/get_started/load_extension.png)

See the [Getting Started Tutorial] for more information.

## Usage

Press <kbd>Control</kbd> + <kbd>q</kbd> to tab search with [dmenu].

### Cross-extension messaging

``` javascript
const port = chrome.runtime.connect('<extension-id>')
port.postMessage({ command: 'tab-search' })
```

More examples can be found [here][Create a keyboard interface to the web].

See [Cross-extension messaging] for more details.

## Configuration

Open `chrome://extensions/configureCommands` to configure the keyboard shortcuts.

## Commands

- `tab-search` (<kbd>Control</kbd> + <kbd>q</kbd>)

[dmenu]: https://tools.suckless.org/dmenu/
[Rofi]: https://github.com/davatorium/rofi
[Chrome]: https://google.com/chrome/
[Create a keyboard interface to the web]: https://alexherbo2.github.io/blog/chrome/create-a-keyboard-interface-to-the-web/
[Getting Started Tutorial]: https://developer.chrome.com/extensions/getstarted
[Cross-extension messaging]: https://developer.chrome.com/extensions/messaging#external
[Shell]: https://github.com/alexherbo2/chrome-shell
[Inkscape]: https://inkscape.org
