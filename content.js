console.log("Power DevBox-Exception by David Wyatt - https://www.linkedin.com/in/wyattdave/")
const sImg='<img id="pdb_exception" style="height:100%; padding-right:10px" src="data:image/png;base64,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"></img>';
const sPopup='<div id="dPopup" style="z-index:10000; width:300px;height:400px; position: absolute; background-color: #f1f1f1; border: 1px solid #d3d3d3; display:none; overflow-y:auto; overflow-x:hidden; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);"><div id="header" style="padding: 10px;cursor: move;z-index: 10;background-color: #404040;color: #fff; height:40px;">'+sImg+'Power DevBox Exception</div><p>Double click action to add exception expression (clipboard)</p><br><div><ul id="actionlist"></ul></div></div>'
let aActions=[];
let aContainers=[];
let dPopup;
let dCanvas;
let bLoad=false;
let bPopup=false;
let sExpression;
let entryIndex=0;
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
        alert(request.popup);
      }
      dPopup=document.querySelector('[id="dPopup"]');
      if(dPopup){
        dPopup.remove
      }  
      if(document.querySelector('[id="pdb_exception"]')){
        document.querySelector('[id="pdb_exception"]').remove();
      }    
    }
    if(request.message =="popup"){
      alert(request.popup);
    }    
    if(bClassicUI){  
      const dAddition=document.querySelector('[id="pdb_exception"]');
      if(dAddition==undefined || dAddition==null){
        const dContainer=document.querySelector('[id*="OfficeHeaderSearchBox_container"]');         
        if(bClassicUI){
          dContainer.insertAdjacentHTML('beforeend', '<div style="vertical-align: middle; height:60%;">'+sImg+'</div>');
        }else{
          dContainer.insertAdjacentHTML('beforeend', '<div style="vertical-align: middle; height:60%; margin-top:10px;">'+sImg+'</div>');
        }      
        const dAddition=document.querySelector('[id="pdb_exception"]');
        dAddition.addEventListener("click", showPopup);
        if(bClassicUI){
          dCanvas=document.querySelector('[class="flow-designer-container"]');        
        }else{
          dCanvas=document.querySelector('[class="msla-designer-canvas msla-panel-mode"]');   
        }      
        dCanvas.insertAdjacentHTML('beforeend', sPopup);
        dPopup=document.querySelector('[id="dPopup"]');
        dragElement(dPopup);        
      }else{
        console.log("already added")
      }    
    }
  }
)

function showPopup() { 
  if(dPopup.style.display == "block"){
    dPopup.style.display = "none";
    bPopup=false;
  }else{
    dPopup.style.display = "block";
    dPopup.style.top="580px";
    dPopup.style.left="2px";
    bPopup=true;
    navigator.clipboard.writeText("Powerdevbox.com");
    aActions.forEach(item =>{
      remove(item);
    });    
  } 
  if(!bLoad){
    addEventListener("dblclick", (event) => {

      if((event.target.outerHTML.includes("msla-card-title")||event.target.outerHTML.includes("panel-msla-title")  )&& bPopup){
        const sName=convertToName(event.target.innerText);
        if(!aActions.includes(sName) && !sExpression.includes('"'+sName+'":')){
          aActions.push(sName);
          let node = document.createElement("li");
          node.innerHTML=sName;
          node.id=sName;                                 
          node.value = entryIndex;
          document.getElementById("actionlist").appendChild(node);
          node.addEventListener("click", function () {
            remove( this.getAttribute('id'));;
          });
          entryIndex++;
          chrome.runtime.sendMessage({ message: "actions",containers:aContainers,actions:aActions }, 
            function (response) {
              console.log(response);
            }
          )
        }
      }
    });
    bLoad=true;
  }
}

function remove(action){
  const sRemove = aActions.splice(aActions.indexOf(action), 1);
  document.getElementById(action).remove();
  chrome.runtime.sendMessage({ message: "actions",containers:aContainers,actions:aActions }, 
    function (response) {
      console.log(response);
    }
  )
}

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'e') {
    const textToCopy = "@{concat('https://make.powerautomate.com/manage/environments/', workflow()?['tags']?['environmentName'], '/flows/', workflow()?['name'], '/runs/', workflow()?['run']['name'])}";
    navigator.clipboard.writeText(textToCopy).then(function() {
      console.log('Text copied to clipboard');
    }).catch(function(err) {
      console.error('Could not copy text: ', err);
    });
    event.preventDefault(); // Prevent the default action to avoid any unwanted behavior
  }
});

function dragElement(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function convertToName(str){
  return str.replaceAll(' ','_')
}