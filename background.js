let sActiveTab;
let sFlowAPI="";
let sAPIflow="";
let flowIdMatch ="";
let envirIdMatch="";
const apiUrl = 'https://us.api.flow.microsoft.com/providers/Microsoft.ProcessSimple';
const apiUrlQuery='?api-version=2016-11-01&$expand=swagger,properties.connectionreferences.apidefinition,properties.definitionSummary.operations.apiOperation,operationDefinition,plan,properties.throttleData,properties.estimatedsuspensiondata';
const regExFlow=new RegExp( '/flows\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
const regExEnvir=new RegExp( '/environments\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
const regExEnvirD=new RegExp( '/environments\/Default-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
//const sExcepExpressionTemplate="@{split(split(replace(replace(replace(concat({containers}),'\"Message\":','\"message\":'),'\"message\":\"An action failed. No dependent actions succeeded','¬'),'essage\":\"The execution of template ','¬'),'essage\":\"')[1],'\"')[0]}"
const sExcepExpressionTemplate=
"@{xpath(xml(json(concat('{\"data\": {',<container>,'}}'))),'string(//message[not(contains(.,''The execution of template action'')) and not(contains(.,''skipped:''))  and not(contains(.,''An action failed. No dependent actions succeeded.''))])')}";

  chrome.action.onClicked.addListener((tab) => {
    if(sFlowAPI!="" && flowIdMatch!=""){
      getActions();
    }
  });

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, info) {
    if(sActiveTab!=tabId && changeInfo.status == "complete"){
        chrome.scripting.executeScript({target: {tabId: tabId}, files: ['content.js']})
    }
    sActiveTab=tabId;
    flowIdMatch = info.url.match(regExFlow);
    if(!flowIdMatch){flowIdMatch=sAPIflow}
    if(flowIdMatch!=""){
      envirIdMatch = info.url.match(regExEnvir);
      if(!envirIdMatch){
          envirIdMatch=info.url.match(regExEnvirD)[0];
      }
    }
  })

  chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    const flowIdMatch = details.url.match(regExFlow);
    if(flowIdMatch){sAPIflow=flowIdMatch}
    if(!sActiveTab){sActiveTab=details.tabId}
    if (details.tabId == sActiveTab)  { 
        for(var i = 0; i < details.requestHeaders.length;i++) {
        if(details.requestHeaders[i].name.toLowerCase() == "authorization"){
          sFlowAPI=details.requestHeaders[i].value      
        }
      }
    }
  }, 
    { urls: ["https://*.api.flow.microsoft.com/*","https://make.powerautomate.com/*","https://make.powerApps.com/*","https://make.powerApps.com/*"] },
    ["requestHeaders", "extraHeaders"]
  );

  function getActions(){
    const sApiUrl=apiUrl+envirIdMatch+flowIdMatch+apiUrlQuery
    fetchAPIData(sApiUrl, sFlowAPI)
    .then(data => {
      const aActions=getChildren (data.properties.definition,new Array(),0,"root");
      console.log(aActions)
      let sContainers="";
      let sListContainers="";
      const aContainers=aActions.filter(item =>{
        return (item.type=="Scope" ||  item.type=="Foreach" ||  item.type=="Switch"||  item.type=="If" ||  item.type=="Until") && !item.operationName.toLowerCase().includes("exception")
      })
      aContainers.forEach(item =>{
        //sContainers+=("string(result('"+item.operationName+"')),")
        sContainers+="'\""+item.operationName+"\":',result('"+item.operationName+"'),',',";
        sListContainers+=item.operationName+"\n"
      })
      const sExcepExpression=sExcepExpressionTemplate.replace('<container>',sContainers.substring(0,sContainers.length-1))
      chrome.tabs.sendMessage(sActiveTab, {message:"clipboard",data:sExcepExpression,containers:sListContainers.substring(0,sContainers.length-1)},
        function(response){
          console.log(response);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });   
  }

  function getChildren(object,aReturn,nested,sParent){
    let parent;
    if(isObject(sParent)){
      parent=sParent.operationName
    }else{
      parent=sParent
    }
    if(object?.actions!= undefined){
      const keys = Object.keys(object.actions);
      keys.forEach((key) => {
        let value = object.actions[key];
        value.operationName=key;
        value.nestedLevel=nested,
        value.parent=parent,
        value.branch="Yes"
        aReturn.push(value);
        aReturn=getChildren(value,aReturn,nested+1,key)
      });
    }
    if(object?.else!= undefined){
      const keys = Object.keys(object.else.actions);
      keys.forEach((key) => {
        let value = object.else.actions[key];
        value.operationName=key;
        value.nestedLevel=nested,
        value.parent=parent,
        value.branch="No"
        aReturn.push(value);
        aReturn=getChildren(value,aReturn,nested+1,key)
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
          value2.nestedLevel=nested,
          value2.parent=parent,
          value2.branch=key
          aReturn.push(value2);
          aReturn=getChildren(value2,aReturn,nested+1,key2)
        })
      });
      const keysDef = Object.keys(object.default.actions);
      keysDef.forEach((keyDef) => {
        let valueDefault=object.default.actions[keyDef];
        valueDefault.operationName=keyDef;
        valueDefault.nestedLevel=nested,
        valueDefault.parent=parent,
        valueDefault.branch="Default"
        aReturn.push(valueDefault);
        aReturn=getChildren(valueDefault,aReturn,nested+1,valueDefault)
      })
      
    }
    return aReturn
  }

  function isObject(objValue) {
    return objValue && typeof objValue === 'object' && objValue.constructor === Object;
  }

  async function fetchAPIData(url, token) {
    try {
      const options = {
        headers: {
          Authorization: token,
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
    }
  }
  