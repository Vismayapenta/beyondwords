function sendAction(action){

chrome.tabs.query({active:true,currentWindow:true},function(tabs){

chrome.tabs.sendMessage(
tabs[0].id,
{action:action}
);

});

}
document.getElementById("dyslexic").onclick=()=>sendAction("dyslexic");

document.getElementById("bionic").onclick=()=>sendAction("bionic");

document.getElementById("focus").onclick=()=>sendAction("focus");

document.getElementById("read").onclick=()=>sendAction("read");

document.getElementById("stop").onclick=()=>sendAction("stop");

document.getElementById("summary").onclick=()=>sendAction("summarize"); 
