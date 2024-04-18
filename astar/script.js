document.querySelector('.er').onclick = function() {
  initAndCreateMaze();
};

let settingStart = false;
let settingEnd = false;
let start = null;
let end = null;
let isEditing = false;

document.querySelector('.set-start').onclick = function() {
  settingStart = true;
  settingEnd = false;
};

document.querySelector('.set-end').onclick = function() {
  settingEnd = true;
  settingStart = false;
};

document.querySelector('.edit-maze').onclick = function() {
  isEditing = !isEditing;
  this.textContent = isEditing ? 'FINISH EDITING' : 'EDIT';
};
document.querySelector('.find-path').onclick = function() {
  if (start && end) {
    drawMaze(window.maze, window.N);
    let path = aStar(window.maze, start, end);
    drawPath(path);
  } else {
    alert("Please set both start and end points.");
  }
};

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
var cellSize;

let width = 500;
let height = 500;
canvas.width = width;
canvas.height = height;

canvas.addEventListener('click', function(event) {
  var rect = canvas.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;
  var clickedRow = Math.floor(y / cellSize);
  var clickedCol = Math.floor(x / cellSize);

  if (isEditing) {
    // Инвертируем состояние ячейки: если это была стена, делаем проход; если проход, делаем стену.
    window.maze[clickedRow][clickedCol] = !window.maze[clickedRow][clickedCol];
    drawMaze(window.maze, window.N);
  } else {
    if (window.maze[clickedRow][clickedCol] === false) {
      if (settingStart) {
        start = clickedRow + "," + clickedCol;
        settingStart = false;
        drawMaze(window.maze, window.N);
      } else if (settingEnd) {
        end = clickedRow + "," + clickedCol;
        settingEnd = false;
        drawMaze(window.maze, window.N);
      }
    }
  }
});


document.getElementById('sizeSlider').oninput = function() {
  document.getElementById('sliderValue').textContent = this.value;
}

function initAndCreateMaze() {

  if (start !== null && end !== null) {
    alert("The starting and ending points are already set. Reset them first.");
    return; // Прерываем выполнение функции
  }

  var size = parseInt(document.getElementById('sizeSlider').value);

  if (isNaN(size)) {
    alert("Please choose a valid number.");
    return;
}
  cellSize = width / size;
  var maze = [];
  for (let i = 0; i < size; i++) {
      maze[i] = [];
      for (let j = 0; j < size; j++) {
          maze[i][j] = true;
      }
  }
  window.maze = maze;
  window.N = size;

  createMaze(maze, 1, 1, size);
  drawMaze(maze, size);
}

function createMaze(maze, row, col, N) {
  maze[row][col] = false;

  let directions = ['top', 'right', 'bottom', 'left'];
  directions = directions.sort(function() {
      return 0.5 - Math.random();
  });

  for (let i = 0; i < directions.length; i++) {
      switch (directions[i]) {
          case 'top':
              if (row - 2 <= 0) continue;
              if (maze[row - 2][col]) {
                  maze[row - 1][col] = false;
                  createMaze(maze, row - 2, col, N);
              }
              break;
          case 'right':
              if (col + 2 >= N - 1) continue;
              if (maze[row][col + 2]) {
                  maze[row][col + 1] = false;
                  createMaze(maze, row, col + 2, N);
              }
              break;
          case 'bottom':
              if (row + 2 >= N - 1) continue;
              if (maze[row + 2][col]) {
                  maze[row + 1][col] = false;
                  createMaze(maze, row + 2, col, N);
              }
              break;
          case 'left':
              if (col - 2 <= 0) continue;
              if (maze[row][col - 2]) {
                  maze[row][col - 1] = false;
                  createMaze(maze, row, col - 2, N);
              }
              break;
      }
  }
}

function drawMaze(maze, N) {
  for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
          context.fillStyle = maze[i][j] ? 'black' : 'white';
          context.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
  }
  if (start) {
    const [startRow, startCol] = start.split(',').map(Number);
    context.fillStyle = 'red';
    context.fillRect(startCol * cellSize, startRow * cellSize, cellSize, cellSize);
}
if (end) {
    const [endRow, endCol] = end.split(',').map(Number);
    context.fillStyle = 'blue';
    context.fillRect(endCol * cellSize, endRow * cellSize, cellSize, cellSize);
}
context.fillStyle = 'white';
}

function reconstructPath(cameFrom, current) {
  let totalPath = [current];
  while (current in cameFrom) {
      current = cameFrom[current];
      totalPath.unshift(current);
  }
  return totalPath.map(cell => cell.join(','));
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, index) => val === b[index]);
}

function getNeighbors(maze, [row, col]) {
  let neighbors = [];
  let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let [dRow, dCol] of directions) {
      let newRow = row + dRow, newCol = col + dCol;
      if (newRow >= 0 && newRow < maze.length && newCol >= 0 && newCol < maze[0].length && !maze[newRow][newCol]) {
          neighbors.push([newRow, newCol]);
      }
  }
  return neighbors;
}

function heuristic([aRow, aCol], [bRow, bCol]) {
  return Math.abs(aRow - bRow) + Math.abs(aCol - bCol);
}

function drawPath(path) {
  path.forEach(function(cellId) {
    const [row, col] = cellId.split(',').map(Number);
    context.fillStyle = 'fuchsia';
    context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function aStar(maze, startId, endId) {
  let start = startId.split(',').map(Number);
  let end = endId.split(',').map(Number);

  let openSet = [start];
  let closedSet = [];
  let gScore = { [start]: 0 };
  let fScore = { [start]: heuristic(start, end) };
  let cameFrom = {};

  while (openSet.length > 0) {
      let current = openSet.reduce((a, b) => fScore[a] < fScore[b] ? a : b);

    
      drawCell(current, 'orange'); 
      await sleep(0.5); 

      if (arraysEqual(current, end)) {
          let path = reconstructPath(cameFrom, current);
          for (let cell of path) {
            drawCell(cell.split(',').map(Number), 'fuchsia'); // Рисование пути
            await sleep(7);
          }
          return path;
      }

      openSet = openSet.filter(node => !arraysEqual(node, current));
      closedSet.push(current);

      let neighbors = getNeighbors(maze, current);
      for (let neighbor of neighbors) {
          if (closedSet.some(node => arraysEqual(node, neighbor))) {
              continue;
          }

          let tentativeGScore = gScore[current] + 1;

          if (!openSet.some(node => arraysEqual(node, neighbor))) {
              openSet.push(neighbor);
              drawCell(neighbor, 'yellow'); 
              await sleep(0.5);
          } else if (tentativeGScore >= gScore[neighbor]) {
              continue;
          }

          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeGScore;
          fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, end);
      }

      drawCell(current, 'gray'); 
      await sleep(0.5);
  }
  alert("NO WAY!");
  return [];
}

function drawCell([row, col], color) {
  context.fillStyle = color;
  context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
}

document.querySelector('.reset').onclick = function() {
  // Очищаем холст
  context.clearRect(0, 0, canvas.width, canvas.height);

  start = null;
  end = null;

  // Сбрасываем ползунок на начальное значение
  var slider = document.getElementById('sizeSlider');
  slider.value = 5; // начальное значение, которое вы установили в HTML
  document.getElementById('sliderValue').textContent = '5';

  window.maze = Array(window.N).fill().map(() => Array(window.N).fill(true));

  settingStart = false;
  settingEnd = false;
  isEditing = false;

  drawMaze(window.maze, window.N);
};