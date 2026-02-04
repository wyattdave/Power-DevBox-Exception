console.log("Power DevBox-Exception by David Wyatt - https://www.linkedin.com/in/wyattdave/")
let aActions=[];
let aContainers=[];
let bLoad=false;
let bPopup=false;
let sExpression;
let entryIndex=0;

// Keyboard listener for Ctrl+M to toggle New Mode
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key.toLowerCase() === 'm') {
    event.preventDefault();
    chrome.runtime.sendMessage({ message: "toggleNewMode" }, function(response) {
      if (response && response.newMode !== undefined) {
        const modeName = response.newMode ? 'New Mode' : 'Legacy Mode';
        showPowerAutomatePopup('Mode set to: ' + modeName, 'info');
      }
    });
  }
});

// Power Automate themed popup
function showPowerAutomatePopup(message, type = 'info') {
  // Remove any existing popup
  const existingPopup = document.getElementById('powerdevbox-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'powerdevbox-popup';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: "Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
  `;

  // Determine icon and color based on type
  let iconColor, iconSvg, headerBg;
  switch(type) {
    case 'success':
      iconColor = '#2A64F6';
      headerBg = 'linear-gradient(135deg, #2A64F6 0%, #1A4ED6 100%)';
      iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/></svg>`;
      break;
    case 'error':
      iconColor = '#D13438';
      headerBg = 'linear-gradient(135deg, #D13438 0%, #A4262C 100%)';
      iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="white"/></svg>`;
      break;
    default:
      iconColor = '#0078D4';
      headerBg = 'linear-gradient(135deg, #0078D4 0%, #106EBE 100%)';
      iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="white"/></svg>`;
  }

  // Create popup container
  const popup = document.createElement('div');
  popup.style.cssText = `
    background: white;
    border-radius: 8px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
    max-width: 420px;
    min-width: 320px;
    overflow: hidden;
    animation: powerdevbox-slideIn 0.2s ease-out;
  `;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes powerdevbox-slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    background: ${headerBg};
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  const iconContainer = document.createElement('div');
  iconContainer.innerHTML = iconSvg;
  iconContainer.style.cssText = `display: flex; align-items: center;`;

  const title = document.createElement('div');
  title.textContent = 'Power DevBox Exception';
  title.style.cssText = `
    color: white;
    font-size: 16px;
    font-weight: 600;
    flex: 1;
  `;

  header.appendChild(iconContainer);
  header.appendChild(title);

  // Create body
  const body = document.createElement('div');
  body.style.cssText = `
    padding: 20px;
    color: #323130;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
  `;
  body.textContent = message;

  // Create footer
  const footer = document.createElement('div');
  footer.style.cssText = `
    padding: 12px 20px;
    background: #FAF9F8;
    border-top: 1px solid #EDEBE9;
    display: flex;
    justify-content: flex-end;
  `;

  const okButton = document.createElement('button');
  okButton.textContent = 'OK';
  okButton.style.cssText = `
    background: #2A64F6;
    color: white;
    border: none;
    padding: 8px 24px;
    border-radius: 2px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.1s ease;
    font-family: inherit;
  `;
  okButton.onmouseover = () => okButton.style.background = '#1A4ED6';
  okButton.onmouseout = () => okButton.style.background = '#2A64F6';
  okButton.onclick = () => {
    overlay.remove();
    style.remove();
  };

  footer.appendChild(okButton);

  // Assemble popup
  popup.appendChild(header);
  popup.appendChild(body);
  popup.appendChild(footer);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
      style.remove();
    }
  };

  // Close on Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      style.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Focus the OK button
  okButton.focus();
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    if(request.message=="environment"){
      sendResponse(window.location.href);
    }

    sendResponse("received")
    const bClassicUI=window.location.href.includes("v3=false");
    if(request.message =="clipboard"){
      aContainers=request.array;
      sExpression=request.data;
      navigator.clipboard.writeText(request.data);
      if(request.popup!=""){
        showPowerAutomatePopup(request.popup, 'success');
      }
    }
    if(request.message =="popup"){
      showPowerAutomatePopup(request.popup, request.popup.toLowerCase().includes('error') ? 'error' : 'info');
    }    
  }
)



document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'e') {
    const textToCopy = "@{concat('https://make.powerautomate.com/manage/environments/', workflow()?['tags']?['environmentName'], '/flows/', workflow()?['name'], '/runs/', workflow()?['run']['name'])}";
    navigator.clipboard.writeText(textToCopy).then(function() {
      showPowerAutomatePopup('Flow run link copied to clipboard', 'success');
    }).catch(function(err) {
      console.error('Could not copy text: ', err);
    });
    event.preventDefault(); // Prevent the default action to avoid any unwanted behavior
  }
});
