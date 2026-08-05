const MODEL_URL = "./model/";

let model = null;
let webcam = null;
let labelContainer = null;
let maxPredictions = 0;

const prediction = document.getElementById("prediction");
const accuracy = document.getElementById("accuracy");
const progressBar = document.getElementById("progressBar");
const history = document.getElementById("history");

document.getElementById("startBtn").addEventListener("click", init);
document.getElementById("captureBtn").addEventListener("click", detect);
document.getElementById("uploadImage").addEventListener("change", uploadImage);

async function loadModel(){

    if(model) return;

    try{

        model = await tmImage.load(
            MODEL_URL + "model.json",
            MODEL_URL + "metadata.json"
        );

        prepareLabels();

    }catch(err){

        console.error(err);
        alert("Failed To Load Model");

    }

}

async function init(){

    await loadModel();

    if(!model) return;

    webcam = new tmImage.Webcam(420,420,true);

    await webcam.setup();

    await webcam.play();

    document.getElementById("webcam-container").innerHTML="";

    document.getElementById("webcam-container").appendChild(webcam.canvas);

    window.requestAnimationFrame(loop);

}

async function loop(){

    webcam.update();

    window.requestAnimationFrame(loop);

}

async function detect(){

    if(!model){

        alert("Model Not Loaded");

        return;

    }

    if(!webcam){

        alert("Start Camera First");

        return;

    }

    const predictions = await model.predict(webcam.canvas);

    show(predictions);

}

async function uploadImage(e){

    await loadModel();

    if(!model) return;

    const file = e.target.files[0];

    if(!file) return;

    const img = new Image();

    img.onload = async ()=>{

        const predictions = await model.predict(img);

        show(predictions);

        window.URL.revokeObjectURL(img.src);

    };

    img.src = window.URL.createObjectURL(file);

}

function prepareLabels(){

    labelContainer = document.getElementById("label-container");

    labelContainer.innerHTML = "";

    maxPredictions = model.getTotalClasses();

    for(let i=0;i<maxPredictions;i++){

        const div=document.createElement("div");

        div.className="classItem";

        div.innerHTML=`

            <div class="classHead">

                <span></span>

                <span></span>

            </div>

            <div class="bar">

                <div class="fill"></div>

            </div>

        `;

        labelContainer.appendChild(div);

    }

}

function show(predictions){

    predictions.sort((a,b)=>b.probability-a.probability);

    const best = predictions[0];

    const percent = (best.probability*100).toFixed(2);

    prediction.innerHTML = `
        ${icon(best.className)}
        <br>
        ${best.className}
    `;

    accuracy.innerHTML = percent + "%";

    progressBar.style.width = percent + "%";

    predictions.forEach((item,index)=>{

        const row = labelContainer.children[index];

        if(!row) return;

        const title = row.querySelector(".classHead span:first-child");

        const value = row.querySelector(".classHead span:last-child");

        const fill = row.querySelector(".fill");

        title.innerHTML =
            `${icon(item.className)} ${item.className}`;

        value.innerHTML =
            (item.probability*100).toFixed(2)+"%";

        fill.style.width =
            (item.probability*100)+"%";

    });

    const li=document.createElement("li");

    li.innerHTML=`
        ${icon(best.className)}
        <b>${best.className}</b>
        <br>
        Confidence : ${percent}%
    `;

    history.prepend(li);

    while(history.children.length>10){

        history.removeChild(history.lastChild);

    }

}

function icon(name){

    name = name.toLowerCase();

    if(name.includes("phone")) return "📱";

    if(name.includes("book")) return "📚";

    if(name.includes("cup")) return "☕";

    return "🤖";

}