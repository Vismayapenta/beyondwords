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
    
    if(request.action==="dyslexic"){
        applyDyslexicFont();
    }

});

let dyslexicOn = false;
//dyslexic font 
function applyDyslexicFont(){

    dyslexicOn = !dyslexicOn;

    if(dyslexicOn){

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap";
        document.head.appendChild(link);

        document.body.style.fontFamily = "'Atkinson Hyperlegible', italic, sans-serif";

        document.body.style.letterSpacing = "1.5px";
        document.body.style.lineHeight = "2";
        document.body.style.fontSize = "20px";

    } else {
        document.body.style.fontFamily = "";
        document.body.style.letterSpacing = "";
        document.body.style.lineHeight = "";
        document.body.style.fontSize = "";
    }
}
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
let currentLine = 0;
let lineDivs = [];


function startReading() {
    stopReading();

    // Extract main content
    let paragraphs = document.querySelectorAll("article p, main p, p");
    let text = "";
    paragraphs.forEach(p => {
        if (p.innerText.length > 50) text += p.innerText + "\n";
    });
    if (!text) text = document.body.innerText;

    const lines = text.split("\n").filter(l => l.trim().length > 30);

    // Fullscreen reader box
    const readerBox = document.createElement("div");
    readerBox.id = "neuro-reader";
    Object.assign(readerBox.style, {
        position: "fixed", top: "0", left: "0",
        width: "100vw", height: "100vh",
        background: "#1a1a2e", padding: "60px 80px",
        overflow: "auto", zIndex: "999999",
        fontSize: "26px", lineHeight: "2.5",
        fontFamily: "'Arial', sans-serif", boxSizing: "border-box"
    });

    // Each line: wrap every word in a <span>
    readerBox.innerHTML = lines.map((line, i) =>
        `<div class="line" data-index="${i}" style="
            margin-bottom: 10px;
            border-radius: 12px;
            padding: 10px 16px;
            transition: filter 0.3s, opacity 0.3s;
        ">
            ${line.trim().split(" ").map(word =>
                `<span class="word" style="
                    display: inline-block;
                    margin-right: 6px;
                    border-radius: 4px;
                    padding: 0 3px;
                    color: #ccc;
                ">${word}</span>`
            ).join("")}
        </div>`
    ).join("");

    document.body.appendChild(readerBox);
    lineDivs = Array.from(readerBox.querySelectorAll(".line"));
    currentLine = 0;

    function applyBlurToAll() {
    lineDivs.forEach(div => {
        div.style.filter = "blur(12px)";   // stronger blur
        div.style.opacity = "0.03";         // almost invisible
        div.style.transform = "scale(0.97)";
        div.style.background = "transparent";
        div.querySelectorAll(".word").forEach(w => {
            w.style.background = "transparent";
            w.style.color = "#555";
        });
    });
}

    function highlightLine(index) {
        const active = lineDivs[index];
        if (!active) return;

        active.style.filter = "none";
        active.style.opacity = "1";
        active.style.transform = "scale(1)";
        active.style.background = "#16213e"; // dark highlight band

        // Reset word colors for this line to readable
        active.querySelectorAll(".word").forEach(w => {
            w.style.color = "#e0e0e0";
            w.style.background = "transparent";
        });

        active.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function highlightWord(lineIndex, wordIndex) {
        const active = lineDivs[lineIndex];
        if (!active) return;

        const words = active.querySelectorAll(".word");

        // Reset previous word
        words.forEach(w => {
            w.style.background = "transparent";
            w.style.color = "#e0e0e0";
        });

        // Highlight current word
        if (words[wordIndex]) {
            words[wordIndex].style.background = "#f9ca24"; // yellow highlight
            words[wordIndex].style.color = "#1a1a2e";      // dark text on yellow
            words[wordIndex].style.borderRadius = "4px";
        }
    }

    function speakLine() {
        if (currentLine >= lines.length) return;

        applyBlurToAll();
        highlightLine(currentLine);

        const lineText = lines[currentLine].trim();
        const words = lineText.split(" ");

        speech = new SpeechSynthesisUtterance(lineText);
        speech.rate = 0.85;
        speech.lang = "en-US";

        // ✅ Word-level highlighting via boundary event
        speech.onboundary = (event) => {
            if (event.name === "word") {
                // Count which word we're on by char index
                let charCount = 0;
                let wordIdx = 0;
                for (let i = 0; i < words.length; i++) {
                    if (charCount >= event.charIndex) { wordIdx = i; break; }
                    charCount += words[i].length + 1; // +1 for space
                }
                highlightWord(currentLine, wordIdx);
            }
        };

        speech.onend = () => {
            currentLine++;
            speakLine();
        };

        speechSynthesis.speak(speech);
    }

    speakLine();
}

function stopReading() {
    speechSynthesis.cancel();
    const box = document.getElementById("neuro-reader");
    if (box) box.remove();
    currentLine = 0;
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
           ="+apiKey,
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
