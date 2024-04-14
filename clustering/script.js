const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let points = [];

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    points.push({x, y, cluster: -1});
    drawPoint(x, y);
});

function drawPoint(x, y, color='white') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawCentroid(x, y) {
    const size = 10; // Размер крестика
    ctx.strokeStyle = 'white'; // Цвет крестика
    ctx.beginPath();
    // Горизонтальная линия
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    // Вертикальная линия
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
}

function startClustering() {
    const k = parseInt(document.getElementById('numClusters').value);
    if (!k || isNaN(k) || k <= 0) {
        alert('Пожалуйста, введите действительное количество кластеров.');
        return;
    }
    performClustering(k);
}

function performClustering(k) {
    let centroids = getRandomCentroidsNaiveSharding(points, k);
    let isStabilized = false;
    let iterations = 0;
    const MAX_ITERATIONS = 50;
    const uniqueColors = getUniqueColors(k);

    while (!isStabilized && iterations < MAX_ITERATIONS) {
        assignPointsToClosestCentroid(points, centroids);
        isStabilized = recalculateCentroids(points, centroids);
        clearCanvas();
        drawClusters(points, uniqueColors);
        // Отрисовка центроидов
        centroids.forEach(centroid => {
            drawCentroid(centroid.x, centroid.y);
        });
        iterations++;
    }
}

function getUniqueColors(k) {
    const colors = [];
    for (let i = 0; i < k; i++) {
        const hue = Math.floor((i / k) * 360);
        colors.push(`hsl(${hue}, 100%, 50%)`);
    }
    return colors;
}

function getRandomCentroidsNaiveSharding(points, k) {
    const numSamples = points.length;
    const step = Math.floor(numSamples / k);
    const centroids = [];
    for (let i = 0; i < k; i++) {
        const start = step * i;
        let end = step * (i + 1);
        if (i + 1 === k) {
            end = numSamples;
        }
        const shardPoints = points.slice(start, end);
        const centroid = calcMeanCentroid(shardPoints);
        centroids.push({...centroid, cluster: i});
    }
    return centroids;
}

function calcMeanCentroid(points) {
    const totalPoints = points.length;
    const mean = {x: 0, y: 0};
    points.forEach(point => {
        mean.x += point.x / totalPoints;
        mean.y += point.y / totalPoints;
    });
    return mean;
}

function assignPointsToClosestCentroid(points, centroids) {
    points.forEach(point => {
        let closestDistance = Infinity;
        let closestCentroid = -1;

        centroids.forEach((centroid, index) => {
            const distance = Math.sqrt(Math.pow(point.x - centroid.x, 2) + Math.pow(point.y - centroid.y, 2));
            if (distance < closestDistance) {
                closestDistance = distance;
                closestCentroid = index;
            }
        });

        point.cluster = closestCentroid;
    });
}

function recalculateCentroids(points, centroids) {
    let isStabilized = true;
    centroids.forEach((centroid, index) => {
        const clusterPoints = points.filter(point => point.cluster === index);
        if (clusterPoints.length === 0) return;

        const newX = clusterPoints.reduce((acc, p) => acc + p.x, 0) / clusterPoints.length;
        const newY = clusterPoints.reduce((acc, p) => acc + p.y, 0) / clusterPoints.length;

        if (centroid.x !== newX || centroid.y !== newY) {
            isStabilized = false;
            centroid.x = newX;
            centroid.y = newY;
        }
    });
    return isStabilized;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawClusters(points, colors) {
    points.forEach(point => {
        const color = colors[point.cluster % colors.length];
        drawPoint(point.x, point.y, color);
    });
}