console.log("Power DevBox-Exception by David Wyatt - https://www.linkedin.com/in/wyattdave/")
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      sendResponse("received")
      if(request.message =="clipboard"){
        navigator.clipboard.writeText(request.data);
        alert("Added to clipboard.\nContainers:\n"+request.containers)
      }
})


