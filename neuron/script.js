const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const buttonClear = document.getElementById('clear');
const buttonPredict = document.getElementById('find');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let neuronsData = null;

buttonClear.addEventListener('click', clearCanvas);
buttonPredict.addEventListener('click', predictImage);

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function setupCanvas() {
    const settings = {
        imageSmoothingEnabled: true,
        globalCompositeOperation: 'source-over',
        globalAlpha: 1,
        lineWidth: 3,
        strokeStyle: 'fuchsia',
        fillStyle: "fuchsia"
    };

    Object.keys(settings).forEach(key => {
        ctx[key] = settings[key];
    });

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

function centerImage(image) {
    const height = image.length;
    const width = image[0].length;

    const centerY = Math.floor(height / 2);
    const centerX = Math.floor(width / 2);

    const offsetY = centerY - Math.floor(height / 2);
    const offsetX = centerX - Math.floor(width / 2);

    const centeredImage = new Array(height).fill(null).map(() => new Array(width).fill(0));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const newY = y + offsetY;
            const newX = x + offsetX;
            if (newY >= 0 && newY < height && newX >= 0 && newX < width) {
                centeredImage[y][x] = image[newY][newX];
            }
        }
    }

    return centeredImage;
}

function predictImage() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    const binaryImage = [];
    for (let y = 0; y < height; y++) {
        binaryImage[y] = [];
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const isFuchsia = data[index] > 200 && data[index + 1] < 100 && data[index + 2] > 200;
            binaryImage[y][x] = isFuchsia ? 1 : 0;
        }
    }

    const centeredImage = centerImage(binaryImage);

    const predictions = new Array(10).fill(0).map((_, index) => ({
        index,
        value: calculatePredictionValue(centeredImage, index)
    }));

    predictions.sort((a, b) => b.value - a.value);

    displayPrediction(predictions[0].index);
}

function calculatePredictionValue(image, neuronIndex) {
    let count = 0;
    let sum = 0;
    for (let i = 0; i < 50; i++) {
        for (let j = 0; j < 50; j++) {
            if (image[i][j] === 1) {
                count++;
                sum += neuronsData[neuronIndex][i][j];
            }
        }
    }
    return count > 0 ? sum / count : 0;
}

function displayPrediction(predictionIndex) {
    const predictionDiv = document.createElement('div');
    predictionDiv.classList.add('prediction');
    predictionDiv.textContent = `Verdict: ${predictionIndex}`;
    document.body.appendChild(predictionDiv);

    setTimeout(() => {
        predictionDiv.remove();
    }, 1500);
}

fetch('data.txt')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.text();
  })
  .then(data => {
    const arrData = data.split(' ').map(Number);
    let temp = 0;
    neuronsData = new Array(10).fill(null).map(() => Array.from({ length: 50 }, () => new Array(50)));
    for (let k = 0; k < 10; ++k) {
      for (let i = 0; i < 50; ++i) {
        for (let j = 0; j < 50; ++j) {
          neuronsData[k][i][j] = arrData[temp++];
        }
      }
    }
  })
  .then(setupCanvas)
  .catch(error => {
    console.error('Error fetching data:', error);
  });