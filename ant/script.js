const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let to = [];
let path = [];

canvas.addEventListener('click', function(event) {
    const x = event.offsetX;
    const y = event.offsetY;
    to.push({x, y});
    drawPoints();
});

document.getElementById('clearBtn').addEventListener('click', function() {
    to = [];
    path = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('findPathBtn').addEventListener('click', function() {
    if (to.length >= 2) {
        findPath();
        drawPoints();
        highlightPath();
    }
});

function drawPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    to.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillText(index + 1, point.x - 5, point.y - 10);
        ctx.fill();
        ctx.closePath();
    });

    ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < to.length; i++) {
        for (let j = 0; j < to.length; j++) {
            if (i !== j) {
                const dx = to[i].x - to[j].x;
                const dy = to[i].y - to[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                ctx.beginPath();
                ctx.moveTo(to[i].x, to[i].y);
                ctx.lineTo(to[j].x, to[j].y);
                ctx.stroke();
                ctx.fillStyle = 'rgba(128, 128, 128, 0.1)';
                ctx.fillText(distance.toFixed(2), (to[i].x + to[j].x) / 2, (to[i].y + to[j].y) / 2);
            }
        }
    }
}

function findPath() {
    const n = to.length;
    let dist = [];
    for (let i = 0; i < n; i++) {
        dist[i] = [];
        for (let j = 0; j < n; j++) {
            const dx = to[i].x - to[j].x;
            const dy = to[i].y - to[j].y;
            dist[i][j] = Math.sqrt(dx * dx + dy * dy);
        }
    }

    let visited = Array(n).fill(false);
    path = [];
    visited[0] = true;
    path.push(0);
    let current = 0;

    for (let i = 1; i < n; i++) {
        let next = -1;
        for (let j = 0; j < n; j++) {
            if (!visited[j] && (next === -1 || dist[current][j] < dist[current][next])) {
                next = j;
            }
        }
        visited[next] = true;
        path.push(next);
        current = next;
    }
    path.push(0);

    highlightPath();
}

function highlightPath() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoints();

    ctx.strokeStyle = 'fuchsia';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < path.length; i++) {
        const index = path[i];
        const point = to[index];
        
        if (i === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    }

    ctx.stroke();
}

