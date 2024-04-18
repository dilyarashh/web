const canvas = document.getElementById('canvas');
const context = canvas.getContext("2d");

canvas.addEventListener('click', fillingBoard);
document.getElementById("clear").onclick = clearFunc;
document.getElementById("start").onclick = geneticAlgorithm;

function clearFunc(){
    location.reload();
}

let points = []; 

function fillingBoard(e){ 
    const clientX = e.pageX - e.target.offsetLeft; 
    const clientY = e.pageY - e.target.offsetTop; 

    context.beginPath(); 
    context.arc(clientX, clientY, 5, 0, 2*Math.PI, false); 
    context.fillStyle = "white"; 
    context.fill(); 

    points.push([clientX, clientY]); 

    if (points.length > 1) { 
        context.beginPath(); 
        context.moveTo(points[points.length - 2][0], points[points.length - 2][1]); 
        context.lineTo(clientX, clientY); 
        context.strokeStyle = 'rgba(128, 128, 128, 0.1)'; 
        context.stroke(); 
    } 
}

function drawPath(there, back) { 
    const drawLine = (start, end, color, width) => {
        context.beginPath(); 
        context.moveTo(start[0], start[1]); 
        context.lineTo(end[0], end[1]); 
        context.strokeStyle = color; 
        context.lineWidth = width; 
        context.stroke(); 
    };

    const extendPath = (path) => {
        const extendedPath = path.slice();
        extendedPath.splice(extendedPath.length - 1, 0, extendedPath[0].slice());
        return extendedPath;
    };

    const extensionFactor = 10; 

    there = extendPath(there);
    back = extendPath(back);

    for (let i = 0; i < there.length - 1; ++i) { 
        let vector = [there[i + 1][0] - there[i][0], there[i + 1][1] - there[i][1]]; 
        let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]); 
        drawLine(
            [there[i][0] + vector[0] * extensionFactor / s, there[i][1] + vector[1] * extensionFactor / s], 
            [there[i + 1][0] - vector[0] * extensionFactor / s, there[i + 1][1] - vector[1] * extensionFactor / s], 
            "black", 
            4
       );
    } 

    for (let q = 0; q < back.length - 1; ++q) { 
        let vector = [back[q + 1][0] - back[q][0], back[q + 1][1] - back[q][1]]; 
        let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]); 
        drawLine(
            [back[q][0] + vector[0] * extensionFactor / s, back[q][1] + vector[1] * extensionFactor / s], 
            [back[q + 1][0] - vector[0] * extensionFactor / s, back[q + 1][1] - vector[1] * extensionFactor / s], 
            "rgb(142,250,142)", 
            2
        );
    } 

    for (let i = 0; i < points.length; ++i){ 
        context.beginPath(); 
        context.arc(points[i][0], points[i][1], 5, 0, 2*Math.PI, false); 
        context.fillStyle = 'white'; 
        context.fill(); 
    } 
}

function highlitePath(bestPath) {
    const color = 'fuchsia'; 

    const drawSegment = (start, end, width) => { 
        context.beginPath();  
        context.moveTo(start[0], start[1]);  
        context.lineTo(end[0], end[1]);  
        context.strokeStyle = color;  
        context.lineWidth = width;  
        context.stroke();  
    }; 
 
    console.log(bestPath.slice())  
 
    bestPath.splice(bestPath.length - 1, 0, bestPath[0].slice());  
 
    console.log(bestPath.slice())  
 
    for (let i = 0; i < bestPath.length - 2; ++i){  
        let vector = [bestPath[i + 1][0] - bestPath[i][0], bestPath[i + 1][1] - bestPath[i][1]];  
        let s = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);  
 
        drawSegment( 
            [bestPath[i][0] + vector[0] * 10 / s, bestPath[i][1] + vector[1] * 10 / s],  
            [bestPath[i + 1][0] - vector[0] * 10 / s, bestPath[i + 1][1] - vector[1] * 10 / s],  
            2 
        ); 
    }  
 
    for (let i = 0; i < points.length; ++i){ 
        context.beginPath(); 
        context.arc(points[i][0], points[i][1], 5, 0, 2*Math.PI, false); 
        context.fillStyle = 'white'; 
        context.fill(); 
    } 
}

let lengthOfChromosome; 
let numberOfGenerations = 300000;
let chanceOfMutation = 100;

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min) + min);

const twoRandomNumbers = (min, max) => {
    let a, b;
    do {
        [a, b] = [randomNumber(min, max), randomNumber(min, max)];
    } while (a === b);
    return [a, b];
};

function addToPopulation(population, chromosome) {
    if (!population.length) {
        population.push(chromosome.slice());
    } else {
        insertIntoSortedPopulation(population, chromosome);
    }
}

function insertIntoSortedPopulation(population, chromosome) {
    let added = false;
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

function distance(chromosome){
    let ans = 0;
    for (let i = 0; i < chromosome.length - 1; ++i){
        ans += Math.sqrt(Math.pow(chromosome[i][0] - chromosome[i + 1][0], 2) + Math.pow(chromosome[i][1] - chromosome[i + 1][1], 2));
    }
    ans += Math.sqrt(Math.pow(chromosome[chromosome.length - 1][0] - chromosome[0][0], 2) + Math.pow(chromosome[chromosome.length - 1][1] - chromosome[0][1], 2));
    return ans;
}

function cross(firstParent, secondParent) {
    let child = [];
    let index1 = randomNumber(0, firstParent.length);
    let index2 = randomNumber(index1 + 1, firstParent.length);
    child = extractSegment(firstParent, index1, index2);

    addNonDuplicates(child, secondParent);

    if (shouldMutate(chanceOfMutation)) {
        mutateChild(child);
    }

    return child;
}

function extractSegment(parent, startIndex, endIndex) {
    return parent.slice(startIndex, endIndex + 1);
}

function addNonDuplicates(child, secondParent) {
    for (let num of secondParent) {
        if (!child.includes(num)) {
            child.push(num);
        }
    }
}

function shouldMutate(chanceOfMutation) {
    return Math.random() * 100 < chanceOfMutation;
}

function mutateChild(child) {
    let rand = twoRandomNumbers(1, lengthOfChromosome);
    let i = rand[0], j = rand[1];
    [child[i], child[j]] = [child[j], child[i]];
}

function crossingParents(firstParent, secondParent){
    let firstChild = cross(firstParent, secondParent);
    let secondChild = cross(firstParent, secondParent);

    firstChild.push(distance(firstChild.slice()))
    secondChild.push(distance(secondChild.slice()))
    return [firstChild, secondChild];
}

async function geneticAlgorithm() {
    if (points.length < 3) {
        alert("Please enter more than two points.");
    } else {
        let firstGeneration = [];
        let end = 500;

        for (let i = 0; i < points.length; ++i) {
            firstGeneration.push(points[i]);
        }
        lengthOfChromosome = firstGeneration.length;

        let population = firstRunning(firstGeneration);

        let bestChromosome = population[0].slice();
        highlitePath(bestChromosome);

        for (let i = 0; i < numberOfGenerations; ++i) {
            if (end === 0) {
                highlitePath(bestChromosome);
                break;
            }

            population = population.slice(0, points.length * points.length);

            population = reproducePopulation(population);

            if (JSON.stringify(bestChromosome) !== JSON.stringify(population[0])) {
                drawPath(bestChromosome, population[0]);
                bestChromosome = population[0].slice();
                end = 500;
            }

            if (i % 100 === 0) {
                console.log(i);
                end -= 100;
            }

            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
}

function firstRunning(firstGeneration) {
    let res = [];
    let buffer = firstGeneration.slice();
    buffer.push(distance(buffer));
    res.push(buffer.slice());

    for (let i = 0; i < points.length * points.length; ++i) {
        buffer = firstGeneration.slice();

        for (let j = 0; j < points.length - 1; ++j) {
            let r1 = randomNumber(0, points.length - 1);
            let r2 = randomNumber(0, points.length - 1);
            [buffer[r1], buffer[r2]] = [buffer[r2], buffer[r1]];
        }

        buffer.push(distance(buffer));
        res.push(buffer.slice());
    }
    return res;
}

function reproducePopulation(population) {
    for (let j = 0; j < points.length * points.length; ++j) {
        let index1 = randomNumber(0, population.length);
        let index2 = randomNumber(0, population.length);
        let firstParent = population[index1].slice(0, population[index1].length - 1);
        let secondParent = population[index2].slice(0, population[index2].length - 1);

        let child = crossingParents(firstParent, secondParent);
        population.push(child[0].slice());
        population.push(child[1].slice());
    }

    population.sort((a, b) => a[a.length - 1] - b[b.length - 1]);
    return population;
}