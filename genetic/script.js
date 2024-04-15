const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

let vertexes = [];

document.getElementById('clearBtn').addEventListener('click', function() {
    location.reload();
});
document.getElementById("findPathBtn").onclick = geneticAlg;
canvas.addEventListener('click', mouseClick);

function mouseClick(e) {
    let clientX = e.pageX - e.target.offsetLeft;
    let clientY = e.pageY - e.target.offsetTop;
    
    drawLines(clientX, clientY);
    drawPoint(clientX, clientY);
    addVertex(clientX, clientY);
}

function addVertex(clientX, clientY) {
    vertexes.push([clientX, clientY]);
}

function drawPoint(clientX, clientY) {
    context.beginPath();
    context.arc(clientX, clientY, 4, 0, 2 * Math.PI, false);
    context.fillStyle = 'white'; 
    context.fill();
    
    context.fillStyle = 'white';
    context.font = 'bold 12px sans-serif';
    context.fillText(vertexes.length + 1, clientX + 5, clientY + 5); 
}

function drawLines(clientX, clientY) {
    context.beginPath();
    if (vertexes.length >= 1) {
        for(let vert of vertexes) {
            let vertX = vert[0];
            let vertY = vert[1];
            
            let vector = [clientX - vertX, clientY - vertY];
            let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
            context.moveTo(vertX + vector[0] * 10 / s, vertY + vector[1] * 10 / s);
            
            context.lineTo(clientX, clientY);
            context.strokeStyle = "rgba(243,243,243,0.25)";
            context.stroke();
        }
    }
}

function drawTheLines(to) {
    to.splice(to.length - 1, 0, to[0].slice());

    for (let q = 0; q < to.length - 1; ++q) {
        context.beginPath();
        let vector = [to[q + 1][0] - to[q][0], to[q + 1][1] - to[q][1]];
        let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

        context.moveTo(to[q][0] + vector[0] * 10 / s, to[q][1] + vector[1] * 10 / s);
        context.lineTo(to[q + 1][0] - vector[0] * 10 / s, to[q + 1][1] - vector[1] * 10 / s);
        context.strokeStyle = 'white';
        context.lineWidth = 1;
        context.stroke();
    }
}

function drawFinishPath(bestPath, color){
    console.log(bestPath.slice())
    bestPath.splice(bestPath.length - 1, 0, bestPath[0].slice())
    console.log(bestPath.slice())
    for (let i = 0; i < bestPath.length - 2; ++i){
        context.beginPath();
        let vector = [bestPath[i + 1][0] - bestPath[i][0] , bestPath[i + 1][1] - bestPath[i][1]];
        let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

        context.moveTo(bestPath[i][0] + vector[0] * 10 / s, bestPath[i][1] + vector[1] * 10 / s);
        context.lineTo(bestPath[i + 1][0] - vector[0] * 10 / s, bestPath[i + 1][1] - vector[1] * 10 / s);
        context.strokeStyle = 'deeppink';
        context.lineWidth = 2;
        context.stroke();

        context.moveTo(bestPath[i][0] + vector[0] * 10 / s, bestPath[i][1] + vector[1] * 10 / s);
        context.lineTo(bestPath[i + 1][0] - vector[0] * 10 / s, bestPath[i + 1][1] - vector[1] * 10 / s);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke()
    }
}


//сам алгоритм

let size = 750;
let lengthOfChromosome;
let numberOfGenerations = 100000;
let chanceOfMutation = 30;

function shuffle(array) {
    let a = array.slice()
    for (let i = 0; i < vertexes.length - 1; ++i) {
        let r1 = randomNumber(1, vertexes.length - 1);
        let r2 = randomNumber(1, vertexes.length - 1);
        [a[r1], a[r2]] = [a[r2], a[r1]];
    }
    return a.slice();
}

function startPopulation(firstGeneration){
    let res = [];
    let buffer = firstGeneration.slice();
    buffer.push(distance(buffer));
    res.push(buffer.slice());

    for (let i = 0; i < vertexes.length * vertexes.length; ++i){
        buffer = firstGeneration.slice();
        buffer = shuffle(buffer)
        buffer.push(distance(buffer));
        res.push(buffer.slice())
    }
    return res;
}

function addToPopulation(population, chromosome) {
    if (!population.length) {
        population.push(chromosome.slice());
    }
    else {
        let added = false
        for (let i = 0; i < population.length; ++i) {
            if (chromosome[chromosome.length - 1] < population[i][population[i].length - 1]) {
                population.splice(i, 0, chromosome);
                added = true;
                break;
            }
        }
        if (!added) {
            population.push(chromosome.slice());
        }
    }
}

function wait(time){
    return new Promise(resolve => setTimeout(resolve, time));
}

function distance(chromosome){
    let ans = 0;
    for (let i = 0; i < chromosome.length - 1; ++i){
        ans += Math.sqrt(Math.pow(chromosome[i][0] - chromosome[i + 1][0], 2) + Math.pow(chromosome[i][1] - chromosome[i + 1][1], 2));
    }
    ans += Math.sqrt(Math.pow(chromosome[chromosome.length - 1][0] - chromosome[0][0], 2) + Math.pow(chromosome[chromosome.length - 1][1] - chromosome[0][1], 2));
    return ans;
}

function twoRandomNumbers(min, max){
    let a = Math.floor(Math.random() * (max - min) + min);
    let b = Math.floor(Math.random() * (max - min) + min);
    while (a === b){
        a = Math.floor(Math.random() * (max - min) + min);
    }
    return [a, b];
}

function randomNumber(min, max){
    return  Math.floor(Math.random() * (max - min) + min);
}

function cross(firstParent, secondParent){
    let child = [];
    let index1 = randomNumber(0, firstParent.length);
    let index2 = randomNumber(index1 + 1, firstParent.length);
    child = firstParent.slice(index1, index2 + 1);

    for (let num of secondParent) {
        if (!child.includes(num)) {
            child.push(num);
        }
    }

    if (Math.random() * 100 < chanceOfMutation){
        let rand = twoRandomNumbers(1, lengthOfChromosome);
        let i = rand[0], j = rand[1];
        [child[i], child[j]] = [child[j], child[i]];
    }

    return child;
}

function crossingParents(firstParent, secondParent){
    let firstChild = cross(firstParent, secondParent);
    let secondChild = cross(firstParent, secondParent);

    firstChild.push(distance(firstChild.slice()))
    secondChild.push(distance(secondChild.slice()))
    return [firstChild, secondChild];
}

async function geneticAlg(){
    let firstGeneration = [];
    let end = 500;

    for (let i = 0; i < vertexes.length; ++i){
        firstGeneration.push(vertexes[i]);
    }
    lengthOfChromosome = firstGeneration.length;

    let population = startPopulation(firstGeneration);
    population.sort((function (a, b) { return a[a.length - 1] - b[b.length - 1]}));

    let bestChromosome = population[0].slice();
    drawFinishPath(bestChromosome, "rgb(250,142,142)")

    for(let i = 0; i < numberOfGenerations; ++i){
        if (end === 0){
            drawFinishPath(bestChromosome, "rgb(142,250,142)")
            break;
        }

        population = population.slice(0, vertexes.length * vertexes.length);

        for (let j = 0; j < vertexes.length * vertexes.length; ++j){
            let index1 = randomNumber(0, population.length);
            let index2 = randomNumber(0, population.length);
            let firstParent = population[index1].slice(0, population[index1].length - 1);
            let secondParent = population[index2].slice(0, population[index2].length - 1);

            let child = crossingParents(firstParent, secondParent);
            population.push(child[0].slice())
            population.push(child[1].slice())
        }

        population.sort((function (a, b) { return a[a.length - 1] - b[b.length - 1]}));

        if (JSON.stringify(bestChromosome) !== JSON.stringify(population[0])){
            drawTheLines(bestChromosome, population[0])
            bestChromosome = population[0].slice();
            end = 500;
        }

        if (i % 100 === 0){
            console.log(i);
            end -= 100;
        }

        await wait(0);
    }
}