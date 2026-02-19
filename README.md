# Power DevBox Exceptions

A Chrome extension that automatically generates exception-handling expressions for **Power Automate** cloud flows. Click the extension icon while editing a flow, and the generated expression is copied to your clipboard — ready to paste into a Compose or Variable action inside your exception scope.

> For more information visit [powerdevbox.com/exception](https://powerdevbox.com/exception)

## Features

- **One-click expression generation** — Reads the flow definition via the Dataverse API, identifies all containers (Scope, If, Switch, ForEach, Until), and builds an XPath-based expression that extracts the first meaningful error message.
- **Advanced Mode** — Toggle with **Ctrl + M** to include individual API connector action outputs in the expression for deeper diagnostics.
- **Flow run link shortcut** — Press **Ctrl + E** to copy a dynamic flow-run URL expression to your clipboard.
- **Token management** — Automatically captures the Dataverse bearer token from browser requests, persists it across service-worker restarts, and monitors expiry with a badge indicator.

## Supported Sites

| Domain | Usage |
|---|---|
| `make.powerautomate.com` | Flow editor (content script + expression generation) |
| `make.preview.powerautomate.com` | Preview flow editor |
| `make.powerapps.com` / `make.preview.powerapps.com` | Content script injection |
| `*.dynamics.com` | Dataverse API token capture |

## Installation

1. Download or clone this repository.
2. Open **chrome://extensions** in Chrome (or any Chromium-based browser).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the repository folder.
5. Navigate to a Power Automate cloud flow in edit mode.

## Usage

1. Open a cloud flow in the Power Automate designer and **save** (the extension reads the last-saved definition).
2. Click the **Power DevBox Exceptions** extension icon.
3. The exception expression is generated and **copied to your clipboard**.
4. Paste the expression into a Compose or Variable action inside your exception-handling scope.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **Ctrl + M** | Toggle between Standard and Advanced mode |
| **Ctrl + E** | Copy a dynamic flow-run link expression to clipboard |

### Badge Indicators

| Badge | Meaning |
|---|---|
| *(none)* | Token is valid and ready |
| **!** (red) | Token is expired or missing — refresh/save the flow page |

## Permissions

| Permission | Reason |
|---|---|
| `scripting` | Inject content script on first click if not already loaded |
| `tabs` | Query the active tab URL |
| `webRequest` | Intercept Dataverse API requests to capture the auth token |
| `storage` | Persist the token and mode preference across service-worker restarts |
| `alarms` | Periodically check token expiry (every 5 minutes) |

## How It Works

1. **Token capture** — A `webRequest.onBeforeSendHeaders` listener intercepts requests to `*.dynamics.com`, extracts the `Authorization` header, parses the JWT expiry, and stores the token.
2. **Flow parsing** — When the icon is clicked, the extension fetches the flow's `clientdata` from the Dataverse API, parses the workflow definition, and recursively walks all actions to find containers (Scope, If, Switch, ForEach, Until).
3. **Expression building** — Containers are assembled into a `concat(…)` expression wrapped in `json(…) → xml(…) → xpath(…)` to extract the first actionable error message, filtering out generic "action failed" and "template skipped" noise.
4. **Clipboard** — The final expression is sent to the content script which writes it to the clipboard and displays a confirmation popup.

## Project Structure

```
manifest.json            # Chrome Extension manifest (v3)
background.js            # Service worker — token management, API calls, expression logic
background.min.js        # Minified background script
content.js               # Content script — clipboard, popups, keyboard shortcuts
content.min.js           # Minified content script
```

## Author

**David Wyatt** — [LinkedIn](https://www.linkedin.com/in/wyattdave/) · [Power DevBox](https://powerdevbox.com)

## License

See repository for license details.
