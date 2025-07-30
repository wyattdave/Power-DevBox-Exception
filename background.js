let sActiveTab;
let sFlowAPI="";
let sAPIflow="";
let timer;
let oReturn;
let bLoading=false;
let apiUrl = 'https://us.api.flow.microsoft.com/providers/Microsoft.ProcessSimple';
const apiUrlQuery='?api-version=2016-11-01&$expand=swagger,properties.connectionreferences.apidefinition,properties.definitionSummary.operations.apiOperation,operationDefinition,plan,properties.throttleData,properties.estimatedsuspensiondata';
const regExFlow=new RegExp( '/flows\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
const regExEnvir=new RegExp( '/environments\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
const regExEnvirD=new RegExp( '/environments\/Default-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
const regExRegion = new RegExp( '^https:\/\/.*\.api\.flow\.microsoft\.com\/providers\/Microsoft\.Process.*');
const regExRegion2 = new RegExp( '^https:\/\/api\.flow\.microsoft\.com\/providers\/Microsoft\.ProcessSimple\/environments');



//const sExcepExpressionTemplate="@{split(split(replace(replace(replace(concat({containers}),'\"Message\":','\"message\":'),'\"message\":\"An action failed. No dependent actions succeeded','¬'),'essage\":\"The execution of template ','¬'),'essage\":\"')[1],'\"')[0]}"
const sExcepExpressionTemplate=
"@{xpath(xml(json(concat('{\"data\": {',<container>,'}}'))),'string(//message[not(contains(.,''The execution of template action'')) and not(contains(.,''skipped:''))  and not(contains(.,''An action failed. No dependent actions succeeded.''))])')}";

  chrome.action.onClicked.addListener((tab) => {
    (async () => {
      const tab = (await chrome.tabs.query({ active: true,lastFocusedWindow: true }))[0]
      if(tab.url.includes("powerautomate.com")){
        sActiveTab=tab.id
        oReturn=getEnvironment(tab.url);
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
    if(sFlowAPI!="" && oReturn.flow!="" && oReturn.environment!="" && !bLoading){
      bLoading=true;
      loading();
      getActions();
    }else if(bLoading){
      chrome.tabs.sendMessage(sActiveTab, {message:"popup",data:[],popup:"For more information please visit: www.powerdevbox.com"},
      function(response){
        console.log(response);
      });
    }

    if(sFlowAPI=="" && oReturn.flow!=""  && oReturn.flow!=null){
      chrome.tabs.sendMessage(sActiveTab, {message:"popup",data:[],popup:"Unable to access token, please click save or refresh the browser"},
      function(response){
        console.log(response);
        resetIcon();
      });
    }
    if(oReturn.flow=="" || oReturn.flow==null){
      chrome.tabs.sendMessage(sActiveTab, {message:"popup",data:[],popup:"Unable to identify flow/environment id, please ensure on a flow edit screen"},
      function(response){
        console.log(response);
        resetIcon();
      });
    } 
  }

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
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

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
  const flowIdMatch = details.url.match(regExFlow);
  if(flowIdMatch){sAPIflow=flowIdMatch};
  if(!sActiveTab){sActiveTab=details.tabId}
  if (details.tabId == sActiveTab){ 
    console.log("Active Tab:", details.url);
    if (regExRegion.test(details.url)||regExRegion2.test(details.url)) {
      //apiUrl=details.url.substring(0,67);
      for(var i = 0; i < details.requestHeaders.length;i++) {
        if(details.requestHeaders[i].name.toLowerCase() == "authorization"){
          sFlowAPI=details.requestHeaders[i].value; 
        }
      }
    }
  }
}, 
  { urls: ["https://*.api.flow.microsoft.com/*","https://make.powerautomate.com/*"] },
  ["requestHeaders", "extraHeaders"]
);

function getEnvironment(url){
  let flowIdMatch = url.match(regExFlow);
  if(flowIdMatch){
    let envirIdMatch = url.match(regExEnvir);
    if(!envirIdMatch){
      envirIdMatch=url.match(regExEnvirD);
    }
    if(envirIdMatch){
      return {environment:envirIdMatch[0],flow:flowIdMatch[0]} 
    }else{
      return {environment:"",flow:""}
    }    
  }else{
    return {environment:"",flow:""}
  }  
}

function getActions(){
    const sApiUrl=apiUrl+oReturn.environment+oReturn.flow+apiUrlQuery;    
    fetchAPIData(sApiUrl, sFlowAPI)
    .then(data => {
      if(isObject(data)){
        const aActions=getChildren (data.properties.definition,new Array(),0,"root");    
        const aContainers=aActions.filter(item =>{
          return (item.type=="Scope" ||  item.type=="Foreach" ||  item.type=="Switch"||  item.type=="If" ||  item.type=="Until") && !item.operationName.toLowerCase().includes("exception")
        })

        const oContainers=createExpression(aContainers,[]);
        const sPopup="Please note only shows since last saved/publishd.\nExpression added to clipboard ready to paste.\nContainers:\n"+oContainers.list;
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
  if(aActions.length>0){
    aActions.forEach(item =>{
      sContainers+="'\""+item+"\":',actions('"+item+"'),',',";
      sListContainers+="*"+item+"\n";
      sContainers+="'\""+item+"-O\":',outputs('"+item+"'),',',";
      sListContainers+="*"+item+"\n";
    })
  }

  return {
    "expression":sExcepExpressionTemplate.replace('<container>',sContainers.substring(0,sContainers.length-1)),
    "list":sListContainers.substring(0,sListContainers.length-1)
  }
}

  function sendError(error){
    console.log(sActiveTab,error);
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
  