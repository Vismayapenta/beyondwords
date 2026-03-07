chrome.runtime.onMessage.addListener((request) => {

    if(request.action === "bionic"){
        bionicReading();
    }

    if(request.action === "focus"){
        focusMode();
    }

    if(request.action === "read"){
        startReading();
    }

    if(request.action === "stop"){
        stopReading();
    }

    if(request.action === "summarize"){
        summarizeText();
    }

});

// ================= BIONIC READING =================
function bionicReading(){

    const paragraphs = document.querySelectorAll("p, li");

    paragraphs.forEach(p=>{
        if(!p.innerText || p.dataset.bionicApplied) return;

        const words = p.innerText.split(" ");

        const newText = words.map(word=>{
            let mid = Math.ceil(word.length/2);
            return "<b>"+word.slice(0,mid)+"</b>"+word.slice(mid);
        }).join(" ");

        p.innerHTML = newText;
        p.dataset.bionicApplied = "true";
    });

}

// ================= FOCUS MODE =================
function focusMode(){

    document.querySelectorAll(
        "nav,aside,footer,header,form,iframe,.ads,.advertisement"
    ).forEach(el=>el.remove());

    document.body.style.maxWidth = "700px";
    document.body.style.margin = "auto";
    document.body.style.padding = "40px";
    document.body.style.fontSize = "20px";
    document.body.style.lineHeight = "1.9";
    document.body.style.background = "#ffffff";

}

// ================= READ ALOUD =================
let speech = null;
let wordSpans = [];
let currentIndex = 0;

function startReading(){

    if(document.getElementById("neuro-reader")){
        return;
    }

    stopReading();

    const text = document.body.innerText;

    const words = text.split(" ");

    const readerBox = document.createElement("div");
    readerBox.id = "neuro-reader";

    readerBox.style.position = "fixed";
    readerBox.style.bottom = "20px";
    readerBox.style.left = "20px";
    readerBox.style.right = "20px";
    readerBox.style.maxHeight = "150px";
    readerBox.style.background = "#ffffff";
    readerBox.style.border = "1px solid #ccc";
    readerBox.style.padding = "15px";
    readerBox.style.overflow = "auto";
    readerBox.style.zIndex = "999999";

    readerBox.innerHTML = words.map(w=>`<span>${w}</span>`).join(" ");

    document.body.appendChild(readerBox);

    wordSpans = readerBox.querySelectorAll("span");

    speech = new SpeechSynthesisUtterance(text);
    speech.rate = 0.9;

    speech.onboundary = function(event){

        if(event.name === "word"){

            if(wordSpans[currentIndex]){
                wordSpans[currentIndex].style.background="yellow";
            }

            if(wordSpans[currentIndex-1]){
                wordSpans[currentIndex-1].style.background="transparent";
            }

            currentIndex++;
        }
    };

    speechSynthesis.speak(speech);
}

function stopReading(){
    speechSynthesis.cancel();
    currentIndex = 0;

    const box = document.getElementById("neuro-reader");
    if(box) box.remove();
}

// ================= AI SUMMARY =================

async function summarizeText(){

    try{

        let text = "";

        document.querySelectorAll("p").forEach(p=>{
            if(p.innerText.length > 20){
                text += p.innerText + " ";
            }
        });

        text = text.substring(0,3500);

        const apiKey = "";

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key="+apiKey,
            {
                method:"POST",
                headers:{ "Content-Type":"application/json" },

                body:JSON.stringify({
                    contents:[{
                        parts:[{
                            text:"Summarize this webpage into 5 simple bullet points:\n\n"+text
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        let result = "";

        if(data?.candidates?.[0]?.content?.parts?.[0]?.text){
            result = data.candidates[0].content.parts[0].text;
        }

        if(!result.trim()){
            alert("AI summary failed.");
            return;
        }

        showSummaryDialog(result);

    }
    catch(e){
        console.error(e);
        alert("Gemini summarizer failed.");
    }
}

// ================= SUMMARY DIALOG BOX =================

function showSummaryDialog(summaryText){

    if(document.getElementById("neuro-summary-dialog")){
        return;
    }

    const dialog = document.createElement("div");
    dialog.id = "neuro-summary-dialog";

    dialog.style.position = "fixed";
    dialog.style.top = "50%";
    dialog.style.left = "50%";
    dialog.style.transform = "translate(-50%, -50%)";

    dialog.style.width = "400px";
    dialog.style.maxHeight = "500px";
    dialog.style.overflow = "auto";

    dialog.style.background = "white";
    dialog.style.boxShadow = "0 0 20px rgba(0,0,0,0.3)";
    dialog.style.borderRadius = "12px";
    dialog.style.padding = "20px";
    dialog.style.zIndex = "999999";

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Close";
    closeBtn.onclick = ()=>dialog.remove();
    closeBtn.style.float = "right";

    const title = document.createElement("h3");
    title.innerText = "NeuroFlow AI Summary";

    const content = document.createElement("div");

    content.innerHTML = bionicText(
        summaryText.split("\n").map(l=>"• "+l).join("<br>")
    );

    dialog.appendChild(closeBtn);
    dialog.appendChild(title);
    dialog.appendChild(content);

    document.body.appendChild(dialog);
}

// ================= BIONIC TEXT FORMAT =================
function bionicText(text){

    return text.split(" ").map(word=>{
        let mid = Math.ceil(word.length/2);
        return "<b>"+word.slice(0,mid)+"</b>"+word.slice(mid);
    }).join(" ");


}
