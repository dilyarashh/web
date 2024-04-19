const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
document.getElementById("clear").onclick = clearFunc;
let clusteringCompleted = false;
let points = []; // Массив для хранения точек и их радиусов

function clearFunc(){
    location.reload();
}

canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const radius = 25; // Радиус кружков
    points.push({ x, y, radius });
    drawCircle(x, y, radius);
});

function drawCircle(x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'white';  // Задание белого цвета для границы кружка
    ctx.stroke();
    drawCircleLines(x, y, radius);
}

function drawCircleLines(x, y, radius) {
    ctx.strokeStyle = 'white';  // Задание белого цвета для линий
    const startAngle = 0; 
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + radius * Math.cos(startAngle + (Math.PI * 2 / 3) * i),
                   y + radius * Math.sin(startAngle + (Math.PI * 2 / 3) * i));
        ctx.stroke();
    }
}

function drawCircleSector(point, color, startAngle, endAngle) {
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.arc(point.x, point.y, point.radius, startAngle, endAngle, false);
    ctx.lineTo(point.x, point.y);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
}

document.getElementById('numClusters').oninput = function() {
    document.getElementById('clusterValue').textContent = this.value;
}

document.getElementById('epsilonRange').oninput = function() {
    document.getElementById('epsilonValue').textContent = this.value;
}

document.getElementById('minPtsRange').oninput = function() {
    document.getElementById('minPtsValue').textContent = this.value;
}


function startClustering() {
    const k = parseInt(document.getElementById('numClusters').value); // Получаем значение из бегунка
    if (!k || isNaN(k) || k <= 0) {
        alert('Пожалуйста, введите действительное количество кластеров.');
        return;
    }
    const eps = parseInt(document.getElementById('epsilonRange').value);
    const minPts = parseInt(document.getElementById('minPtsRange').value);

    performClustering(k);
    clusterComponents();
    performDBSCAN(eps, minPts); // Используйте значения из бегунков
    clearCanvas(); // Обновление канваса после всех кластеризаций
    clusteringCompleted = true; 
}


function performDBSCAN(eps, minPts) {
    const labels = new Array(points.length).fill(-1);
    let clusterId = 0;

    for (let i = 0; i < points.length; i++) {
        if (labels[i] !== -1) continue;
        const neighbors = findNeighbors(points, i, eps);
        if (neighbors.length < minPts) {
            labels[i] = -2; // пометка как шум
        } else {
            expandCluster(points, labels, i, neighbors, clusterId++, eps, minPts);
        }
    }

    points.forEach((point, index) => {
        if (labels[index] >= 0) {
            point.tertiaryCluster = labels[index];
        } else {
            point.tertiaryCluster = -1; // шум
        }
    });
}

function findNeighbors(points, idx, eps) {
    return points.filter((p, i) => 
        i !== idx && Math.sqrt((p.x - points[idx].x) ** 2 + (p.y - points[idx].y) ** 2) <= eps);
}

function expandCluster(points, labels, idx, neighbors, clusterId, eps, minPts) {
    labels[idx] = clusterId;
    let i = 0;
    while (i < neighbors.length) {
        const neighborIdx = points.indexOf(neighbors[i]);
        if (labels[neighborIdx] === -2) {
            labels[neighborIdx] = clusterId;
        }
        if (labels[neighborIdx] === -1) {
            labels[neighborIdx] = clusterId;
            const newNeighbors = findNeighbors(points, neighborIdx, eps);
            if (newNeighbors.length >= minPts) {
                neighbors = neighbors.concat(newNeighbors);
            }
        }
        i++;
    }
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
        points.forEach(point => {
            drawCircleSector(point, uniqueColors[point.cluster], -Math.PI / 3, Math.PI / 3);
        });
        iterations++;
    }
}

function clusterComponents() {
    const visited = new Array(points.length).fill(false);
    const colors = ['red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'orange', 'purple'];
    let colorIndex = 0;

    for (let i = 0; i < points.length; i++) {
        if (!visited[i]) {
            points[i].secondaryCluster = colorIndex % colors.length;
            dfs(i, colors[colorIndex++ % colors.length], visited);
        }
    }
    points.forEach(point => {
        drawCircleSector(point, colors[point.secondaryCluster], Math.PI / 3, Math.PI);
    });
}

function dfs(index, color, visited) {
    const stack = [index];
    visited[index] = true;

    while (stack.length > 0) {
        const current = stack.pop();

        for (let i = 0; i < points.length; i++) {
            if (!visited[i] && isNear(points[current], points[i])) {
                visited[i] = true;
                points[i].secondaryCluster = points[current].secondaryCluster;
                stack.push(i);
            }
        }
    }
}

function isNear(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) <= 2 * p1.radius;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(point => {
        drawCircle(point.x, point.y, point.radius);
        const kMeansColor = getUniqueColors(points.length)[point.cluster];
        drawCircleSector(point, kMeansColor, -Math.PI / 3, Math.PI / 3);
        const componentColor = ['red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'orange', 'purple'][point.secondaryCluster % 8];
        drawCircleSector(point, componentColor, Math.PI / 3, Math.PI);
        const tertiaryColor = point.tertiaryCluster >= 0 ? getUniqueColors(20)[point.tertiaryCluster] : 'grey';
        drawCircleSector(point, tertiaryColor, Math.PI, Math.PI * 5 / 3);
    });
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
    let sumX = 0, sumY = 0;
    points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
    });
    return { x: sumX / points.length, y: sumY / points.length };
}

function assignPointsToClosestCentroid(points, centroids) {
    points.forEach(point => {
        let closestDistance = Infinity;
        let closestCentroid = -1;
        centroids.forEach((centroid, index) => {
            const distance = Math.sqrt((point.x - centroid.x) ** 2 + (point.y - centroid.y) ** 2);
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

function getUniqueColors(k) {
  const colors = [];
  for (let i = 0; i < k; i++) {
      const hue = Math.floor((i / k) * 360);
      colors.push(`hsl(${hue}, 100%, 50%)`);
  }
  return colors;
}

canvas.addEventListener('mousemove', function(event) {
    if (!clusteringCompleted) return; // Выход, если кластеризация не завершена

    const mouseX = event.pageX;
    const mouseY = event.pageY;
    let hovered = false;

    points.forEach(point => {
        const rect = canvas.getBoundingClientRect();
        const pointX = point.x + rect.left;
        const pointY = point.y + rect.top;
        const distance = Math.sqrt((mouseX - pointX) ** 2 + (mouseY - pointY) ** 2);
        if (distance <= point.radius) {
            const angle = Math.atan2(mouseY - pointY, mouseX - pointX);
            const adjustedAngle = (angle < -Math.PI / 2) ? angle + 2 * Math.PI : angle;
            let method;
            if (adjustedAngle >= -Math.PI / 3 && adjustedAngle <= Math.PI / 3) {
                method = "K-MEANS";
            } else if (adjustedAngle >= Math.PI / 3 && adjustedAngle <= Math.PI) {
                method = "COMPONENTS";
            } else if (adjustedAngle >= Math.PI && adjustedAngle <= Math.PI * 5 / 3) {
                method = "DBSCAN";
            }

            if (method) {
                displayTooltip(mouseX, mouseY, method);
                hovered = true;
            }
        }
    });

    if (!hovered) {
        clearTooltip();
    }
});


function displayTooltip(x, y, text) {
    const tooltip = document.getElementById('tooltip') || document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'white';
    tooltip.style.color = 'black';
    tooltip.style.fontFamily = 'monospace';
    tooltip.style.border = '1px solid black';
    tooltip.style.padding = '5px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.visibility = 'hidden'; // Сначала скрыть, чтобы вычислить размеры

    if (!document.getElementById('tooltip')) {
        document.body.appendChild(tooltip);
    }

    // Обновить размеры после того, как текст добавлен
    tooltip.style.visibility = 'visible';
    tooltip.style.left = `${x - tooltip.offsetWidth / 2}px`; // Центрирование подсказки по горизонтали
    tooltip.style.top = `${y - tooltip.offsetHeight - 5}px`; // Смещение вверх от курсора
}

function clearTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.parentNode.removeChild(tooltip);
    }
}
 