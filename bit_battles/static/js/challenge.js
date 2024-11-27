let timerElement;
let truthtable;
let alertsElement;
let playerResults;
let currentStage = null;

window.addEventListener("DOMContentLoaded", (event) => {
    timerElement = document.getElementById("timer");
    truthtable = document.getElementById("truthtable");
    alertsElement = document.getElementById("alerts");
    playerResults = document.getElementById("player-results");
    loadStage("challenge");
});

function loadStage(stage) {
    if (currentStage) currentStage.classList.remove("active");
    currentStage = document.getElementById(stage);
    currentStage.classList.add("active");

    if (stage === "challenge") {
        requestAnimationFrame(updateTimer);
        loadGateButtons(["AND", "NOT", "OR", "XOR"]);
        loadTruthtable(challenge.truthtable);
        loadGates(challenge.truthtable);
    }
    if (stage === "results") {
        loadResults();
    }
}

function loadGateButtons(gates) {
    gates.forEach(gate => {
        document.getElementById(`${gate}-btn`).classList.add("active");
    });
} 

function loadTruthtable(data) {
    const testColumn = document.getElementById("test-column");
    let firstOutput = false;
    let columnLength = 0;

    for (const [key, values] of Object.entries(data)) {
        const column = document.createElement("div");
        const title = document.createElement("div");
        title.classList.add("title")
        title.innerText = key

        column.appendChild(title);
        values.forEach(value => {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add(value? "on": "off");
            cell.innerText = value;

            column.appendChild(cell);
        });
        
        if (key.charCodeAt(0) > 77 && !firstOutput) {
            column.classList.add("output");
            firstOutput = true;
        }

        truthtable.appendChild(column);
        columnLength = values.length;
    }

    for (let i = 0; i < columnLength; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.innerText = "v";
        cell.id = `test-${i}`;

        testColumn.appendChild(cell);
    }
}

function loadGates(data) {
    let inputY = 60;
    let outputY = 60;

    for (const key of Object.keys(data)) {
        if (key.charCodeAt(0) > 77) {
            const gate = objects["OUTPUT"];
            const [inputCoordinates, outputCoordinates] = setConnectors(gate, 1000, outputY);

            placedGates.push({
                x: 1000, 
                y: outputY, 
                type: "OUTPUT", 
                rotation: 0, 
                inputs: inputCoordinates, 
                output: outputCoordinates,
                id: key,
            });
            outputY += 2 * gridSize;
            continue;
        }

        const gate = objects["INPUT"];
        const [inputCoordinates, outputCoordinates] = setConnectors(gate, 520, inputY);

        placedGates.push({
            x: 520, 
            y: inputY, 
            type: "INPUT",
            rotation: 0, 
            inputs: inputCoordinates, 
            output: outputCoordinates,
            id: key,
        });
        inputY += 2 * gridSize;
    }

    drawGrid();
    drawCanvas();
}

let secondsElapsed = 0;
let lastTime = performance.now();

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secondsRemaining = seconds % 60;
    return (
        String(minutes).padStart(2, '0') + ':' +
        String(secondsRemaining).padStart(2, '0')
    );
}

function updateTimer(timestamp) {
    const elapsed = timestamp - lastTime;

    if (elapsed >= 1000) {
        secondsElapsed++;
        timerElement.textContent = formatTime(secondsElapsed);
               
        lastTime = timestamp;
    }
    requestAnimationFrame(updateTimer);
}

async function submit() {
    const response = await fetch(`/api/challenge/${challenge.date}/submit`, {
        method: "POST",
        body: JSON.stringify({"gates": placedGates, "wires": placedWires}),
        headers: {"Authorization": `Bearer ${getCookie("ut")}`, "Content-Type": "application/json"}
    });

    try {
        const json = await response.json();
        if (!response.ok) return sendAlert(json.error);
        if (!json.passed) return sendAlert("You did not pass the test.");
    } catch {
        sendAlert("Unexpected error.");
    }

    loadStage("results");
}

let alerts = [];

function sendAlert(message) {
    if (alerts.length >= 5) {
        const element = alerts.shift();
        element.remove();
    }

    const alertElement = document.createElement("div");
    alertElement.classList.add("alert");
    alertElement.innerText = message;
    alerts.push(alertElement);
    alertsElement.appendChild(alertElement);

    updateAlertPositions();

    setTimeout(() => {
        const index = alerts.indexOf(alertElement);
        if (index > -1) {
            alerts.splice(index, 1);
            alertElement.remove();
            updateAlertPositions();
        }
    }, 30000);
}

function updateAlertPositions() {
    alerts.forEach((alert, index) => {
        alert.style.bottom = `${10 + (30 * index)}px`;
    });
}

async function loadResults() {
    const response = await fetch(`/api/challenge/${challenge.date}/results`, {
        method: "GET",
        headers: {"Authorization": `Bearer ${getCookie("ut")}`}
    });

    if (!response.ok) return
    const json = await response.json();

    const timePerformance = (json.user.duration - json.average_duration).toFixed(2);
    const gatePerformance = (json.user.gates - json.average_gates).toFixed(2);
    const pathPerformance = (json.user.longest_path - json.average_longest_path).toFixed(2);

    playerResults.innerHTML += `
        <ul>
            <li>Average gates: ${json.average_gates}</li>
            <li>Average longest path: ${json.average_longest_path}</li>
            <li>Average time: ${formatSeconds(json.average_duration)}</li>
        </ul>
        <div>
            <h2>${player.username} (You)</h2>
            <p>
                Time: ${formatSeconds(json.user.duration)} (${timePerformance <= 0? 
                    `<span class="good">${timePerformance}s</span>`: 
                    `<span class="bad">+${timePerformance}s</span>`
                }) Gates: ${json.user.gates} (${gatePerformance <= 0? 
                    `<span class="good">${gatePerformance}</span>`: 
                    `<span class="bad">+${gatePerformance}</span>`
                }) Longest path: ${json.user.longest_path} (${pathPerformance <= 0? 
                    `<span class="good">${pathPerformance}</span>`: 
                    `<span class="bad">+${pathPerformance}</span>`
                })
            </p>
        </div>
    `
}

function formatSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(3);

    return `${minutes}m ${remainingSeconds}s`;
}