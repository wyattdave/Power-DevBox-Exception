console.log("Power DevBox-Exception by David Wyatt - https://www.linkedin.com/in/wyattdave/")
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      sendResponse("received")
      if(request.message =="clipboard"){
        navigator.clipboard.writeText(request.data);
        alert(request.popup)
      }
      if(request.message =="popup"){
        alert(request.popup)
      }
})


