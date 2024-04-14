const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

let vertexes = [];
let size = 750;
let numberOfGenerations = 100000;
let alpha = 1;
let beta = 1;
let pheromones;
let distance;
let desires = [];
let Q = 200;
let evaporation = 0.64;

canvas.addEventListener('click', mouseClick);
document.getElementById("clear").onclick = clearFunc;
document.getElementById("start").onclick = antAlgorithm;

context.moveTo(0, 0); 
context.lineTo(size, 0);
context.moveTo(size, 0);
context.lineTo(size, size);
context.moveTo(0, 0);
context.lineTo(0, size);
context.moveTo(0, size);
context.lineTo(size, size);
context.stroke();

function clearFunc(){
    location.reload();
}

function mouseClick(e){
    let clientX = e.pageX - e.target.offsetLeft;
    let clientY = e.pageY - e.target.offsetTop;

    context.beginPath();
    if (vertexes.length >= 1){
        for(let vert of vertexes){
            let vertX = vert[0];
            let vertY = vert[1];

            let vector = [clientX - vertX , clientY - vertY];
            let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
            context.moveTo(vertX + vector[0] * 10 / s, vertY + vector[1] * 10 / s);

            context.lineTo(clientX, clientY);
            context.strokeStyle = "rgba(243,243,243,0.34)";
            context.stroke();
        }
    }

    context.beginPath();
    context.arc(clientX, clientY, 2, 0, 2*Math.PI, false);
    context.fillStyle = "white";
    context.fill();

    vertexes.push([clientX, clientY]);
    redrawVertexes();
}

function redrawVertexes(){
    for (let i = 0; i < vertexes.length; ++i){
        context.beginPath();
        context.arc(vertexes[i][0], vertexes[i][1], 4, 0, 2*Math.PI, false);
        context.fillStyle = "white";
        context.fill();
    }
}

function drawTheLines(from, to){
    let a = from.slice()
    a.push(a[0].slice())

    for (let i = 0; i < a.length - 1; ++i){
        context.beginPath();
        let vector = [a[i + 1][0] - a[i][0] , a[i + 1][1] - a[i][1]];
        let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

        context.moveTo(a[i][0] + vector[0] * 10 / s, a[i][1] + vector[1] * 10 / s);
        context.lineTo(a[i + 1][0] - vector[0] * 10 / s, a[i + 1][1] - vector[1] * 10 / s);
        context.strokeStyle = "rgb(255,255,255)";
        context.lineWidth = 2;
        context.stroke();

        context.moveTo(a[i][0] + vector[0] * 10 / s, a[i][1] + vector[1] * 10 / s);
        context.lineTo(a[i + 1][0] - vector[0] * 10 / s, a[i + 1][1] - vector[1] * 10 / s);
        context.strokeStyle = "rgba(243,243,243,0.34)";
        context.lineWidth = 1;
        context.stroke()
    }

    let b = to.slice();
    b.push(b[0].slice())

    for (let i = 0; i < b.length - 1; ++i){
        context.beginPath();
        let vector = [b[i + 1][0] - b[i][0] , b[i + 1][1] - b[i][1]];
        let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
        context.moveTo(b[i][0] + vector[0] * 10 / s, b[i][1] + vector[1] * 10 / s);
        context.lineTo(b[i + 1][0] - vector[0] * 10 / s, b[i + 1][1] - vector[1] * 10 / s);
        context.strokeStyle = "rgb(250,142,142)";
        context.lineWidth = 1;
        context.stroke();
    }

}

function drawFinishPath(bestPath, color){
    bestPath.push(bestPath[0].slice());
    for (let i = 0; i < bestPath.length - 1; ++i){
        context.beginPath();
        let vector = [bestPath[i + 1][0] - bestPath[i][0] , bestPath[i + 1][1] - bestPath[i][1]];
        let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

        context.moveTo(bestPath[i][0] + vector[0] * 10 / s, bestPath[i][1] + vector[1] * 10 / s);
        context.lineTo(bestPath[i + 1][0] - vector[0] * 10 / s, bestPath[i + 1][1] - vector[1] * 10 / s);
        context.strokeStyle = "rgb(255,255,255)";
        context.lineWidth = 2;
        context.stroke();

        context.moveTo(bestPath[i][0] + vector[0] * 10 / s, bestPath[i][1] + vector[1] * 10 / s);
        context.lineTo(bestPath[i + 1][0] - vector[0] * 10 / s, bestPath[i + 1][1] - vector[1] * 10 / s);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke()
    }
}

function wait(time){
    return new Promise(resolve => setTimeout(resolve, time));
}

function distanceBetweenTwoPoints(first, second){
    return Math.sqrt(Math.pow(first[0] - second[0], 2) + Math.pow(first[1] - second[1], 2));
}

function allDistanceForPath(path_idx){
    let dist = 0
    for (let i = 0; i < path_idx.length - 1; ++i){
        dist += distanceBetweenTwoPoints(vertexes[path_idx[i]].slice(), vertexes[path_idx[i + 1]].slice());
    }
    dist += distanceBetweenTwoPoints(vertexes[path_idx[path_idx.length - 1]].slice(), vertexes[path_idx[0]].slice());
    return dist;
}

function addToPopulation(allWays, path) {
    if (!allWays.length) {
        allWays.push(path.slice());
    }
    else {
        let added = false
        for (let i = 0; i < allWays.length; ++i) {
            if (path[path.length - 1] < allWays[i][allWays[i].length - 1]) {
                allWays.splice(i, 0, path);
                added = true;
                break;
            }
        }
        if (!added) {
            allWays.push(path.slice());
        }
    }
}

async function antAlgorithm(){
    let vertexesLength = vertexes.length;
    let bestAnt = []; 

    let b = vertexes.slice(0);

    let qwe = [];
    for (let i = 0; i < vertexes.length; ++i){
        qwe.push(i);
    }

    bestAnt.push(b, qwe, allDistanceForPath(qwe));

    pheromones = [];
    distance = [];

    for (let i = 0; i < vertexesLength; ++i){
        pheromones[i] = new Array(vertexesLength);
        distance[i] = new Array(vertexesLength);
    }

    for (let i = 0; i < vertexes.length - 1; ++i){
        for (let j = i + 1; j < vertexes.length; ++j){
            distance[i][j] = Q / distanceBetweenTwoPoints(vertexes[i].slice(), vertexes[j].slice());
            pheromones[i][j] = 0.2;
        }
    }


    let end = vertexesLength * 2;

    for (let generation = 0; generation < numberOfGenerations; ++generation){
        if (end === 0){
            drawFinishPath(bestAnt[0], 'deeppink');
            break;
        }

        let ways = [];
        let path = [];
        let path_idx = [];

        for (let ant = 0; ant < vertexes.length; ++ant){
            path = [];
            path_idx = [];

            let startVertex_idx = ant;
            let startVertex = vertexes[startVertex_idx].slice();

            path.push(startVertex);
            path_idx.push(startVertex_idx);

            while (path.length !== vertexes.length){
                let sumOfDesires = 0;

                let p = [];
                for (let j = 0; j < vertexes.length; ++j) {
                    if (path_idx.indexOf(j) !== -1){
                        continue;
                    }
                    let min = Math.min(startVertex_idx, j);
                    let max = Math.max(startVertex_idx, j);
                    let desire = Math.pow(pheromones[min][max], alpha) * Math.pow(distance[min][max], beta);
                    p.push([j,desire]);
                    sumOfDesires += desire;
                }

                for (let i = 0; i < p.length; ++i){
                    p[i][1] /= sumOfDesires;
                }

                for (let j = 1; j < p.length; ++j){
                    p[j][1] += p[j - 1][1];
                }

                let rand = Math.random()
                let choice
                for (let i = 0; i < p.length; ++i){
                    if (rand < p[i][1]){
                        choice = p[i][0];
                        break;
                    }
                }
                startVertex_idx = choice;

                startVertex = vertexes[startVertex_idx].slice();
                path.push(startVertex.slice());
                path_idx.push(startVertex_idx);
            }
            ways.push([path.slice(), path_idx.slice(), allDistanceForPath(path_idx)])
        }

        ways.sort((function (a, b) { return a[2] - b[2]}));

        for (let i = 0; i < vertexesLength - 1; ++i){
            for (let j = i + 1; j < vertexesLength; ++j){
                pheromones[i][j] *= evaporation;
            }
        }

        for (let i = 0; i < ways.length; ++i){
            let idx_path = ways[i][1].slice();
            let lenOfPath = ways[i][2]
            for (let j = 0; j < vertexesLength - 1; ++j){
                let min = Math.min(idx_path[j], idx_path[j + 1]);
                let max = Math.max(idx_path[j], idx_path[j + 1]);
                pheromones[min][max] += Q / lenOfPath;
            }
        }

        let newBestAnt = ways[0].slice();

        if (newBestAnt[2] < bestAnt[2]){
            drawTheLines(bestAnt[0], newBestAnt[0]);
            bestAnt = newBestAnt.slice();
            redrawVertexes();
            end = vertexesLength * 2;
        }

        end -= 1;
        console.log(generation)
        await wait(100);
    }

}
