let sActiveTab;
let bNewMode=false;
let sFlowAPI="";
let sAPIflow="";
let timer;
let oReturn;
let bLoading=false;
let apiUrl = 'dynamics.com';
let tokenExpiry = null; // Timestamp when the token expires

// Token Management Constants
const TOKEN_CHECK_ALARM = 'tokenCheckAlarm';
const TOKEN_STORAGE_KEY = 'flowApiToken';
const TOKEN_EXPIRY_STORAGE_KEY = 'flowApiTokenExpiry';
const TOKEN_CHECK_INTERVAL_MINUTES = 5;
const TOKEN_EXPIRY_BUFFER_SECONDS = 60; // Consider token expired 60 seconds before actual expiry
const NEW_MODE_STORAGE_KEY = 'newModeEnabled';

// Parse JWT token to extract expiry time
function parseJwtExpiry(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    
    // Remove 'Bearer ' prefix if present
    const tokenValue = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    // JWT has 3 parts separated by dots
    const parts = tokenValue.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Return the expiry timestamp (exp is in seconds, convert to milliseconds)
    if (payload.exp) {
      return payload.exp * 1000;
    }
    return null;
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}

// Check if token is still valid
function isTokenValid() {
  if (!sFlowAPI || !tokenExpiry) return false;
  const now = Date.now();
  return tokenExpiry > (now + TOKEN_EXPIRY_BUFFER_SECONDS * 1000);
}

// Get token status information
function getTokenStatus() {
  const now = Date.now();
  const hasToken = !!sFlowAPI;
  const isValid = isTokenValid();
  const minutesRemaining = tokenExpiry ? Math.max(0, Math.floor((tokenExpiry - now) / 60000)) : 0;
  
  return {
    hasToken,
    isValid,
    minutesRemaining,
    expiryTime: tokenExpiry ? new Date(tokenExpiry).toISOString() : null
  };
}

// Save token to persistent storage
async function saveTokenToStorage() {
  try {
    await chrome.storage.local.set({
      [TOKEN_STORAGE_KEY]: sFlowAPI,
      [TOKEN_EXPIRY_STORAGE_KEY]: tokenExpiry
    });
  } catch (error) {
    console.error('Error saving token to storage:', error);
  }
}

// Restore token from persistent storage
async function restoreTokenFromStorage() {
  try {
    const result = await chrome.storage.local.get([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_STORAGE_KEY]);
    if (result[TOKEN_STORAGE_KEY] && result[TOKEN_EXPIRY_STORAGE_KEY]) {
      const storedExpiry = result[TOKEN_EXPIRY_STORAGE_KEY];
      const now = Date.now();
      
      // Only restore if token is still valid
      if (storedExpiry > (now + TOKEN_EXPIRY_BUFFER_SECONDS * 1000)) {
        sFlowAPI = result[TOKEN_STORAGE_KEY];
        tokenExpiry = storedExpiry;
        console.log('Token restored from storage, expires in', Math.floor((tokenExpiry - now) / 60000), 'minutes');
        updateBadge();
        return true;
      } else {
        console.log('Stored token has expired, clearing storage');
        await clearTokenFromStorage();
      }
    }
    return false;
  } catch (error) {
    console.error('Error restoring token from storage:', error);
    return false;
  }
}

// Clear token from storage
async function clearTokenFromStorage() {
  try {
    await chrome.storage.local.remove([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_STORAGE_KEY]);
    console.log('Token cleared from storage');
  } catch (error) {
    console.error('Error clearing token from storage:', error);
  }
}

// Invalidate expired token
async function invalidateExpiredToken() {
  sFlowAPI = "";
  tokenExpiry = null;
  await clearTokenFromStorage();
  updateBadge();
}

// Update badge to show token status
function updateBadge() {
  if (!sFlowAPI || !isTokenValid()) {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    chrome.action.setTitle({ title: 'Token expired or missing - refresh the page' });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'Power DevBox Exceptions' });
  }
}

// Periodic token check handler
async function checkTokenStatus() {
  const status = getTokenStatus();
  console.log('Token status:', status);
  
  if (status.hasToken && !status.isValid) {
    await invalidateExpiredToken();
  }
  updateBadge();
}

// Setup periodic token check alarm
async function setupTokenCheckAlarm() {
  try {
    // Clear any existing alarm
    await chrome.alarms.clear(TOKEN_CHECK_ALARM);
    
    // Create new alarm that fires every TOKEN_CHECK_INTERVAL_MINUTES
    await chrome.alarms.create(TOKEN_CHECK_ALARM, {
      periodInMinutes: TOKEN_CHECK_INTERVAL_MINUTES
    });

  } catch (error) {
    console.error('Error setting up token check alarm:', error);
  }
}

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === TOKEN_CHECK_ALARM) {
    checkTokenStatus();
  }
});


// Initialize token management on service worker startup
(async function initializeTokenManagement() {
  await restoreTokenFromStorage();
  await restoreNewModeFromStorage();
  await setupTokenCheckAlarm();
  updateBadge();
})();

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    if (details.url.includes("dynamics.com")) {
      if(details.url.includes("workflows(")){
          sAPIflow=details.url.match(regExFlow)[0];
          apiUrl=details.url.split(")")[0]+")";
      }
      for(let i = 0; i < details.requestHeaders.length;i++) {
        if(details.requestHeaders[i].name.toLowerCase() == "authorization"){
          const newToken = details.requestHeaders[i].value;
          
          // Only update if we got a new token
          if (newToken && newToken !== sFlowAPI) {
            sFlowAPI = newToken;
            
            // Parse the JWT to get expiry time
            const expiry = parseJwtExpiry(newToken);
            if (expiry) {
              tokenExpiry = expiry;
              console.log('New token captured, expires at:', new Date(tokenExpiry).toISOString());
              
              // Save to persistent storage
              saveTokenToStorage();
            }
            
            // Update badge to show valid token status
            updateBadge();
          }
        }
      }
    
  }
}, 
  { urls: ["https://*.dynamics.com/*"] },
  ["requestHeaders", "extraHeaders"]
);

///////////////"https://*.api.flow.microsoft.com/*"
// Save bNewMode to storage
async function saveNewModeToStorage() {
  try {
    await chrome.storage.local.set({ [NEW_MODE_STORAGE_KEY]: bNewMode });
  } catch (error) {
    console.error('Error saving new mode to storage:', error);
  }
}

// Restore bNewMode from storage
async function restoreNewModeFromStorage() {
  try {
    const result = await chrome.storage.local.get([NEW_MODE_STORAGE_KEY]);
    if (result[NEW_MODE_STORAGE_KEY] !== undefined) {
      bNewMode = result[NEW_MODE_STORAGE_KEY];
    }
  } catch (error) {
    console.error('Error restoring new mode from storage:', error);
  }
}

const regExFlow = new RegExp('workflows\\(([0-9a-fA-F-]{36})\\)');
//const sExcepExpressionTemplate="@{split(split(replace(replace(replace(concat({containers}),'\"Message\":','\"message\":'),'\"message\":\"An action failed. No dependent actions succeeded','¬'),'essage\":\"The execution of template ','¬'),'essage\":\"')[1],'\"')[0]"
const sExcepExpressionTemplate=
"@{xpath(xml(json(concat('{\"data\": {',<container>,'}}'))),'string(//message[not(contains(.,''The execution of template action'')) and not(contains(.,''skipped:''))  and not(contains(.,''An action failed. No dependent actions succeeded.''))])')}";

  chrome.action.onClicked.addListener((tab) => {
    (async () => {
      const tab = (await chrome.tabs.query({ active: true,lastFocusedWindow: true }))[0]
      if(tab.url.includes("powerautomate.com")){
        sActiveTab=tab.id
        if(tab.status == "complete"){

          try {
            await chrome.tabs.sendMessage(sActiveTab, {message: "ping"});
            
            getDetails();
          } catch (error) {
            
            chrome.scripting.executeScript({target: {tabId: sActiveTab}, files: ['content.js']});
            getDetails();
          }
        }else{
          getDetails()
        }  
      }
    })(); 
  });


  function getDetails(){
    if(sFlowAPI!="" && sAPIflow!="" && !bLoading){
      bLoading=true;
      loading();
      getActions();
    }else if(bLoading){
      chrome.tabs.sendMessage(sActiveTab, {message:"popup",data:[],popup:"For more information please visit: www.powerdevbox.com"},
      function(response){
      });
    }

    if(sFlowAPI=="" && sAPIflow!=""  && sAPIflow!=null){
      chrome.tabs.sendMessage(sActiveTab, {message:"popup",data:[],popup:"Unable to access token, please click save or refresh the browser"},
      function(response){
    
        resetIcon();
      });
    }
    if(sAPIflow=="" || sAPIflow==null){
      chrome.tabs.sendMessage(sActiveTab, {message:"popup",data:[],popup:"Unable to identify flow id, please ensure on a flow edit screen"},
      function(response){
    
        resetIcon();
      });
    } 
  }

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if(request.message === "getTokenStatus"){
        const status = getTokenStatus();
        sendResponse(status);
        return true;
      }
      if(request.message === "toggleNewMode"){
        bNewMode = !bNewMode;
        saveNewModeToStorage();
        sendResponse({ newMode: bNewMode });
        return true;
      }
      sendResponse("received")
      if(request.message =="actions"){
        const oContainers=createExpression(request.containers,request.actions);
        const sPopup="Please note only shows since last saved/published.\nExpression added to clipboard ready to paste.\nContainers:\n"+oContainers.list;
        const aContainers=request.containers;
        chrome.tabs.sendMessage(sActiveTab, {message:"clipboard",data:oContainers.expression,array:aContainers,popup:""},
          function(response){
            let error = chrome.runtime.lastError;            
            if(error){
              sendError(error)
            }else{
              resetIcon();
            }
        });
      }
    }
  )
  
  function loading(){
    let bTurned=false;
    let iCounter=0
    timer=setInterval(() => {
      if(bTurned){
        chrome.action.setIcon({
          path: "loading up.png"
        });
      }else{
        chrome.action.setIcon({
          path: "loading side.png"
        });
      }
      bTurned=!bTurned;
    if (iCounter>10){   
      resetIcon();     
    }
    iCounter++;
    }, 500);
}

function resetIcon(){
  clearInterval(timer);
  chrome.action.setIcon({
    path: "exception circle 128 v2.png"
  });
  bLoading=false;
}

function getActions(){
    fetchAPIData(apiUrl, sFlowAPI)
    .then(data => {
      if(isObject(data)){
        const oDefinition=JSON.parse(data.clientdata);
        const aActions=getChildren (oDefinition.properties.definition,new Array(),0,"root");    
        const aContainers=aActions.filter(item =>{
          return (item.type=="Scope" ||  item.type=="Foreach" ||  item.type=="Switch"||  item.type=="If" ||  item.type=="Until") && !item.operationName.toLowerCase().includes("exception")
        })

        const aApiActions=aActions.filter(item =>{return item.type=="OpenApiConnection" && !item.operationName.toLowerCase().includes("exception")});
        const oContainers=createExpression(aContainers,aApiActions);
        const sPopup=data.name+"\nPlease note only shows since last saved/publishd.\nExpression added to clipboard ready to paste.\nContainers:\n"+oContainers.list;
        chrome.tabs.sendMessage(sActiveTab, {message:"clipboard",data:oContainers.expression,array:aContainers,popup:sPopup},
        function(response){
          let error = chrome.runtime.lastError;            
          if(error){
            sendError(error)
          }else{
            resetIcon();
          }
      });
      }else{
        sendError(data)
      }     
    })
    .catch(error => {
      console.error('Error:', error);
      sendError(error)
    });  
}

function createExpression(aContainers,aActions){
  let sContainers="";
  let sListContainers="";

  aContainers.forEach(item =>{
      if(!parentIsLoop(item,aContainers) || (!item.children.includes('"type":"Foreach"') && item.type!="Foreach" && item.type!="Until" && !(countParentLoops(item,aContainers,0)>1))){
        sContainers+="'\""+item.operationName+"\":',result('"+item.operationName+"'),',',";
        sListContainers+=item.operationName+"\n"
      } 
  })
  if(aActions.length>0 && bNewMode){
    sListContainers+="\nAPI Actions:\n";
    aActions.forEach(item =>{
      sContainers+="'\""+item.operationName+"\":',actions('"+item.operationName+"'),',',";
      sContainers+="'\""+item.operationName+"-O\":',outputs('"+item.operationName+"'),',',";
      sListContainers+=item.operationName+"\n";
    })
  }

  return {
    "expression":sExcepExpressionTemplate.replace('<container>',sContainers.substring(0,sContainers.length-1)),
    "list":sListContainers.substring(0,sListContainers.length-1)
  }
}

  function sendError(error){
    chrome.tabs.sendMessage(sActiveTab, {message:"clipboard",data:[],popup:'Error:\n'+error},
        function(response){          
          resetIcon();
        });
  }

function parentIsLoop(object,aReturn){
  if(object.parentType=="Foreach" || object.parentType=="Until"){
    return true
  }
  oParent=aReturn.find(item =>{return item.operationName==object.parent})
  if(oParent){  
    return parentIsLoop(oParent,aReturn)
  }
  return false
}

function countParentLoops(object,aReturn, iCount){
  oParent=aReturn.find(item =>{return item.operationName==object.parent})
  if(oParent){  
    if(oParent.type=="Foreach" || oParent.type=="Until"){
      iCount++;
    }
    return countParentLoops(oParent,aReturn,iCount)
  }
  return iCount;
}

  function getChildren(object,aReturn,nested,sParent,sParentType){
    let parent;
    let parentType;
    if(isObject(sParent)){
      parent=sParent.operationName;
      parentType=sParent.type
    }else{
      parent=sParent;
      parentType=sParentType
    }
    if(object?.actions!= undefined){
      const keys = Object.keys(object.actions);
      keys.forEach((key) => {
        let value = object.actions[key];
        value.operationName=key;
        value.nestedLevel=nested;
        value.parent=parent;
        value.parentType=parentType;
        value.branch="Yes";
        if(value?.actions!= undefined){
          value.children=JSON.stringify(value.actions)
        }else{
          value.children="-";
        }
        aReturn.push(value);

        aReturn=getChildren(value,aReturn,nested+1,key,object.actions[key].type);
      });
    }
    if(object?.else!= undefined){
      const keys = Object.keys(object.else.actions);
      keys.forEach((key) => {
        let value = object.else.actions[key];
        value.operationName=key;
        value.nestedLevel=nested;
        value.parent=parent;
        value.parentType=parentType;
        value.branch="No"
        if(value?.actions!= undefined){
          value.children=JSON.stringify(value.actions)
        }else{
          value.children="-";
        }
        aReturn.push(value);
        aReturn=getChildren(value,aReturn,nested+1,key,object.else.actions[key].type);
      });
    }
    
    if(object?.cases!= undefined){
      const keys = Object.keys(object.cases);
      keys.forEach((key) => {
        let value = object.cases[key];     
        const keys2 = Object.keys(value.actions);
        keys2.forEach((key2) => {   
          
          let value2 = object.cases[key].actions[key2];
          value2.operationName=key2;
          value2.nestedLevel=nested;
          value2.parent=parent;
          value2.parentType=parentType;
          value2.branch=key;
          if(value2?.actions!= undefined){
            value2.children=JSON.stringify(value2.actions)
          }else{
            value2.children="-";
          }
          aReturn.push(value2);
          aReturn=getChildren(value2,aReturn,nested+1,key2,object.cases[key].actions[key2].type)
        })
      });
      const keysDef = Object.keys(object.default.actions);
      keysDef.forEach((keyDef) => {
        let valueDefault=object.default.actions[keyDef];
        valueDefault.operationName=keyDef;
        valueDefault.nestedLevel=nested;
        valueDefault.parent=parent;
        valueDefault.parentType=parentType;
        valueDefault.branch="Default";
        if(valueDefault?.actions!= undefined){
          valueDefault.children=JSON.stringify(value.actions)
        }else{
          valueDefault.children="-";
        }
        aReturn.push(valueDefault);
        aReturn=getChildren(valueDefault,aReturn,nested+1,valueDefault,object.default.actions[keyDef].type)
      })
      
    }
    return aReturn;
  }

  function isObject(objValue) {
    return objValue && typeof objValue === 'object' && objValue.constructor === Object;
  }

  async function fetchAPIData(url, token) {
    try {
      const options = {
        headers: {
          Authorization: token
        },
      };
      const response = await fetch(url, options);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching API data:', error);
      return 'Error fetching API data: '+ error
    }
  }
