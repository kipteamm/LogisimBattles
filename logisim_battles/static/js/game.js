let truthtable;

window.addEventListener("DOMContentLoaded", (event) => {
    truthtable = document.getElementById("truthtable");
    loadTruthtable(battle.truthtable);
    loadGates(battle.truthtable);
})

function loadTruthtable(data) {
    let firstOutput = false;

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
    }
}

function loadGates(data) {
    let inputY = 60;
    let outputY = 60;

    for (const key of Object.keys(data)) {
        if (key.charCodeAt(0) > 77) {
            const gate = objects["OUTPUT"];

            placedGates.push({
                x: 800, 
                y: outputY, 
                type: "OUTPUT", 
                rotation: 0, 
                inputs: gate.inputs.map((input) => ({x: 800 + input.x, y: outputY + input.y})), 
                output: {x: 800 + gate.output.x, y: outputY + gate.output.y},
                id: key,
            });
            outputY += 2 * gridSize;
            continue;
        }

        const gate = objects["INPUT"];

        placedGates.push({
            x: 20, 
            y: inputY, 
            type: "INPUT",
            rotation: 0, 
            inputs: gate.inputs.map((input) => ({x: 20 + input.x, y: inputY + input.y})), 
            output: {x: 20 + gate.output.x, y: inputY + gate.output.y},
            id: key,
        });
        inputY += 2 * gridSize;
    }

    drawGrid();
    drawCanvas();
}